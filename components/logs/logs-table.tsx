/**
 * SecureLogTI - Logs Table Component
 * Displays logs with CRUD operations
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { mockLogs } from "@/lib/mock-data"
import type { LogEntry } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EditLogDialog } from "./edit-log-dialog"
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
  }

  return (
    <Badge variant="outline" className={cn("font-medium", styles[logType as keyof typeof styles])}>
      {logType}
    </Badge>
  )
}

export function LogsTable() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleView = (log: LogEntry) => {
    setSelectedLog(log)
    setIsViewOpen(true)
  }

  const handleEdit = (log: LogEntry) => {
    setSelectedLog(log)
    setIsEditOpen(true)
  }

  const handleDelete = (log: LogEntry) => {
    setSelectedLog(log)
    setIsDeleteOpen(true)
  }

  const confirmDelete = () => {
    if (selectedLog) {
      setLogs(logs.filter((l) => l.id !== selectedLog.id))
      setIsDeleteOpen(false)
      setSelectedLog(null)
    }
  }

  const handleUpdateLog = (updatedLog: LogEntry) => {
    setLogs(logs.map((l) => (l.id === updatedLog.id ? updatedLog : l)))
    setIsEditOpen(false)
    setSelectedLog(null)
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">Security Logs</CardTitle>
            <span className="text-sm text-muted-foreground">{logs.length} entries</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Source IP</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Message</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-border">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">{log.sourceIp}</TableCell>
                    <TableCell>{getLogTypeBadge(log.logType)}</TableCell>
                    <TableCell className="text-card-foreground max-w-xs truncate">{log.message}</TableCell>
                    <TableCell>{getSeverityBadge(log.severity)}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(log)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
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
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedLog && (
        <>
          <ViewLogDialog log={selectedLog} open={isViewOpen} onOpenChange={setIsViewOpen} />
          <EditLogDialog log={selectedLog} open={isEditOpen} onOpenChange={setIsEditOpen} onSave={handleUpdateLog} />
          <DeleteLogDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={confirmDelete} />
        </>
      )}
    </>
  )
}
