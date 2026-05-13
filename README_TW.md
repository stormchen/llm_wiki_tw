# LLM Wiki

<p align="center">
  <img src="logo.jpg" width="128" height="128" style="border-radius: 22%;" alt="LLM Wiki Logo">
</p>

<p align="center">
  <strong>一個能自我構建的個人知識庫。</strong><br>
  LLM 閱讀你的文件，構建結構化 Wiki，並持續保持更新。
</p>

<p align="center">
  <a href="#這是什麼">這是什麼？</a> •
  <a href="#我們的修改與新增">功能特性</a> •
  <a href="#技術棧">技術棧</a> •
  <a href="#安裝">安裝</a> •
  <a href="#致謝">致謝</a> •
  <a href="#許可證">許可證</a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | 繁體中文
</p>

---

<p align="center">
  <img src="assets/overview.jpg" width="100%" alt="概覽">
</p>

## 功能亮點

- **兩步思維鏈攝入** — LLM 先分析再生成 Wiki 頁面，來源可追溯，支援增量快取
- **四訊號知識圖譜** — 直接連結、來源重疊、Adamic-Adar、型別親和四維關聯度模型
- **Louvain 社群檢測** — 自動發現知識聚類，內聚度評分
- **圖譜洞察** — 驚奇連線與知識空白檢測，一鍵觸發 Deep Research
- **向量語義搜尋** — 可選的 embedding 檢索，基於 LanceDB，支援任意 OpenAI 相容端點
- **持久化攝入佇列** — 序列處理，崩潰恢復，取消/重試，進度視覺化
- **資料夾匯入** — 遞迴匯入保留目錄結構，資料夾路徑作為 LLM 分類上下文
- **深度研究** — LLM 智慧生成搜尋主題，多查詢網路搜尋，研究結果自動攝入 Wiki
- **非同步稽核系統** — LLM 在攝入時標記需人工判斷的項，預定義操作，預生成搜尋查詢
- **Chrome 網頁剪藏** — 一鍵捕獲網頁內容，自動攝入知識庫
- **Notion 整合** — 將 Notion 頁面直接匯入為 Markdown 格式，並無縫攝入你的知識庫
- **網頁 Chat 介面** — 無需安裝，Coworker 透過瀏覽器即可查詢知識庫，支援中英文，帶打字機串流效果

## 這是什麼？

LLM Wiki 是一個跨平臺桌面應用，能將你的文件自動轉化為有組織、相互關聯的知識庫。與傳統 RAG（每次查詢都從頭檢索和回答）不同，LLM 會從你的資料中**增量構建並維護一個持久化的 Wiki**。知識只編譯一次並持續更新，而非每次查詢都重新推導。

本專案基於 [Karpathy 的 LLM Wiki 方法論](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) —— 一套使用 LLM 構建個人知識庫的方法論。我們將其核心理念實現為一個完整的桌面應用，並做了大量增強。

<p align="center">
  <img src="assets/llm_wiki_arch.jpg" width="100%" alt="LLM Wiki 架構圖">
</p>

## 致謝

基礎方法論來自 **Andrej Karpathy** 的 [llm-wiki.md](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)，描述了使用 LLM 增量構建和維護個人 Wiki 的設計模式。原始文件是一個抽象的設計正規化；本專案是一個具體的實現，並有大量擴充套件。

## 保留的原始設計

核心架構忠實遵循 Karpathy 的方法論：

- **三層架構**：原始資料（不可變）→ Wiki（LLM 生成）→ Schema（規則和配置）
- **三個核心操作**：Ingest（攝入）、Query（查詢）、Lint（檢查）
- **index.md** 作為內容目錄和 LLM 導航入口
- **log.md** 作為可解析格式的時序操作記錄
- **[[wikilink]]** 語法用於交叉引用
- **YAML frontmatter** 存在於每個 Wiki 頁面
- **Obsidian 相容** —— Wiki 目錄可直接作為 Obsidian 倉庫使用
- **人類策展，LLM 維護** —— 基本角色分工

<p align="center">
  <img src="assets/5-obsidian_compatibility.jpg" width="100%" alt="Obsidian 相容">
</p>

## 我們的修改與新增

### 1. 從命令列到桌面應用

