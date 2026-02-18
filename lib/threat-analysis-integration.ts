/**
 * SecureLogTI - Advanced Threat Detection Integration
 * Bridges advanced threat detection algorithm with the existing threat intelligence system
 * Now includes IP Reputation scoring with REAL API integration (AbuseIPDB)
 * 
 * Setup: Add ABUSEIPDB_API_KEY to .env.local for real IP reputation checks
 * Get free API key: https://www.abuseipdb.com/
 */

import { 
  performAdvancedThreatAnalysis, 
  type AdvancedThreatAnalysis 
} from "./advanced-threat-detection"
import { 
  analyzeIpReputation, 
  analyzeMultipleIps,
  type IpReputationAnalysis 
} from "./ip-reputation-check"
import {
  checkIpReputationFromAPI,
  checkMultipleIpsFromAPI,
  getCacheStats,
  clearReputationCache,
  testAbuseIPDBConnection,
  getAbuseIPDBAccountInfo,
  type IpReputationData
} from "./ip-reputation-api"
import type { LogEntry, ThreatIntelligence } from "./types"

/**
 * Get IP reputation using real API if available, fallback to mock data
 * This function tries AbuseIPDB API first, then uses local mock data
 */
async function getIpReputationWithFallback(ipAddress: string): Promise<IpReputationAnalysis> {
  // Try real API first
  const apiData = await checkIpReputationFromAPI(ipAddress)
  
  if (apiData) {
    // API succeeded - wrap in IpReputationAnalysis format
    return {
      ipAddress,
      reputation: apiData,
      confidenceScore: Math.min(100, (apiData.reportCount / 10) + 50),
      recommendations: generateRecommendations(apiData),
      reputationBoost: calculateReputationBoost(apiData),
    }
  }

  // Fallback to mock data (when API unavailable or no key)
  console.log(`[Threat Detection] Using mock data for ${ipAddress} (API unavailable)`)
  return analyzeIpReputation(ipAddress)
}

/**
 * Generate recommendations based on IP reputation data
 */
function generateRecommendations(reputation: IpReputationData): string[] {
  const recommendations: string[] = []

  if (reputation.abuseScore >= 75) {
    recommendations.push(`🚨 CRITICAL: IP has CRITICAL abuse score (${reputation.abuseScore}/100) - Block immediately`)
  } else if (reputation.abuseScore >= 50) {
    recommendations.push(`🔴 HIGH RISK: IP has HIGH abuse score (${reputation.abuseScore}/100) - Add to watchlist`)
  }

  if (reputation.isBlacklisted) {
    recommendations.push(`⛔ IP is blacklisted - Add to firewall blocklist`)
  }

  if (reputation.reportCount > 100) {
    recommendations.push(`📊 This IP has ${reputation.reportCount} abuse reports - Likely coordinated attacker`)
  } else if (reputation.reportCount > 10) {
    recommendations.push(`📋 This IP has ${reputation.reportCount} reports - Enable rate limiting`)
  }

  if (reputation.threatCategories.includes("botnet") || reputation.threatCategories.includes("botnets")) {
    recommendations.push(`🤖 Botnet activity detected - Check for C2 communication`)
  }
  if (reputation.threatCategories.includes("malware")) {
    recommendations.push(`🦠 Known malware distribution source - Scan systems`)
  }
  if (reputation.threatCategories.includes("ddos")) {
    recommendations.push(`⚡ DDoS participant - Enable DDoS protection`)
  }
  if (reputation.threatCategories.includes("phishing")) {
    recommendations.push(`🎣 Phishing infrastructure - Block for safety`)
  }

  if (reputation.reputationTrend === "declining") {
    recommendations.push(`📉 Reputation declining - Increase monitoring`)
  }

  if (reputation.reportCount === 0 && reputation.abuseScore < 10) {
    recommendations.push(`✅ No abuse history - IP appears safe`)
  }

  return recommendations.length > 0 ? recommendations : ["Monitor for future activity"]
}

/**
 * Calculate reputation boost based on real API data
 */
function calculateReputationBoost(reputation: IpReputationData): number {
  let boost = 0

  // Abuse score contribution (0-40 points)
  boost += (reputation.abuseScore / 100) * 40

  // Recent reports are worse (0-10 points)
  const daysSinceReport = (Date.now() - reputation.lastReported.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceReport < 7) boost += 10
  else if (daysSinceReport < 30) boost += 5
  else if (daysSinceReport < 90) boost += 2

  // Blacklist status (instant +20)
  if (reputation.isBlacklisted) boost += 20

  // Report count weighted
  const reportWeight = Math.min(reputation.reportCount / 100, 1)
  boost += reportWeight * 10

  // High-risk countries
  const highRiskCountries = ["KP", "IR", "SY"]
  if (highRiskCountries.includes(reputation.country)) boost += 10

  // Trend analysis
  if (reputation.reputationTrend === "declining") boost += 8
  else if (reputation.reputationTrend === "improving") boost -= 5

  return Math.max(-20, Math.min(50, boost))
}

