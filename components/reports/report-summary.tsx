import type React from "react"
/**
 * SecureLogTI - Report Summary Cards
 * Quick summary statistics for reports
 */

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Shield, Target } from "lucide-react"
import { mockAttacksByDay, mockTopAttackingIPs } from "@/lib/mock-data"

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  trend?: "up" | "down"
  trendValue?: string
}

function SummaryCard({ title, value, subtitle, icon, trend, trendValue }: SummaryCardProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-card-foreground">{value}</p>
            <div className="flex items-center gap-1">
              {trend && (
                <span className={trend === "up" ? "text-danger" : "text-success"}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                </span>
              )}
              <p className="text-xs text-muted-foreground">
                {trendValue && <span className={trend === "up" ? "text-danger" : "text-success"}>{trendValue} </span>}
                {subtitle}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportSummary() {
  // Calculate totals from mock data
  const totalAttacks = mockAttacksByDay.reduce((sum, day) => sum + day.count, 0)
  const avgAttacksPerDay = Math.round(totalAttacks / mockAttacksByDay.length)
  const uniqueAttackers = mockTopAttackingIPs.length
  const highRiskAttackers = mockTopAttackingIPs.filter((ip) => ip.threatLevel === "high").length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Attacks (7 Days)"
        value={totalAttacks}
        subtitle="vs previous period"
        icon={<Target className="h-5 w-5" />}
        trend="up"
        trendValue="+12%"
      />
      <SummaryCard
        title="Avg Attacks / Day"
        value={avgAttacksPerDay}
        subtitle="this week"
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <SummaryCard
        title="Unique Attackers"
        value={uniqueAttackers}
        subtitle="distinct IPs detected"
        icon={<Shield className="h-5 w-5" />}
      />
      <SummaryCard
        title="High Risk Attackers"
        value={highRiskAttackers}
        subtitle="require immediate attention"
        icon={<Shield className="h-5 w-5" />}
        trend="up"
        trendValue="+2"
      />
    </div>
  )
}
