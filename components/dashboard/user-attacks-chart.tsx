/**
 * SecureLogTI - User Attacks Chart
 * Shows attack trends from the user's own log data
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { AttacksByDay } from "@/lib/types"

interface UserAttacksChartProps {
  data: AttacksByDay[]
}

export function UserAttacksChart({ data }: UserAttacksChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  if (data.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Security Events</CardTitle>
          <CardDescription>Daily security events from your logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>No data yet. Upload logs to see your security trends.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Security Events</CardTitle>
        <CardDescription>Daily security events from your logs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="userAttackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.15 180)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="oklch(0.7 0.15 180)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 285)" vertical={false} />
              <XAxis dataKey="date" stroke="oklch(0.65 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.65 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 285)",
                  border: "1px solid oklch(0.28 0.005 285)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                labelStyle={{ color: "oklch(0.65 0 0)" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="oklch(0.7 0.15 180)"
                strokeWidth={2}
                fill="url(#userAttackGradient)"
                name="Events"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
