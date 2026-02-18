/**
 * SecureLogTI - Attacks Per Day Chart
 * Line/area chart showing attack trends over time
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { mockAttacksByDay } from "@/lib/mock-data"

export function AttacksChart() {
  const data = mockAttacksByDay.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Attacks Per Day</CardTitle>
        <CardDescription>Daily attack frequency over the past 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#attackGradient)"
                name="Attacks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
