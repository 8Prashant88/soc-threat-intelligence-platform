/**
 * SecureLogTI - Integration Example
 * Shows how to wire up advanced threat detection in your system
 * 
 * This file demonstrates how to integrate the new enhanced algorithms
 * with your existing log upload and analysis workflow
 */

import { parseLogs } from "@/lib/log-parser"
import { analyzeLogsWithAdvancedDetection } from "@/lib/threat-analysis-integration"
import type { LogEntry, ThreatIntelligence } from "@/lib/types"

// ============================================================================
// EXAMPLE 1: Process uploaded log file
// ============================================================================

export async function processUploadedLogFile(
  fileContent: string,
  userId: string
): Promise<{
  logEntries: LogEntry[]
  threats: ThreatIntelligence[]
  parseErrors: string[]
}> {
  // Step 1: Parse the log file
  console.log("📋 Parsing log file...")
  const parseResult = parseLogs(fileContent)

  if (!parseResult.success) {
    console.warn("⚠️  Parse warnings:", parseResult.errors)
  }

  // Step 2: Enhance parsed entries with metadata
  const logEntries: LogEntry[] = parseResult.entries.map((entry) => ({
    id: `log-${Date.now()}-${Math.random()}`,
    userId,
    parsedAt: new Date(),
    ...entry,
  }))

  console.log(`✅ Parsed ${logEntries.length} log entries`)

  // Step 3: Run advanced threat detection
  console.log("🔍 Analyzing threats with advanced algorithms...")
  const threats = analyzeLogsWithAdvancedDetection(logEntries, userId)

  console.log(`⚠️  Detected ${threats.length} threats`)
  threats.forEach((threat) => {
    console.log(
      `  - ${threat.ipAddress}: ${threat.threatScore}/100 (${threat.threatLevel.toUpperCase()})`
    )
    console.log(`    Detected: ${threat.detectedAttackTypes?.join(", ")}`)
    console.log(`    Confidence: ${threat.confidenceScore}%`)
  })

  return {
    logEntries,
    threats,
    parseErrors: parseResult.errors,
  }
}

// ============================================================================
// EXAMPLE 2: Real-time log analysis
// ============================================================================

/**
 * Analyze logs as they come in (e.g., from streaming endpoint)
 */
export function analyzeIncomingLogs(
  newLogs: LogEntry[],
  userId: string,
  existingThreats?: ThreatIntelligence[]
): ThreatIntelligence[] {
  console.log(`📊 Analyzing ${newLogs.length} incoming logs...`)

  // Run analysis on new logs
  const newThreats = analyzeLogsWithAdvancedDetection(newLogs, userId)

  // Merge with existing threats (higher score takes precedence)
  const threatMap = new Map<string, ThreatIntelligence>()

  existingThreats?.forEach((threat) => {
    threatMap.set(threat.ipAddress, threat)
  })

  newThreats.forEach((threat) => {
    const existing = threatMap.get(threat.ipAddress)
    if (existing && threat.threatScore > existing.threatScore) {
      threatMap.set(threat.ipAddress, threat)
    } else if (!existing) {
      threatMap.set(threat.ipAddress, threat)
    }
  })

  return Array.from(threatMap.values())
}

// ============================================================================
// EXAMPLE 3: Generate security report
// ============================================================================

/**
 * Generate a detailed security analysis report
 */
export function generateSecurityReport(
  threats: ThreatIntelligence[],
  logEntries: LogEntry[]
): string {
  const timestamp = new Date().toISOString()
  const highThreatCount = threats.filter((t) => t.threatLevel === "high").length
  const mediumThreatCount = threats.filter((t) => t.threatLevel === "medium").length
  const lowThreatCount = threats.filter((t) => t.threatLevel === "low").length

  let report = `
# Security Analysis Report
Generated: ${timestamp}

## Executive Summary
- Total Logs Analyzed: ${logEntries.length}
- Threats Detected: ${threats.length}
- High Risk: ${highThreatCount}
- Medium Risk: ${mediumThreatCount}
- Low Risk: ${lowThreatCount}

## Critical Findings
${
  highThreatCount > 0
    ? threats
        .filter((t) => t.threatLevel === "high")
        .map(
          (t) => `
### ${t.ipAddress} - CRITICAL THREAT
- Threat Score: ${t.threatScore}/100
- Attack Types: ${t.detectedAttackTypes?.join(", ") || "Unknown"}
- Detection Confidence: ${t.confidenceScore}%
- Status: ${t.status.toUpperCase()}

**Reasoning:**
${t.algorithmReasoning || "No reasoning available"}

**Recommended Actions:**
${(t.recommendations || []).slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join("\n")}
`
        )
        .join("\n")
    : "No critical threats detected."
}

## Medium Risk Threats
${
  mediumThreatCount > 0
    ? threats
        .filter((t) => t.threatLevel === "medium")
        .map((t) => `- ${t.ipAddress}: ${t.threatScore}/100 (${t.detectedAttackTypes?.join(", ")})`)
        .join("\n")
    : "No medium risk threats detected."
}

## Detection Methods Summary
${
  threats
    .flatMap((t) => t.detectionMethods || [])
    .reduce(
      (acc, method) => {
        acc[method] = (acc[method] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    ? Object.entries(
        threats
          .flatMap((t) => t.detectionMethods || [])
          .reduce(
            (acc, method) => {
              acc[method] = (acc[method] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          )
      )
        .map(([method, count]) => `- ${method}: Applied ${count} times`)
        .join("\n")
    : "No detection methods applied"
}

## Log Statistics
- Total Entries: ${logEntries.length}
- By Type:
  - Auth: ${logEntries.filter((l) => l.logType === "auth").length}
  - System: ${logEntries.filter((l) => l.logType === "system").length}
  - Firewall: ${logEntries.filter((l) => l.logType === "firewall").length}
  - Application: ${logEntries.filter((l) => l.logType === "application").length}
  - Network: ${logEntries.filter((l) => l.logType === "network").length}

## Next Steps
1. Review high-risk threats immediately
2. Implement recommended security measures
3. Monitor medium-risk threats closely
4. Update firewall/access control rules as needed
  `

  return report
}

