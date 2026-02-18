/**
 * SecureLogTI - User Threats Table
 * Displays threats detected from user's logs
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle, XCircle, Eye, Shield } from "lucide-react"
import type { ThreatIntelligence } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getThreatLevelBgColor } from "@/lib/threat-algorithm"
import { useState } from "react"
import { ThreatDetailDialog } from "./threat-detail-dialog"

interface UserThreatsTableProps {
  threats: ThreatIntelligence[]
  onUpdateStatus: (threatId: string, status: ThreatIntelligence["status"]) => void
}

export function UserThreatsTable({ threats, onUpdateStatus }: UserThreatsTableProps) {
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntelligence | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-danger/20 text-danger",
      resolved: "bg-success/20 text-success",
      false_positive: "bg-muted text-muted-foreground",
    }
    return (
      <Badge className={cn("font-medium", styles[status as keyof typeof styles])}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  if (threats.length === 0) {
    return (
      <Card className="bg-card">
        <CardContent className="py-12">
          <div className="text-center">
            <Shield className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">No threats detected</h3>
            <p className="text-sm text-muted-foreground">
              Your logs don't show any significant threats. Keep uploading logs for continuous monitoring.
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
            <CardTitle className="text-card-foreground">Detected Threats</CardTitle>
            <span className="text-sm text-muted-foreground">{threats.length} threats</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">IP Address</TableHead>
                  <TableHead className="text-muted-foreground">Threat Score</TableHead>
                  <TableHead className="text-muted-foreground">Level</TableHead>
                  <TableHead className="text-muted-foreground">Failed Logins</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
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
                            className={cn("h-full", getThreatLevelBgColor(threat.threatLevel))}
                            style={{ width: `${threat.threatScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-card-foreground">{threat.threatScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", getThreatLevelBgColor(threat.threatLevel))}>
                        {threat.threatLevel.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-card-foreground">{threat.failedLogins}</TableCell>
                    <TableCell>{getStatusBadge(threat.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedThreat(threat)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {threat.status === "active" && (
                            <>
                              <DropdownMenuItem onClick={() => onUpdateStatus(threat.id, "resolved")}>
                                <CheckCircle className="mr-2 h-4 w-4 text-success" />
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateStatus(threat.id, "false_positive")}>
                                <XCircle className="mr-2 h-4 w-4" />
                                False Positive
                              </DropdownMenuItem>
                            </>
                          )}
                          {threat.status !== "active" && (
                            <DropdownMenuItem onClick={() => onUpdateStatus(threat.id, "active")}>
                              <Shield className="mr-2 h-4 w-4 text-danger" />
                              Reactivate
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

      {selectedThreat && (
        <ThreatDetailDialog threat={selectedThreat} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
      )}
    </>
  )
}
