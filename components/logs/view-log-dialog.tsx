/**
 * SecureLogTI - View Log Dialog
 * Dialog for viewing full log entry details
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { LogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ViewLogDialogProps {
  log: LogEntry
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewLogDialog({ log, open, onOpenChange }: ViewLogDialogProps) {
  const severityStyles = {
    info: "bg-primary/20 text-primary",
    warning: "bg-warning/20 text-warning",
    error: "bg-danger/20 text-danger",
    critical: "bg-danger text-danger-foreground",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Log Entry Details</DialogTitle>
          <DialogDescription>Full details of the selected log entry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Log ID</p>
              <p className="font-mono text-sm text-card-foreground">{log.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="font-mono text-sm text-card-foreground">{log.timestamp.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Source IP</p>
              <p className="font-mono text-sm text-primary">{log.sourceIp}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Log Type</p>
              <Badge variant="outline" className="mt-1">
                {log.logType}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Severity</p>
            <Badge className={cn("mt-1", severityStyles[log.severity])}>{log.severity.toUpperCase()}</Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Message</p>
            <div className="mt-2 rounded-lg bg-secondary p-3">
              <p className="text-sm text-card-foreground">{log.message}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
