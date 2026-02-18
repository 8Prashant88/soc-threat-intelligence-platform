/**
 * SecureLogTI - Log Paste Dialog
 * Allows users to paste raw log entries for parsing
 */

"use client"
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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { parseLogs, getSampleLogFormats } from "@/lib/log-parser"
import type { ParsedLogResult } from "@/lib/types"

interface LogPasteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogsAdded: (result: ParsedLogResult) => void
}

export function LogPasteDialog({ open, onOpenChange, onLogsAdded }: LogPasteDialogProps) {
  const [content, setContent] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ParsedLogResult | null>(null)

  const handleParse = async () => {
    if (!content.trim()) return

    setIsProcessing(true)
    setResult(null)

    // Simulate processing delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    const parseResult = parseLogs(content)
    setResult(parseResult)
    setIsProcessing(false)
  }

  const handleConfirm = () => {
    if (result && result.success) {
      onLogsAdded(result)
      handleClose()
    }
  }

  const handleClose = () => {
    setContent("")
    setResult(null)
    onOpenChange(false)
  }

  const sampleFormats = getSampleLogFormats()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Paste Log Entries
          </DialogTitle>
          <DialogDescription>
            Paste your Linux log entries below. The system will parse and analyze them automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Paste your log entries here, one per line..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setResult(null)
            }}
            className="bg-secondary border-border min-h-48 font-mono text-sm"
          />

          {/* Sample formats hint */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground mb-2">Supported formats (examples):</p>
            <div className="space-y-1">
              {sampleFormats.slice(0, 2).map((format, i) => (
                <p key={i} className="text-xs font-mono text-muted-foreground truncate">
                  {format}
                </p>
              ))}
            </div>
          </div>

          {/* Parse result */}
          {result && (
            <Alert
              className={
                result.success
                  ? "bg-success/10 border-success/50 text-success"
                  : "bg-destructive/10 border-destructive/50"
              }
            >
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                {result.success ? (
                  <>
                    Successfully parsed {result.parsedLines} of {result.totalLines} lines.
                    {result.errors.length > 0 && ` (${result.errors.length} warnings)`}
                  </>
                ) : (
                  <>Could not parse any log entries. Please check the format.</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!result ? (
            <Button
              onClick={handleParse}
              disabled={!content.trim() || isProcessing}
              className="bg-primary text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse Logs"
              )}
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={!result.success} className="bg-primary text-primary-foreground">
              Add {result.parsedLines} Logs
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
