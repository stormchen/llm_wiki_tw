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
import { Loader2 } from "lucide-react"

interface NotionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (url: string) => Promise<void>
}

export function NotionImportDialog({
  open,
  onOpenChange,
  onImport,
}: NotionImportDialogProps) {
  const [url, setUrl] = useState("")
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!url.trim()) return
    setImporting(true)
    setError(null)
    
    try {
      await onImport(url.trim())
      setUrl("")
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to import from Notion")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Notion</DialogTitle>
          <DialogDescription>
            Enter a Notion page URL to import it as a Markdown file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notion-url">Notion Page URL</Label>
            <Input
              id="notion-url"
              placeholder="https://www.notion.so/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={importing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim()) {
                  handleImport()
                }
              }}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!url.trim() || importing}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
