/**
 * SecureLogTI - IP Reputation Lookup Component
 * Allows users to manually check if an IP is listed as suspicious
 */

"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, Search, Globe, Building2, Loader } from "lucide-react"
import { analyzeIpReputation } from "@/lib/ip-reputation-check"
import type { IpReputationAnalysis } from "@/lib/ip-reputation-check"
import { cn } from "@/lib/utils"

export function IpReputationLookup() {
  const [ipInput, setIpInput] = useState("")
  const [result, setResult] = useState<IpReputationAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLookup = async () => {
    // Validate IP format
    const ipPattern =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    
    if (!ipInput.trim()) {
      setError("Please enter an IP address")
      return
    }

    if (!ipPattern.test(ipInput.trim())) {
      setError("Invalid IP address format (e.g., 192.168.1.100)")
      return
    }

    setError("")
    setLoading(true)

    try {
      const analysis = analyzeIpReputation(ipInput.trim())
      setResult(analysis)
    } catch (err) {
      setError("Failed to check IP reputation. Please try again.")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLookup()
    }
  }

  const handleClear = () => {
    setIpInput("")
    setResult(null)
    setError("")
  }

  const isSuspicious = result && (result.reputation.abuseScore >= 25 || result.reputation.isBlacklisted)

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card className="bg-card border-border p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          IP Reputation Lookup
        </h3>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleLookup}
              disabled={loading || !ipInput.trim()}
              className="min-w-24"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check
                </>
              )}
            </Button>
            {result && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="min-w-20"
              >
                Clear
              </Button>
            )}
          </div>

          {error && (
            <div className="flex gap-2 p-2 rounded-lg bg-danger/10 border border-danger/30">
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="bg-card border-border p-4 space-y-4">
          {/* Suspicion Alert */}
          {isSuspicious ? (
            <div className="flex gap-3 p-3 rounded-lg bg-danger/10 border-2 border-danger/40">
              <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger">🚨 This IP appears SUSPICIOUS</p>
                <p className="text-xs text-danger/80 mt-0.5">
                  This IP has a reputation score of {result.reputation.abuseScore} and shows signs of malicious activity. 
                  {result.reputation.isBlacklisted && " It is listed on a blocklist."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 p-3 rounded-lg bg-success/10 border-2 border-success/40">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-success">✅ This IP appears SAFE</p>
                <p className="text-xs text-success/80 mt-0.5">
                  No suspicious activity detected. Reputation score: {result.reputation.abuseScore}
                </p>
              </div>
            </div>
          )}

          {/* Header with IP and Risk Level */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">IP Address</p>
              <p className="text-lg font-mono font-bold text-card-foreground">{result.ipAddress}</p>
            </div>
            <Badge
              className={cn(
                result.reputation.abuseScore >= 75
                  ? "bg-danger/20 text-danger"
                  : result.reputation.abuseScore >= 50
                    ? "bg-warning/20 text-warning"
                    : result.reputation.abuseScore >= 25
                      ? "bg-info/20 text-info"
                      : "bg-success/20 text-success",
              )}
            >
              {result.reputation.riskLevel.toUpperCase()}
            </Badge>
          </div>

          {/* Abuse Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Abuse Score</p>
              <p className="text-sm font-bold text-card-foreground">{result.reputation.abuseScore}/100</p>
            </div>
            <Progress
              value={result.reputation.abuseScore}
              className={cn(
                "h-2",
                result.reputation.abuseScore >= 75
                  ? "[&>div]:bg-danger"
                  : result.reputation.abuseScore >= 50
                    ? "[&>div]:bg-warning"
                    : result.reputation.abuseScore >= 25
                      ? "[&>div]:bg-info"
                      : "[&>div]:bg-success",
              )}
            />
          </div>

          {/* Blacklist Status */}
          {result.reputation.isBlacklisted && (
            <div className="flex gap-2 p-2 rounded-lg bg-danger/10 border border-danger/30">
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-danger">🚨 BLACKLISTED</p>
                <p className="text-xs text-danger/80">This IP is known to be malicious</p>
              </div>
            </div>
          )}

          {/* Location & ISP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                <Globe className="h-3 w-3" />
                Country
              </p>
              <p className="text-sm font-mono text-card-foreground font-semibold">
                {result.reputation.country || "Unknown"}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                ISP
              </p>
              <p className="text-xs font-mono text-card-foreground">
                {result.reputation.isp || "Unknown"}
              </p>
            </div>
          </div>

          {/* Reports & Trend */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Abuse Reports</p>
              <p className="text-xl font-bold text-card-foreground">{result.reputation.reportCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Total reports</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Reputation Trend</p>
              <p className={cn(
                "text-sm font-semibold capitalize",
                result.reputation.reputationTrend === "improving" ? "text-success" :
                result.reputation.reputationTrend === "declining" ? "text-danger" : "text-warning"
              )}>
                {result.reputation.reputationTrend}
              </p>
            </div>
          </div>

          {/* Threat Categories */}
          {result.reputation.threatCategories.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Threat Categories</p>
              <div className="flex flex-wrap gap-2">
                {result.reputation.threatCategories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs capitalize">
                    {cat.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Last Reported */}
          <div className="rounded-lg bg-secondary p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Last Reported</p>
            <p className="text-sm text-card-foreground">
              {result.reputation.lastReported.getTime() === 0
                ? "Never reported"
                : result.reputation.lastReported.toLocaleDateString() +
                  " " +
                  result.reputation.lastReported.toLocaleTimeString()}
            </p>
          </div>

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Lookup Confidence</p>
              <p className="text-sm font-bold text-card-foreground">{result.confidenceScore}%</p>
            </div>
            <Progress value={result.confidenceScore} className="h-2 [&>div]:bg-primary" />
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-card-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Recommendations
              </p>
              <div className="space-y-2">
                {result.recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="flex gap-2 text-xs p-2 rounded-lg bg-secondary border border-border">
                    <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                    <span className="text-card-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe IP Indicator */}
          {result.reputation.abuseScore === 0 && result.reputation.reportCount === 0 && (
            <div className="flex gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">✅ Safe IP</p>
                <p className="text-xs text-success/80">No abuse reports on record</p>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
