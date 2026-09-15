import { getNotionClient, getNotionToMd, extractNotionId } from "./notion-client"
import {
  fetchDatabaseMetadata,
  queryAllDatabaseRows,
  renderDatabaseToMarkdown,
  saveDatabaseAsMultiFiles,
  safeFilename,
} from "./notion-database"
import { normalizePath } from "./path-utils"
import { writeFile, readFile } from "@/commands/fs"

export interface ImportNotionOptions {
  onProgress?: (message: string) => void
  includeCardBlocks?: boolean
  databaseMode?: "multi-file" | "single-file"
}

export interface ImportNotionResult {
  path: string
  paths: string[]
  title: string
  isFolder: boolean
}

export async function getUniqueDestPath(dir: string, fileName: string): Promise<string> {
  const basePath = `${dir}/${fileName}`

  // Check if file exists by trying to read it
  try {
    await readFile(basePath)
  } catch {
    // File doesn't exist — use original name
    return basePath
  }

  // File exists — add date suffix
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : ""
  const nameWithoutExt = ext ? fileName.slice(0, -ext.length) : fileName
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")

  const withDate = `${dir}/${nameWithoutExt}-${date}${ext}`
  try {
    await readFile(withDate)
  } catch {
    return withDate
  }

  // Date suffix also exists — add counter
  for (let i = 2; i <= 99; i++) {
    const withCounter = `${dir}/${nameWithoutExt}-${date}-${i}${ext}`
    try {
      await readFile(withCounter)
    } catch {
      return withCounter
    }
  }

  // Shouldn't happen, but fallback
  return `${dir}/${nameWithoutExt}-${date}-${Date.now()}${ext}`
}

export async function importFromNotion(
  projectPath: string,
  notionUrl: string,
  apiKey: string,
  options?: ImportNotionOptions
): Promise<ImportNotionResult> {
  const entityId = extractNotionId(notionUrl)
  if (!entityId) {
    throw new Error("Invalid Notion URL or unable to extract Page / Database ID.")
  }

  if (!apiKey) {
    throw new Error("Notion API Key is required.")
  }

  const client = getNotionClient(apiKey)
  const n2m = getNotionToMd(client)
  const onProgress = options?.onProgress
  const dbMode = options?.databaseMode ?? "multi-file"

  onProgress?.("正在連接 Notion 服務…")

  // Determine whether this is a Page or a Database
  let isDatabase = false
  let page: any = null
  let dbMeta: any = null

  try {
    page = await client.pages.retrieve({ page_id: entityId })
  } catch {
    // If page retrieve fails, check if it is a Database
    try {
      dbMeta = await fetchDatabaseMetadata(client, entityId)
      isDatabase = true
    } catch {
      throw new Error(
        "無法存取該 Notion 頁面或資料庫。請確認：1. 金鑰正確 2. 該頁面已在 Notion 右上角「···」>「連線 (Connections)」加入授權。"
      )
    }
  }

  const pp = normalizePath(projectPath)

  if (isDatabase && dbMeta) {
    const title = dbMeta.title || "未命名資料庫"
    onProgress?.(`正在查詢資料庫「${title}」記錄…`)

    const rows = await queryAllDatabaseRows(client, entityId, dbMeta.dataSourceIds || dbMeta.dataSourceId, {
      onProgress,
      maxRows: 500,
    })

    if (dbMode === "multi-file") {
      onProgress?.(`正在以多檔案模式建立 ${rows.length} 筆記錄…`)
      const multiResult = await saveDatabaseAsMultiFiles(pp, dbMeta, rows, n2m, {
        notionUrl,
        includeCardBlocks: options?.includeCardBlocks ?? true,
        onProgress,
      })

      return {
        path: multiResult.folderPath,
        paths: multiResult.filePaths,
        title: multiResult.title,
        isFolder: true,
      }
    } else {
      // Single-file mode
      onProgress?.(`正在轉換 ${rows.length} 筆資料庫記錄為單一 Markdown…`)
      const finalContent = await renderDatabaseToMarkdown(dbMeta, rows, n2m, {
        notionUrl,
        includeCardBlocks: options?.includeCardBlocks ?? true,
        onProgress,
      })

      const safeTitle = safeFilename(title, "notion_database")
      const fileName = `${safeTitle}.md`
      const destPath = await getUniqueDestPath(`${pp}/raw/sources`, fileName)

      onProgress?.("正在儲存來源檔案…")
      await writeFile(destPath, finalContent)

      return {
        path: destPath,
        paths: [destPath],
        title,
        isFolder: false,
      }
    }
  } else {
    // Process as Page (which may also contain inline child databases!)
    let title = "Notion 頁面"
    if (
      page.properties &&
      page.properties.title &&
      page.properties.title.title &&
      page.properties.title.title.length > 0
    ) {
      title = page.properties.title.title[0].plain_text
    } else {
      // Find any title-type property
      const titleProp = Object.values(page.properties || {}).find(
        (p: any) => p && typeof p === "object" && p.type === "title"
      ) as any
      if (titleProp && titleProp.title && titleProp.title.length > 0) {
        title = titleProp.title[0].plain_text
      }
    }

    // Register custom transformer for inline child_database blocks
    n2m.setCustomTransformer("child_database", async (block: any) => {
      try {
        const childDbId = block.id
        const childTitle = block.child_database?.title || "資料庫"
        onProgress?.(`正在讀取內嵌資料庫「${childTitle}」…`)

        const childMeta = await fetchDatabaseMetadata(client, childDbId)
        const rows = await queryAllDatabaseRows(client, childDbId, childMeta.dataSourceIds || childMeta.dataSourceId, {
          onProgress,
          maxRows: 200,
        })

        const dbMarkdown = await renderDatabaseToMarkdown(childMeta, rows, n2m, {
          includeCardBlocks: true,
          maxCardBlocks: 20,
          onProgress,
        })

        return `\n\n${dbMarkdown}\n\n`
      } catch (err) {
        console.warn("[notion-import] Failed to fetch inline database:", err)
        return `\n\n### 📑 資料庫: ${block.child_database?.title || "未命名資料庫"}\n\n*(無法讀取內嵌資料庫內容，可能需要將該資料庫個別加入連線授權)*\n\n`
      }
    })

    onProgress?.(`正在抓取頁面區塊內容…`)
    const mdBlocks = await n2m.pageToMarkdown(entityId)
    const mdString = n2m.toMarkdownString(mdBlocks)

    const finalContent = `# ${title}\n\n> 來源: ${notionUrl}\n\n${mdString.parent || ""}`
    const safeTitle = safeFilename(title, "notion_page")
    const fileName = `${safeTitle}.md`
    const destPath = await getUniqueDestPath(`${pp}/raw/sources`, fileName)

    onProgress?.("正在儲存來源檔案…")
    await writeFile(destPath, finalContent)

    return {
      path: destPath,
      paths: [destPath],
      title,
      isFolder: false,
    }
  }
}
