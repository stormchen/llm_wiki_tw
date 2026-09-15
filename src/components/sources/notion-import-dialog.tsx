import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Files, FileText } from "lucide-react"

interface NotionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (
    url: string,
    databaseMode: "multi-file" | "single-file",
    onProgress?: (message: string) => void
  ) => Promise<void>
}

export function NotionImportDialog({
  open,
  onOpenChange,
  onImport,
}: NotionImportDialogProps) {
  const [url, setUrl] = useState("")
  const [databaseMode, setDatabaseMode] = useState<"multi-file" | "single-file">("multi-file")
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!url.trim()) return
    setImporting(true)
    setError(null)
    setProgress("正在準備匯入…")

    try {
      await onImport(url.trim(), databaseMode, (msg) => {
        setProgress(msg)
      })
      setUrl("")
      setProgress(null)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to import from Notion")
    } finally {
      setImporting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (importing) return
    setError(null)
    setProgress(null)
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>從 Notion 匯入 (Import from Notion)</DialogTitle>
          <DialogDescription>
            支援輸入 Notion 頁面 (Page) 或資料庫 (Database) 網址，將自動轉換為來源文件。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <div className="grid gap-2">
            <Label htmlFor="notion-url">Notion 網址 (URL)</Label>
            <Input
              id="notion-url"
              placeholder="https://www.notion.so/... 或 https://app.notion.com/p/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim() && !importing) {
                  handleImport()
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label>資料庫匯入模式 (若網址為資料庫)</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={importing}
                onClick={() => setDatabaseMode("multi-file")}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  databaseMode === "multi-file"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card hover:bg-accent/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <Files className="h-4 w-4 text-primary" />
                  <span>獨立多檔案 (推薦)</span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                  建立資料夾，每筆記錄存為單一文章，完整建立知識庫與圖譜。
                </p>
              </button>

              <button
                type="button"
                disabled={importing}
                onClick={() => setDatabaseMode("single-file")}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  databaseMode === "single-file"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card hover:bg-accent/50 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <FileText className="h-4 w-4" />
                  <span>單一彙總文件</span>
                </div>
                <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                  將全部記錄彙整於同一份 Markdown 文件（總覽表格 + 詳細卡片）。
                </p>
              </button>
            </div>
          </div>

          {importing && progress && (
            <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>{progress}</span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={!url.trim() || importing}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {importing ? "匯入中…" : "開始匯入"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
