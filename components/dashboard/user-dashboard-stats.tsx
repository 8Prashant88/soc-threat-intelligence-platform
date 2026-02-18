/**
 * SecureLogTI - User Dashboard Statistics
 * Displays personalized security metrics for the current user
 */

"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  variant?: "default" | "warning" | "danger" | "success"
}

function StatCard({ title, value, icon, description, variant = "default" }: StatCardProps) {
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
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`rounded-lg p-3 ${iconBgStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface UserDashboardStatsProps {
  stats: DashboardStats
}

export function UserDashboardStats({ stats }: UserDashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Logs"
        value={stats.totalLogs}
        icon={<FileText className="h-6 w-6" />}
        description="Logs you've uploaded"
      />
      <StatCard
        title="Suspicious IPs"
        value={stats.suspiciousIps}
        icon={<AlertTriangle className="h-6 w-6" />}
        variant="warning"
        description="IPs flagged for review"
      />
      <StatCard
        title="High-Risk Threats"
        value={stats.highRiskThreats}
        icon={<ShieldAlert className="h-6 w-6" />}
        variant="danger"
        description="Require attention"
      />
      <StatCard
        title="Logs This Week"
        value={stats.logsThisWeek}
        icon={<TrendingUp className="h-6 w-6" />}
        variant="success"
        description="Recently added"
      />
    </div>
  )
}
