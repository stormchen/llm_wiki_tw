import type { Client } from "@notionhq/client"
import type { NotionToMarkdown } from "notion-to-md"
import { createDirectory, writeFile, readFile } from "@/commands/fs"
import { normalizePath } from "./path-utils"

export interface DatabaseMetadata {
  id: string
  title: string
  description: string
  url?: string
  dataSourceId?: string
  dataSourceIds?: string[]
}

export interface DatabaseRow {
  id: string
  url?: string
  title: string
  properties: Record<string, any>
  createdTime?: string
  lastEditedTime?: string
}

export interface DatabaseRenderOptions {
  notionUrl?: string
  includeCardBlocks?: boolean
  maxCardBlocks?: number
  onProgress?: (message: string) => void
}

/**
 * Sanitize a string to be a safe filesystem name while preserving CJK characters.
 */
export function safeFilename(input: string, fallback = "item"): string {
  const sanitized = input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
  return sanitized || fallback
}

/**
 * Extract plain text from RichText array.
 */
function extractPlainText(richText: any[]): string {
  if (!Array.isArray(richText)) return ""
  return richText.map((item) => item.plain_text || "").join("")
}

/**
 * Retrieve database information (title, description, all data sources).
 */
export async function fetchDatabaseMetadata(
  client: Client,
  databaseId: string
): Promise<DatabaseMetadata> {
  let db: any
  try {
    db = await client.databases.retrieve({ database_id: databaseId })
  } catch (err: any) {
    // If not found in databases, try dataSources directly
    if (client.dataSources) {
      try {
        db = await client.dataSources.retrieve({ data_source_id: databaseId })
      } catch {
        throw err
      }
    } else {
      throw err
    }
  }

  const title = extractPlainText(db.title) || "Untitled Database"
  const description = extractPlainText(db.description) || ""
  const dataSourceIds: string[] =
    db.data_sources && Array.isArray(db.data_sources)
      ? db.data_sources.map((ds: any) => ds.id).filter(Boolean)
      : []
  const dataSourceId = dataSourceIds.length > 0 ? dataSourceIds[0] : undefined

  return {
    id: db.id,
    title,
    description,
    url: db.url,
    dataSourceId,
    dataSourceIds,
  }
}

/**
 * Format any Notion property value into a human-readable Markdown string.
 */
export function formatNotionPropertyValue(prop: any): string {
  if (!prop || typeof prop !== "object") return ""

  const type = prop.type
  switch (type) {
    case "title":
      return extractPlainText(prop.title)
    case "rich_text":
      return extractPlainText(prop.rich_text)
    case "number":
      return prop.number !== null && prop.number !== undefined ? String(prop.number) : ""
    case "select":
      return prop.select?.name || ""
    case "multi_select":
      return Array.isArray(prop.multi_select)
        ? prop.multi_select.map((item: any) => item.name).join(", ")
        : ""
    case "date":
      if (!prop.date) return ""
      return prop.date.end ? `${prop.date.start} ~ ${prop.date.end}` : prop.date.start
    case "checkbox":
      return prop.checkbox ? "✅ 是" : "❌ 否"
    case "url":
      return prop.url ? `[${prop.url}](${prop.url})` : ""
    case "email":
      return prop.email ? `[${prop.email}](mailto:${prop.email})` : ""
    case "phone_number":
      return prop.phone_number || ""
    case "status":
      return prop.status?.name || ""
    case "people":
      return Array.isArray(prop.people)
        ? prop.people.map((p: any) => p.name || p.id).join(", ")
        : ""
    case "files":
      return Array.isArray(prop.files)
        ? prop.files
            .map((f: any) => {
              const name = f.name || "檔案"
              const url = f.file?.url || f.external?.url
              return url ? `[${name}](${url})` : name
            })
            .join(", ")
        : ""
    case "unique_id":
      return prop.unique_id
        ? `${prop.unique_id.prefix ? prop.unique_id.prefix + "-" : ""}${prop.unique_id.number}`
        : ""
    case "formula":
      if (!prop.formula) return ""
      if (prop.formula.type === "string") return prop.formula.string || ""
      if (prop.formula.type === "number") return String(prop.formula.number ?? "")
      if (prop.formula.type === "boolean") return prop.formula.boolean ? "✅" : "❌"
      if (prop.formula.type === "date") return prop.formula.date?.start || ""
      return ""
    case "relation":
      return Array.isArray(prop.relation) ? `(${prop.relation.length} 項關聯)` : ""
    case "rollup":
      if (!prop.rollup) return ""
      if (prop.rollup.type === "number") return String(prop.rollup.number ?? "")
      if (prop.rollup.type === "date") return prop.rollup.date?.start || ""
      if (prop.rollup.type === "array") {
        return prop.rollup.array
          .map((sub: any) => formatNotionPropertyValue(sub))
          .filter(Boolean)
          .join(", ")
      }
      return ""
    default:
      return ""
  }
}

