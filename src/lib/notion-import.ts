import { getNotionClient, getNotionToMd, extractNotionPageId } from "./notion-client"
import { normalizePath } from "./path-utils"
import { writeFile, readFile } from "@/commands/fs"

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
  apiKey: string
): Promise<{ path: string; title: string }> {
  const pageId = extractNotionPageId(notionUrl)
  if (!pageId) {
    throw new Error("Invalid Notion URL or unable to extract Page ID.")
  }

  if (!apiKey) {
    throw new Error("Notion API Key is required.")
  }

  const client = getNotionClient(apiKey)
  const n2m = getNotionToMd(client)

  // Fetch page metadata to get the title
  const page = await client.pages.retrieve({ page_id: pageId })
  
  let title = "Untitled Notion Page"
  
  // @ts-ignore: Notion API types are complex, safely traverse to find the title
  if (page.properties && page.properties.title && page.properties.title.title && page.properties.title.title.length > 0) {
    // @ts-ignore
    title = page.properties.title.title[0].plain_text
  } else {
    // sometimes the title property is named something else (e.g. "Name")
    // @ts-ignore
    const titleProp = Object.values(page.properties).find(p => p.type === "title")
    // @ts-ignore
    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      // @ts-ignore
      title = titleProp.title[0].plain_text
    }
  }

  // Fetch page blocks and convert to markdown
  const mdBlocks = await n2m.pageToMarkdown(pageId)
  const mdString = n2m.toMarkdownString(mdBlocks)

  // Construct final markdown content
  // Note: we can optionally add the notion URL to the content
  const content = `# ${title}\n\n> Source: ${notionUrl}\n\n${mdString.parent}`

  const pp = normalizePath(projectPath)
  
  // Create a safe filename from the title (keep CJK chars, replace illegal OS chars)
  const safeTitle = title
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim()
    
  const finalTitle = safeTitle || 'notion_page'
  const fileName = `${finalTitle}.md`
  
  const destPath = await getUniqueDestPath(`${pp}/raw/sources`, fileName)
  
  await writeFile(destPath, content)
  
  return { path: destPath, title }
}