原始設計是一個抽象的模式文件，設計上是複製貼上給 LLM agent 使用的。我們將其構建為**完整的跨平臺桌面應用**：
- **三欄佈局**：知識樹 / 檔案樹（左）+ 聊天（中）+ 預覽（右）
- **圖示側邊欄** —— 在 Wiki、資料源、搜尋、圖譜、Lint、稽核、深度研究、設定之間快速切換
- **自定義可調面板** —— 左右面板支援拖拽調整大小，帶最小/最大約束
- **活動面板** —— 實時處理狀態，逐檔案顯示攝入進度
- **全狀態持久化** —— 對話、設定、稽核項、專案配置在重啟後保持
- **場景模板** —— 研究、閱讀、個人成長、商業、通用 —— 每個模板預配置 purpose.md 和 schema.md

### 2. Purpose.md —— Wiki 的靈魂

原始設計有 Schema（Wiki 如何運作），但沒有正式定義 **為什麼** 這個 Wiki 存在。我們新增了 `purpose.md`：
- 定義目標、關鍵問題、研究範圍、演進中的論點
- LLM 在每次攝入和查詢時都會讀取它以獲取上下文
- LLM 可以根據使用模式建議更新
- 與 schema 不同 —— schema 是結構規則，purpose 是方向意圖

### 3. 兩步思維鏈攝入

原始設計描述的是 LLM 同時閱讀和寫入的單步攝入。我們將其拆分為**兩次順序 LLM 呼叫**，顯著提升質量：

```
第一步（分析）：LLM 閱讀資料 → 結構化分析
  - 關鍵實體、概念、論點
  - 與現有 Wiki 內容的關聯
  - 與現有知識的矛盾和張力
  - Wiki 結構建議

第二步（生成）：LLM 基於分析 → 生成 Wiki 檔案
  - 帶 frontmatter 的資料摘要（type, title, sources[]）
  - 實體頁面、概念頁面及交叉引用
  - 更新 index.md、log.md、overview.md
  - 需要人工判斷的稽核項
  - 深度研究的搜尋查詢
```

超越原始設計的攝入增強：
- **SHA256 增量快取** —— 攝入前檢查原始檔內容雜湊，未變更則自動跳過，節省 LLM token 和時間
- **持久化攝入佇列** —— 序列處理防止併發 LLM 呼叫；佇列持久化到磁碟，應用重啟後自動恢復；失敗任務自動重試最多 3 次
- **資料夾匯入** —— 遞迴匯入保留目錄結構；資料夾路徑作為分類上下文傳給 LLM（如 "papers > energy" 幫助分類）
- **佇列視覺化** —— 活動面板顯示進度條、排隊/處理中/失敗任務，支援取消和重試
- **自動 Embedding** —— 開啟向量搜尋時，新頁面攝入後自動生成 embedding
- **來源可追溯** —— 每個生成的 Wiki 頁面在 YAML frontmatter 中包含 `sources: []` 欄位，連結回貢獻的原始資料檔案
- **overview.md 自動更新** —— 全域性概要頁面在每次攝入後重新生成，反映 Wiki 最新狀態
- **保證資料摘要生成** —— 兜底機制確保資料摘要頁面始終被建立，即使 LLM 遺漏
- **語言感知生成** —— LLM 按使用者配置的語言（中文或英文）響應

### 4. 知識圖譜與關聯度模型

<p align="center">
  <img src="assets/3-knowledge_graph.jpg" width="100%" alt="知識圖譜">
</p>

原始設計提到了 `[[wikilinks]]` 用於交叉引用，但沒有圖分析。我們構建了**完整的知識圖譜視覺化和關聯度引擎**：

**四訊號關聯度模型：**
| 訊號 | 權重 | 描述 |
|------|------|------|
| 直接連結 | ×3.0 | 透過 `[[wikilinks]]` 連結的頁面 |
| 來源重疊 | ×4.0 | 共享同一原始資料的頁面（透過 frontmatter `sources[]`） |
| Adamic-Adar | ×1.5 | 共享共同鄰居的頁面（按鄰居度數加權） |
| 型別親和 | ×1.0 | 相同頁面型別的加分（實體↔實體，概念↔概念） |

**圖譜視覺化（sigma.js + graphology + ForceAtlas2）：**
- 按頁面型別或社群著色節點，按連結數縮放節點大小（√ 縮放）
- 邊的粗細和顏色按關聯權重變化（綠色=強，灰色=弱）
- 懸停互動：鄰居節點保持可見，非鄰居變暗，邊高亮並顯示關聯度分數
- 縮放控制元件（放大、縮小、適應螢幕）
- 位置快取防止資料更新時佈局跳動
- 圖例根據著色模式自動切換型別計數或社群資訊

### 5. Louvain 社群檢測

