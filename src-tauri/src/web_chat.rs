use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::thread;

static APP_DATA_DIR: Mutex<Option<PathBuf>> = Mutex::new(None);

/// 由 lib.rs 在 setup 階段呼叫，設定 app_data_dir 路徑
pub fn set_app_data_dir(dir: PathBuf) {
    if let Ok(mut guard) = APP_DATA_DIR.lock() {
        *guard = Some(dir);
    }
}

fn get_app_data_dir() -> Option<PathBuf> {
    APP_DATA_DIR.lock().ok()?.clone()
}

// ── LLM 設定讀取 ─────────────────────────────────────────────────

#[derive(Debug, Clone)]
struct LlmSettings {
    provider: String,
    api_key: String,
    model: String,
    ollama_url: String,
    custom_endpoint: String,
}

fn read_llm_settings() -> Option<LlmSettings> {
    let dir = get_app_data_dir()?;
    let path = dir.join("app-state.json");
    let content = std::fs::read_to_string(&path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let cfg = &json["llmConfig"];

    let provider = cfg["provider"].as_str().unwrap_or("ollama").to_string();
    let mut api_key = cfg["apiKey"].as_str().unwrap_or("").to_string();
    let mut model = cfg["model"].as_str().unwrap_or("").to_string();
    let mut ollama_url = cfg["ollamaUrl"]
        .as_str()
        .unwrap_or("http://localhost:11434")
        .to_string();
    let mut custom_endpoint = cfg["customEndpoint"].as_str().unwrap_or("").to_string();

    // 讀取 activePresetId，並從 providerConfigs 合併覆蓋值
    if let Some(preset_id) = json["activePresetId"].as_str() {
        if let Some(preset) = json["providerConfigs"][preset_id].as_object() {
            if let Some(k) = preset.get("apiKey").and_then(|v| v.as_str()) {
                if !k.is_empty() { api_key = k.to_string(); }
            }
            if let Some(m) = preset.get("model").and_then(|v| v.as_str()) {
                if !m.is_empty() { model = m.to_string(); }
            }
            // Ollama/custom 的 base URL 存在 baseUrl 欄位
            if let Some(u) = preset.get("baseUrl").and_then(|v| v.as_str()) {
                if !u.is_empty() {
                    ollama_url = u.to_string();
                    custom_endpoint = u.to_string();
                }
            }
        }
    }

    Some(LlmSettings { provider, api_key, model, ollama_url, custom_endpoint })
}

// ── Wiki 搜尋 ─────────────────────────────────────────────────────

use crate::clip_server::get_current_project;

fn search_wiki(query: &str) -> Vec<String> {
    let project_path = get_current_project();
    eprintln!("[WebChat] search_wiki: project_path={:?}, query={:?}", project_path, query);
    if project_path.is_empty() {
        eprintln!("[WebChat] CURRENT_PROJECT is empty! Has the user opened a project in the app?");
        return vec![];
    }
    let wiki_dir = Path::new(&project_path).join("wiki");
    eprintln!("[WebChat] scanning wiki_dir: {:?}", wiki_dir);

    // 支援中文分詞：英文用空白分割，中文用 CJK 字元二元組拆分
    let mut keywords: Vec<String> = vec![];
    for word in query.split_whitespace() {
        let word_lower = word.to_lowercase();
        let chars: Vec<char> = word_lower.chars().collect();
        let has_cjk = chars.iter().any(|c| {
            (*c as u32) >= 0x4E00 && (*c as u32) <= 0x9FFF
        });
        if has_cjk {
            // CJK 二元組（bigram）
            for i in 0..chars.len().saturating_sub(1) {
                let bigram: String = chars[i..=i+1].iter().collect();
                keywords.push(bigram);
            }
            // 單字也加入
            for c in &chars {
                if (*c as u32) >= 0x4E00 && (*c as u32) <= 0x9FFF {
                    keywords.push(c.to_string());
                }
            }
        } else if word_lower.len() > 2 {
            keywords.push(word_lower);
        }
    }
    // 如果分詞結果為空，直接用整個 query 作為關鍵字
    if keywords.is_empty() {
        keywords.push(query.to_lowercase());
    }
    eprintln!("[WebChat] keywords: {:?}", keywords);

    let mut results: Vec<(usize, String)> = vec![];
    collect_md_files(&wiki_dir, &keywords, &mut results);
    eprintln!("[WebChat] matched {} files", results.len());
    results.sort_by(|a, b| b.0.cmp(&a.0));
    results
        .into_iter()
        .take(5)
        .map(|(_, content)| content)
        .collect()
}

fn collect_md_files(dir: &Path, keywords: &[String], results: &mut Vec<(usize, String)>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_md_files(&path, keywords, results);
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            if let Ok(content) = std::fs::read_to_string(&path) {
                let lower = content.to_lowercase();
                let score: usize = keywords.iter().filter(|k| lower.contains(k.as_str())).count();
                if score > 0 {
                    // 截取前 2000 字元避免 context 過長
                    let trimmed: String = content.chars().take(2000).collect();
                    results.push((score, trimmed));
                }
            }
        }
    }
}

