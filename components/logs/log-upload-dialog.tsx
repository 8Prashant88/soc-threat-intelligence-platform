/**
 * SecureLogTI - Log Upload Dialog
 * Allows users to upload .log or .txt files for parsing
 */

"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Upload, File, X } from "lucide-react"
import { parseLogs } from "@/lib/log-parser"
import type { ParsedLogResult } from "@/lib/types"

interface LogUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogsAdded: (result: ParsedLogResult) => void
}

export function LogUploadDialog({ open, onOpenChange, onLogsAdded }: LogUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ParsedLogResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setResult(null)
    setError(null)

    if (selectedFile) {
      // Validate file type
      const validTypes = [".log", ".txt"]
      const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."))

      if (!validTypes.includes(extension)) {
        setError("Please upload a .log or .txt file")
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      setFile(selectedFile)
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const content = await file.text()
      const parseResult = parseLogs(content)
      setResult(parseResult)
    } catch (err) {
      setError("Failed to read file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (result && result.success) {
      onLogsAdded(result)
      handleClose()
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const input = fileInputRef.current
      if (input) {
        const dt = new DataTransfer()
        dt.items.add(droppedFile)
        input.files = dt.files
        handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Log File
          </DialogTitle>
          <DialogDescription>Upload a .log or .txt file containing your log entries.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".log,.txt" onChange={handleFileChange} className="hidden" />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-card-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setResult(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .log and .txt files up to 5MB</p>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <Alert className="bg-destructive/10 border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
                  <>Could not parse any log entries. Please check the file format.</>
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
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="bg-primary text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process File"
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