原始設計中沒有。基於 **Louvain 演算法**（graphology-communities-louvain）自動發現知識聚類：

- **自動聚類** —— 根據連結拓撲發現哪些頁面自然歸為一組，獨立於預定義的頁面型別
- **型別 / 社群 一鍵切換** —— 按頁面型別（實體、概念、資料...）或按發現的知識叢集著色
- **內聚度評分** —— 每個社群按內部邊密度（實際邊數 / 可能邊數）評分；低內聚社群（< 0.15）標警告
- **12 色調色盤** —— 叢集之間視覺區分清晰
- **社群圖例** —— 顯示核心節點標籤、成員數和內聚度

<p align="center">
  <img src="assets/kg_community.jpg" width="100%" alt="Louvain 社群檢測">
</p>

### 6. 圖譜洞察 —— 驚奇連線與知識空白

原始設計中沒有。系統**自動分析圖譜結構**，呈現可操作的洞察：

**驚奇連線：**
- 檢測意外關聯：跨社群邊、跨型別連結、邊緣↔核心耦合
- 複合驚奇度評分排序最值得關注的連線
- 可消除 —— 標記為已檢視後不再重複出現

**知識空白：**
- **孤立頁面**（度 ≤ 1）—— 與 Wiki 其餘部分缺少連線的頁面
- **稀疏社群**（cohesion < 0.15，≥ 3 頁）—— 內部交叉引用薄弱的知識領域
- **橋接節點**（連線 3+ 個叢集）—— 維繫多個知識領域的關鍵樞紐頁面

**互動：**
- 點選洞察卡片**高亮**圖譜中對應節點和邊；再次點選取消
- 知識空白和橋接節點附帶 **Deep Research 按鈕** —— 觸發 LLM 智慧主題生成（讀取 overview.md + purpose.md 獲取領域上下文）
- 研究主題在**可編輯確認對話方塊**中展示 —— 使用者可修改主題和搜尋查詢後再啟動

<p align="center">
  <img src="assets/kg_insights.jpg" width="100%" alt="圖譜洞察">
</p>

### 7. 最佳化的查詢檢索管線

原始設計描述了 LLM 讀取相關頁面的簡單查詢。我們構建了支援可選向量搜尋的**多階段檢索管線**：

```
階段 1：分詞搜尋
  - 英文：分詞 + 停用詞過濾
  - 中文：CJK 二元組分詞（每個 → [每個, 個…]）
  - 標題匹配加分（+10 分）
  - 同時搜尋 wiki/ 和 raw/sources/

階段 1.5：向量語義搜尋（可選）
  - 透過任意 OpenAI 相容的 /v1/embeddings 端點生成 embedding
  - 儲存在 LanceDB（Rust 後端）中進行快速 ANN 檢索
  - 餘弦相似度發現即使沒有關鍵詞重疊也語義相關的頁面
  - 結果合併：增強已有匹配 + 新增新發現

階段 2：圖譜擴充套件
  - 搜尋結果作為種子節點
  - 四訊號關聯度模型發現相關頁面
  - 2 跳遍歷帶衰減，發現更深層關聯

階段 3：預算控制
  - 可配置上下文視窗：4K → 1M tokens
  - 比例分配：60% Wiki 頁面，20% 聊天曆史，5% 索引，15% 系統提示
  - 頁面按搜尋 + 圖譜關聯度綜合分數排序

階段 4：上下文組裝
  - 編號頁面附完整內容（非僅摘要）
  - 系統提示包含：purpose.md、語言規則、引用格式、index.md
  - LLM 被指示按編號引用頁面：[1]、[2] 等
```

**向量搜尋**完全可選 —— 預設關閉，在設定中開啟，有獨立的端點、API Key 和模型配置。關閉時管線 fallback 到分詞搜尋 + 圖譜擴充套件。基準測試：開啟向量搜尋後整體召回率從 58.2% 提升至 71.4%。

### 8. 多對話聊天與持久化

原始設計只有單一查詢介面。我們構建了**完整的多對話支援**：

- **獨立聊天會話** —— 建立、重新命名、刪除對話
- **對話側邊欄** —— 快速切換不同主題
- **逐對話持久化** —— 每個對話儲存到 `.llm-wiki/chats/{id}.json`
- **可配置歷史深度** —— 限制作為上下文傳送的訊息數量（預設：10）
- **引用參考面板** —— 每條回覆上可摺疊的區域，顯示使用了哪些 Wiki 頁面，按型別分組並附圖示
- **引用持久化** —— 引用的頁面直接儲存在訊息資料中，重啟後穩定不變
- **重新生成** —— 一鍵重新生成最後一條回覆（移除最後的助手+使用者訊息對，重新傳送）
- **儲存到 Wiki** —— 將有價值的回答歸檔到 `wiki/queries/`，然後自動攝入提取實體/概念到知識網路

