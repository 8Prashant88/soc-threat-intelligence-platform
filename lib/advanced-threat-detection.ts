/**
 * SecureLogTI - Advanced Threat Detection Engine
 * Multi-factor threat analysis with explainable AI
 *
 * Detection Methods:
 * 1. Pattern-Based Detection - Attack signatures & indicators
 * 2. Anomaly Detection - Deviation from baseline behavior
 * 3. Temporal Analysis - Time-based behavior patterns
 * 4. Severity Escalation - Behavior intensity over time
 * 5. Correlation Analysis - Multiple threat indicators
 */

import type { LogEntry, ThreatLevel } from "./types"

// Attack indicator patterns
const ATTACK_PATTERNS = {
  SSH_BRUTE_FORCE: /failed password|invalid user|authentication failure|permission denied|refused our key/i,
  SQL_INJECTION: /'[\s]?or[\s]?'|union[\s]?select|drop[\s]?table|exec\(|base64|0x/i,
  MALWARE_INDICATORS: /wget[\s]|curl[\s]|base64.*-d|powershell|meterpreter|ransomware|backdoor|botnet|trojan|worm|virus|spyware/i,
  DDOS_ATTACK: /429|service unavailable|too many requests|connection reset|rate limit|timeout/i,
  WEB_SHELL_UPLOAD: /\.php|\.jsp|\.asp|\.cgi|\.exe|\.sh[\s]|webshell|c99shell/i,
  PRIVILEGE_ESCALATION: /sudo|su[\s]|root|administrator|setuid/i,
  SUSPICIOUS_PORTS: /:(22|23|3306|5432|27017|6379|9200|27015)\s/i,
  UNAUTHORIZED_ACCESS: /401|403|denied|forbidden|not allowed/i,
}

/**
 * Detailed algorithm breakdown for each detection
 */
export interface DetectionReason {
  method: string
  confidence: number // 0-100
  description: string
  evidence: string[]
}

/**
 * Advanced threat analysis result with full reasoning
 */
export interface AdvancedThreatAnalysis {
  threatScore: number // 0-100
  threatLevel: ThreatLevel
  riskFactors: DetectionReason[]
  primaryAttackType: string
  confidence: number
  reasoning: string
  recommendations: string[]
}

/**
 * Behavioral baseline for anomaly detection
 */
export interface BehavioralMetrics {
  avgRequestsPerHour: number
  avgFailedAttemptsPerDay: number
  avgAccessPatterns: string[]
  timeOfDayDistribution: { hour: number; count: number }[]
  uniqueEndpoints: number
  geographicVariability: number
}

// ============================================================================
// DETECTION METHOD 1: PATTERN-BASED DETECTION
// ============================================================================

export function detectByPatterns(logEntries: LogEntry[]): DetectionReason[] {
  const findings: DetectionReason[] = []
  const messagesByType: Record<string, string[]> = {}

  logEntries.forEach((log) => {
    const msg = (log.message || log.rawLog || "").toLowerCase()
    const logType = log.logType

    if (!messagesByType[logType]) messagesByType[logType] = []
    messagesByType[logType].push(msg)
  })

  // Check for SSH brute force patterns
  const sshBruteForceMatches = logEntries.filter(
    (l) => l.logType === "auth" && ATTACK_PATTERNS.SSH_BRUTE_FORCE.test(l.message || l.rawLog || "")
  )
  if (sshBruteForceMatches.length >= 3) {
    findings.push({
      method: "SSH Brute Force Pattern Detection",
      confidence: Math.min(80 + sshBruteForceMatches.length * 5, 99),
      description: `Detected ${sshBruteForceMatches.length} SSH authentication failures matching known brute force patterns`,
      evidence: sshBruteForceMatches.slice(0, 3).map((l) => l.message || l.rawLog || ""),
    })
  }

  // Check for SQL injection patterns
  const sqlInjectionMatches = logEntries.filter((l) =>
    ATTACK_PATTERNS.SQL_INJECTION.test(l.message || l.rawLog || "")
  )
  if (sqlInjectionMatches.length > 0) {
    findings.push({
      method: "SQL Injection Signature Detection",
      confidence: Math.min(85 + sqlInjectionMatches.length * 10, 99),
      description: `Detected ${sqlInjectionMatches.length} SQL injection attack signatures in logs`,
      evidence: sqlInjectionMatches.slice(0, 2).map((l) => l.message || l.rawLog || ""),
    })
  }

  // Check for malware indicators
  const malwareMatches = logEntries.filter((l) =>
    ATTACK_PATTERNS.MALWARE_INDICATORS.test(l.message || l.rawLog || "")
  )
  if (malwareMatches.length > 0) {
    findings.push({
      method: "Malware Indicators Detection",
      confidence: Math.min(75 + malwareMatches.length * 8, 98),
      description: `Detected ${malwareMatches.length} suspicious commands associated with malware behavior`,
      evidence: malwareMatches.slice(0, 2).map((l) => l.message || l.rawLog || ""),
    })
  }

  // Check for DDoS patterns
  const ddosMatches = logEntries.filter((l) =>
    ATTACK_PATTERNS.DDOS_ATTACK.test(l.message || l.rawLog || "")
  )
  if (ddosMatches.length > 0) {
    findings.push({
      method: "DDoS Attack Pattern Detection",
      confidence: Math.min(70 + ddosMatches.length * 5, 95),
      description: `Detected ${ddosMatches.length} indicators of distributed denial of service attacks`,
      evidence: ddosMatches.slice(0, 2).map((l) => l.message || l.rawLog || ""),
    })
  }

  // Check for web shell uploads
  const webShellMatches = logEntries.filter((l) =>
    ATTACK_PATTERNS.WEB_SHELL_UPLOAD.test(l.message || l.rawLog || "")
  )
  if (webShellMatches.length > 0) {
    findings.push({
      method: "Web Shell Upload Detection",
      confidence: Math.min(80 + webShellMatches.length * 10, 99),
      description: `Detected ${webShellMatches.length} suspicious file uploads matching web shell patterns`,
      evidence: webShellMatches.slice(0, 2).map((l) => l.message || l.rawLog || ""),
    })
  }

  // Check for privilege escalation attempts
  const privEscMatches = logEntries.filter(
    (l) =>
      l.logType === "auth" &&
      ATTACK_PATTERNS.PRIVILEGE_ESCALATION.test(l.message || l.rawLog || "")
  )
  if (privEscMatches.length >= 2) {
    findings.push({
      method: "Privilege Escalation Attempt Detection",
      confidence: Math.min(70 + privEscMatches.length * 5, 90),
      description: `Detected ${privEscMatches.length} attempts to escalate privileges`,
      evidence: privEscMatches.slice(0, 2).map((l) => l.message || l.rawLog || ""),
    })
  }

  return findings
}

// ============================================================================
// DETECTION METHOD 2: ANOMALY DETECTION (Statistical)
// ============================================================================

export function detectAnomalies(logEntries: LogEntry[], baseline?: BehavioralMetrics): DetectionReason[] {
  const findings: DetectionReason[] = []

  if (logEntries.length === 0) return findings

  // Calculate metrics
  const timeRange = {
    start: Math.min(...logEntries.map((l) => l.timestamp.getTime())),
    end: Math.max(...logEntries.map((l) => l.timestamp.getTime())),
  }
  const hoursSpan = (timeRange.end - timeRange.start) / (1000 * 60 * 60)

  // 1. Request rate anomaly
  const requestRate = logEntries.length / Math.max(hoursSpan, 1)
  const baselineRate = baseline?.avgRequestsPerHour || 10
  if (requestRate > baselineRate * 3) {
    findings.push({
      method: "Request Rate Anomaly Detection",
      confidence: Math.min(60 + Math.log(requestRate / baselineRate) * 20, 90),
      description: `Unusually high request rate detected: ${Math.round(requestRate)} requests/hour (baseline: ${baselineRate})`,
      evidence: [`Rate spike: ${Math.round(requestRate / baselineRate)}x normal traffic`],
    })
  }

  // 2. Error rate anomaly
  const errorCount = logEntries.filter(
    (l) => l.severity === "error" || l.severity === "critical"
  ).length
  const errorRate = errorCount / logEntries.length
  if (errorRate > 0.3) {
    findings.push({
      method: "Error Rate Anomaly Detection",
      confidence: Math.min(50 + errorRate * 50, 85),
      description: `Elevated error rate detected: ${(errorRate * 100).toFixed(1)}% of logs are errors`,
      evidence: [
        `${errorCount} error logs out of ${logEntries.length}`,
        `Baseline error rate typically < 10%`,
      ],
    })
  }

  // 3. Failed authentication spike
  const failedAuthLogs = logEntries.filter(
    (l) =>
      l.logType === "auth" &&
      ATTACK_PATTERNS.UNAUTHORIZED_ACCESS.test(l.message || l.rawLog || "")
  )
  const baselineFailedAuth = baseline?.avgFailedAttemptsPerDay || 2
  if (failedAuthLogs.length > baselineFailedAuth * 2) {
    findings.push({
      method: "Failed Authentication Spike Detection",
      confidence: Math.min(70 + failedAuthLogs.length * 5, 95),
      description: `Spike in failed authentication attempts: ${failedAuthLogs.length} failures detected`,
      evidence: failedAuthLogs.slice(0, 3).map((l) => l.message || l.rawLog || ""),
    })
  }

  return findings
}

// ============================================================================
// DETECTION METHOD 3: TEMPORAL ANALYSIS
// ============================================================================

export function detectTemporalPatterns(logEntries: LogEntry[]): DetectionReason[] {
  const findings: DetectionReason[] = []

  if (logEntries.length < 5) return findings

  // Group by hour
  const byHour: Record<number, number> = {}
  logEntries.forEach((log) => {
    const hour = log.timestamp.getHours()
    byHour[hour] = (byHour[hour] || 0) + 1
  })

  // Find concentrated activity
  const hours = Object.entries(byHour)
  const avgPerHour = logEntries.length / Math.max(Object.keys(byHour).length, 1)
  const peakHours = hours.filter(([_, count]) => count > avgPerHour * 3)

  if (peakHours.length > 0 && peakHours.length <= 2) {
    findings.push({
      method: "Concentrated Attack Window Detection",
      confidence: 65,
      description: `Attack activity concentrated in specific time window(s) - characteristic of automated attacks`,
      evidence: peakHours.map(([hour, count]) => `${count} events at hour ${hour}:00`),
    })
  }

  // Rapid succession detection (within minutes)
  if (logEntries.length >= 5) {
    const sorted = [...logEntries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    let rapidSuccessionCount = 0

    for (let i = 1; i < Math.min(sorted.length, 20); i++) {
      const timeDiff = sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime()
      if (timeDiff < 1000) { // Less than 1 second apart
        rapidSuccessionCount++
      }
    }

    if (rapidSuccessionCount >= 3) {
      findings.push({
        method: "Rapid-Fire Event Detection",
        confidence: 75,
        description: `Detected ${rapidSuccessionCount} events occurring in rapid succession (< 1 second apart)`,
        evidence: [
          "Rapid event sequence matches automated/scripted attack behavior",
          "Manual user activity typically has > 1 second gaps",
        ],
      })
    }
  }

  return findings
}

// ============================================================================
// DETECTION METHOD 4: SEVERITY ESCALATION ANALYSIS
// ============================================================================

export function detectSeverityEscalation(logEntries: LogEntry[]): DetectionReason[] {
  const findings: DetectionReason[] = []

  if (logEntries.length < 3) return findings

  // Count severity levels
  const severityCount = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  }

  logEntries.forEach((log) => {
    severityCount[log.severity]++
  })

  // Check for escalation pattern (warning -> error -> critical)
  const hasCritical = severityCount.critical > 0
  const hasError = severityCount.error > 0
  const hasWarning = severityCount.warning > 0

  if (hasCritical) {
    findings.push({
      method: "Critical Severity Escalation Detection",
      confidence: 85,
      description: `Escalation to CRITICAL severity detected - indicates severe system compromise or attack`,
      evidence: [
        `${severityCount.critical} CRITICAL level events`,
        severityCount.error > 0 ? `Progressive escalation from ERROR (${severityCount.error}) to CRITICAL` : "",
      ].filter(Boolean),
    })
  } else if (hasError) {
    findings.push({
      method: "Error Level Escalation Detection",
      confidence: 70,
      description: `Multiple ERROR level events indicate system issues or attack progression`,
      evidence: [`${severityCount.error} ERROR level events detected`],
    })
  }

  return findings
}

// ============================================================================
// DETECTION METHOD 5: CORRELATION ANALYSIS
// ============================================================================

export function detectCorrelations(
  logEntries: LogEntry[]
): DetectionReason[] {
  const findings: DetectionReason[] = []

  const uniqueIPs = new Set(logEntries.map((l) => l.sourceIp))
  const uniqueEndpoints = new Set(
    logEntries
      .map((l) => {
        const match = (l.message || l.rawLog || "").match(/\/[^\s]+/)
        return match ? match[0] : null
      })
      .filter(Boolean)
  )

  // Multiple IPs attacking same target
  if (uniqueIPs.size >= 5 && uniqueEndpoints.size <= 3) {
    findings.push({
      method: "Distributed Attack Correlation Detection",
      confidence: 75,
      description: `Multiple source IPs (${uniqueIPs.size}) targeting same endpoint(s) - indicates coordinated attack`,
      evidence: [
        `${uniqueIPs.size} unique source IPs detected`,
        `${uniqueEndpoints.size} unique target endpoint(s)`,
        "Pattern matches distributed attack signatures",
      ],
    })
  }

  // Check for mixed attack types
  const patternMatches = {
    bruteForce: logEntries.filter((l) => ATTACK_PATTERNS.SSH_BRUTE_FORCE.test(l.message || l.rawLog || ""))
      .length,
    sqlInjection: logEntries.filter((l) => ATTACK_PATTERNS.SQL_INJECTION.test(l.message || l.rawLog || "")).length,
    malware: logEntries.filter((l) => ATTACK_PATTERNS.MALWARE_INDICATORS.test(l.message || l.rawLog || "")).length,
  }

  const attackTypeCount = Object.values(patternMatches).filter((count) => count > 0).length
  if (attackTypeCount >= 2) {
    findings.push({
      method: "Multi-Vector Attack Detection",
      confidence: 80,
      description: `Multiple attack vectors detected in same incident - suggests sophisticated attacker`,
      evidence: [
        attackTypeCount >= 2 ? "Brute force + SQL injection detected" : "",
        attackTypeCount >= 3 ? "All three attack types present" : "",
      ].filter(Boolean),
    })
  }

  return findings
}

// ============================================================================
// MAIN ANALYSIS FUNCTION - COMBINES ALL DETECTION METHODS
// ============================================================================

export function performAdvancedThreatAnalysis(
  logEntries: LogEntry[],
  userId: string,
  baseline?: BehavioralMetrics
): Map<string, AdvancedThreatAnalysis> {
  const analysisByIP = new Map<string, AdvancedThreatAnalysis>()

  // Group logs by source IP
  const logsByIP = new Map<string, LogEntry[]>()
  logEntries.forEach((log) => {
    const ip = log.sourceIp || "0.0.0.0"
    if (!logsByIP.has(ip)) {
      logsByIP.set(ip, [])
    }
    logsByIP.get(ip)!.push(log)
  })

  // Analyze each IP
  logsByIP.forEach((ipLogs, ip) => {
    const allReasons: DetectionReason[] = []

    // Apply all detection methods
    allReasons.push(...detectByPatterns(ipLogs))
    allReasons.push(...detectAnomalies(ipLogs, baseline))
    allReasons.push(...detectTemporalPatterns(ipLogs))
    allReasons.push(...detectSeverityEscalation(ipLogs))
    allReasons.push(...detectCorrelations(ipLogs))

    // Calculate composite threat score
    const threatScore = calculateCompositeScore(allReasons)
    const threatLevel = scoreToThreatLevel(threatScore)

    // Overall confidence
    const avgConfidence = allReasons.length > 0 ? Math.round(allReasons.reduce((a, r) => a + r.confidence, 0) / allReasons.length) : 0

    // Determine primary attack type
    const primaryAttackType = determinePrimaryAttackType(ipLogs, allReasons)

    // Generate recommendations
    const recommendations = generateRecommendations(primaryAttackType, threatLevel, allReasons)

    // Create reasoning summary
    const reasoning = createReasoningSummary(allReasons, threatScore)

    analysisByIP.set(ip, {
      threatScore,
      threatLevel,
      riskFactors: allReasons,
      primaryAttackType,
      confidence: avgConfidence,
      reasoning,
      recommendations,
    })
  })

  return analysisByIP
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateCompositeScore(reasons: DetectionReason[]): number {
  if (reasons.length === 0) return 0

  // Weight different detection types
  const weights: Record<string, number> = {
    "SQL Injection Signature Detection": 40,
    "Web Shell Upload Detection": 35,
    "Malware Indicators Detection": 38,
    "SSH Brute Force Pattern Detection": 25,
    "DDoS Attack Pattern Detection": 30,
    "Critical Severity Escalation Detection": 35,
    "Multi-Vector Attack Detection": 40,
    "Distributed Attack Correlation Detection": 35,
    "Rapid-Fire Event Detection": 20,
    "Concentrated Attack Window Detection": 15,
    "Request Rate Anomaly Detection": 18,
    "Error Rate Anomaly Detection": 20,
    "Failed Authentication Spike Detection": 25,
    "Privilege Escalation Attempt Detection": 28,
  }

  const weightedScore = reasons.reduce((sum, reason) => {
    const weight = weights[reason.method] || 20
    const contribution = (reason.confidence / 100) * weight
    return sum + contribution
  }, 0)

  // Normalize to 0-100 scale
  const maxPossibleScore = Object.values(weights).reduce((a, b) => a + b, 0)
  return Math.min(Math.round((weightedScore / maxPossibleScore) * 100), 100)
}

function scoreToThreatLevel(score: number): ThreatLevel {
  if (score >= 70) return "high"
  if (score >= 40) return "medium"
  return "low"
}

function determinePrimaryAttackType(ipLogs: LogEntry[], reasons: DetectionReason[]): string {
  const attackTypes: Record<string, number> = {}

  reasons.forEach((reason) => {
    if (reason.method.includes("SQL Injection")) attackTypes["SQL Injection"] = (attackTypes["SQL Injection"] || 0) + 1
    if (reason.method.includes("SSH Brute Force")) attackTypes["SSH Brute Force"] = (attackTypes["SSH Brute Force"] || 0) + 1
    if (reason.method.includes("Malware")) attackTypes["Malware"] = (attackTypes["Malware"] || 0) + 1
    if (reason.method.includes("DDoS")) attackTypes["DDoS"] = (attackTypes["DDoS"] || 0) + 1
    if (reason.method.includes("Web Shell")) attackTypes["Web Shell Upload"] = (attackTypes["Web Shell Upload"] || 0) + 1
  })

  const primary = Object.entries(attackTypes).sort(([, a], [, b]) => b - a)[0]
  return primary ? primary[0] : "Suspicious Activity"
}

function generateRecommendations(attackType: string, threatLevel: ThreatLevel, reasons: DetectionReason[]): string[] {
  const recommendations: string[] = []

  // Immediate actions based on threat level
  if (threatLevel === "high") {
    recommendations.push("CRITICAL: Block source IP immediately on firewall")
    recommendations.push("Isolate affected systems from network if locally originated")
    recommendations.push("Preserve logs and evidence for forensic analysis")
    recommendations.push("Alert security team immediately")
  } else if (threatLevel === "medium") {
    recommendations.push("Monitor source IP closely for escalation")
    recommendations.push("Implement rate limiting to slow attack")
    recommendations.push("Review access logs for successful breaches")
  }

  // Type-specific recommendations
  switch (attackType) {
    case "SSH Brute Force":
      recommendations.push("Disable password authentication, use SSH keys only")
      recommendations.push("Implement fail2ban or similar rate limiting")
      recommendations.push("Change SSH port from default 22")
      break
    case "SQL Injection":
      recommendations.push("Apply Web Application Firewall (WAF) rules immediately")
      recommendations.push("Audit database for unauthorized modifications")
      recommendations.push("Review application code for parameterized queries")
      break
    case "Malware":
      recommendations.push("Run full antivirus/malware scan on affected systems")
      recommendations.push("Check for persistence mechanisms and backdoors")
      recommendations.push("Rotate all credentials used on affected systems")
      break
    case "DDoS":
      recommendations.push("Activate DDoS mitigation service")
      recommendations.push("Setup rate limiting and CAPTCHA challenges")
      recommendations.push("Consider triggering CDN/WAF protections")
      break
  }

  // Detection method specific recommendations
  reasons.forEach((reason) => {
    if (reason.confidence > 80) {
      recommendations.push(`High confidence detection (${reason.confidence}%): ${reason.method}`)
    }
  })

  return recommendations
}

function createReasoningSummary(reasons: DetectionReason[], score: number): string {
  if (reasons.length === 0) return "No threats detected"

  const topReasons = reasons.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  const summary = topReasons
    .map((r) => `${r.method} (${r.confidence}% confidence): ${r.description}`)
    .join("; ")

  return `Composite threat score ${score}/100 based on: ${summary}`
}

export function getAllDetectionMethods(): string[] {
  return [
    "Pattern-Based Detection",
    "Anomaly Detection",
    "Temporal Pattern Analysis",
    "Severity Escalation Detection",
    "Correlation Analysis",
  ]
}
