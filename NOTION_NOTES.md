# Notion 資料庫整合與長文件 Ingestion 開發踩坑與最佳實踐記錄

本文件記錄了在整合 Notion 資料庫（Database）匯入與知識庫提取（Ingestion）過程中所遇到的核心技術瓶頸、踩坑經驗與對應的架構解法。

---

## 1. Notion API 與資料庫解析踩坑

### 坑 1：Page URL 與 Database URL 的混淆
- **現象**：使用者貼入 Notion 網址後，原本預期抓取整個新聞資料庫（數十筆），但卻只抓到了 14 筆。
- **原因**：Notion 的網址分為「一般頁面 (Page)」與「資料庫 (Database)」。若貼上的是某一天或特定檢視表的 Page 網址，API 只會讀取該 Page 底下的內容（剛好 14 筆）；必須使用主資料庫（Database）的網址才能查出所有歷史記錄。
- **解法**：
  1. 升級 `extractNotionId`，精準相容 `/p/Title-{ID}`、`?v=...`、UUID 與 32-hex 格式。
  2. 系統自動檢測 ID 究竟是 Page 還是 Database，若為 Database 則啟動全量資料列查詢，若為 Page 則同時展開其內嵌資料庫。

### 坑 2：`notion-to-md` 預設跳過內嵌資料庫內容
- **現象**：匯入包含內嵌資料庫（Inline Database）的 Notion 頁面時，轉換出的 Markdown 只有短短一行資料庫標題。
- **原因**：`notion-to-md` 遇到 `child_database` 區塊時，預設只會輸出資料庫名稱，完全不會調用 Notion API 查詢記錄。
- **解法**：在 `notion-to-md` 實例上註冊 `child_database` 的 Custom Transformer，自動遞迴呼叫 `client.databases.query` / `client.dataSources.query`，將資料庫展開為 Markdown 表格與卡片詳細記錄。

### 坑 3：最新版 Notion SDK 的 Data Sources 機制
- **現象**：在最新 Notion API（2025-09-03 / 2026）中，直接對 `databases.query` 查詢可能遺漏不同分頁或檢視表的項目。
- **原因**：最新架構將資料庫抽象為 `data_sources`，一個 Database 可能有多個 Data Sources。
- **解法**：在 `fetchDatabaseMetadata` 收集所有的 `dataSourceIds`，並在 `queryAllDatabaseRows` 中遍歷所有資料來源進行去重聚合，確保記錄完整。

---

## 2. 知識庫提取（Ingestion）踩坑

### 坑 4：單一長文件 vs 獨立多檔案的知識庫落差
- **現象**：資料庫內容明明有幾十筆資料，轉換為 Wiki 後卻只生成了少數 3~5 筆頁面。
- **原因**：
  - 當所有資料庫記錄合併為單一長 Markdown 文件時，AI Ingest 會將其視為「一篇單一文章」，受限於 LLM 單次回覆 Token 上限（8,192 tokens），AI 只能採取重點提煉與歸納，只萃取最核心的幾個主題實體。
- **解法**：
  - 新增 **「獨立多檔案模式 (Multi-file Mode)」**：為資料庫建立專屬資料夾（例如 `raw/sources/每日AI新聞-20260915/`），將每一條新聞獨立存為 `01-標題.md`，並附帶 `index.md` 索引總表。
  - 匯入後自動批次排入 Ingest 佇列，AI 逐篇處理，為每筆新聞建立獨立的 Wiki 頁面與知識圖譜關聯。

### 坑 5：Chunk Analysis 錯誤訊息遮蔽
- **現象**：長文件在切塊分析失敗時，畫面僅顯示 `Chunk analysis stream failed`，無法得知底層原因。
- **原因**：程式碼中 `if (hadError) throw new Error("Chunk analysis stream failed")` 遺失了 LLM 回傳的原始 Error 物件。
- **解法**：在 Catch 與 Stream Callback 中記錄 `chunkErrorMessage`，並拋出包含具體錯誤（如 401、429、Quota exceeded、Context length exceeded 等）的完整描述，方便快速除錯。

---

## 3. Tauri 桌面環境與建置踩坑

### 坑 6：Tauri macOS 打包資源缺少導致 Panic
- **現象**：執行 `npm run tauri dev` 時，Rust build script panic 退出：
  `resource path ../mcp-server/dist doesn't exist`
  `resource path ../mcp-server/node_modules doesn't exist`
- **原因**：`src-tauri/tauri.macos.conf.json` 定義了隨附打包資源包含 `mcp-server/dist` 與 `node_modules`，若未預先編譯或安裝依賴則會中斷。
- **解法**：在 `mcp-server` 目錄執行 `npm install` 與 `npm run build`（或透過主專案 `npm run mcp:build`）即可解決。

### 坑 7：前端套件缺失引發白畫面
- **現象**：啟動後桌面視窗一片空白，畫面未正常渲染。
- **原因**：專案根目錄的 `node_modules` 缺少 `@tauri-apps/plugin-autostart`、`mermaid` 等相依套件，導致 Vite 在前端 Runtime 載入模組失敗。
- **解法**：在專案根目錄執行 `npm install` 完整安裝宣告依賴後恢復正常。
