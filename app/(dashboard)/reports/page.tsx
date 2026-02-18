/**
 * SecureLogTI - Reports Page
 * Analytics and visualization of user's security data
 */

"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { UserAttacksChart } from "@/components/dashboard/user-attacks-chart"
import { UserTopThreats } from "@/components/dashboard/user-top-threats"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { getUserStats, getUserAttacksByDay, getUserTopAttackingIPs, getUserLogs } from "@/lib/data-store"
import type { AttacksByDay, TopAttackingIP, DashboardStats, LogEntry } from "@/lib/types"
import { FileText, AlertTriangle, ShieldAlert, PieChart } from "lucide-react"

export default function ReportsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalLogs: 0,
    suspiciousIps: 0,
    highRiskThreats: 0,
    logsThisWeek: 0,
  })
  const [attacksData, setAttacksData] = useState<AttacksByDay[]>([])
  const [topThreats, setTopThreats] = useState<TopAttackingIP[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    if (user?.id) {
      setStats(getUserStats(user.id))
      setAttacksData(getUserAttacksByDay(user.id))
      setTopThreats(getUserTopAttackingIPs(user.id))
      setLogs(getUserLogs(user.id))
    }
  }, [user?.id])

  // Calculate log type distribution
  const logTypeDistribution = logs.reduce(
    (acc, log) => {
      acc[log.logType] = (acc[log.logType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate severity distribution
  const severityDistribution = logs.reduce(
    (acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen">
      <Header title="Security Reports" subtitle="Analytics and insights from your log data" />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg p-2 bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.totalLogs}</p>
                <p className="text-sm text-muted-foreground">Total Logs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg p-2 bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.suspiciousIps}</p>
                <p className="text-sm text-muted-foreground">Suspicious IPs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg p-2 bg-danger/10">
                <ShieldAlert className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stats.highRiskThreats}</p>
                <p className="text-sm text-muted-foreground">High-Risk</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg p-2 bg-success/10">
                <PieChart className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{Object.keys(logTypeDistribution).length}</p>
                <p className="text-sm text-muted-foreground">Log Types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserAttacksChart data={attacksData} />
          <UserTopThreats data={topThreats} />
        </div>

        {/* Distribution Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Log Type Distribution */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h3 className="font-semibold text-card-foreground mb-4">Log Type Distribution</h3>
              {Object.keys(logTypeDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(logTypeDistribution).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(count / logs.length) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium text-card-foreground w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h3 className="font-semibold text-card-foreground mb-4">Severity Distribution</h3>
              {Object.keys(severityDistribution).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(severityDistribution).map(([severity, count]) => {
                    const colors = {
                      info: "bg-primary",
                      warning: "bg-warning",
                      error: "bg-danger",
                      critical: "bg-danger",
                    }
                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">{severity}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[severity as keyof typeof colors] || "bg-primary"}`}
                              style={{ width: `${(count / logs.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-card-foreground w-12 text-right">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