/**
 * Internal single data source query helper.
 */
async function querySingleTarget(
  client: Client,
  databaseId: string,
  targetId: string,
  seenIds: Set<string>,
  maxRows: number,
  options?: { onProgress?: (msg: string) => void }
): Promise<DatabaseRow[]> {
  const resultRows: DatabaseRow[] = []
  let hasMore = true
  let cursor: string | undefined = undefined

  while (hasMore && resultRows.length < maxRows) {
    let response: any

    try {
      if (client.dataSources && typeof client.dataSources.query === "function") {
        response = await client.dataSources.query({
          data_source_id: targetId,
          start_cursor: cursor,
          page_size: Math.min(100, maxRows - resultRows.length),
        })
      } else {
        throw new Error("dataSources.query not available")
      }
    } catch {
      try {
        response = await client.request({
          path: `databases/${databaseId}/query`,
          method: "post",
          body: {
            start_cursor: cursor,
            page_size: Math.min(100, maxRows - resultRows.length),
          },
        })
      } catch {
        response = await client.request({
          path: `data_sources/${targetId}/query`,
          method: "post",
          body: {
            start_cursor: cursor,
            page_size: Math.min(100, maxRows - resultRows.length),
          },
        })
      }
    }

    if (!response || !Array.isArray(response.results)) {
      break
    }

    for (const item of response.results) {
      if (item.object === "page" && !seenIds.has(item.id)) {
        seenIds.add(item.id)
        let title = "未命名項目"
        const props = item.properties || {}

        // Find title property
        for (const [_, val] of Object.entries(props)) {
          if ((val as any)?.type === "title") {
            const extracted = extractPlainText((val as any).title)
            if (extracted) title = extracted
            break
          }
        }

        resultRows.push({
          id: item.id,
          url: item.url,
          title,
          properties: props,
          createdTime: item.created_time,
          lastEditedTime: item.last_edited_time,
        })
      }
    }

    options?.onProgress?.(`已載入 ${seenIds.size} 筆資料庫記錄…`)

    hasMore = Boolean(response.has_more && response.next_cursor)
    cursor = response.next_cursor || undefined

    if (hasMore && resultRows.length < maxRows) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }

  return resultRows
}

/**
 * Query all rows from a database (handles pagination and multiple data sources).
 */
export async function queryAllDatabaseRows(
  client: Client,
  databaseId: string,
  dataSourceId?: string | string[],
  options?: { maxRows?: number; onProgress?: (msg: string) => void }
): Promise<DatabaseRow[]> {
  const rows: DatabaseRow[] = []
  const maxRows = options?.maxRows ?? 500
  const seenIds = new Set<string>()

  const targets: string[] = Array.isArray(dataSourceId)
    ? dataSourceId.filter(Boolean)
    : dataSourceId
    ? [dataSourceId]
    : [databaseId]

  if (targets.length === 0) {
    targets.push(databaseId)
  }

  for (const targetId of targets) {
    if (rows.length >= maxRows) break
    const targetRows = await querySingleTarget(
      client,
      databaseId,
      targetId,
      seenIds,
      maxRows - rows.length,
      options
    )
    rows.push(...targetRows)
  }

  return rows
}

/**
 * Render a single database row into an independent Markdown document.
 */
