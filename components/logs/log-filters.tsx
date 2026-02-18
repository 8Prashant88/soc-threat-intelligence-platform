/**
 * SecureLogTI - Log Filters Component
 * Search and filter controls for log management
 */

"use client"

import { useState } from "react"
import { Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateLogDialog } from "./create-log-dialog"

interface LogFiltersProps {
  onSearch?: (query: string) => void
  onFilterType?: (type: string) => void
  onFilterSeverity?: (severity: string) => void
}

export function LogFilters({ onSearch, onFilterType, onFilterSeverity }: LogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by IP address or message..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
            className="pl-9 bg-secondary border-border"
          />
        </div>

        {/* Log Type Filter */}
        <Select onValueChange={onFilterType}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Log Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="firewall">Firewall</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity Filter */}
        <Select onValueChange={onFilterSeverity}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create New Log Button */}
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsCreateOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Log Entry
      </Button>

      <CreateLogDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
