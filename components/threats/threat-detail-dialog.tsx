/**
 * SecureLogTI - Threat Detail Dialog
 * Shows detailed information about a specific threat with algorithm explanations
 * NOW INCLUDES: IP Reputation information and scoring
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge, Badge as UIBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import type { ThreatIntelligence } from "@/lib/types"
import { getThreatLevelBgColor } from "@/lib/threat-algorithm"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, Lightbulb, Target, Globe, Building2 } from "lucide-react"

interface ThreatDetailDialogProps {
  threat: ThreatIntelligence
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThreatDetailDialog({ threat, open, onOpenChange }: ThreatDetailDialogProps) {
  const statusStyles = {
    active: "bg-danger/20 text-danger",
    resolved: "bg-success/20 text-success",
    false_positive: "bg-muted text-muted-foreground",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Threat Intelligence Analysis</DialogTitle>
          <DialogDescription>
            Comprehensive threat assessment with algorithm explanations and recommendations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* IP and Score Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">IP Address</p>
              <p className="text-2xl font-mono font-bold text-primary">{threat.ipAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Threat Score</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  threat.threatLevel === "high"
                    ? "text-danger"
                    : threat.threatLevel === "medium"
                      ? "text-warning"
                      : "text-success",
                )}
              >
                {threat.threatScore}/100
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk Assessment</span>
              <Badge className={cn(getThreatLevelBgColor(threat.threatLevel))}>
                {threat.threatLevel.toUpperCase()}
              </Badge>
            </div>
            <Progress
              value={threat.threatScore}
              className={cn(
                "h-3",
                threat.threatLevel === "high"
                  ? "[&>div]:bg-danger"
                  : threat.threatLevel === "medium"
                    ? "[&>div]:bg-warning"
                    : "[&>div]:bg-success",
              )}
            />
          </div>

          {/* Confidence and Detection Methods */}
          {threat.confidenceScore !== undefined && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-secondary p-3 border-border">
                <p className="text-xs text-muted-foreground mb-1">Detection Confidence</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-card-foreground">{threat.confidenceScore}%</p>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </Card>
              <Card className="bg-secondary p-3 border-border">
                <p className="text-xs text-muted-foreground mb-1">Detection Methods</p>
                <p className="text-sm font-mono text-card-foreground">{threat.detectionMethods?.length || 0} method(s)</p>
              </Card>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-sm text-muted-foreground">Failed Logins</p>
              <p className="text-2xl font-bold text-card-foreground">{threat.failedLogins}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-sm text-muted-foreground">Suspicious Events</p>
              <p className="text-2xl font-bold text-card-foreground">{threat.repeatedAccess}</p>
            </div>
          </div>

          {/* Status and Last Seen */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={cn("mt-1", statusStyles[threat.status])}>
                {threat.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Seen</p>
              <p className="text-sm font-mono text-card-foreground mt-1">{threat.lastSeen.toLocaleString()}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Overview</p>
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-sm text-card-foreground">{threat.description}</p>
            </div>
          </div>

          {/* IP Reputation Information */}
          {threat.enrichment && (
            <div>
              <p className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-info" />
                IP Reputation & Enrichment
              </p>
              <div className="space-y-3">
                {/* Abuse Score */}
                <div className="rounded-lg bg-secondary p-3 border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-muted-foreground">Abuse Score (0-100)</p>
                    <Badge
                      className={cn(
                        threat.enrichment.abuseScore >= 80
                          ? "bg-danger/20 text-danger"
                          : threat.enrichment.abuseScore >= 50
                            ? "bg-warning/20 text-warning"
                            : threat.enrichment.abuseScore >= 25
                              ? "bg-info/20 text-info"
                              : "bg-success/20 text-success",
                      )}
                    >
                      {threat.enrichment.abuseScore}/100
                    </Badge>
                  </div>
                  <Progress
                    value={threat.enrichment.abuseScore}
                    className={cn(
                      "h-2",
                      threat.enrichment.abuseScore >= 80
                        ? "[&>div]:bg-danger"
                        : threat.enrichment.abuseScore >= 50
                          ? "[&>div]:bg-warning"
                          : threat.enrichment.abuseScore >= 25
                            ? "[&>div]:bg-info"
                            : "[&>div]:bg-success",
                    )}
                  />
                </div>

                {/* Location and ISP */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Country</p>
                    <p className="text-sm font-mono text-card-foreground">{threat.enrichment.country || "Unknown"}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ISP</p>
                        <p className="text-xs font-mono text-card-foreground">{threat.enrichment.isp || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Count and Last Reported */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Abuse Reports</p>
                    <p className="text-xl font-bold text-card-foreground">{threat.enrichment.reportCount || 0}</p>
                  </div>
                  <div className="rounded-lg bg-secondary p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Last Reported</p>
                    <p className="text-xs font-mono text-card-foreground">
                      {threat.enrichment.lastReported
                        ? new Date(threat.enrichment.lastReported).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Algorithm Reasoning */}
          {threat.algorithmReasoning && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-card-foreground">Algorithm Reasoning</p>
              </div>
              <div className="rounded-lg bg-secondary p-3 border border-warning/30">
                <p className="text-sm text-card-foreground">{threat.algorithmReasoning}</p>
              </div>
            </div>
          )}

          {/* Risk Factors with Detection Details */}
          {threat.riskFactors && threat.riskFactors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-card-foreground mb-3">Detection Methods & Evidence</p>
              <Accordion type="single" collapsible className="space-y-2">
                {threat.riskFactors.map((factor, idx) => (
                  <AccordionItem key={idx} value={`factor-${idx}`} className="border border-border rounded-lg overflow-hidden">
                    <AccordionTrigger className="bg-secondary hover:bg-secondary/80 px-3 py-2">
                      <div className="flex items-center gap-2 text-left flex-1">
                        <Target className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-card-foreground">{factor.method}</p>
                          <p className="text-xs text-muted-foreground">{factor.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {factor.confidence}% confidence
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-card/50 px-3 py-2 text-sm space-y-2">
                      {typeof factor === "object" && "evidence" in factor ? (
                        (factor as any).evidence?.map((ev: string, i: number) => (
                          <div key={i} className="text-xs text-muted-foreground pl-4 border-l border-border">
                            • {ev}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Detection evidence available</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Attack Types */}
          {threat.detectedAttackTypes && threat.detectedAttackTypes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-card-foreground mb-2">Detected Attack Types</p>
              <div className="flex flex-wrap gap-2">
                {threat.detectedAttackTypes.map((attackType) => (
                  <Badge
                    key={attackType}
                    className={cn(
                      threat.threatLevel === "high"
                        ? "bg-danger/20 text-danger"
                        : threat.threatLevel === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-info/20 text-info",
                    )}
                  >
                    {attackType.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {threat.recommendations && threat.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-danger" />
                <p className="text-sm font-semibold text-card-foreground">Recommendations</p>
              </div>
              <div className="space-y-2">
                {threat.recommendations.slice(0, 5).map((rec, idx) => (
                  <div key={idx} className="flex gap-2 text-xs p-2 rounded-lg bg-secondary border border-border">
                    <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                    <span className="text-card-foreground">{rec}</span>
                  </div>
                ))}
                {threat.recommendations.length > 5 && (
                  <p className="text-xs text-muted-foreground italic">
                    +{threat.recommendations.length - 5} more recommendations available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
