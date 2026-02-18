/**
 * SecureLogTI - User Top Threats
 * Shows the user's most concerning IPs
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { TopAttackingIP } from "@/lib/types"
import { Shield } from "lucide-react"

interface UserTopThreatsProps {
  data: TopAttackingIP[]
}

export function UserTopThreats({ data }: UserTopThreatsProps) {
  const getThreatBadge = (level: string) => {
    const styles = {
      high: "bg-danger/20 text-danger",
      medium: "bg-warning/20 text-warning",
      low: "bg-success/20 text-success",
    }
    return <Badge className={cn("font-medium", styles[level as keyof typeof styles])}>{level.toUpperCase()}</Badge>
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Top Threats</CardTitle>
          <CardDescription>Most concerning IPs from your logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Shield className="h-10 w-10 mb-3 opacity-50" />
            <p>No threats detected yet.</p>
            <p className="text-sm">Upload logs to start threat analysis.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Top Threats</CardTitle>
        <CardDescription>Most concerning IPs from your logs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.ipAddress} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                <div>
                  <p className="font-mono text-sm text-primary">{item.ipAddress}</p>
                  <p className="text-xs text-muted-foreground">{item.attackCount} suspicious events</p>
                </div>
              </div>
              {getThreatBadge(item.threatLevel)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