// ── LLM API 呼叫（Ollama 優先，同步阻塞讀取串流） ────────────────

fn build_llm_request(settings: &LlmSettings, system: &str, user_msg: &str) -> (String, String, String) {
    // 回傳 (url, headers_json, body_json)
    let messages = serde_json::json!([
        {"role": "system", "content": system},
        {"role": "user", "content": user_msg}
    ]);

    match settings.provider.as_str() {
        "ollama" => {
            let base = settings.ollama_url.trim_end_matches('/');
            // 去除尾部的 /v1，統一補上完整路徑
            let base = base.trim_end_matches("/v1");
            let url = format!("{}/v1/chat/completions", base);
            let headers = r#"{"Content-Type":"application/json","Origin":"http://localhost"}"#.to_string();
            let body = serde_json::json!({
                "model": settings.model,
                "messages": messages,
                "stream": true
            }).to_string();
            (url, headers, body)
        }
        "anthropic" => {
            let url = "https://api.anthropic.com/v1/messages".to_string();
            let headers = serde_json::json!({
                "Content-Type": "application/json",
                "x-api-key": settings.api_key,
                "anthropic-version": "2023-06-01"
            }).to_string();
            let body = serde_json::json!({
                "model": settings.model,
                "max_tokens": 4096,
                "stream": true,
                "system": system,
                "messages": [{"role": "user", "content": user_msg}]
            }).to_string();
            (url, headers, body)
        }
        "google" => {
            // Google Gemini API（SSE 格式）
            let encoded_model = settings.model.replace('/', "%2F");
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse",
                encoded_model
            );
            let headers = serde_json::json!({
                "Content-Type": "application/json",
                "x-goog-api-key": settings.api_key
            }).to_string();
            let body = serde_json::json!({
                "systemInstruction": {
                    "parts": [{"text": system}]
                },
                "contents": [{
                    "role": "user",
                    "parts": [{"text": user_msg}]
                }]
            }).to_string();
            (url, headers, body)
        }
        _ => {
            // openai / custom / minimax 皆走 OpenAI wire
            let base = if settings.provider == "openai" {
                "https://api.openai.com".to_string()
            } else {
                settings.custom_endpoint.trim_end_matches('/').to_string()
            };
            let url = if base.ends_with("/chat/completions") {
                base
            } else {
                format!("{}/v1/chat/completions", base)
            };
            let headers = serde_json::json!({
                "Content-Type": "application/json",
                "Authorization": format!("Bearer {}", settings.api_key)
            }).to_string();
            let body = serde_json::json!({
                "model": settings.model,
                "messages": messages,
                "stream": true
            }).to_string();
            (url, headers, body)
        }
    }
}

