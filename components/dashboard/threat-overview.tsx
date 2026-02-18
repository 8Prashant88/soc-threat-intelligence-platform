/**
 * SecureLogTI - Threat Overview Card
 * Shows a quick overview of current threat status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockThreats } from "@/lib/mock-data"
import { getThreatLevelBgColor } from "@/lib/threat-algorithm"
import { cn } from "@/lib/utils"

export function ThreatOverview() {
  const activeThreats = mockThreats.filter((t) => t.status === "active")
  const highThreats = activeThreats.filter((t) => t.threatLevel === "high")
  const mediumThreats = activeThreats.filter((t) => t.threatLevel === "medium")
  const lowThreats = activeThreats.filter((t) => t.threatLevel === "low")

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Threat Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threat Level Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">High Risk</span>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium", getThreatLevelBgColor("high"))}>
              {highThreats.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Medium Risk</span>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium", getThreatLevelBgColor("medium"))}>
              {mediumThreats.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Low Risk</span>
            <span className={cn("rounded-full px-3 py-1 text-sm font-medium", getThreatLevelBgColor("low"))}>
              {lowThreats.length}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Top Active Threats */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-card-foreground">Top Active Threats</h4>
          <div className="space-y-2">
            {highThreats.slice(0, 3).map((threat) => (
              <div key={threat.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div>
                  <p className="font-mono text-sm text-card-foreground">{threat.ipAddress}</p>
                  <p className="text-xs text-muted-foreground">{threat.description}</p>
                </div>
                <span className="text-lg font-bold text-danger">{threat.threatScore}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
