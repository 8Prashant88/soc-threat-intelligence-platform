import type React from "react"
/**
 * SecureLogTI - Dashboard Statistics Cards
 * Displays key security metrics in card format
 */

import { Card, CardContent } from "@/components/ui/card"
import { FileText, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react"
import { mockDashboardStats } from "@/lib/mock-data"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "warning" | "danger" | "success"
}

function StatCard({ title, value, icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    warning: "border-warning/50",
    danger: "border-danger/50",
    success: "border-success/50",
  }

  const iconBgStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  }

  return (
    <Card className={`bg-card ${variantStyles[variant]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold text-card-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={`mt-1 text-xs ${trend.isPositive ? "text-success" : "text-danger"}`}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
              </p>
            )}
          </div>
          <div className={`rounded-lg p-3 ${iconBgStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  const stats = mockDashboardStats

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Logs Collected"
        value={stats.totalLogs}
        icon={<FileText className="h-6 w-6" />}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Suspicious IPs Detected"
        value={stats.suspiciousIps}
        icon={<AlertTriangle className="h-6 w-6" />}
        variant="warning"
        trend={{ value: 8, isPositive: false }}
      />
      <StatCard
        title="High-Risk Threats"
        value={stats.highRiskThreats}
        icon={<ShieldAlert className="h-6 w-6" />}
        variant="danger"
        trend={{ value: 3, isPositive: false }}
      />
      <StatCard
        title="Resolved Threats"
        value={stats.resolvedThreats}
        icon={<CheckCircle className="h-6 w-6" />}
        variant="success"
        trend={{ value: 15, isPositive: true }}
      />
    </div>
  )
}