export async function renderSingleRowToMarkdown(
  row: DatabaseRow,
  n2m?: NotionToMarkdown,
  options?: { includeBlocks?: boolean }
): Promise<string> {
  const parts: string[] = []

  // 1. Title
  parts.push(`# ${row.title}\n`)

  // 2. Metadata / Properties
  const propLines: string[] = []
  if (row.url) {
    propLines.push(`- **Notion 連結**: [開啟原始頁面](${row.url})`)
  }
  if (row.createdTime) {
    propLines.push(`- **建立時間**: ${row.createdTime.slice(0, 10)}`)
  }

  for (const [name, prop] of Object.entries(row.properties)) {
    if (prop.type === "title") continue
    const formatted = formatNotionPropertyValue(prop)
    if (formatted) {
      propLines.push(`- **${name}**: ${formatted}`)
    }
  }

  if (propLines.length > 0) {
    parts.push("## 屬性資訊\n")
    parts.push(propLines.join("\n") + "\n")
  }

  // 3. Card Blocks (Notes)
  const includeBlocks = options?.includeBlocks ?? true
  if (includeBlocks && n2m) {
    try {
      const mdBlocks = await n2m.pageToMarkdown(row.id)
      if (mdBlocks && mdBlocks.length > 0) {
        const mdStrObj = n2m.toMarkdownString(mdBlocks)
        const blockContent = mdStrObj.parent?.trim()
        if (blockContent) {
          parts.push("## 詳細內容\n")
          parts.push(blockContent + "\n")
        }
      }
    } catch (err) {
      console.warn(`[notion-database] Failed to fetch blocks for single row ${row.id}:`, err)
    }
  }

  return parts.join("\n")
}

/**
 * Render database metadata and rows into comprehensive structured single Markdown.
 */
export async function renderDatabaseToMarkdown(
  metadata: DatabaseMetadata,
  rows: DatabaseRow[],
  n2m?: NotionToMarkdown,
  options?: DatabaseRenderOptions
): Promise<string> {
  const parts: string[] = []

  // 1. Header
  parts.push(`# ${metadata.title}\n`)
  if (options?.notionUrl) {
    parts.push(`> 來源: ${options.notionUrl}`)
  }
  parts.push(`> 記錄總數: ${rows.length} 筆\n`)

  if (metadata.description) {
    parts.push(`${metadata.description}\n`)
  }

  if (rows.length === 0) {
    parts.push("*(此資料庫目前沒有任何記錄)*\n")
    return parts.join("\n")
  }

  // 2. Discover key properties for the overview table
  const allPropertyNames = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row.properties)) {
      if (row.properties[key]?.type !== "title") {
        allPropertyNames.add(key)
      }
    }
  }

  // Select up to 4 most meaningful columns for the overview table
  const priorityTypes = ["select", "multi_select", "status", "url", "date", "checkbox"]
  const sortedTableCols = Array.from(allPropertyNames).sort((a, b) => {
    const typeA = rows[0]?.properties[a]?.type || ""
    const typeB = rows[0]?.properties[b]?.type || ""
    const scoreA = priorityTypes.indexOf(typeA)
    const scoreB = priorityTypes.indexOf(typeB)
    return (scoreA === -1 ? 99 : scoreA) - (scoreB === -1 ? 99 : scoreB)
  }).slice(0, 4)

  // 3. Overview Table
  parts.push("## 📑 資料庫清單\n")
  const tableHeaders = ["名稱", ...sortedTableCols]
  parts.push(`| ${tableHeaders.join(" | ")} |`)
  parts.push(`| ${tableHeaders.map(() => ":---").join(" | ")} |`)

  for (const row of rows) {
    const titleCell = row.url ? `[${row.title}](${row.url})` : row.title
    const otherCells = sortedTableCols.map((colName) => {
      const val = formatNotionPropertyValue(row.properties[colName])
      return (val || "-").replace(/\|/g, "\\|").replace(/\n/g, " ")
    })
    parts.push(`| ${[titleCell, ...otherCells].join(" | ")} |`)
  }
  parts.push("\n")

  // 4. Detailed Card List
  parts.push("## 📝 詳細內容\n")

  const includeBlocks = options?.includeCardBlocks ?? true
  const maxCardBlocks = options?.maxCardBlocks ?? 50

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    options?.onProgress?.(`正在處理第 ${i + 1}/${rows.length} 筆卡片內容…`)

    parts.push(`### ${i + 1}. ${row.title}\n`)

    // List all non-empty properties
    const propLines: string[] = []
    for (const [name, prop] of Object.entries(row.properties)) {
      if (prop.type === "title") continue
      const formatted = formatNotionPropertyValue(prop)
      if (formatted) {
        propLines.push(`- **${name}**: ${formatted}`)
      }
    }

    if (row.url) {
      propLines.push(`- **Notion 連結**: [開啟頁面](${row.url})`)
    }

    if (propLines.length > 0) {
      parts.push(propLines.join("\n") + "\n")
    }

    // Fetch and append card blocks if requested and n2m is available
    if (includeBlocks && n2m && i < maxCardBlocks) {
      try {
        const mdBlocks = await n2m.pageToMarkdown(row.id)
        if (mdBlocks && mdBlocks.length > 0) {
          const mdStrObj = n2m.toMarkdownString(mdBlocks)
          const blockContent = mdStrObj.parent?.trim()
          if (blockContent) {
            parts.push("#### 內文筆記\n")
            parts.push(blockContent + "\n")
          }
        }
        await new Promise((r) => setTimeout(r, 120))
      } catch (err) {
        console.warn(`[notion-database] Failed to fetch blocks for row ${row.id}:`, err)
      }
    }

    parts.push("---\n")
  }

  return parts.join("\n")
}

