/**
 * SecureLogTI - Edit Log Dialog
 * Form dialog for editing existing log entries
 */

"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LogEntry, LogType } from "@/lib/types"

interface EditLogDialogProps {
  log: LogEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (log: LogEntry) => void
}

export function EditLogDialog({ log, open, onOpenChange, onSave }: EditLogDialogProps) {
  type EditForm = {
    sourceIp: string
    logType: LogType
    severity: LogEntry["severity"]
    message: string
  }

  const [formData, setFormData] = useState<EditForm>({
    sourceIp: log.sourceIp,
    logType: log.logType,
    severity: log.severity,
    message: log.message,
  })

  useEffect(() => {
    setFormData({
      sourceIp: log.sourceIp,
      logType: log.logType,
      severity: log.severity,
      message: log.message,
    })
  }, [log])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...log,
      ...formData,
      logType: formData.logType as LogType,
      severity: formData.severity as "info" | "warning" | "error" | "critical",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Edit Log Entry</DialogTitle>
          <DialogDescription>Modify the details of this log entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sourceIp">Source IP Address</Label>
              <Input
                id="edit-sourceIp"
                value={formData.sourceIp}
                onChange={(e) => setFormData({ ...formData, sourceIp: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-logType">Log Type</Label>
                <Select
                  value={formData.logType}
                  onValueChange={(value) => setFormData({ ...formData, logType: value as LogType })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value as EditForm["severity"] })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Log Message</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-secondary border-border min-h-24"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
