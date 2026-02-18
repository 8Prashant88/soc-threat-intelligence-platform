/**
 * SecureLogTI - Threats Table Component
 * Displays threat intelligence data with status management
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react"
import { mockThreats } from "@/lib/mock-data"
import type { ThreatIntelligence, ThreatStatus } from "@/lib/types"
import { getThreatLevelBgColor } from "@/lib/threat-algorithm"
import { cn } from "@/lib/utils"
import { ThreatDetailDialog } from "./threat-detail-dialog"

function getStatusBadge(status: ThreatStatus) {
  const styles = {
    active: "bg-danger/20 text-danger",
    resolved: "bg-success/20 text-success",
    false_positive: "bg-muted text-muted-foreground",
  }

  const labels = {
    active: "Active",
    resolved: "Resolved",
    false_positive: "False Positive",
  }

  return <Badge className={cn("font-medium", styles[status])}>{labels[status]}</Badge>
}

export function ThreatsTable() {
  const [threats, setThreats] = useState<ThreatIntelligence[]>(mockThreats)
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntelligence | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleStatusChange = (threatId: string, newStatus: ThreatStatus) => {
    setThreats(threats.map((t) => (t.id === threatId ? { ...t, status: newStatus } : t)))
  }

  const handleViewDetails = (threat: ThreatIntelligence) => {
    setSelectedThreat(threat)
    setIsDetailOpen(true)
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">Threat Intelligence Feed</CardTitle>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">
                Active:{" "}
                <span className="text-danger font-medium">{threats.filter((t) => t.status === "active").length}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                Resolved:{" "}
                <span className="text-success font-medium">
                  {threats.filter((t) => t.status === "resolved").length}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">IP Address</TableHead>
                  <TableHead className="text-muted-foreground">Threat Score</TableHead>
                  <TableHead className="text-muted-foreground">Threat Level</TableHead>
                  <TableHead className="text-muted-foreground">Last Seen</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {threats.map((threat) => (
                  <TableRow key={threat.id} className="border-border">
                    <TableCell className="font-mono text-sm text-primary">{threat.ipAddress}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              threat.threatScore >= 70
                                ? "bg-danger"
                                : threat.threatScore >= 40
                                  ? "bg-warning"
                                  : "bg-success",
                            )}
                            style={{ width: `${threat.threatScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-card-foreground">{threat.threatScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium uppercase", getThreatLevelBgColor(threat.threatLevel))}>
                        {threat.threatLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{threat.lastSeen.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(threat.status)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{threat.description}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleViewDetails(threat)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {threat.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(threat.id, "resolved")}
                                className="text-success focus:text-success"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(threat.id, "false_positive")}
                                className="text-muted-foreground"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as False Positive
                              </DropdownMenuItem>
                            </>
                          )}
                          {threat.status !== "active" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(threat.id, "active")}
                              className="text-danger focus:text-danger"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Reactivate Threat
                            </DropdownMenuItem>
                          )}
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

      {/* Detail Dialog */}
      {selectedThreat && (
        <ThreatDetailDialog threat={selectedThreat} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
      )}
    </>
  )
}