### 9. 思維鏈 / 推理過程展示

原始設計中沒有。針對會輸出 `<think>` 塊的 LLM（DeepSeek、QwQ 等）：

- **流式思維展示** —— 生成中滾動顯示 5 行，帶透明度漸變
- **預設摺疊** —— 生成完成後思維塊隱藏，點選展開
- **視覺分離** —— 思維內容以獨特樣式顯示，與主回覆分開

### 10. KaTeX 數學公式渲染

原始設計中沒有。跨所有檢視的完整 LaTeX 數學支援：

- **KaTeX 渲染** —— 行內 `$...$` 和塊級 `$$...$$` 公式透過 remark-math + rehype-katex 渲染
- **Milkdown 數學外掛** —— 預覽編輯器透過 @milkdown/plugin-math 原生渲染數學公式
- **自動檢測** —— 裸 `\begin{aligned}` 等 LaTeX 環境自動補上 `$$` 定界符
- **Unicode 降級** —— 100+ 符號對映（α, ∑, →, ≤ 等）用於數學塊外的簡單行內符號

### 11. 稽核系統（非同步人機協作）

原始設計建議在攝入時全程參與。我們新增了**非同步稽核佇列**：

- LLM 在攝入過程中標記需要人工判斷的專案
- **預定義操作型別**：建立頁面、深度研究、跳過 —— 約束操作防止 LLM 憑空生成任意操作
- **攝入時生成搜尋查詢** —— LLM 預先為每個稽核項生成最佳化的網路搜尋查詢
- 使用者可在方便時處理稽核 —— 不阻塞攝入流程

### 12. 深度研究

<p align="center">
  <img src="assets/1-deepresearch.jpg" width="100%" alt="深度研究">
</p>

原始設計中沒有。當 LLM 識別出知識空白時：

- **網路搜尋**（Tavily API）查詢相關資料，返回完整內容（非截斷摘要）
- **多條搜尋查詢** —— 攝入時由 LLM 生成，針對搜尋引擎最佳化
- **LLM 智慧主題生成** —— 從圖譜洞察觸發時，LLM 讀取 overview.md + purpose.md 生成領域精準的研究主題和查詢（非泛泛關鍵詞）
- **使用者確認對話方塊** —— 研究主題和搜尋查詢可編輯，確認後才開始研究
- **LLM 綜合** 搜尋結果生成 Wiki 研究頁面，並交叉引用現有 Wiki
- **思維鏈展示** —— 綜合過程中 `<think>` 塊顯示為可摺疊區域，自動滾動到最新內容
- **自動攝入** —— 研究結果自動進入兩步攝入流程，提取實體/概念到 Wiki
- **任務佇列** —— 最多 3 個併發任務
- **研究面板** —— 專用側邊面板，動態高度，實時流式進度

### 13. 瀏覽器擴充套件（網頁剪藏）

<p align="center">
  <img src="assets/4-chrome_extension_webclipper.jpg" width="100%" alt="Chrome 擴充套件網頁剪藏">
</p>

原始設計提到了 Obsidian Web Clipper。我們構建了**專用 Chrome 擴充套件**（Manifest V3）：

- **Mozilla Readability.js** 精確提取文章內容（去除廣告、導航、側邊欄）
- **Turndown.js** 將 HTML 轉換為 Markdown，支援表格
- **專案選擇器** —— 選擇剪藏到哪個 Wiki（支援多專案）
- **本地 HTTP API**（埠 19827，tiny_http）—— 擴充套件 ↔ 應用通訊
- **自動攝入** —— 剪藏內容自動觸發兩步攝入流程
- **剪藏監聽** —— 每 3 秒輪詢新剪藏，自動處理
- **離線預覽** —— 即使應用未執行也能顯示提取的內容

### 14. 多格式文件支援

原始設計聚焦於純文字/Markdown。我們支援保留文件語義的結構化提取：