/**
 * Batch get IP reputation with fallback
 * Uses real API for better accuracy and speed
 */
async function getMultipleIpsReputation(ips: string[]): Promise<Map<string, IpReputationAnalysis>> {
  const results = new Map<string, IpReputationAnalysis>()
  const uniqueIps = [...new Set(ips)]

  // Try to batch check via API
  const apiResults = await checkMultipleIpsFromAPI(uniqueIps)

  // Process each IP
  for (const ip of uniqueIps) {
    if (apiResults.has(ip)) {
      // Got real API data
      const apiData = apiResults.get(ip)!
      results.set(ip, {
        ipAddress: ip,
        reputation: apiData,
        confidenceScore: Math.min(100, (apiData.reportCount / 10) + 50),
        recommendations: generateRecommendations(apiData),
        reputationBoost: calculateReputationBoost(apiData),
      })
    } else {
      // Fallback to mock
      results.set(ip, await getIpReputationWithFallback(ip))
    }
  }

  return results
}

/**
 * Convert AdvancedThreatAnalysis results to ThreatIntelligence objects
 * This integration ensures the advanced algorithm output can be used throughout the system
 * NOW INCLUDES: IP Reputation scoring for enhanced threat assessment
 */
export function convertToThreatIntelligence(
  analysisResults: Map<string, AdvancedThreatAnalysis>,
  userId: string,
  logsMap: Map<string, LogEntry[]>,
  reputationAnalysis?: Map<string, IpReputationAnalysis>
): ThreatIntelligence[] {
  const threats: ThreatIntelligence[] = []

  analysisResults.forEach((analysis, ipAddress) => {
    const ipLogs = logsMap.get(ipAddress) || []
    
    // Get IP reputation data
    const reputation = reputationAnalysis?.get(ipAddress) || analyzeIpReputation(ipAddress)
    
    // Get basic metrics from logs
    const failedLogins = ipLogs.filter(
      (l) => l.severity === "error" && l.logType === "auth"
    ).length
    
    const lastSeen = ipLogs.length > 0 
      ? new Date(Math.max(...ipLogs.map((l) => l.timestamp.getTime())))
      : new Date()

    // Adjust threat score based on IP reputation
    // Scale: -20 to +50 reputation boost
    // Base threat score is 0-100, we adjust by reputation
    const adjustedThreatScore = Math.max(
      0,
      Math.min(100, analysis.threatScore + reputation.reputationBoost)
    )

    // Update threat level based on adjusted score
    let threatLevel = analysis.threatLevel
    if (adjustedThreatScore >= 70) threatLevel = "high"
    else if (adjustedThreatScore >= 40) threatLevel = "medium"
    else threatLevel = "low"

    // Enhanced recommendations with IP reputation insights
    const recommendations = [
      ...analysis.recommendations,
      ...reputation.recommendations.filter(
        (rec) => !analysis.recommendations.some((ar) => ar.toLowerCase() === rec.toLowerCase())
      ),
    ]

    // Build enriched threat description
    let description = analysis.primaryAttackType
      ? `${analysis.primaryAttackType} detected with ${analysis.threatScore} threat score`
      : "Suspicious activity detected"

    if (reputation.reputation.riskLevel === "critical") {
      description = `⚠️ CRITICAL: ${description} | IP has CRITICAL reputation (${reputation.reputation.abuseScore}/100 abuse score)`
    } else if (reputation.reputation.riskLevel === "high") {
      description = `${description} | IP has HIGH risk reputation (${reputation.reputation.abuseScore}/100)`
    } else if (reputation.reputation.isBlacklisted) {
      description = `${description} | ⛔ IP is BLACKLISTED`
    }

    const threat: ThreatIntelligence = {
      id: `threat-${userId}-${ipAddress.replace(/\./g, "-")}`,
      userId,
      ipAddress,
      threatScore: adjustedThreatScore,
      threatLevel,
      lastSeen,
      status: adjustedThreatScore >= 70 ? "active" : "active",
      failedLogins,
      repeatedAccess: ipLogs.length,
      description,
      detectedAttackTypes: [analysis.primaryAttackType],
      totalSuspiciousEvents: ipLogs.length,
      suspicious: adjustedThreatScore >= 30,
      
      // Enrichment from IP reputation
      enrichment: {
        country: reputation.reputation.country,
        isp: reputation.reputation.isp,
        abuseScore: reputation.reputation.abuseScore,
        reportCount: reputation.reputation.reportCount,
        lastReported: reputation.reputation.lastReported,
      },
      
      // Algorithm explanation fields
      algorithmReasoning: `${analysis.reasoning} | IP Reputation Impact: ${reputation.reputationBoost > 0 ? "+" : ""}${reputation.reputationBoost.toFixed(1)} points (${reputation.reputation.riskLevel.toUpperCase()} risk)`,
      detectionMethods: [
        ...analysis.riskFactors.map((rf) => rf.method),
        `IP Reputation Check (${reputation.reputation.abuseScore}/100 abuse score)`,
      ],
      confidenceScore: Math.min(
        100,
        (analysis.confidence + reputation.confidenceScore) / 2
      ),
      riskFactors: [
        ...analysis.riskFactors.map((rf) => ({
          method: rf.method,
          confidence: rf.confidence,
          description: rf.description,
        })),
        {
          method: "IP Reputation Analysis",
          confidence: reputation.confidenceScore,
          description: `IP has ${reputation.reputation.reportCount} abuse reports | Trend: ${reputation.reputation.reputationTrend} | Categories: ${reputation.reputation.threatCategories.join(", ") || "none"}`,
        },
      ],
      recommendations,
    }

    threats.push(threat)
  })

  return threats
}

