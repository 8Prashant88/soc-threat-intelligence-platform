/**
 * SecureLogTI - Detected Threats Summary Component
 * Displays threats detected from logs with detailed info and remediation measures
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, AlertCircle, Shield, ChevronDown, ChevronUp, CheckCircle } from "lucide-react"
import type { ThreatIntelligence } from "@/lib/types"
import { getThreatLevelBgColor, getThreatLevelColor, getRemediationMeasures, getAttackTypeLabel } from "@/lib/threat-algorithm"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DetectedThreatsSummaryProps {
  threats: ThreatIntelligence[]
}

export function DetectedThreatsSummary({ threats }: DetectedThreatsSummaryProps) {
  const [expandedThreatId, setExpandedThreatId] = useState<string | null>(null)

  if (threats.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            Threats Detected
          </CardTitle>
          <CardDescription>Detailed analysis of detected threats and recommended actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No threats detected</p>
            <p className="text-sm text-muted-foreground">Your logs show no significant security threats</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Threats Detected
        </CardTitle>
        <CardDescription>Detailed analysis of detected threats and recommended actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {threats.map((threat) => (
          <div key={threat.id} className="border border-border rounded-lg overflow-hidden">
            {/* Threat Header - Summary Row */}
            <div
              className={cn(
                "p-4 cursor-pointer hover:bg-secondary/50 transition-colors",
                getThreatLevelBgColor(threat.threatLevel),
              )}
              onClick={() => setExpandedThreatId(expandedThreatId === threat.id ? null : threat.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Threat Icon and Basic Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {threat.threatLevel === "high" ? (
                      <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0" />
                    ) : threat.threatLevel === "medium" ? (
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-foreground truncate">{threat.ipAddress}</p>
                      <p className="text-xs text-muted-foreground">Source IP</p>
                    </div>
                  </div>

                  {/* Threat Score */}
                  <div className="flex flex-col items-center px-3 py-2 bg-background/50 rounded border border-border/50">
                    <p className="text-lg font-bold">{threat.threatScore}</p>
                    <p className="text-xs text-muted-foreground">Threat Score</p>
                  </div>

                  {/* Severity Badge */}
                  <Badge className={cn("font-medium whitespace-nowrap", getThreatLevelBgColor(threat.threatLevel))}>
                    {threat.threatLevel.toUpperCase()} SEVERITY
                  </Badge>

                  {/* Attack Types */}
                  {threat.detectedAttackTypes && threat.detectedAttackTypes.length > 0 && (
                    <div className="hidden md:flex flex-wrap gap-1">
                      {threat.detectedAttackTypes.slice(0, 2).map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {getAttackTypeLabel(type).split(" ")[0]}
                        </Badge>
                      ))}
                      {threat.detectedAttackTypes.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{threat.detectedAttackTypes.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Icon */}
                <div className="ml-4 flex-shrink-0">
                  {expandedThreatId === threat.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Information - Expandable */}
            {expandedThreatId === threat.id && (
              <div className="border-t border-border p-4 bg-secondary/30 space-y-6">
                {/* Overview Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Threat Score</p>
                    <p className={cn("text-2xl font-bold", getThreatLevelColor(threat.threatLevel))}>
                      {threat.threatScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Severity Level</p>
                    <Badge className={cn("font-medium", getThreatLevelBgColor(threat.threatLevel))}>
                      {threat.threatLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Failed Logins</p>
                    <p className="text-lg font-bold text-foreground">{threat.failedLogins}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Events</p>
                    <p className="text-lg font-bold text-foreground">{threat.totalSuspiciousEvents || 0}</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Threat Summary</p>
                  <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded border border-border/50">
                    {threat.description}
                  </p>
                </div>

                {/* Detected Attack Types */}
                {threat.detectedAttackTypes && threat.detectedAttackTypes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Detected Attack Types</p>
                    <div className="flex flex-wrap gap-2">
                      {threat.detectedAttackTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-sm">
                          {getAttackTypeLabel(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remediation Measures */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Remediation Measures</p>
                  <Tabs defaultValue={threat.detectedAttackTypes?.[0] || "general"} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
                      {threat.detectedAttackTypes?.map((type) => (
                        <TabsTrigger key={type} value={type} className="text-xs">
                          {getAttackTypeLabel(type).split(" ")[0]}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {threat.detectedAttackTypes?.map((attackType) => {
                      const remediations = getRemediationMeasures(attackType)
                      return (
                        <TabsContent key={`content-${attackType}`} value={attackType} className="space-y-4">
                          {remediations.length > 0 ? (
                            remediations.map((remediation, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "border rounded-lg p-4",
                                  remediation.priority === "critical"
                                    ? "border-danger/30 bg-danger/5"
                                    : remediation.priority === "high"
                                      ? "border-warning/30 bg-warning/5"
                                      : "border-primary/30 bg-primary/5",
                                )}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <p className="font-medium text-sm text-foreground">{remediation.title}</p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      remediation.priority === "critical"
                                        ? "bg-danger/10 text-danger border-danger/20"
                                        : remediation.priority === "high"
                                          ? "bg-warning/10 text-warning border-warning/20"
                                          : "bg-primary/10 text-primary border-primary/20",
                                    )}
                                  >
                                    {remediation.priority.toUpperCase()} PRIORITY
                                  </Badge>
                                </div>
                                <ol className="space-y-2">
                                  {remediation.steps.map((step, stepIndex) => (
                                    <li key={stepIndex} className="flex gap-3 text-sm">
                                      <span className="font-semibold text-muted-foreground flex-shrink-0 min-w-6">
                                        {stepIndex + 1}.
                                      </span>
                                      <span className="text-foreground">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No specific remediation measures available.</p>
                          )}
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </div>

                {/* Status Info */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      className={cn(
                        "font-medium",
                        threat.status === "active"
                          ? "bg-danger/20 text-danger"
                          : threat.status === "resolved"
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {threat.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last Detected: {new Date(threat.lastSeen).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