/// 解析一行 SSE data: {...} 取出 token 文字
fn parse_sse_token(line: &str, provider: &str) -> Option<String> {
    if !line.starts_with("data: ") {
        return None;
    }
    let data = line[6..].trim();
    if data == "[DONE]" {
        return None;
    }
    let v: serde_json::Value = serde_json::from_str(data).ok()?;
    match provider {
        "anthropic" => {
            if v["type"].as_str()? == "content_block_delta" {
                return Some(v["delta"]["text"].as_str()?.to_string());
            }
            None
        }
        "google" => {
            // Gemini SSE 格式：candidates[0].content.parts[]
            let parts = v["candidates"][0]["content"]["parts"].as_array()?;
            let text: String = parts.iter()
                .filter(|p| !p["thought"].as_bool().unwrap_or(false))
                .filter_map(|p| p["text"].as_str())
                .collect();
            if text.is_empty() { None } else { Some(text) }
        }
        _ => {
            // OpenAI wire（ollama / openai / custom）
            let content = v["choices"][0]["delta"]["content"].as_str()?;
            Some(content.to_string())
        }
    }
}

/// 用 reqwest blocking 呼叫 LLM 並將 SSE token 逐字寫入 stream，傳回完整文字
fn call_llm_streaming<W: Write>(
    settings: &LlmSettings,
    system: &str,
    user_msg: &str,
    writer: &mut W,
) -> Result<(), String> {
    let (url, headers_json, body) = build_llm_request(settings, system, user_msg);
    let headers_val: serde_json::Value =
        serde_json::from_str(&headers_json).map_err(|e| e.to_string())?;

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = client.post(&url);
    if let Some(obj) = headers_val.as_object() {
        for (k, v) in obj {
            if let Some(s) = v.as_str() {
                req = req.header(k.as_str(), s);
            }
        }
    }
    let mut resp = req.body(body).send().map_err(|e| e.to_string())?;

    let mut buf = String::new();
    let mut byte_buf = [0u8; 1024];
    loop {
        match resp.read(&mut byte_buf) {
            Ok(0) => break,
            Ok(n) => {
                let chunk = String::from_utf8_lossy(&byte_buf[..n]);
                buf.push_str(&chunk);
                // 逐行處理
                while let Some(pos) = buf.find('\n') {
                    let line = buf[..pos].trim_end_matches('\r').to_string();
                    buf = buf[pos + 1..].to_string();
                    if let Some(token) = parse_sse_token(&line, &settings.provider) {
                        if !token.is_empty() {
                            let sse = format!("data: {}\n\n", serde_json::json!({"token": token}));
                            let _ = writer.write_all(sse.as_bytes());
                            let _ = writer.flush();
                        }
                    }
                }
            }
            Err(_) => break,
        }
    }
    let _ = writer.write_all(b"data: {\"done\":true}\n\n");
    let _ = writer.flush();
    Ok(())
}

// ── HTTP 請求處理 ──────────────────────────────────────────────────