| 格式 | 方法 |
|------|------|
| PDF | pdf-extract（Rust）+ 檔案快取 |
| DOCX | docx-rs —— 標題、加粗/斜體、列表、表格 → 結構化 Markdown |
| PPTX | ZIP + XML —— 逐頁提取，保留標題/列表結構 |
| XLSX/XLS/ODS | calamine —— 正確的單元格型別、多工作表支援、Markdown 表格 |
| 圖片 | 原生預覽（png, jpg, gif, webp, svg 等） |
| 影片/音訊 | 內建播放器 |
| 網頁剪藏 | Readability.js + Turndown.js → 乾淨的 Markdown |

### 15. 檔案刪除級聯清理

原始設計沒有刪除機制。我們新增了**智慧級聯刪除**：

- 刪除資料檔案時同時移除其 Wiki 摘要頁面
- **三重匹配** 查詢相關 Wiki 頁面：frontmatter `sources[]` 欄位、資料摘要頁面名稱、frontmatter 章節引用
- **共享實體保護** —— 連結到多個資料的實體/概念頁面僅從其 `sources[]` 陣列中移除被刪除的資料，而非刪除整個頁面
- **索引清理** —— 被移除的頁面從 index.md 中清除
- **Wiki 連結清理** —— 指向已刪除頁面的失效 `[[wikilinks]]` 從其餘 Wiki 頁面中移除

### 16. 可配置上下文視窗

原始設計中沒有。使用者可配置 LLM 接收多少上下文：

- **4K 到 1M tokens 滑塊** —— 適配不同 LLM 的能力
- **比例預算分配** —— 更大的視窗按比例獲得更多 Wiki 內容
- **60/20/5/15 分配** —— Wiki 頁面 / 聊天曆史 / 索引 / 系統提示

### 17. 跨平臺相容

原始設計與平臺無關（抽象模式）。我們處理了具體的跨平臺問題：

- **路徑規範化** —— 統一的 `normalizePath()` 在 22+ 個檔案中使用，反斜槓 → 正斜槓
- **Unicode 安全字串處理** —— 基於字元而非位元組的切片（防止中文檔名導致崩潰）
- **macOS 關閉隱藏** —— 關閉按鈕隱藏視窗（程式後臺執行），點選 Dock 圖示恢復，Cmd+Q 退出
- **Windows/Linux 關閉確認** —— 關閉時彈出確認對話方塊，防止誤操作導致資料丟失
- **Tauri v2** —— macOS、Windows、Linux 原生桌面
- **GitHub Actions CI/CD** —— 自動構建 macOS（ARM + Intel）、Windows（.msi）、Linux（.deb / .AppImage）

### 18. 其他新增

- **國際化** —— 中英文介面（react-i18next）
- **設定持久化** —— LLM 提供商、API 金鑰、模型、上下文大小、語言透過 Tauri Store 儲存
- **Obsidian 配置** —— 自動生成 `.obsidian/` 目錄及推薦設定
- **Markdown 渲染** —— 帶邊框的 GFM 表格、程式碼塊、聊天和預覽中的 wikilink 處理
- **多 LLM 提供商** —— OpenAI、Anthropic、Google、Ollama、自定義 —— 各有特定的流式傳輸和請求頭
- **15 分鐘超時** —— 長時間攝入操作不會過早失敗
- **dataVersion 訊號** —— 圖譜和 UI 在 Wiki 內容變更時自動重新整理

### 19. 網頁 Chat 查詢介面（v0.4.6 新增）

讓協作者（Coworker）不需安裝任何軟體，直接用瀏覽器查詢你的 Wiki 知識庫：

- **獨立 HTTP 伺服器**（Port 19828）—— 應用程式啟動後自動在背景執行，監聽區域網路（`0.0.0.0`）
- **零前端修改** —— 完全在 Rust 後端實作，不影響桌面應用的任何現有程式碼
- **內嵌 Chat UI** —— 深色主題、打字機串流效果、Markdown 渲染（marked.js），HTML 直接由 Rust 伺服
- **智慧 Wiki 搜尋** —— 支援中英文查詢，中文採用 CJK bigram 分詞，自動比對 `wiki/` 目錄下的相關 `.md` 頁面
- **多 Provider 串流**：
  - **Google Gemini**：`streamGenerateContent?alt=sse` SSE 格式，過濾 thinking token
  - **Ollama**：OpenAI 相容端點，自動修正 `/v1` 路徑重複問題
  - **Anthropic**：`content_block_delta` SSE 解析
  - **OpenAI / Custom**：標準 OpenAI wire 格式
- **Preset 設定同步** —— 自動讀取 `app-state.json` 中的 `activePresetId` 與 `providerConfigs`，無需額外設定

