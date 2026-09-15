import { describe, it, expect, vi } from "vitest"
import { extractNotionId } from "./notion-client"
import {
  formatNotionPropertyValue,
  renderDatabaseToMarkdown,
  renderSingleRowToMarkdown,
  queryAllDatabaseRows,
  safeFilename,
  type DatabaseMetadata,
  type DatabaseRow,
} from "./notion-database"

describe("safeFilename", () => {
  it("sanitizes illegal characters and keeps CJK", () => {
    expect(safeFilename("每日AI新聞: 2026/09/15 <最新>")).toBe(
      "每日AI新聞_ 2026_09_15 _最新_"
    )
    expect(safeFilename("", "fallback")).toBe("fallback")
  })
})

describe("extractNotionId", () => {
  it("extracts ID from user's app.notion.com page URL with prefix", () => {
    const url = "https://app.notion.com/p/AI-31301aab6d9080deb4acd16ef47a56fc"
    expect(extractNotionId(url)).toBe("31301aab-6d90-80de-b4ac-d16ef47a56fc")
  })

  it("extracts ID from standard notion.so page URL with view query params", () => {
    const url = "https://www.notion.so/myworkspace/31301aab6d9080deb4acd16ef47a56fc?v=987654321"
    expect(extractNotionId(url)).toBe("31301aab-6d90-80de-b4ac-d16ef47a56fc")
  })

  it("extracts ID from ?p= search parameter", () => {
    const url = "https://notion.so/workspace?p=31301aab6d9080deb4acd16ef47a56fc"
    expect(extractNotionId(url)).toBe("31301aab-6d90-80de-b4ac-d16ef47a56fc")
  })

  it("extracts ID from raw 32-char hex string", () => {
    expect(extractNotionId("31301aab6d9080deb4acd16ef47a56fc")).toBe(
      "31301aab-6d90-80de-b4ac-d16ef47a56fc"
    )
  })

  it("extracts ID from already hyphenated UUID", () => {
    expect(extractNotionId("31301aab-6d90-80de-b4ac-d16ef47a56fc")).toBe(
      "31301aab-6d90-80de-b4ac-d16ef47a56fc"
    )
  })

  it("returns null for invalid inputs", () => {
    expect(extractNotionId("")).toBeNull()
    expect(extractNotionId("invalid-url-without-id")).toBeNull()
  })
})

describe("formatNotionPropertyValue", () => {
  it("formats title and rich_text", () => {
    expect(
      formatNotionPropertyValue({
        type: "title",
        title: [{ plain_text: "Claude 3.7 Sonnet" }],
      })
    ).toBe("Claude 3.7 Sonnet")

    expect(
      formatNotionPropertyValue({
        type: "rich_text",
        rich_text: [{ plain_text: "具備混合推理能力的 LLM" }],
      })
    ).toBe("具備混合推理能力的 LLM")
  })

  it("formats select and multi_select", () => {
    expect(
      formatNotionPropertyValue({
        type: "select",
        select: { name: "AI 程式助手" },
      })
    ).toBe("AI 程式助手")

    expect(
      formatNotionPropertyValue({
        type: "multi_select",
        multi_select: [{ name: "LLM" }, { name: "Agent" }, { name: "Coding" }],
      })
    ).toBe("LLM, Agent, Coding")
  })

  it("formats date ranges and single dates", () => {
    expect(
      formatNotionPropertyValue({
        type: "date",
        date: { start: "2026-03-01", end: "2026-03-15" },
      })
    ).toBe("2026-03-01 ~ 2026-03-15")

    expect(
      formatNotionPropertyValue({
        type: "date",
        date: { start: "2026-03-01", end: null },
      })
    ).toBe("2026-03-01")
  })

  it("formats URLs, checkboxes and status", () => {
    expect(
      formatNotionPropertyValue({
        type: "url",
        url: "https://anthropic.com",
      })
    ).toBe("[https://anthropic.com](https://anthropic.com)")

    expect(
      formatNotionPropertyValue({
        type: "checkbox",
        checkbox: true,
      })
    ).toBe("✅ 是")

    expect(
      formatNotionPropertyValue({
        type: "checkbox",
        checkbox: false,
      })
    ).toBe("❌ 否")

    expect(
      formatNotionPropertyValue({
        type: "status",
        status: { name: "In Progress" },
      })
    ).toBe("In Progress")
  })

  it("formats formulas", () => {
    expect(
      formatNotionPropertyValue({
        type: "formula",
        formula: { type: "string", string: "計算結果" },
      })
    ).toBe("計算結果")

    expect(
      formatNotionPropertyValue({
        type: "formula",
        formula: { type: "number", number: 99.5 },
      })
    ).toBe("99.5")
  })
})

