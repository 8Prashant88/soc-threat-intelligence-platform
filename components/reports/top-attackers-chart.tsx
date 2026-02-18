/**
 * SecureLogTI - Top Attacking IPs Chart
 * Bar chart showing most active threat sources
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"
import { mockTopAttackingIPs } from "@/lib/mock-data"

export function TopAttackersChart() {
  const data = mockTopAttackingIPs.map((item) => ({
    ...item,
    // Truncate IP for better display
    shortIp: item.ipAddress.length > 12 ? item.ipAddress.substring(0, 12) + "..." : item.ipAddress,
  }))

  const getBarColor = (threatLevel: string) => {
    switch (threatLevel) {
      case "high":
        return "oklch(0.65 0.22 25)"
      case "medium":
        return "oklch(0.8 0.16 85)"
      case "low":
        return "oklch(0.7 0.18 145)"
      default:
        return "oklch(0.7 0.15 180)"
    }
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Top Attacking IPs</CardTitle>
        <CardDescription>Most active threat sources by attack count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 285)" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.65 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="shortIp"
                stroke="oklch(0.65 0 0)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 285)",
                  border: "1px solid oklch(0.28 0.005 285)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                labelStyle={{ color: "oklch(0.65 0 0)" }}
                formatter={(value, name, props) => [
                  `${value} attacks`,
                  `${props.payload.ipAddress} (${props.payload.threatLevel.toUpperCase()})`,
                ]}
              />
              <Bar dataKey="attackCount" radius={[0, 4, 4, 0]} name="Attacks">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.threatLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-danger" />
            <span className="text-muted-foreground">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Low Risk</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