**使用方式：**

```
1. 啟動 LLM Wiki 桌面應用程式
2. 在應用程式中開啟你的 Wiki 專案
3. Coworker 用瀏覽器打開 http://[你的IP]:19828/chat
4. 輸入問題 → 享受基於 Wiki 知識庫的即時回答
```

> **注意**：網頁 Chat 使用桌面應用目前載入的 Wiki 專案與 LLM 設定，請確認應用程式已開啟並載入專案。

## 技術棧

| 層級 | 技術 |
|------|------|
| 桌面 | Tauri v2（Rust 後端） |
| 前端 | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v4 |
| 編輯器 | Milkdown（基於 ProseMirror 的所見即所得） |
| 圖譜 | sigma.js + graphology + ForceAtlas2 |
| 搜尋 | 分詞搜尋 + 圖譜關聯度 + 可選向量（LanceDB） |
| 向量資料庫 | LanceDB（Rust，嵌入式，可選） |
| PDF | pdf-extract |
| Office | docx-rs + calamine |
| 國際化 | react-i18next |
| 狀態管理 | Zustand |
| LLM | 流式 fetch（OpenAI、Anthropic、Google、Ollama、自定義） |
| 網路搜尋 | Tavily API |
| 網頁 Chat 伺服器 | Rust（reqwest blocking + TCP，Port 19828） |

## 安裝

### 預編譯二進位制檔案

從 [Releases](https://github.com/stormchen/llm_wiki_tw/releases) 下載：
- **macOS**：`.dmg`（Apple Silicon + Intel）
- **Windows**：`.msi`
- **Linux**：`.deb` / `.AppImage`

### 從原始碼構建

```bash
# 前置條件：Node.js 20+, Rust 1.70+
git clone https://github.com/stormchen/llm_wiki_tw.git
cd llm_wiki
npm install
npm run tauri dev      # 開發模式
npm run tauri build    # 生產構建
```

### Chrome 擴充套件

1. 開啟 `chrome://extensions`
2. 啟用「開發者模式」
3. 點選「載入已解壓的擴充套件程式」
4. 選擇 `extension/` 目錄

### Notion 匯入

1. 進入 **設定 > 整合** 並新增你的 Notion Internal Integration Token。
2. 開啟 **資料源** 索引標籤，點選 **Notion**，然後貼上你的 Notion 頁面 URL。
3. 頁面將自動轉換為 Markdown 並加入佇列以攝入你的知識庫。

## 快速開始

1. 啟動應用 → 建立新專案（選擇模板）
2. 進入 **設定** → 配置 LLM 提供商（API 金鑰 + 模型）
3. 進入 **資料源** → 匯入文件（PDF、DOCX、MD 等）
4. 觀察 **活動面板** —— LLM 自動構建 Wiki 頁面
5. 使用 **聊天** 查詢你的知識庫
6. 瀏覽 **知識圖譜** 檢視關聯
7. 檢視 **稽核** 處理需要你關注的專案
8. 定期執行 **Lint** 維護 Wiki 健康度
9. 讓 Coworker 透過瀏覽器開啟 `http://[你的IP]:19828/chat` 查詢知識庫

## 專案結構

```
my-wiki/
├── purpose.md              # 目標、關鍵問題、研究範圍
├── schema.md               # Wiki 結構規則、頁面型別
├── raw/
│   ├── sources/            # 上傳的文件（不可變）
│   └── assets/             # 本地圖片
├── wiki/
│   ├── index.md            # 內容目錄
│   ├── log.md              # 操作歷史
│   ├── overview.md         # 全域性概要（自動更新）
│   ├── entities/           # 人物、組織、產品
│   ├── concepts/           # 理論、方法、技術
│   ├── sources/            # 資料摘要
│   ├── queries/            # 儲存的聊天回答 + 研究
│   ├── synthesis/          # 跨資料分析
│   └── comparisons/        # 並列對比
├── .obsidian/              # Obsidian 倉庫配置（自動生成）
└── .llm-wiki/              # 應用配置、聊天曆史、稽核項
```

## Star History

<a href="https://www.star-history.com/?repos=stormchen%2Fllm_wiki_tw&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=stormchen/llm_wiki_tw&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=stormchen/llm_wiki_tw&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=stormchen/llm_wiki_tw&type=date&legend=top-left" />
 </picture>
</a>

## 許可證

本專案基於 **GNU 通用公共許可證 v3.0** 授權 —— 詳見 [LICENSE](LICENSE)。