fn handle_connection(mut stream: TcpStream) {
    let mut buf = [0u8; 8192];
    let n = match stream.read(&mut buf) {
        Ok(n) if n > 0 => n,
        _ => return,
    };
    let req = String::from_utf8_lossy(&buf[..n]);
    let first_line = req.lines().next().unwrap_or("");
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 2 {
        return;
    }
    let method = parts[0];
    let path = parts[1].split('?').next().unwrap_or("/");

    let cors = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n";

    match (method, path) {
        ("OPTIONS", _) => {
            let _ = stream.write_all(
                format!("HTTP/1.1 204 No Content\r\n{}Content-Length: 0\r\n\r\n", cors).as_bytes(),
            );
        }
        ("GET", "/chat") | ("GET", "/") => {
            let html = get_chat_html();
            let header = format!(
                "HTTP/1.1 200 OK\r\n{}Content-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n",
                cors,
                html.len()
            );
            let _ = stream.write_all(header.as_bytes());
            let _ = stream.write_all(html.as_bytes());
        }
        ("POST", "/api/chat") => {
            // 讀取 body（request header 後的部分）
            let req_str = String::from_utf8_lossy(&buf[..n]).to_string();
            let body_start = req_str.find("\r\n\r\n").map(|i| i + 4).unwrap_or(n);
            let body_bytes = &buf[body_start..n];
            let body_str = String::from_utf8_lossy(body_bytes);
            let payload: serde_json::Value =
                serde_json::from_str(&body_str).unwrap_or(serde_json::json!({}));
            let question = payload["question"].as_str().unwrap_or("").to_string();

            // SSE 回應 header
            let header = format!(
                "HTTP/1.1 200 OK\r\n{}Content-Type: text/event-stream\r\nCache-Control: no-cache\r\nConnection: keep-alive\r\n\r\n",
                cors
            );
            if stream.write_all(header.as_bytes()).is_err() {
                return;
            }

            if question.is_empty() {
                let _ = stream.write_all(b"data: {\"error\":\"empty question\"}\n\n");
                return;
            }

            let settings = match read_llm_settings() {
                Some(s) => s,
                None => {
                    let _ = stream.write_all(
                        b"data: {\"error\":\"LLM not configured. Please open the app and set up your LLM provider.\"}\n\n",
                    );
                    return;
                }
            };

            // 搜尋 Wiki
            let pages = search_wiki(&question);
            let context = if pages.is_empty() {
                "（目前知識庫尚無相關內容）".to_string()
            } else {
                pages.join("\n\n---\n\n")
            };

            let system = format!(
                "你是一個知識庫助理。請根據以下從 Wiki 知識庫中找到的相關內容來回答使用者的問題。\
                如果相關內容中沒有足夠資訊，請如實告知。\n\n\
                === 相關 Wiki 內容 ===\n{}\n===================",
                context
            );

            if let Err(e) = call_llm_streaming(&settings, &system, &question, &mut stream) {
                let msg = format!("data: {{\"error\":\"{}\"}}\n\n", e.replace('"', "'"));
                let _ = stream.write_all(msg.as_bytes());
            }
        }
        _ => {
            let body = b"{\"error\":\"not found\"}";
            let _ = stream.write_all(
                format!(
                    "HTTP/1.1 404 Not Found\r\n{}Content-Type: application/json\r\nContent-Length: {}\r\n\r\n",
                    cors,
                    body.len()
                )
                .as_bytes(),
            );
            let _ = stream.write_all(body);
        }
    }
}

// ── Chat HTML 介面 ────────────────────────────────────────────────