/**
 * Perform complete threat analysis on a set of logs using advanced detection
 * Returns ThreatIntelligence objects ready for storage and display
 * NOW INCLUDES: IP Reputation checking for enhanced threat assessment
 * 
 * NOTE: This synchronous version uses mock data only
 * For real IP reputation data, use analyzeLogsWithAdvancedDetectionAsync()
 */
export function analyzeLogsWithAdvancedDetection(
  logs: LogEntry[],
  userId: string
): ThreatIntelligence[] {
  // Group logs by IP for analysis
  const logsByIP = new Map<string, LogEntry[]>()
  const uniqueIps: string[] = []
  
  logs.forEach((log) => {
    const ip = log.sourceIp || "0.0.0.0"
    if (!logsByIP.has(ip)) {
      logsByIP.set(ip, [])
      uniqueIps.push(ip)
    }
    logsByIP.get(ip)!.push(log)
  })

  // Run advanced threat analysis
  const analysisResults = performAdvancedThreatAnalysis(logs, userId)

  // Use mock IP reputation (synchronous)
  const reputationAnalysis = analyzeMultipleIps(uniqueIps)

  // Convert to ThreatIntelligence format with IP reputation integration
  return convertToThreatIntelligence(analysisResults, userId, logsByIP, reputationAnalysis)
}

/**
 * Async version: Perform threat analysis with REAL IP reputation from AbuseIPDB API
 * This version checks real threat intelligence databases
 * Much slower but more accurate
 * 
 * Requires: ABUSEIPDB_API_KEY in .env.local
 * Get free key: https://www.abuseipdb.com/
 * 
 * Usage:
 *   const threats = await analyzeLogsWithAdvancedDetectionAsync(logs, userId)
 */
export async function analyzeLogsWithAdvancedDetectionAsync(
  logs: LogEntry[],
  userId: string
): Promise<ThreatIntelligence[]> {
  // Group logs by IP for analysis
  const logsByIP = new Map<string, LogEntry[]>()
  const uniqueIps: string[] = []
  
  logs.forEach((log) => {
    const ip = log.sourceIp || "0.0.0.0"
    if (!logsByIP.has(ip)) {
      logsByIP.set(ip, [])
      uniqueIps.push(ip)
    }
    logsByIP.get(ip)!.push(log)
  })

  // Run advanced threat analysis
  const analysisResults = performAdvancedThreatAnalysis(logs, userId)

  // NEW: Use REAL IP reputation from API with fallback
  const reputationAnalysis = await getMultipleIpsReputation(uniqueIps)

  // Convert to ThreatIntelligence format with real IP reputation
  return convertToThreatIntelligence(analysisResults, userId, logsByIP, reputationAnalysis)
}

/**
 * Get a human-readable summary of detection methods used
 */
export function getDetectionMethodsSummary(detectionMethods: string[]): string {
  const methodCount = detectionMethods.length
  const uniqueMethods = [...new Set(detectionMethods)]

  if (methodCount === 0) return "No detection methods applied"
  if (methodCount === 1) return `1 detection method: ${uniqueMethods[0]}`
  
  return `${uniqueMethods.length} detection methods applied: ${uniqueMethods
    .slice(0, 2)
    .join(", ")}${uniqueMethods.length > 2 ? ` and ${uniqueMethods.length - 2} more` : ""}`
}

