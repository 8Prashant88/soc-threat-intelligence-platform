/**
 * SecureLogTI - Alert Detail Dialog
 * Shows detailed information about a security alert
 */

"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, CheckCircle, Copy } from "lucide-react"
import type { SecurityAlert } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AlertDetailDialogProps {
  alert: SecurityAlert
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (alertId: string, status: SecurityAlert["status"]) => void
}

export function AlertDetailDialog({ alert, open, onOpenChange, onStatusChange }: AlertDetailDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyIP = () => {
    navigator.clipboard.writeText(alert.sourceIp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-danger"
      case "high":
        return "text-warning"
      case "medium":
        return "text-primary"
      case "low":
        return "text-success"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-danger/10"
      case "high":
        return "bg-warning/10"
      case "medium":
        return "bg-primary/10"
      case "low":
        return "bg-success/10"
      default:
        return "bg-muted"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn("text-lg", getSeverityColor(alert.severity))}>{alert.title}</DialogTitle>
          <DialogDescription>{alert.alertType.replace(/_/g, " ")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Summary */}
          <Card className={getSeverityBgColor(alert.severity)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Alert Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div className="font-medium">{alert.alertType.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Severity</div>
                  <Badge className={cn("font-medium", getSeverityColor(alert.severity))}>{alert.severity.toUpperCase()}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge variant="outline">{alert.status}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Detected</div>
                  <div className="font-medium">{new Date(alert.detectedAt).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Source Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Source IP Address</div>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded font-mono text-sm flex-1">{alert.sourceIp}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyIP}
                    title="Copy IP address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-success mt-1">Copied to clipboard</p>}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{alert.description}</p>
            </CardContent>
          </Card>

          {/* Indicators */}
          {alert.indicators && Object.keys(alert.indicators).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Threat Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alert.indicators.threatScore !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Threat Score</span>
                      <span className="font-medium">{alert.indicators.threatScore}/100</span>
                    </div>
                  )}
                  {alert.indicators.threatLevel && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Threat Level</span>
                      <Badge>{alert.indicators.threatLevel}</Badge>
                    </div>
                  )}
                  {alert.indicators.failedLogins !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Failed Login Attempts</span>
                      <span className="font-medium">{alert.indicators.failedLogins}</span>
                    </div>
                  )}
                  {alert.indicators.totalSuspiciousEvents !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Suspicious Events</span>
                      <span className="font-medium">{alert.indicators.totalSuspiciousEvents}</span>
                    </div>
                  )}
                  {alert.indicators.detectedAttackTypes && alert.indicators.detectedAttackTypes.length > 0 && (
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground block mb-2">Detected Attack Types</span>
                      <div className="flex flex-wrap gap-2">
                        {alert.indicators.detectedAttackTypes.map((type: string) => (
                          <Badge key={type} variant="secondary">
                            {type.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendation */}
          {alert.recommendation && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Recommended Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{alert.recommendation}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            {alert.status !== "resolved" && (
              <Button
                variant="outline"
                onClick={() => {
                  onStatusChange(alert.id, "resolved")
                  onOpenChange(false)
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve Alert
              </Button>
            )}
            {alert.status === "new" && (
              <Button
                onClick={() => {
                  onStatusChange(alert.id, "acknowledged")
                  onOpenChange(false)
                }}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Acknowledge
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