/**
 * Get a unique directory path for multi-file database export.
 */
async function getUniqueDirectoryPath(baseDir: string, dirName: string): Promise<string> {
  const basePath = `${baseDir}/${dirName}`
  try {
    await readFile(`${basePath}/index.md`)
  } catch {
    return basePath
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const withDate = `${baseDir}/${dirName}-${date}`
  try {
    await readFile(`${withDate}/index.md`)
  } catch {
    return withDate
  }

  for (let i = 2; i <= 99; i++) {
    const withCounter = `${baseDir}/${dirName}-${date}-${i}`
    try {
      await readFile(`${withCounter}/index.md`)
    } catch {
      return withCounter
    }
  }

  return `${baseDir}/${dirName}-${date}-${Date.now()}`
}

/**
 * Save database as multiple individual files in a dedicated folder.
 * Returns the folder path and all generated individual source file paths for ingest.
 */
export async function saveDatabaseAsMultiFiles(
  projectPath: string,
  metadata: DatabaseMetadata,
  rows: DatabaseRow[],
  n2m?: NotionToMarkdown,
  options?: DatabaseRenderOptions
): Promise<{ folderPath: string; filePaths: string[]; title: string }> {
  const pp = normalizePath(projectPath)
  const safeDbTitle = safeFilename(metadata.title, "notion_database")
  const folderPath = await getUniqueDirectoryPath(`${pp}/raw/sources`, safeDbTitle)

  await createDirectory(folderPath)

  const filePaths: string[] = []
  const includeBlocks = options?.includeCardBlocks ?? true
  const maxCardBlocks = options?.maxCardBlocks ?? 500

  // 1. Write individual Markdown files for each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    options?.onProgress?.(`正在儲存記錄檔案 (${i + 1}/${rows.length})：${row.title}…`)

    const padIndex = String(i + 1).padStart(2, "0")
    const safeItemTitle = safeFilename(row.title, `item_${padIndex}`)
    const fileName = `${padIndex}-${safeItemTitle}.md`
    const filePath = `${folderPath}/${fileName}`

    const shouldFetchBlocks = includeBlocks && i < maxCardBlocks
    const content = await renderSingleRowToMarkdown(row, n2m, {
      includeBlocks: shouldFetchBlocks,
    })

    await writeFile(filePath, content)
    filePaths.push(filePath)

    if (shouldFetchBlocks) {
      await new Promise((r) => setTimeout(r, 100))
    }
  }

  // 2. Write index.md inside the folder for overall navigation
  options?.onProgress?.("正在產生資料庫目錄索引 (index.md)…")
  const indexParts: string[] = []
  indexParts.push(`# ${metadata.title}\n`)
  if (options?.notionUrl) {
    indexParts.push(`> 來源: ${options.notionUrl}`)
  }
  indexParts.push(`> 記錄總數: ${rows.length} 筆\n`)

  if (metadata.description) {
    indexParts.push(`${metadata.description}\n`)
  }

  indexParts.push("## 📑 項目索引清單\n")
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const padIndex = String(i + 1).padStart(2, "0")
    const safeItemTitle = safeFilename(row.title, `item_${padIndex}`)
    const fileName = `${padIndex}-${safeItemTitle}.md`

    const extraTags: string[] = []
    for (const [_, prop] of Object.entries(row.properties)) {
      if (prop.type === "select" || prop.type === "multi_select" || prop.type === "status") {
        const val = formatNotionPropertyValue(prop)
        if (val) extraTags.push(`\`${val}\``)
      }
    }
    const tagText = extraTags.length > 0 ? ` — ${extraTags.join(" ")}` : ""

    indexParts.push(`${i + 1}. [${row.title}](./${encodeURIComponent(fileName)})${tagText}`)
  }

  const indexFilePath = `${folderPath}/index.md`
  await writeFile(indexFilePath, indexParts.join("\n") + "\n")
  filePaths.push(indexFilePath)

  return {
    folderPath,
    filePaths,
    title: metadata.title,
  }
}