// ============================================================================
// EXAMPLE 4: Alert generation based on threat level
// ============================================================================

export interface SecurityAlert {
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  ipAddress: string
  threatScore: number
  detectedAt: Date
  actionRequired: boolean
}

/**
 * Convert detected threats to actionable alerts
 */
export function generateAlerts(threats: ThreatIntelligence[]): SecurityAlert[] {
  const alerts: SecurityAlert[] = []

  threats.forEach((threat) => {
    if (threat.threatLevel === "high" || threat.threatScore >= 70) {
      alerts.push({
        severity: "critical",
        title: `CRITICAL: ${threat.detectedAttackTypes?.[0] || "Unknown"} Attack from ${threat.ipAddress}`,
        description: threat.algorithmReasoning || threat.description,
        ipAddress: threat.ipAddress,
        threatScore: threat.threatScore,
        detectedAt: threat.lastSeen,
        actionRequired: true,
      })
    } else if (threat.threatLevel === "medium" || threat.threatScore >= 40) {
      alerts.push({
        severity: "high",
        title: `WARNING: Suspicious activity detected from ${threat.ipAddress}`,
        description: threat.description,
        ipAddress: threat.ipAddress,
        threatScore: threat.threatScore,
        detectedAt: threat.lastSeen,
        actionRequired: false,
      })
    }
  })

  return alerts
}

// ============================================================================
// EXAMPLE 5: Batch processing handler
// ============================================================================

/**
 * Process multiple log files and aggregate results
 * Useful for bulk import or periodic analysis
 */
export async function batchProcessLogs(
  files: Array<{ name: string; content: string }>,
  userId: string
): Promise<{
  results: Array<{ fileName: string; logCount: number; threatCount: number }>
  totalLogs: number
  totalThreats: number
  criticalThreats: ThreatIntelligence[]
}> {
  const allResults = []
  let totalLogCount = 0
  let totalThreatCount = 0
  const allThreats: ThreatIntelligence[] = []

  for (const file of files) {
    try {
      const { logEntries, threats } = await processUploadedLogFile(file.content, userId)

      totalLogCount += logEntries.length
      totalThreatCount += threats.length
      allThreats.push(...threats)

      allResults.push({
        fileName: file.name,
        logCount: logEntries.length,
        threatCount: threats.length,
      })
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error)
      allResults.push({
        fileName: file.name,
        logCount: 0,
        threatCount: 0,
      })
    }
  }

  return {
    results: allResults,
    totalLogs: totalLogCount,
    totalThreats: totalThreatCount,
    criticalThreats: allThreats.filter((t) => t.threatLevel === "high"),
  }
}

// ============================================================================
// EXAMPLE 6: Detection method analytics
// ============================================================================

/**
 * Analyze which detection methods are most effective
 */
export function analyzeDetectionEffectiveness(threats: ThreatIntelligence[]) {
  const methodStats: Record<
    string,
    { count: number; avgConfidence: number; avgThreatScore: number }
  > = {}

  threats.forEach((threat) => {
    threat.riskFactors?.forEach((factor) => {
      if (!methodStats[factor.method]) {
        methodStats[factor.method] = {
          count: 0,
          avgConfidence: 0,
          avgThreatScore: 0,
        }
      }
      methodStats[factor.method].count++
      methodStats[factor.method].avgConfidence += factor.confidence
      methodStats[factor.method].avgThreatScore += threat.threatScore
    })
  })

  // Calculate averages
  Object.keys(methodStats).forEach((method) => {
    const stats = methodStats[method]
    stats.avgConfidence = Math.round(stats.avgConfidence / stats.count)
    stats.avgThreatScore = Math.round(stats.avgThreatScore / stats.count)
  })

  return methodStats
}

// ============================================================================
// EXPORT TYPES FOR USE IN YOUR SYSTEM
// ============================================================================

export type { LogEntry, ThreatIntelligence }
export { parseLogs, getSampleLogFormats, isValidLogContent } from "@/lib/log-parser"
export { analyzeLogsWithAdvancedDetection } from "@/lib/threat-analysis-integration"