fn get_chat_html() -> String {
    r#"<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LLM Wiki Chat</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f1117; --surface: #1a1d27; --border: #2a2d3a;
    --accent: #6366f1; --accent-hover: #818cf8;
    --text: #e2e8f0; --text-muted: #64748b;
    --user-bg: #1e2235; --ai-bg: #161922;
  }
  body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; height: 100dvh; display: flex; flex-direction: column; }
  header { padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 10px; }
  header .logo { width: 28px; height: 28px; background: var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  header h1 { font-size: 16px; font-weight: 600; }
  header span { font-size: 12px; color: var(--text-muted); margin-left: auto; }
  #messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .msg { max-width: 800px; width: 100%; margin: 0 auto; display: flex; gap: 10px; }
  .msg.user { flex-direction: row-reverse; }
  .bubble { padding: 12px 16px; border-radius: 12px; line-height: 1.6; font-size: 14px; max-width: 85%; }
  .user .bubble { background: var(--user-bg); border: 1px solid var(--border); border-radius: 12px 4px 12px 12px; }
  .ai .bubble { background: var(--ai-bg); border: 1px solid var(--border); border-radius: 4px 12px 12px 12px; }
  .avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }
  .user .avatar { background: var(--accent); }
  .ai .avatar { background: #1e293b; border: 1px solid var(--border); }
  .bubble p { margin-bottom: 8px; } .bubble p:last-child { margin-bottom: 0; }
  .bubble pre { background: #0d1117; border: 1px solid var(--border); border-radius: 6px; padding: 12px; overflow-x: auto; margin: 8px 0; }
  .bubble code { font-family: 'Fira Code', monospace; font-size: 13px; }
  .bubble p code { background: #1e293b; padding: 1px 5px; border-radius: 3px; }
  .cursor { display: inline-block; width: 2px; height: 1em; background: var(--accent); animation: blink .8s infinite; vertical-align: text-bottom; margin-left: 1px; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .welcome { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .welcome h2 { font-size: 22px; margin-bottom: 8px; color: var(--text); }
  #inputArea { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--surface); }
  .input-wrap { max-width: 800px; margin: 0 auto; display: flex; gap: 10px; align-items: flex-end; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; transition: border-color .2s; }
  .input-wrap:focus-within { border-color: var(--accent); }
  #question { flex: 1; background: none; border: none; outline: none; color: var(--text); font-size: 14px; resize: none; min-height: 24px; max-height: 160px; line-height: 1.5; font-family: inherit; }
  #sendBtn { background: var(--accent); border: none; color: white; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .2s; }
  #sendBtn:hover { background: var(--accent-hover); }
  #sendBtn:disabled { background: var(--border); cursor: not-allowed; }
  #sendBtn svg { width: 16px; height: 16px; }
  .error { color: #f87171; }
</style>
</head>
<body>
<header>
  <div class="logo">📚</div>
  <h1>LLM Wiki Chat</h1>
  <span id="status">已連線</span>
</header>
<div id="messages">
  <div class="welcome">
    <h2>👋 歡迎使用 Wiki 知識庫助理</h2>
    <p>輸入問題，我會從知識庫中找尋相關資訊並回答你。</p>
  </div>
</div>
<div id="inputArea">
  <div class="input-wrap">
    <textarea id="question" placeholder="輸入你的問題..." rows="1"></textarea>
    <button id="sendBtn" title="送出 (Enter)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>
</div>
<script>
const messagesEl = document.getElementById('messages');
const questionEl = document.getElementById('question');
const sendBtn = document.getElementById('sendBtn');
let streaming = false;

function autoResize() {
  questionEl.style.height = 'auto';
  questionEl.style.height = Math.min(questionEl.scrollHeight, 160) + 'px';
}
questionEl.addEventListener('input', autoResize);
questionEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
sendBtn.addEventListener('click', send);

function addMsg(role, content = '') {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = content;
  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function send() {
  if (streaming) return;
  const q = questionEl.value.trim();
  if (!q) return;
  questionEl.value = '';
  autoResize();

  // 清除 welcome 畫面
  const welcome = messagesEl.querySelector('.welcome');
  if (welcome) welcome.remove();

  addMsg('user', escapeHtml(q));
  const aiBubble = addMsg('ai', '<span class="cursor"></span>');
  streaming = true;
  sendBtn.disabled = true;

  let rawText = '';
  const es = new EventSource('/api/chat', { withCredentials: false });

  // EventSource 不支援 POST，改用 fetch + ReadableStream
  es.close();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q })
  }).then(resp => {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) { finish(); return; }
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              rawText += data.token;
              aiBubble.innerHTML = marked.parse(rawText) + '<span class="cursor"></span>';
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
            if (data.done || data.error) {
              if (data.error) aiBubble.innerHTML = '<span class="error">⚠️ ' + escapeHtml(data.error) + '</span>';
              finish();
            }
          } catch(_) {}
        }
        read();
      }).catch(finish);
    }
    read();
  }).catch(err => {
    aiBubble.innerHTML = '<span class="error">⚠️ 連線失敗：' + escapeHtml(String(err)) + '</span>';
    finish();
  });

  function finish() {
    streaming = false;
    sendBtn.disabled = false;
    // 移除 cursor
    const cursor = aiBubble.querySelector('.cursor');
    if (cursor) cursor.remove();
    if (!rawText && !aiBubble.querySelector('.error')) {
      aiBubble.innerHTML = '<span class="error">⚠️ 未收到回應，請確認 LLM Wiki 應用程式是否執行中。</span>';
    }
  }
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
</script>
</body>
</html>"#.to_string()
}

// ── 對外公開的啟動函式 ────────────────────────────────────────────

const WEB_CHAT_PORT: u16 = 19828;

pub fn start_web_chat_server(app_data_dir: PathBuf) {
    set_app_data_dir(app_data_dir);
    thread::spawn(|| {
        let listener = match TcpListener::bind(format!("0.0.0.0:{}", WEB_CHAT_PORT)) {
            Ok(l) => {
                println!("[WebChat] 已啟動，監聽 http://0.0.0.0:{}", WEB_CHAT_PORT);
                l
            }
            Err(e) => {
                eprintln!("[WebChat] 無法綁定 Port {}：{}", WEB_CHAT_PORT, e);
                return;
            }
        };
        for stream in listener.incoming().flatten() {
            thread::spawn(|| handle_connection(stream));
        }
    });
}
