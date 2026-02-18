/**
 * SecureLogTI - Create Log Dialog
 * Form dialog for creating new log entries
 */

"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateLogDialog({ open, onOpenChange }: CreateLogDialogProps) {
  const [formData, setFormData] = useState({
    sourceIp: "",
    logType: "",
    severity: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send data to an API
    console.log("Creating log:", formData)
    onOpenChange(false)
    setFormData({ sourceIp: "", logType: "", severity: "", message: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Create New Log Entry</DialogTitle>
          <DialogDescription>Add a new security log entry to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sourceIp">Source IP Address</Label>
              <Input
                id="sourceIp"
                placeholder="192.168.1.100"
                value={formData.sourceIp}
                onChange={(e) => setFormData({ ...formData, sourceIp: e.target.value })}
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logType">Log Type</Label>
                <Select
                  value={formData.logType}
                  onValueChange={(value) => setFormData({ ...formData, logType: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select severity" />
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
              <Label htmlFor="message">Log Message</Label>
              <Textarea
                id="message"
                placeholder="Enter log message details..."
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
              Create Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
