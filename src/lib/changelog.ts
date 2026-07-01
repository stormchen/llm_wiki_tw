/**
 * Changelog shown in Settings → Changelog. Hardcoded rather than
 * pulled from GitHub Releases so it works offline and stays under
 * version control with the code that ships the changes.
 *
 * Conventions:
 *   - Newest version first (the UI renders in array order).
 *   - Each entry has both `en` and `zh` highlight lists; the
 *     section picks whichever matches the current i18n language.
 *   - Only user-visible changes belong here. Internal refactors,
 *     CI tweaks, and pure test work go in commit messages, not
 *     here — keep this readable for end users.
 *   - When releasing a new version: prepend a new entry with the
 *     same shape, then bump package.json / tauri.conf.json /
 *     Cargo.toml / Cargo.lock as usual.
 */

export interface ChangelogEntry {
  version: string
  date: string // YYYY-MM-DD
  highlights: {
    en: string[]
    zh: string[]
  }
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.5.2",
    date: "2026-06-25",
    highlights: {
      en: [
        "Fixed knowledge graph node previews so clicked pages open in the graph-side preview panel instead of switching to the Wiki page.",
      ],
      zh: [
        "修復知識圖譜節點預覽：點擊頁面節點時會在圖譜右側預覽欄打開，不再跳轉到 Wiki 頁面。",
      ],
    },
  },
  {
    version: "0.5.1",
    date: "2026-06-24",
    highlights: {
      en: [
        "Added Chat Agent modes, persisted tool progress, and project file tools for local inspection.",
        "Improved reasoning-model handling so chat can recover when an endpoint returns thinking text but no final answer.",
      ],
      zh: [
        "新增聊天 Agent 模式、持久化工具呼叫進度，並加入專案檔案查看工具。",
        "改進推理模型相容性：當端點只返回思考內容而沒有最終回答時，聊天會自動兜底恢復。",
      ],
    },
  },
  {
    version: "0.5.0",
    date: "2026-06-24",
    highlights: {
      en: [
        "Added the new chat Agent flow with query understanding, local/wiki graph tools, external search tools, and visible tool progress.",
        "Improved chat references with an in-chat preview panel, resizable preview width, source snippets, and persisted search toggles.",
        "Improved Agent routing by using each project overview to decide when local wiki search should be preferred over external search.",
        "Removed the Intel macOS release build from GitHub Actions.",
      ],
      zh: [
        "新增聊天 Agent 流程，支援問題理解、本地 Wiki/圖譜工具、外部搜尋工具，以及可見的工具呼叫進度。",
        "改進聊天引用體驗：支援對話內引用預覽、可調預覽寬度、來源片段展示，以及搜尋開關持久化。",
        "改進 Agent 路由判斷：使用每個專案的 overview 來判斷何時優先搜尋當前知識庫而不是外部網頁。",
        "移除 GitHub Actions 中的 Intel Mac 發布建置。",
      ],
    },
  },
  {
    version: "0.4.26",
    date: "2026-06-23",
    highlights: {
      en: [
        "Merged recent community PR fixes and cleaned up release documentation.",
        "Fixed release build issues around bundled resources and PDFium binaries.",
        "Added Intel x86_64 macOS client support to the release build.",
      ],
      zh: [
        "合併近期社群 PR 修復，並清理發布文件。",
        "修復發布建置中隨包資源和 PDFium 二進位相關問題。",
        "新增 Intel x86_64 Mac 用戶端的發布建置支援。",
      ],
    },
  },
  {
    version: "0.4.25",
    date: "2026-06-23",
    highlights: {
      en: [
        "Added Firecrawl as a Web Search provider with friendlier handling for anonymous search limits.",
        "Fixed a batch of reported UI, import, search, and provider compatibility bugs.",
        "Improved release build preparation for bundled MCP resources.",
      ],
      zh: [
        "新增 Firecrawl 網頁搜尋 Provider，並優化匿名搜尋受限時的提示。",
        "修復一批使用者回饋的介面、匯入、搜尋和 Provider 相容性問題。",
        "改進發布建置中 MCP 隨包資源的準備流程。",
      ],
    },
  },
  {
    version: "0.4.24",
    date: "2026-06-16",
    highlights: {
      en: [
        "Improved project creation visibility, lint repair suggestions, zoom controls, autosave, and review persistence across project switches.",
        "Fixed vector index cleanup, Unicode page IDs, duplicate scan prefiltering, and local embedding requests so indexes and rebuilds stay accurate.",
        "Improved MCP and local CLI provider reliability, including MCP version reporting and running Codex CLI from the project root.",
        "Improved language prompts so technical names, model names, tool names, and code identifiers are preserved more reliably.",
        "Hardened Windows startup with a native title bar, earlier API startup, and a visible startup-error fallback instead of a blank window.",
      ],
      zh: [
        "改進專案建立欄位可見性、檢查修復建議、縮放控制、自動儲存，以及切換專案後的待審閱項保留。",
        "修復向量索引清理、Unicode 頁面 ID、重複掃描預篩選和本地 Embedding 請求，確保索引與重建結果更準確。",
        "改進 MCP 與本地 CLI Provider 穩定性，包括 MCP 版本顯示，以及從專案根目錄執行 Codex CLI。",
        "改進語言提示詞，更可靠地保留技術名、模型名、工具名和程式碼識別碼。",
        "增強 Windows 啟動穩定性：使用原生標題列、提前啟動 API，並在前端啟動失敗時顯示錯誤訊息而不是白屏。",
      ],
    },
  },
  {
    version: "0.4.23",
    date: "2026-06-08",
    highlights: {
      en: [
        "Added Doubao embedding compatibility and improved embedding rebuild safety.",
        "Fixed dedup scan hangs, Codex CLI PATH detection from login shells, and several ingest / scheduled import reliability issues.",
      ],
      zh: [
        "新增 Doubao Embedding 相容，並提升 Embedding 重建過程的安全性。",
        "修復去重掃描卡住、Codex CLI 登入 shell PATH 偵測，以及多處擷取和定期匯入穩定性問題。",
      ],
    },
  },
  {
    version: "0.4.22",
    date: "2026-06-08",
    highlights: {
      en: [
        "Improved MinerU PDF previews by extracting images from MinerU result archives and rewriting them into Markdown image links.",
        "Converted MinerU HTML tables inside Markdown output into Markdown tables for cleaner preview and ingest.",
        "Hardened MinerU image handling for spaces, parentheses, path traversal, duplicate names, and partial image-save failures.",
      ],
      zh: [
        "改進 MinerU PDF 預覽：從 MinerU 結果壓縮包提取圖片，並重寫為 Markdown 圖片引用。",
        "將 MinerU Markdown 輸出中的 HTML 表格轉換為 Markdown 表格，讓預覽和擷取更乾淨。",
        "強化 MinerU 圖片處理，覆蓋空格、括號、路徑穿越、重名圖片和圖片儲存部分失敗等邊界。",
      ],
    },
  },
  {
    version: "0.4.21",
    date: "2026-06-08",
    highlights: {
      en: [
        "Improved chat image support with safer local image handling, MiniMax M3 provider compatibility, and GLM vision model compatibility.",
        "Improved MinerU PDF parsing, local CLI provider resolution, API/MCP settings, and source/image ingestion reliability.",
        "Closed a batch of fixed GitHub issues covering source monitoring, scrolling, long-document ingest, editing, and provider compatibility.",
      ],
      zh: [
        "改進 AI 對話圖片支援，增強本地圖片處理安全性，並擴充 MiniMax M3 Provider 與 GLM 多模態模型相容。",
        "優化 MinerU PDF 解析、本地 CLI Provider 解析、API/MCP 設定，以及資料與圖片擷取穩定性。",
        "集中處理並關閉一批已修復的 GitHub issue，覆蓋資料監控、滾動、長文件擷取、編輯儲存和 Provider 相容。",
      ],
    },
  },
  {
    version: "0.4.20",
    date: "2026-06-04",
    highlights: {
      en: [
        "Fixed the macOS titlebar so it keeps native window dragging while following light and dark mode.",
      ],
      zh: [
        "修復 macOS 頂部標題列：保留系統原生拖動，同時跟隨亮色和暗色模式。",
      ],
    },
  },
  {
    version: "0.4.19",
    date: "2026-06-03",
    highlights: {
      en: [
        "Fixed the macOS traffic-light titlebar drag area while keeping Windows and Linux on their native window controls.",
      ],
      zh: [
        "修復 macOS 頂部紅黃綠按鈕區域無法拖動窗口的問題，同時保持 Windows 和 Linux 使用原生窗口控制。",
      ],
    },
  },
  {
    version: "0.4.18",
    date: "2026-06-03",
    highlights: {
      en: [
        "Fixed close-window behavior on macOS and restored a clear Quit / Hide Window confirmation when asking before close.",
        "Improved Linux compatibility so the window minimizes instead of hiding when system tray support is unavailable.",
      ],
      zh: [
        "修復 macOS 關閉窗口行為，並在詢問模式下恢復清晰的「退出 / 隐藏窗口」確認。",
        "改進 Linux 相容性：系統托盤不可用時改為最小化，避免窗口隱藏後無法恢復。",
      ],
    },
  },
  {
    version: "0.4.17",
    date: "2026-06-03",
    highlights: {
      en: [
        "Added a local MCP server for agent clients, using the same project, search, graph, and file APIs as the desktop app.",
        "Updated Settings to manage API + MCP access together, including token guidance and a copyable MCP client configuration.",
      ],
      zh: [
        "新增本地 MCP 服務，方便智慧體用戶端透過與桌面端一致的專案、搜尋、圖譜和檔案介面存取 LLM Wiki。",
        "設定中新增 API + MCP 管理入口，包含存取開關、token 提示和可複製的 MCP 用戶端配置。",
      ],
    },
  },
  {
    version: "0.4.17-custom",
    date: "2026-05-30",
    highlights: {
      en: [
        "Knowledge Graph search: a new search control in the graph view lets you find and highlight nodes by name, with keyboard navigation and animated flyover to matching nodes.",
        "Ollama web search: Ollama models can now act as a search provider for Chat and Deep Research without needing an external API key.",
        "SearXNG self-hosted search: configure your own SearXNG instance as a web search source with selectable category filters.",
        "Knowledge Tree new page types: Finding, Thesis, and Methodology pages are now supported as first-class wiki page types.",
        "Sources view overhaul: two-stage inline delete confirmation (arm/confirm), virtual-scroll for large source trees, and a rescan button to sync external filesystem changes.",
        "Chat input redesign: web search and AnyTXT toggles now appear inside the chat input box for faster access.",
        "Mermaid diagram rendering fix: diagrams no longer re-render or flash during active LLM streaming.",
        "API server replaces internal web chat server for a more robust and configurable local API with access token support.",
        "Various stability and performance improvements inherited from upstream v0.4.7–v0.4.16.",
        "Notion integration preserved: import Notion pages via Settings → Integrations → Notion API Key.",
      ],
      zh: [
        "知識圖譜搜尋：圖譜視圖新增搜尋控件，可按名稱找到並高亮節點，支援鍵盤導航與動畫定位。",
        "Ollama 網頁搜尋：Ollama 模型現在可作為 AI 對話和深度研究的搜尋 Provider，無需外部 API 金鑰。",
        "SearXNG 自建搜尋：可設定自建的 SearXNG 實例作為網頁搜尋來源，並可選擇搜尋類別。",
        "知識樹新頁面類型：新增 Finding（發現）、Thesis（論點）、Methodology（方法論）三種 Wiki 頁面類型。",
        "原始資料側邊欄改進：兩段式確認刪除（點一下 Arm，再點確認），大型資料夾虛擬滾動，以及手動重新整理外部檔案系統變更。",
        "聊天輸入列重新設計：網頁搜尋與 AnyTXT 開關整合在輸入框內，操作更快捷。",
        "Mermaid 圖表渲染修正：AI 串流輸出期間圖表不再重複渲染或閃爍。",
        "API 伺服器取代舊版 Web Chat Server，提供更強大的本機 API，支援存取 Token 控制。",
        "繼承 upstream v0.4.7–v0.4.16 的多項穩定性與效能改進。",
        "保留 Notion 整合：可透過 設定 → 整合 → Notion API 金鑰 匯入 Notion 頁面。",
      ],
    },
  },
  {
    version: "0.4.16",
    date: "2026-05-29",
    highlights: {
      en: [
        "Improved knowledge graph performance for large projects with worker-based layout and lighter rendering updates.",
        "Fixed graph search rendering errors and stabilized graph controls during filtering and search.",
      ],
      zh: [
        "优化大型项目的知识图谱性能，使用后台布局计算并减少渲染更新开销。",
        "修复图谱搜索时的渲染报错，并提升筛选和搜索过程中的图谱稳定性。",
      ],
    },
  },
  {
    version: "0.4.15",
    date: "2026-05-28",
    highlights: {
      en: [
        "Added AnyTXT as an external information source for Chat and Deep Research, with source labels and snippet previews.",
        "Added legacy Word .doc support for source import, text extraction, ingest, and preview.",
        "Improved source import, monitoring, chat search controls, graph controls, wiki generation reliability, and Mermaid rendering stability.",
        "Fixed raw-source preview, scrolling, editing, embedding configuration, and lint persistence issues.",
      ],
      zh: [
        "新增 AnyTXT 作为 AI 对话和 Deep Research 的外部信息源，并支持来源标记和片段预览。",
        "新增旧版 Word .doc 支持，可用于资料导入、文本提取、摄取和预览。",
        "改进资料导入与监控、对话搜索开关、关系图控制、Wiki 生成可靠性和 Mermaid 渲染稳定性。",
        "修复原始资料预览、滚动、编辑保存、Embedding 配置和检查结果持久化相关问题。",
      ],
    },
  },
  {
    version: "0.4.14",
    date: "2026-05-26",
    highlights: {
      en: [
        "Deep Research can now use AnyTXT local file search alongside web search, with configurable research sources.",
        "Improved long-document ingestion with more resilient chunked analysis and follow-up research suggestions.",
        "Fixed provider compatibility and Windows path handling issues.",
      ],
      zh: [
        "Deep Research 现在可结合 AnyTXT 本地文件搜索和网页搜索，并支持配置研究信息来源。",
        "改进长文档导入：分块分析更稳，并优化补充研究建议生成。",
        "修复 Provider 兼容性和 Windows 路径处理相关问题。",
      ],
    },
  },
  {
    version: "0.4.13",
    date: "2026-05-24",
    highlights: {
      en: [
        "Improved local API and search reliability, including shared backend search behavior.",
        "Fixed source handling edge cases for nested folders, non-English paths, and Windows compatibility.",
        "Fixed search provider configuration and Codex CLI Windows behavior issues.",
      ],
      zh: [
        "改进本地 API 与搜索稳定性，包括统一后端搜索能力。",
        "修复嵌套资料文件夹、非英文路径和 Windows 兼容相关的资料处理问题。",
        "修复搜索 Provider 配置和 Codex CLI 在 Windows 下的体验问题。",
      ],
    },
  },
  {
    version: "0.4.12",
    date: "2026-05-19",
    highlights: {
      en: [
        "Fixed SearXNG web search configuration so self-hosted instances work without requiring an API key.",
      ],
      zh: [
        "修复 SearXNG 网页搜索配置：自托管实例不再被错误要求填写 API Key。",
      ],
    },
  },
  {
    version: "0.4.11",
    date: "2026-05-19",
    highlights: {
      en: [
        "Added a local API server for project files, search, graph data, and source rescans, with configurable access control in Settings.",
        "Unified UI and API search on the Rust backend with keyword and vector retrieval.",
        "Added Knowledge Graph search with a compact expandable search control and improved empty-result stability.",
      ],
      zh: [
        "新增本地 API Server，可通过接口访问项目文件、搜索、关系图数据和资料重扫，并可在设置中配置访问控制。",
        "UI 搜索和 API 搜索统一到 Rust 后端，支持关键词与向量检索。",
        "关系图新增搜索功能，默认使用紧凑的可展开搜索按钮，并改进无结果时的稳定性。",
      ],
    },
  },
  {
    version: "0.4.10",
    date: "2026-05-14",
    highlights: {
      en: [
        "Added configurable source folder monitoring, manual source-folder refresh, and Gemini native embeddings support.",
        "Fixed source sync, embedding provider compatibility, and settings localization issues.",
      ],
      zh: [
        "新增可配置的资料文件夹监控、手动刷新资料文件夹，以及 Gemini 原生向量嵌入支持。",
        "修复资料同步、向量 provider 兼容性和设置页本地化相关问题。",
      ],
    },
  },
  {
    version: "0.4.9",
    date: "2026-05-11",
    highlights: {
      en: ["Fixed Windows compatibility issues around file paths, source sync, and file deletion."],
      zh: ["修复 Windows 下文件路径、原始资料同步和文件删除相关的兼容性问题。"],
    },
  },
  {
    version: "0.4.8",
    date: "2026-05-11",
    highlights: {
      en: [
        "Project file sync is more complete: external changes in raw sources can be detected, queued persistently, retried, and routed through the same source add/delete lifecycle as in-app actions.",
        "Source cleanup is more reliable when raw files are deleted outside the app: related wiki pages, index entries, wikilinks, and `related:` references are cleaned consistently, including path-style `.md` links.",
        "Web search adds SearXNG as a provider, with per-provider configuration and selectable SearXNG search categories.",
        "Large raw-source folders are easier to browse: the Sources page now renders the file tree progressively while scrolling.",
        "OpenAI GPT-5 / o-series ingest compatibility is improved by using the supported completion-token parameter shape and avoiding unsupported sampling knobs.",
      ],
      zh: [
        "项目文件同步更完整：外部修改 raw sources 后可被检测、持久化排队、重试，并统一走应用内相同的 source 添加/删除生命周期。",
        "外部删除原始文件后的清理更可靠：相关 wiki 页面、index 条目、正文 wikilink 和 `related:` 引用会一致清理，也覆盖带路径和 `.md` 后缀的引用。",
        "网页搜索新增 SearXNG Provider，支持独立配置并选择 SearXNG 搜索分类。",
        "原始资料目录较大时更易浏览：Sources 页面现在会随滚动渐进渲染文件树。",
        "改进 OpenAI GPT-5 / o-series 的 ingest 兼容性：使用支持的 completion token 参数，并避免发送不支持的采样参数。",
      ],
    },
  },
  {
    version: "0.4.7",
    date: "2026-05-06",
    highlights: {
      en: [
        "Web search now supports multiple providers: Tavily and SerpApi can be configured separately, with independent API keys and SerpApi search-engine selection.",
        "Reasoning-model support is improved across providers: thinking controls are available in LLM settings, structured ingest avoids reasoning-only failures, and chat can show model thinking when an endpoint streams it.",
        "Knowledge graph exploration is cleaner with filters, structural-node hiding, right-click node hide, and reset controls.",
        "Persian (Farsi) is now available as an output language, with better auto-detection from Arabic, RTL rendering, and per-project target-language preferences.",
      ],
      zh: [
        "网页搜索支持多 Provider：Tavily 和 SerpApi 可分别配置，API Key 独立保存，并支持选择 SerpApi 搜索引擎。",
        "推理型模型支持增强：LLM 设置里新增 thinking / reasoning 控制，结构化导入会避免只输出思考不输出正文的问题，聊天中也能显示模型流式返回的思考过程。",
        "关系图新增过滤能力：可隐藏结构性节点、按节点/连接过滤、右键隐藏单个节点，并可一键重置。",
        "新增 Persian (Farsi) 输出语言支持：自动检测可更好地区分 Persian 和 Arabic，内容按 RTL 显示，Target Language 也改为按项目独立保存。",
      ],
    },
  },
  {
    version: "0.4.6",
    date: "2026-05-01",
    highlights: {
      en: [
        "Right-click delete in the Knowledge tree for entity / concept pages, with full reference cleanup: every body `[[wikilink]]`, `index.md` listing entry, and `related:` frontmatter array pointing at the deleted page is rewritten in the same pass — no more dangling refs left behind for the FrontmatterPanel to flag with a warning icon.",
        "Mermaid diagrams now render in chat: any ` ```mermaid ` fenced code block in an LLM reply renders as an SVG (lazy-loaded so the diagram engine is only fetched when first encountered). Click a diagram to enlarge with zoom controls; Esc to close.",
        "Wiki pages whose frontmatter was wrapped in a stray ```yaml … ``` code fence now render correctly: the orphan closing ``` no longer hijacks the body into one giant un-formatted code block.",
        "Windows: Claude Code CLI provider works again. Detection and chat spawn now resolve through the same path lookup (claude.cmd → claude.exe → claude), so Settings showing \"installed\" matches what chat can actually spawn.",
        "Fixed: switching the UI language in Settings → Interface, saving, then editing any other settings field and saving again no longer silently reverts the UI back to the previous language.",
        "All file-delete paths (Sources view source delete, Lint view orphan delete, Knowledge tree right-click) now use the same cleanup helper, so deleting via any of them gets the full sweep — no more inconsistent behaviour where one path cleaned wikilinks but left `related:` frontmatter pointing at the void.",
      ],
      zh: [
        "Knowledge 知识树新增右键删除 entity / concept 页面：删除时自动清理所有引用 —— 文中的 `[[wikilink]]`、`index.md` 的目录条目、其它页面 frontmatter `related:` 数组里指向被删页的 slug，全都在同一步重写干净，不再留断链让 FrontmatterPanel 显示警告图标。",
        "聊天中支持渲染 Mermaid 图：LLM 回复里的 ` ```mermaid ` 代码块会渲染成 SVG（懒加载，只有遇到第一个图才下载渲染引擎）。点击图可放大查看，支持缩放控制和 Esc 关闭。",
        "frontmatter 被错误包在 ```yaml … ``` 代码栅栏里的 wiki 页现在能正常渲染：之前下半部全部被孤立的闭 fence 当成一个未关闭的代码块，标题、列表、表格全都不上样式。",
        "Windows 下 Claude Code CLI 再次可用：探测和 chat 启动现在走同一套路径解析（claude.cmd → claude.exe → claude），不会再出现「Settings 检测到已安装但实际 chat 启动失败」的怪现象。",
        "修复：在 Settings → Interface 切换 UI 语言保存后，再编辑其它设置并保存，UI 不会再被静默切回原来的语言。",
        "所有删除入口（Sources 删原始文档、Lint 删孤儿页、Knowledge 树右键）现在都走同一个清理辅助函数，任意路径删除都会触发完整清扫 —— 不会再有一条路径清掉 wikilink 但漏掉 `related:` 留下断引的不一致。",
      ],
    },
  },
  {
    version: "0.4.5",
    date: "2026-04-30",
    highlights: {
      en: [
        "Settings → Network: global HTTP/HTTPS proxy with live apply (no app restart needed). Local addresses bypass the proxy by default so Ollama / LM Studio / LAN-deployed LLMs keep working.",
        "Settings → Maintenance: new \"Detect duplicate entities / concepts\" tool. The LLM scans every wiki page and surfaces likely-duplicate groups (English vs Chinese name, plural vs singular, abbreviation vs full form). You confirm each group before merging; merges run through a persistent serial queue with up to 3 automatic retries, survives app restart, and supports cancel / retry from the UI.",
        "Re-ingesting an entity / concept page that already exists now preserves earlier contributions: an LLM merge step combines old + new bodies instead of clobbering, with length / structure sanity checks and a backup snapshot on fallback.",
        "Frontmatter tags / related fields are now union-merged across re-ingests (previously only sources was protected — earlier-contributed tags and links silently disappeared).",
        "Wiki pages whose frontmatter was wrapped in a stray ```yaml … ``` code fence now render correctly: the orphan closing ``` no longer hijacks the body into one giant un-formatted code block.",
        "Better Claude Code CLI error reporting: the bare \"exit 1\" message is replaced by the actual subprocess stderr / unparsed stdout, so authentication failures and other startup errors are visible instead of opaque.",
        "Better diagnostic when a model produces lots of \"thinking\" text but never any answer (some Kimi / Qwen-style endpoints stream `reasoning` only and emit no `content` — previously this surfaced as \"analysis Not available\" with no clue why).",
      ],
      zh: [
        "设置里新增「网络」面板，可配置全局 HTTP/HTTPS 代理，保存即时生效不需要重启应用。本地地址默认不走代理，Ollama / LM Studio / 局域网 LLM 不受影响。",
        "设置里新增「维护」面板，包含「检测重复实体 / 概念」工具：LLM 扫描全部 wiki 页面，把可能指向同一主题但用了不同名字的页面分组（中英对照、单复数、缩写与全称等），每组确认后再合并。合并任务进入持久化串行队列，自动重试最多 3 次，应用重启不丢，UI 支持取消和重试。",
        "重新 ingest 同名 entity / concept 页时，由 LLM 把新旧版本合并成一份完整内容，不再直接覆盖丢失之前的贡献；包含长度/结构 sanity 检查，失败时自动备份原版本。",
        "frontmatter 的 tags / related 字段现在跨多次 ingest 自动并集合并（之前只保护 sources，导致旧文档贡献的 tag 和关联会悄悄消失）。",
        "frontmatter 被错误包在 ```yaml … ``` 代码栅栏里的 wiki 页现在能正常渲染：之前页面下半部全部被孤立的闭 fence 当成一个未关闭的代码块，标题、列表、表格全都不上样式。",
        "Claude Code CLI 的报错信息更详细：不再只显示「exit 1」，而是把子进程实际的 stderr / 未解析的 stdout 展示出来，鉴权失败等启动问题终于看得见。",
        "改进诊断：模型只输出 reasoning 但不输出 content 的情况（部分 Kimi / Qwen 端点的流式接口只发 reasoning_content）现在会明确报告，而不是丢出令人摸不着头脑的「analysis Not available」。",
      ],
    },
  },
  {
    version: "0.4.4",
    date: "2026-04-28",
    highlights: {
      en: [
        "Native ARM64 Linux builds — .deb and .AppImage now ship for aarch64 (Raspberry Pi, ARM cloud instances, Apple Silicon Linux VMs).",
        "Visual frontmatter panel for wiki pages: type-coded chips for entity / concept / query, clickable source and related cards that navigate directly to the linked file or page.",
        "Read-mode default for wiki pages — Obsidian-style [[wikilinks]] render as proper clickable links instead of raw bracketed text. Edit toggle in the top-right keeps the WYSIWYG editor available when needed.",
        "LLM-generated wiki pages no longer get wrapped in a stray ```yaml ... ``` code fence (prompt rewrite + write-time sanitizer + read-time fallback).",
        "IME composition Enter no longer triggers chat / search / research submit when typing under a Chinese / Japanese / Korean input method.",
        'Selecting Claude Code CLI provider in Settings (the "no API key" option) now works across ingest, sweep, lint, chat, sources, and the clip watcher — previously it failed with "LLM not configured" everywhere.',
      ],
      zh: [
        "新增原生 ARM64 Linux 构建（.deb / .AppImage），覆盖树莓派、ARM 云实例、Apple Silicon Linux 虚拟机等。",
        "Wiki 页面顶部新增可视化 frontmatter 面板：实体 / 概念 / 查询用色块徽章区分，源文件和相关页面用可点击卡片，单击跳转。",
        "Wiki 页面默认进入阅读模式，Obsidian 风格的 [[wikilink]] 渲染成蓝色可点链接而不是字面括号文本；右上角 Edit 按钮可切回 WYSIWYG 编辑器。",
        "LLM 生成的 wiki 页面不再被错误地包在 ```yaml ... ``` 代码栅栏里（prompt 改写 + 写盘清洗 + 读取兜底三层防御）。",
        "中日韩输入法选词时按 Enter 不再误触发聊天 / 搜索 / 研究的提交。",
        "选用 Claude Code CLI provider（无需 API key）后，导入、聊天、语义 lint、sweep、剪藏导入等所有功能都能正常工作（此前各处都误报 LLM 未配置）。",
      ],
    },
  },
  {
    version: "0.4.3",
    date: "2026-04-28",
    highlights: {
      en: [
        "Fixed Ollama connection failure when configured to a LAN-deployed instance (e.g. http://192.168.x.x:11434). The Origin header is now sent as http://localhost regardless of server address, so Ollama's default OLLAMA_ORIGINS allowlist accepts it.",
      ],
      zh: [
        "修复使用局域网内 Ollama 服务（如 http://192.168.x.x:11434）时连接失败的问题。Origin 请求头现在固定为 http://localhost，匹配 Ollama 默认的 OLLAMA_ORIGINS 白名单。",
      ],
    },
  },
  {
    version: "0.4.2",
    date: "2026-04-28",
    highlights: {
      en: [
        "Project creation dialog now requires picking an AI output language up front — the previous Auto default surprised users with mixed-language output.",
        "Deleting a project actually removes it from the recent list now (previously the auto-open flow re-added it on next launch).",
      ],
      zh: [
        "创建项目时必须显式选择 AI 输出语言（之前 Auto 默认值会让生成内容混杂语言）。",
        "删除项目后真正从最近列表里移除（之前重启应用会被自动重新打开流程加回来）。",
      ],
    },
  },
  {
    version: "0.4.1",
    date: "2026-04-27",
    highlights: {
      en: [
        "Polished the update-available notification banner; the download link now opens in the system browser.",
        "Settings gear and About row keep showing a small red dot when an update is available, even after dismissing the top banner.",
      ],
      zh: [
        "新版本提醒 banner 优化样式，下载链接用系统浏览器打开。",
        "有可用更新时，设置齿轮按钮和 About 行会显示小红点，即使关闭顶部 banner 也仍然提示。",
      ],
    },
  },
  {
    version: "0.4.0",
    date: "2026-04-26",
    highlights: {
      en: [
        "Multimodal ingest: extract embedded images from PDF / docx / pptx and caption them with a vision model so the wiki page references each image with semantic alt text instead of empty placeholders.",
        "Image-aware search: results page splits into Pages and Images sections, clicking a thumbnail opens a lightbox and a Jump-to-source button navigates directly into the original document at the right location.",
        "Folder import + recursive cascade delete with two-stage inline confirmation (no more accidental folder loss from a single misclick).",
      ],
      zh: [
        "多模态导入：从 PDF / docx / pptx 抽出内嵌图片并用视觉模型生成描述，wiki 页面引用图片时带上语义 alt 文本。",
        "搜索结果新增图片分区：缩略图点击打开 lightbox，跳转到源文档按钮直达图片在原文中的位置。",
        "支持文件夹批量导入和递归级联删除（删除按钮采用两段式确认，避免误删整个文件夹）。",
      ],
    },
  },
]
