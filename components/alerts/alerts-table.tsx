/**
 * SecureLogTI - Alerts Table Component
 * Displays security alerts with status management and actions
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, MoreHorizontal, Eye } from "lucide-react"
import type { SecurityAlert } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { AlertDetailDialog } from "./alert-detail-dialog"

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-danger" />
    case "high":
      return <AlertCircle className="h-4 w-4 text-warning" />
    case "medium":
      return <AlertCircle className="h-4 w-4 text-primary" />
    case "low":
      return <AlertCircle className="h-4 w-4 text-success" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

function getSeverityBadge(severity: string) {
  const styles = {
    critical: "bg-danger/20 text-danger",
    high: "bg-warning/20 text-warning",
    medium: "bg-primary/20 text-primary",
    low: "bg-success/20 text-success",
  }

  return <Badge className={cn("font-medium", styles[severity as keyof typeof styles])}>{severity.toUpperCase()}</Badge>
}

function getStatusBadge(status: string) {
  const styles = {
    new: "bg-primary/20 text-primary",
    acknowledged: "bg-warning/20 text-warning",
    resolved: "bg-success/20 text-success",
  }

  const labels = {
    new: "New",
    acknowledged: "Acknowledged",
    resolved: "Resolved",
  }

  return <Badge className={cn("font-medium", styles[status as keyof typeof styles])}>{labels[status as keyof typeof labels]}</Badge>
}

function getAlertTypeLabel(alertType: string) {
  const labels: Record<string, string> = {
    brute_force: "Brute Force Attack",
    sql_injection: "SQL Injection",
    malware: "Malware Detection",
    ddos_attack: "DDoS Attack",
    suspicious_activity: "Suspicious Activity",
  }
  return labels[alertType] || alertType
}

interface AlertsTableProps {
  alerts: SecurityAlert[]
  onUpdateStatus: (alertId: string, status: SecurityAlert["status"]) => void
  loading?: boolean
}

export function AlertsTable({ alerts, onUpdateStatus, loading = false }: AlertsTableProps) {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleViewDetails = (alert: SecurityAlert) => {
    setSelectedAlert(alert)
    setIsDetailOpen(true)
  }

  const handleStatusChange = (alertId: string, newStatus: SecurityAlert["status"]) => {
    onUpdateStatus(alertId, newStatus)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No alerts</p>
            <p className="text-sm text-muted-foreground">Your system is secure. Continue monitoring for suspicious activity.</p>
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
            <CardTitle>Security Alerts Feed</CardTitle>
            <div className="flex gap-2 text-sm">
              <span className="text-muted-foreground">
                New: <span className="text-primary font-medium">{alerts.filter((a) => a.status === "new").length}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                Acknowledged:{" "}
                <span className="text-warning font-medium">{alerts.filter((a) => a.status === "acknowledged").length}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                Resolved: <span className="text-success font-medium">{alerts.filter((a) => a.status === "resolved").length}</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Source IP</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground">Detected</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <span className="font-medium text-sm">{getAlertTypeLabel(alert.alertType)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">{alert.sourceIp}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(alert.detectedAt).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{alert.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(alert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {alert.status === "new" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, "acknowledged")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Mark as Acknowledged
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "resolved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, "resolved")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Resolved
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "new" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(alert.id, "new")}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Mark as New
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedAlert && (
        <AlertDetailDialog alert={selectedAlert} open={isDetailOpen} onOpenChange={setIsDetailOpen} onStatusChange={handleStatusChange} />
      )}
    </>
  )
}
