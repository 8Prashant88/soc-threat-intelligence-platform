/**
 * SecureLogTI - Log Management Page
 * User-centric log ingestion, viewing, and management
 */

"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { LogIngestionTabs } from "@/components/logs/log-ingestion-tabs"
import { UserLogsTable } from "@/components/logs/user-logs-table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserLogs, addUserLogs, deleteUserLog, clearUserLogs } from "@/lib/data-store"
import type { LogEntry, ParsedLogResult } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function LogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // Load user's logs on mount
  useEffect(() => {
    if (user?.id) {
      const userLogs = getUserLogs(user.id)
      setLogs(userLogs)
    }
  }, [user?.id])

  // Apply filters
  useEffect(() => {
    let result = [...logs]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (log) => log.sourceIp.toLowerCase().includes(query) || log.message.toLowerCase().includes(query),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((log) => log.logType === typeFilter)
    }

    // Sort by timestamp descending
    result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredLogs(result)
  }, [logs, searchQuery, typeFilter])

  // Handle new logs added
  const handleLogsAdded = (result: ParsedLogResult) => {
    if (user?.id && result.success) {
      const addedLogs = addUserLogs(user.id, result.entries)
      setLogs((prev) => [...prev, ...addedLogs])
    }
  }

  // Handle log deletion
  const handleDeleteLog = (logId: string) => {
    if (user?.id) {
      deleteUserLog(user.id, logId)
      setLogs((prev) => prev.filter((l) => l.id !== logId))
    }
  }

  // Handle clear all logs
  const handleClearAll = () => {
    if (user?.id) {
      clearUserLogs(user.id)
      setLogs([])
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Log Management" subtitle="Upload, paste, or submit logs for analysis" />

      <div className="p-6 space-y-6">
        {/* Log Ingestion Methods */}
        <LogIngestionTabs onLogsAdded={handleLogsAdded} />

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by IP address or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>

            {/* Log Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="firewall">Firewall</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="network">Network</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear All */}
          {logs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-danger border-danger/50 hover:bg-danger/10 bg-transparent">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all logs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {logs.length} log entries and associated threat data. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-danger text-danger-foreground hover:bg-danger/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Logs Table */}
        <UserLogsTable logs={filteredLogs} onDeleteLog={handleDeleteLog} />
      </div>
    </div>
  )
}
