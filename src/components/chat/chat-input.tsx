import { useRef, useState, useCallback } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  placeholder?: string
}

export function ChatInput({ onSend, onStop, isStreaming, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const lastCompositionEnd = useRef<number>(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const ta = e.target
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 在組合文字時（例如注音選字），阻止按鍵事件
      if (isComposing || e.nativeEvent.isComposing || e.keyCode === 229 || e.key === "Process") {
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        // macOS 某些輸入法會在 compositionend 觸發後才送出 Enter keydown，
        // 這裡設定 100ms 緩衝區避免這種假 Enter 觸發送出
        if (Date.now() - lastCompositionEnd.current < 100) {
          e.preventDefault()
          return
        }
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend, isComposing],
  )

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
    lastCompositionEnd.current = Date.now()
  }, [])

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder ?? "Type a message... (Enter to send, Shift+Enter for newline)"}
        disabled={isStreaming}
        rows={1}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        style={{ maxHeight: "120px", overflowY: "auto" }}
      />
      {isStreaming ? (
        <Button
          variant="destructive"
          size="icon"
          onClick={onStop}
          className="shrink-0"
          title="Stop generation"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim()}
          className="shrink-0"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