/**
 * Get IP reputation summary for a set of threats
 * Useful for dashboard and reporting
 */
export function getIpReputationSummary(threats: ThreatIntelligence[]) {
  let criticalRepIps = 0
  let highRepIps = 0
  let blacklistedIps = 0
  const threatCategoriesByIp: Record<string, string[]> = {}

  threats.forEach((threat) => {
    const abuseScore = threat.enrichment?.abuseScore || 0
    
    if (abuseScore >= 80) {
      criticalRepIps++
    } else if (abuseScore >= 50) {
      highRepIps++
    }

    // Check if IP is mentioned as blacklisted in description
    if (threat.description.includes("BLACKLIST") || threat.description.includes("CRITICAL")) {
      blacklistedIps++
    }

    // Extract threat categories from risk factors
    const repFactor = threat.riskFactors?.find(rf => rf.method === "IP Reputation Analysis")
    if (repFactor) {
      threatCategoriesByIp[threat.ipAddress] = repFactor.description.split("Categories: ")[1]?.split("|")[0]?.split(",") || []
    }
  })

  return {
    totalIpsAnalyzed: threats.length,
    criticalReputationIps: criticalRepIps,
    highReputationIps: highRepIps,
    blacklistedIps,
    reputationAverageScore: threats.length > 0 
      ? Math.round((threats.reduce((sum, t) => sum + (t.enrichment?.abuseScore || 0), 0) / threats.length))
      : 0,
  }
}

/**
 * Calculate risk factors breakdown for visualization
 */
export function getRiskFactorsBreakdown(riskFactors?: Array<{ confidence: number; method: string }>) {
  if (!riskFactors || riskFactors.length === 0) {
    return { highest: 0, count: 0, byConfidence: {} }
  }

  const sorted = [...riskFactors].sort((a, b) => b.confidence - a.confidence)
  const byConfidence: Record<string, number> = {}

  riskFactors.forEach((rf) => {
    const bucket = rf.confidence >= 80 ? "High" : rf.confidence >= 50 ? "Medium" : "Low"
    byConfidence[bucket] = (byConfidence[bucket] || 0) + 1
  })

  return {
    highest: sorted[0]?.confidence || 0,
    count: riskFactors.length,
    byConfidence,
  }
}

/**
 * Export analysis for reporting
 */
export function exportThreatAnalysisReport(threat: ThreatIntelligence): string {
  const sections = [
    `# Threat Analysis Report - ${threat.ipAddress}`,
    ``,
    `## Summary`,
    `- **Threat Score**: ${threat.threatScore}/100`,
    `- **Threat Level**: ${threat.threatLevel.toUpperCase()}`,
    `- **Status**: ${threat.status}`,
    `- **Confidence**: ${threat.confidenceScore || "N/A"}%`,
    `- **Last Seen**: ${threat.lastSeen.toISOString()}`,
    ``,
    `## Description`,
    threat.description,
    ``,
  ]

  if (threat.algorithmReasoning) {
    sections.push(`## Algorithm Analysis`)
    sections.push(threat.algorithmReasoning)
    sections.push(``)
  }

  if (threat.detectedAttackTypes && threat.detectedAttackTypes.length > 0) {
    sections.push(`## Detected Attack Types`)
    threat.detectedAttackTypes.forEach((attack) => {
      sections.push(`- ${attack.replace(/_/g, " ").toUpperCase()}`)
    })
    sections.push(``)
  }

  if (threat.recommendations && threat.recommendations.length > 0) {
    sections.push(`## Recommendations`)
    threat.recommendations.forEach((rec, idx) => {
      sections.push(`${idx + 1}. ${rec}`)
    })
    sections.push(``)
  }

  return sections.join("\n")
}
/**
 * ===========================================================================
 * IP Reputation API Exports
 * ===========================================================================
 * Re-export API functions for convenience
 */

export {
  checkIpReputationFromAPI,
  checkMultipleIpsFromAPI,
  getCacheStats,
  clearReputationCache,
  testAbuseIPDBConnection,
  getAbuseIPDBAccountInfo,
} from "./ip-reputation-api"

/**
 * Convenience function to test API setup
 * Call this to verify AbuseIPDB API is configured correctly
 * 
 * Usage:
 *   const result = await testIpReputationSetup()
 *   console.log(result.message)
 */
export { testAbuseIPDBConnection as testIpReputationSetup }