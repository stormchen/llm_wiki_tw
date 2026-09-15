import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"
import { fetch as tauriFetch } from "@tauri-apps/plugin-http"

export function getNotionClient(apiKey: string) {
  return new Client({
    auth: apiKey,
    // Use Tauri's HTTP plugin to bypass CORS restrictions
    fetch: tauriFetch as unknown as typeof fetch,
    retry: {
      maxRetries: 3,
      initialRetryDelayMs: 1000,
    },
  })
}

export function getNotionToMd(client: Client) {
  return new NotionToMarkdown({ notionClient: client })
}

/**
 * Extracts a standard 36-character UUID from a Notion URL, page URL, database URL, or raw ID.
 */
export function extractNotionId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // 1. Direct standard UUID with hyphens
  const directUuid = trimmed.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
  if (directUuid) {
    return directUuid[1].toLowerCase()
  }

  // 2. Direct 32-character hex ID
  const directHex = trimmed.match(/^([a-f0-9]{32})$/i)
  if (directHex) {
    const id = directHex[1].toLowerCase()
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
  }

  // 3. Extract from URL
  try {
    const parsedUrl = new URL(trimmed)
    
    // Check search params first (e.g. ?p=31301aab6d9080deb4acd16ef47a56fc)
    const pParam = parsedUrl.searchParams.get("p")
    if (pParam) {
      const match = pParam.match(/([a-f0-9]{32})/i)
      if (match) {
        const id = match[1].toLowerCase()
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
      }
    }

    const path = parsedUrl.pathname
    const segments = path.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (!lastSegment) return null

    // Match 32 hex chars at the end of last segment (e.g., Title-31301aab6d9080deb4acd16ef47a56fc)
    const match = lastSegment.match(/([a-f0-9]{32})$/i)
    if (match) {
      const id = match[1].toLowerCase()
      return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    }

    // Match UUID with hyphens in last segment
    const uuidMatch = lastSegment.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
    if (uuidMatch) {
      return uuidMatch[1].toLowerCase()
    }

    return null
  } catch {
    // If not a valid URL, search anywhere in the string for a 32-hex pattern
    const match = trimmed.match(/([a-f0-9]{32})/i)
    if (match) {
      const id = match[1].toLowerCase()
      return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
    }
    return null
  }
}

/**
 * Backwards compatibility alias for extractNotionId.
 */
export const extractNotionPageId = extractNotionId