describe("renderSingleRowToMarkdown", () => {
  it("renders a single row as an independent markdown document", async () => {
    const row: DatabaseRow = {
      id: "row-1",
      title: "OpenAI 發表全新模型",
      url: "https://www.notion.so/row-1",
      createdTime: "2026-09-15T12:00:00Z",
      properties: {
        分類: { type: "select", select: { name: "模型發布" } },
        標籤: { type: "multi_select", multi_select: [{ name: "語音" }, { name: "即時" }] },
        連結: { type: "url", url: "https://openai.com/news" },
      },
    }

    const md = await renderSingleRowToMarkdown(row, undefined, { includeBlocks: false })
    expect(md).toContain("# OpenAI 發表全新模型")
    expect(md).toContain("- **Notion 連結**: [開啟原始頁面](https://www.notion.so/row-1)")
    expect(md).toContain("- **建立時間**: 2026-09-15")
    expect(md).toContain("- **分類**: 模型發布")
    expect(md).toContain("- **標籤**: 語音, 即時")
  })
})

describe("renderDatabaseToMarkdown", () => {
  const mockMetadata: DatabaseMetadata = {
    id: "31301aab-6d90-80de-b4ac-d16ef47a56fc",
    title: "AI 資源與工具庫",
    description: "整理目前最優質的 AI 工具與研究文章",
  }

  const mockRows: DatabaseRow[] = [
    {
      id: "row-1",
      title: "Anthropic Claude",
      url: "https://www.notion.so/row-1",
      properties: {
        類別: { type: "select", select: { name: "LLM" } },
        標籤: { type: "multi_select", multi_select: [{ name: "推理" }, { name: "寫作" }] },
        推薦: { type: "checkbox", checkbox: true },
        官方網址: { type: "url", url: "https://claude.ai" },
      },
    },
    {
      id: "row-2",
      title: "Google Gemini",
      url: "https://www.notion.so/row-2",
      properties: {
        類別: { type: "select", select: { name: "多模態" } },
        標籤: { type: "multi_select", multi_select: [{ name: "長上下文" }] },
        推薦: { type: "checkbox", checkbox: true },
        官方網址: { type: "url", url: "https://gemini.google.com" },
      },
    },
  ]

  it("renders structured markdown with overview table and detailed card list", async () => {
    const md = await renderDatabaseToMarkdown(mockMetadata, mockRows, undefined, {
      notionUrl: "https://app.notion.com/p/AI-31301aab6d9080deb4acd16ef47a56fc",
      includeCardBlocks: false,
    })

    expect(md).toContain("# AI 資源與工具庫")
    expect(md).toContain("> 來源: https://app.notion.com/p/AI-31301aab6d9080deb4acd16ef47a56fc")
    expect(md).toContain("> 記錄總數: 2 筆")
    expect(md).toContain("## 📑 資料庫清單")
    expect(md).toContain("| 名稱 |")
    expect(md).toContain("[Anthropic Claude](https://www.notion.so/row-1)")
    expect(md).toContain("[Google Gemini](https://www.notion.so/row-2)")
    expect(md).toContain("## 📝 詳細內容")
    expect(md).toContain("### 1. Anthropic Claude")
    expect(md).toContain("- **類別**: LLM")
    expect(md).toContain("- **標籤**: 推理, 寫作")
    expect(md).toContain("### 2. Google Gemini")
  })
})

describe("queryAllDatabaseRows", () => {
  it("queries rows and handles pagination", async () => {
    const mockClient = {
      dataSources: {
        query: vi
          .fn()
          .mockResolvedValueOnce({
            object: "list",
            results: [
              {
                object: "page",
                id: "page-1",
                url: "https://notion.so/page-1",
                properties: {
                  Name: {
                    type: "title",
                    title: [{ plain_text: "Item 1" }],
                  },
                },
              },
            ],
            has_more: true,
            next_cursor: "cursor-1",
          })
          .mockResolvedValueOnce({
            object: "list",
            results: [
              {
                object: "page",
                id: "page-2",
                url: "https://notion.so/page-2",
                properties: {
                  Name: {
                    type: "title",
                    title: [{ plain_text: "Item 2" }],
                  },
                },
              },
            ],
            has_more: false,
            next_cursor: null,
          }),
      },
    } as any

    const rows = await queryAllDatabaseRows(
      mockClient,
      "db-123",
      "ds-123"
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].title).toBe("Item 1")
    expect(rows[1].title).toBe("Item 2")
    expect(mockClient.dataSources.query).toHaveBeenCalledTimes(2)
  })
})
