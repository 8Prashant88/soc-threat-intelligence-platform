/**
 * SecureLogTI - Threat Score Calculator Component
 * Interactive component to demonstrate the threat scoring algorithm
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, AlertTriangle, TrendingUp, Activity } from "lucide-react"
import { calculateThreatScore, getThreatLevelBgColor, type ThreatScoreResult } from "@/lib/threat-algorithm"
import { cn } from "@/lib/utils"

export function ThreatScoreCalculator() {
  const [failedLogins, setFailedLogins] = useState(0)
  const [repeatedAccess, setRepeatedAccess] = useState(0)
  const [additionalFactors, setAdditionalFactors] = useState(0)
  const [result, setResult] = useState<ThreatScoreResult | null>(null)

  const handleCalculate = () => {
    const scoreResult = calculateThreatScore(failedLogins, repeatedAccess, additionalFactors)
    setResult(scoreResult)
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle className="text-card-foreground">Threat Score Algorithm</CardTitle>
        </div>
        <CardDescription>
          Simulate the threat scoring algorithm to understand how IP addresses are classified as malicious.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-card-foreground">Input Parameters</h4>

            <div className="space-y-2">
              <Label htmlFor="failedLogins" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Failed Login Attempts
              </Label>
              <Input
                id="failedLogins"
                type="number"
                min={0}
                value={failedLogins}
                onChange={(e) => setFailedLogins(Number(e.target.value))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Each failed login adds 2 points (max 50 points)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeatedAccess" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Repeated Access Count
              </Label>
              <Input
                id="repeatedAccess"
                type="number"
                min={0}
                value={repeatedAccess}
                onChange={(e) => setRepeatedAccess(Number(e.target.value))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Each repeated access adds 0.5 points (max 30 points)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalFactors" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-danger" />
                Additional Risk Factors
              </Label>
              <Input
                id="additionalFactors"
                type="number"
                min={0}
                max={20}
                value={additionalFactors}
                onChange={(e) => setAdditionalFactors(Number(e.target.value))}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">Known bad IP, blacklist match, etc. (max 20 points)</p>
            </div>

            <Button onClick={handleCalculate} className="w-full bg-primary text-primary-foreground">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Threat Score
            </Button>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-card-foreground">Algorithm Result</h4>

            {result ? (
              <div className="space-y-4">
                {/* Score Display */}
                <div className="rounded-lg bg-secondary p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Threat Score</p>
                  <p
                    className={cn(
                      "text-5xl font-bold",
                      result.threatLevel === "high"
                        ? "text-danger"
                        : result.threatLevel === "medium"
                          ? "text-warning"
                          : "text-success",
                    )}
                  >
                    {result.score}
                  </p>
                  <Badge className={cn("mt-3", getThreatLevelBgColor(result.threatLevel))}>
                    {result.threatLevel.toUpperCase()} RISK
                  </Badge>
                </div>

                {/* Score Breakdown */}
                <div className="rounded-lg bg-secondary p-4 space-y-2">
                  <p className="text-sm font-medium text-card-foreground">Score Breakdown:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Logins:</span>
                      <span className="text-card-foreground">+{result.breakdown.failedLoginScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Repeated Access:</span>
                      <span className="text-card-foreground">+{result.breakdown.repeatedAccessScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Factors:</span>
                      <span className="text-card-foreground">+{result.breakdown.baseScore}</span>
                    </div>
                    <div className="border-t border-border pt-1 flex justify-between font-medium">
                      <span className="text-card-foreground">Total:</span>
                      <span className="text-card-foreground">{result.score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div
                  className={cn(
                    "rounded-lg p-4",
                    result.threatLevel === "high"
                      ? "bg-danger/10 border border-danger/20"
                      : result.threatLevel === "medium"
                        ? "bg-warning/10 border border-warning/20"
                        : "bg-success/10 border border-success/20",
                  )}
                >
                  <p className="text-sm font-medium text-card-foreground mb-1">Recommendation:</p>
                  <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                </div>

                {/* Malicious Flag */}
                {result.isMalicious && (
                  <div className="flex items-center gap-2 rounded-lg bg-danger/20 p-3">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                    <span className="text-sm font-medium text-danger">IP flagged as MALICIOUS</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-secondary p-8 text-center">
                <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Enter parameters and click calculate to see the threat score</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
