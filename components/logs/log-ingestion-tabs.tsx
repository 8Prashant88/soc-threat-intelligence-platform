/**
 * SecureLogTI - Log Ingestion Tabs
 * Tabbed interface for different log submission methods
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Upload, Plus } from "lucide-react"
import { LogPasteDialog } from "./log-paste-dialog"
import { LogUploadDialog } from "./log-upload-dialog"
import type { ParsedLogResult } from "@/lib/types"

interface LogIngestionTabsProps {
  onLogsAdded: (result: ParsedLogResult) => void
}

export function LogIngestionTabs({ onLogsAdded }: LogIngestionTabsProps) {
  const [isPasteOpen, setIsPasteOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const methods = [
    {
      id: "paste",
      icon: FileText,
      title: "Paste Logs",
      description: "Copy and paste log entries directly",
      action: () => setIsPasteOpen(true),
    },
    {
      id: "upload",
      icon: Upload,
      title: "Upload File",
      description: "Upload .log or .txt files",
      action: () => setIsUploadOpen(true),
    },
  ]

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Logs
          </CardTitle>
          <CardDescription>Choose how you want to submit your log data for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {methods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary hover:border-primary/50 bg-transparent"
                onClick={method.action}
              >
                <method.icon className="h-8 w-8 text-primary" />
                <span className="font-medium text-card-foreground">{method.title}</span>
                <span className="text-xs text-muted-foreground text-center">{method.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LogPasteDialog open={isPasteOpen} onOpenChange={setIsPasteOpen} onLogsAdded={onLogsAdded} />
      <LogUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} onLogsAdded={onLogsAdded} />
    </>
  )
}
