import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import { fetch as tauriFetch } from "@tauri-apps/plugin-http"

export function getNotionClient(apiKey: string) {
  return new Client({
    auth: apiKey,
    // Use Tauri's HTTP plugin to bypass CORS restrictions
    fetch: tauriFetch as unknown as typeof fetch,
  })
}

export function getNotionToMd(client: Client) {
  return new NotionToMarkdown({ notionClient: client })
}

/**
 * Extracts a 32-character Notion Page ID from a given Notion URL.
 * Notion URLs typically end with a 32-character hex string, optionally
 * preceded by a page title and a dash.
 */
export function extractNotionPageId(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname
    
    // Split by '/' and take the last segment
    const segments = path.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    
    if (!lastSegment) return null
    
    // The page ID is usually the last 32 characters, consisting of hex digits
    const match = lastSegment.match(/([a-f0-9]{32})$/i)
    if (match) {
      // Format it with hyphens to be standard 8-4-4-4-12 UUID format
      const id = match[1]
      return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    }
    
    // Sometimes URLs might just be the UUID with hyphens
    const uuidMatch = lastSegment.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
    if (uuidMatch) {
      return uuidMatch[1]
    }
    
    return null
  } catch {
    // Invalid URL
    return null
  }
}
