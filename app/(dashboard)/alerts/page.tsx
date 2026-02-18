/**
 * SecureLogTI - Security Alerts Page
 * View and manage security alerts for detected attacks
 */

"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { AlertsTable } from "@/components/alerts/alerts-table"
import { useAuth } from "@/lib/auth-context"
import { getUserAlerts, updateAlertStatus } from "@/lib/data-store"
import type { SecurityAlert } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

export default function AlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setAlerts(getUserAlerts(user.id))
      setLoading(false)
    }
  }, [user?.id])

  const handleUpdateStatus = (alertId: string, status: SecurityAlert["status"]) => {
    if (user?.id) {
      updateAlertStatus(user.id, alertId, status)
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)))
    }
  }

  const newAlerts = alerts.filter((a) => a.status === "new")
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged")
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved")

  const criticalAlerts = alerts.filter((a) => a.severity === "critical" && a.status !== "resolved")
  const highAlerts = alerts.filter((a) => a.severity === "high" && a.status !== "resolved")

  return (
    <div className="min-h-screen">
      <Header title="Security Alerts" subtitle="Monitor and respond to detected security threats" />

      <div className="p-6 space-y-6">
        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger">{criticalAlerts.length}</div>
              <CardDescription>Requires immediate action</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                High Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{highAlerts.length}</div>
              <CardDescription>Monitor closely</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                New Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{newAlerts.length}</div>
              <CardDescription>Unreviewed</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{resolvedAlerts.length}</div>
              <CardDescription>Closed alerts</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <AlertsTable alerts={alerts} onUpdateStatus={handleUpdateStatus} loading={loading} />
      </div>
    </div>
  )
}
