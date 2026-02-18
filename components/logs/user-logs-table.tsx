/**
 * SecureLogTI - User Logs Table Component
 * Displays user's logs with delete functionality
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Eye, FileText } from "lucide-react"
import type { LogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { analyzeUserLogs, getThreatLevelBgColor } from "@/lib/threat-algorithm"
import type { ThreatIntelligence } from "@/lib/types"
import { useState } from "react"
import { ViewLogDialog } from "./view-log-dialog"
import { DeleteLogDialog } from "./delete-log-dialog"

function getSeverityBadge(severity: string) {
  const styles = {
    info: "bg-primary/20 text-primary",
    warning: "bg-warning/20 text-warning",
    error: "bg-danger/20 text-danger",
    critical: "bg-danger text-danger-foreground",
  }

  return <Badge className={cn("font-medium", styles[severity as keyof typeof styles])}>{severity.toUpperCase()}</Badge>
}

function getLogTypeBadge(logType: string) {
  const styles = {
    auth: "bg-chart-1/20 text-chart-1",
    system: "bg-chart-2/20 text-chart-2",
    firewall: "bg-chart-3/20 text-chart-3",
    application: "bg-chart-4/20 text-chart-4",
    network: "bg-chart-5/20 text-chart-5",
  }

  return (
    <Badge variant="outline" className={cn("font-medium", styles[logType as keyof typeof styles] || "")}>
      {logType}
    </Badge>
  )
}

interface UserLogsTableProps {
  logs: LogEntry[]
  onDeleteLog: (logId: string) => void
}

export function UserLogsTable({ logs, onDeleteLog }: UserLogsTableProps) {
  const [viewMode, setViewMode] = useState<"raw" | "aggregated">("raw")
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleView = (log: LogEntry) => {
    setSelectedLog(log)
    setIsViewOpen(true)
  }

  const handleDelete = (log: LogEntry) => {
    setSelectedLog(log)
    setIsDeleteOpen(true)
  }

  const confirmDelete = () => {
    if (selectedLog) {
      onDeleteLog(selectedLog.id)
      setIsDeleteOpen(false)
      setSelectedLog(null)
    }
  }

  // Aggregated analysis by IP (uses rule-based analyzer)
  const aggregated: ThreatIntelligence[] = analyzeUserLogs(logs, "ui")

  if (logs.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No logs yet</h3>
            <p className="text-sm text-muted-foreground">
              Add logs using the options above to start analyzing your security data.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">Your Logs</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{logs.length} entries</span>
              <div className="flex items-center gap-1">
                <button
                  className={cn("text-sm px-2 py-1 rounded", viewMode === "raw" ? "bg-secondary" : "")}
                  onClick={() => setViewMode("raw")}
                >
                  Raw
                </button>
                <button
                  className={cn("text-sm px-2 py-1 rounded", viewMode === "aggregated" ? "bg-secondary" : "")}
                  onClick={() => setViewMode("aggregated")}
                >
                  Aggregated by IP
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {viewMode === "raw" ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground">Source IP</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Message</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-border">
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {typeof log.timestamp === "string" ? new Date(log.timestamp).toLocaleString() : log.timestamp?.toLocaleString?.()}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-primary">{log.sourceIp}</TableCell>
                      <TableCell>{getLogTypeBadge(log.logType)}</TableCell>
                      <TableCell className="text-card-foreground max-w-xs truncate">{log.message}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleView(log)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(log)} className="text-danger focus:text-danger">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Source IP</TableHead>
                    <TableHead className="text-muted-foreground">Threat Score</TableHead>
                    <TableHead className="text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-muted-foreground">Detections</TableHead>
                    <TableHead className="text-muted-foreground">Events</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregated.map((a) => (
                    <TableRow key={a.id} className="border-border">
                      <TableCell className="font-mono text-sm text-primary">{a.ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn("h-full", getThreatLevelBgColor(a.threatLevel))}
                              style={{ width: `${a.threatScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-card-foreground">{a.threatScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getThreatLevelBgColor(a.threatLevel))}>
                          {a.threatLevel.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {(a.detectedAttackTypes || []).join(", ") || "None"}
                      </TableCell>
                      <TableCell className="text-card-foreground">{a.totalSuspiciousEvents || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => alert(`Show logs for ${a.ipAddress}`)}>
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedLog && (
        <>
          <ViewLogDialog log={selectedLog} open={isViewOpen} onOpenChange={setIsViewOpen} />
          <DeleteLogDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
        </>
      )}
    </>
  )
}
