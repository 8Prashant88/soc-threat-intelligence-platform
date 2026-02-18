/**
 * SecureLogTI - Threat Scoring Algorithm
 * Simulates a threat scoring algorithm for demonstration purposes
 *
 * Algorithm Logic:
 * - Base score starts at 0
 * - Each failed login adds 2 points
 * - Each repeated access adds 0.5 points
 * - Score is capped at 100
 * - Threat level is determined by score thresholds
 */

import type { ThreatLevel, LogEntry, ThreatIntelligence } from "./types"

/**
 * Rule-based, explainable threat analysis applied after logs are aggregated by IP.
 * This implementation follows the project requirements:
 * - aggregate by IP
 * - detect SSH brute force, SQLi, Web brute force and Malware indicators
 * - compute a single cumulative threat score per IP
 * - map score to severity (low/medium/high)
 * - return explainable threat intelligence entries per IP
 */

// Attack indicator patterns (kept simple and explainable)
const SSH_FAILURE_PATTERNS = ["failed password", "invalid user", "authentication failure", "server refused our key", "permission denied"]
const SQLI_PATTERNS = ["' or '1'='1", "union select", "drop table", "--", "exec(", "replace(", "concat(", "char(", "0x"]
const LOGIN_ENDPOINT_PATTERNS = ["/login", "login", "/signin", "wp-login.php", "/admin/login", "/api/auth", "/authenticate"]
const MALWARE_PATTERNS = ["wget", "curl", "/bin/bash", "base64 -d", "powershell", "meterpreter", "ransomware", "backdoor", "botnet", "trojan", "worm", "virus", "spyware"]
const DDOS_PATTERNS = ["429", "service unavailable", "connection reset", "too many requests", "rate limit", "timeout", "connection refused"]

// Scoring constants per requirements
const SCORE_FAILED_1_2 = 10
const SCORE_FAILED_3_4 = 30
const SCORE_FAILED_5_PLUS = 70
const SCORE_SQLI = 40
const SCORE_MALWARE = 50
const SCORE_DDOS = 60

// Severity mapping
function scoreToSeverity(score: number): ThreatLevel {
  if (score >= 60) return "high"
  if (score >= 30) return "medium"
  return "low"
}

/**
 * Analyze a list of parsed logs and produce ThreatIntelligence entries grouped by IP.
 * The function is intentionally rule-based and easy to explain.
 */
export function analyzeUserLogs(logs: LogEntry[], userId: string): ThreatIntelligence[] {
  const byIp = new Map<
    string,
    {
      messages: string[]
      failedCount: number
      sqlCount: number
      malwareCount: number
      ddosCount: number
      http401or403Count: number
      loginEndpointCount: number
      lastSeen: Date
      totalEvents: number
    }
  >()

  logs.forEach((l) => {
    const ip = l.sourceIp || "0.0.0.0"
    const entry = byIp.get(ip) || {
      messages: [],
      failedCount: 0,
      sqlCount: 0,
      malwareCount: 0,
      ddosCount: 0,
      http401or403Count: 0,
      loginEndpointCount: 0,
      lastSeen: l.timestamp,
      totalEvents: 0,
    }

    entry.totalEvents++
    if (l.timestamp > entry.lastSeen) entry.lastSeen = l.timestamp
    entry.messages.push(l.message || l.rawLog || "")

    const msgLower = (l.message || l.rawLog || "").toLowerCase()

    // SSH failure detection (count failed attempts)
    for (const p of SSH_FAILURE_PATTERNS) {
      if (msgLower.includes(p)) {
        entry.failedCount++
        break
      }
    }

    // SQL injection detection (any match triggers)
    for (const p of SQLI_PATTERNS) {
      if (msgLower.includes(p)) {
        entry.sqlCount++
        break
      }
    }

    // Malware indicators
    for (const p of MALWARE_PATTERNS) {
      if (msgLower.includes(p)) {
        entry.malwareCount++
        break
      }
    }

    // DDoS detection (high request volume, rate limiting, service unavailability)
    for (const p of DDOS_PATTERNS) {
      if (msgLower.includes(p)) {
        entry.ddosCount++
        break
      }
    }

    // Simple HTTP status detection (401/403 in message)
    if (msgLower.includes(" 401 ") || msgLower.includes(" 401\"") || msgLower.includes("status=401") || msgLower.includes(" 403 ") || msgLower.includes("status=403")) {
      entry.http401or403Count++
    }

    // Login endpoint access
    for (const p of LOGIN_ENDPOINT_PATTERNS) {
      if (msgLower.includes(p)) {
        entry.loginEndpointCount++
        break
      }
    }

    byIp.set(ip, entry)
  })

  const thresholdForSuspicious = 30 // threshold to mark suspicious by score (can be explained in viva)

  const results: ThreatIntelligence[] = []

  byIp.forEach((stats, ip) => {
    // Compute failed-attempt score bucket
    let score = 0

    if (stats.failedCount >= 5) score += SCORE_FAILED_5_PLUS
    else if (stats.failedCount >= 3) score += SCORE_FAILED_3_4
    else if (stats.failedCount >= 1) score += SCORE_FAILED_1_2

    // SQLi and malware additive scores (each occurrence adds once for explainability)
    if (stats.sqlCount > 0) score += SCORE_SQLI
    if (stats.malwareCount > 0) score += SCORE_MALWARE
    if (stats.ddosCount > 0) score += SCORE_DDOS

    // Cap score at 100
    score = Math.min(score, 100)

    // Determine detected attack types
    const attacks: string[] = []
    if (stats.failedCount > 0) attacks.push("ssh_bruteforce")
    if (stats.sqlCount > 0) attacks.push("sql_injection")
    if (stats.http401or403Count > 0 && stats.loginEndpointCount > 0) attacks.push("web_bruteforce")
    if (stats.malwareCount > 0) attacks.push("malware_suspicious_activity")
    if (stats.ddosCount > 0) attacks.push("ddos_attack")

    const totalSuspiciousEvents = stats.failedCount + stats.sqlCount + stats.malwareCount + stats.http401or403Count + stats.loginEndpointCount

    const threatLevel = scoreToSeverity(score)

    const suspiciousIpFlag = score >= thresholdForSuspicious || attacks.length >= 2

    // Build a human-friendly description (explainable)
    const descriptionParts: string[] = []
    if (stats.failedCount > 0) descriptionParts.push(`${stats.failedCount} failed auth attempts`)
    if (stats.sqlCount > 0) descriptionParts.push(`${stats.sqlCount} SQLi indicator(s)`)
    if (stats.malwareCount > 0) descriptionParts.push(`${stats.malwareCount} malware indicator(s)`)
    if (stats.ddosCount > 0) descriptionParts.push(`${stats.ddosCount} DDoS indicator(s)`)
    if (stats.http401or403Count > 0) descriptionParts.push(`${stats.http401or403Count} HTTP 401/403 responses`)
    if (stats.loginEndpointCount > 0) descriptionParts.push(`${stats.loginEndpointCount} login endpoint accesses`)

    const description = descriptionParts.length > 0 ? descriptionParts.join("; ") : "No clear indicators"

    // Map to ThreatIntelligence shape from types.ts
    results.push({
      id: `threat-${userId}-${ip.replace(/\./g, "-")}`,
      userId,
      ipAddress: ip,
      threatScore: score,
      threatLevel,
      lastSeen: stats.lastSeen,
      status: "active",
      failedLogins: stats.failedCount,
      repeatedAccess: stats.totalEvents,
      description,
      detectedAttackTypes: attacks,
      totalSuspiciousEvents,
      suspicious: suspiciousIpFlag,
      enrichment: undefined,
    })
  })

  return results
}

/**
 * Keep a small helper for UI components that expect a quick score calculation.
 * This mirrors the same scoring rules (explainable) but is simpler and used only for quick UI previews.
 */
export interface ThreatScoreResult {
  score: number
  threatLevel: ThreatLevel
  breakdown: {
    failedLoginScore: number
    repeatedAccessScore: number
    baseScore: number
  }
  isMalicious: boolean
  recommendation: string
}

export function calculateThreatScore(failedLogins: number, repeatedAccess: number, additionalFactors = 0): ThreatScoreResult {
  let score = 0
  let failedLoginScore = 0
  if (failedLogins >= 5) failedLoginScore = SCORE_FAILED_5_PLUS
  else if (failedLogins >= 3) failedLoginScore = SCORE_FAILED_3_4
  else if (failedLogins >= 1) failedLoginScore = SCORE_FAILED_1_2

  // repeatedAccess contributes small amount (kept backward-compatible)
  const repeatedAccessScore = Math.min(Math.round(repeatedAccess * 0.5), 30)

  score = failedLoginScore + repeatedAccessScore + additionalFactors
  score = Math.min(score, 100)

  const threatLevel = scoreToSeverity(score)
  const isMalicious = score >= 60

  let recommendation = "Continue monitoring. No immediate action required."
  if (threatLevel === "medium") recommendation = "Monitor closely. Implement rate limiting and review access patterns."
  if (threatLevel === "high") recommendation = "Immediate action required. Consider blocking this IP address and investigating the source."

  return {
    score,
    threatLevel,
    breakdown: {
      failedLoginScore,
      repeatedAccessScore,
      baseScore: additionalFactors,
    },
    isMalicious,
    recommendation,
  }
}

export function getThreatLevelBgColor(level: ThreatLevel): string {
  switch (level) {
    case "high":
      return "bg-danger/20 text-danger"
    case "medium":
      return "bg-warning/20 text-warning"
    case "low":
      return "bg-success/20 text-success"
  }
}

export function getThreatLevelColor(level: ThreatLevel): string {
  switch (level) {
    case "high":
      return "text-danger"
    case "medium":
      return "text-warning"
    case "low":
      return "text-success"
  }
}

// Remediation measures for different attack types
export interface RemediationMeasure {
  title: string
  steps: string[]
  priority: "critical" | "high" | "medium" | "low"
}

export function getRemediationMeasures(attackType: string): RemediationMeasure[] {
  const remediations: Record<string, RemediationMeasure[]> = {
    ssh_bruteforce: [
      {
        title: "Immediate Actions",
        priority: "critical",
        steps: [
          "Block the source IP immediately using firewall rules",
          "Review SSH logs for successful unauthorized access",
          "Check for unauthorized SSH keys in ~/.ssh/authorized_keys",
          "Generate new SSH key pairs if any compromise is suspected",
        ],
      },
      {
        title: "Short-term Hardening",
        priority: "high",
        steps: [
          "Change SSH port from default 22 to a non-standard port",
          "Disable password authentication - use key-based auth only",
          "Implement fail2ban or similar intrusion prevention tool",
          "Configure AccountLockout policies after N failed attempts",
        ],
      },
      {
        title: "Long-term Security",
        priority: "high",
        steps: [
          "Enable 2FA/MFA for privileged accounts",
          "Implement VPN or bastion host for SSH access",
          "Use key management solutions for automated key rotation",
          "Regular security audits and penetration testing",
        ],
      },
    ],
    sql_injection: [
      {
        title: "Immediate Actions",
        priority: "critical",
        steps: [
          "Take the affected application offline or disable vulnerable endpoints",
          "Check database logs for unauthorized queries or data exfiltration",
          "Verify database user privileges and revoke unnecessary permissions",
          "Check for SQL modification timestamps on tables",
        ],
      },
      {
        title: "Vulnerability Remediation",
        priority: "critical",
        steps: [
          "Use parameterized queries/prepared statements in all database code",
          "Implement input validation and sanitization",
          "Apply Web Application Firewall (WAF) rules",
          "Implement database query logging and monitoring",
        ],
      },
      {
        title: "Post-Breach Actions",
        priority: "high",
        steps: [
          "Audit all database access logs for the incident period",
          "Check for data breach disclosure requirements",
          "Update security policies and code review processes",
          "Implement automated SQL injection scanning in CI/CD pipeline",
        ],
      },
    ],
    malware_suspicious_activity: [
      {
        title: "Immediate Actions",
        priority: "critical",
        steps: [
          "Isolate the affected system from network immediately",
          "Preserve system logs and memory dumps for forensic analysis",
          "Disable network access to prevent command & control communication",
          "Capture network traffic for investigation",
        ],
      },
      {
        title: "Malware Removal",
        priority: "critical",
        steps: [
          "Boot system in Safe Mode if possible",
          "Run updated antivirus and malware scanners (Malwarebytes, ESET)",
          "Check for persistence mechanisms (startup folders, scheduled tasks, services)",
          "Review processes for suspicious activity using Process Explorer",
        ],
      },
      {
        title: "Post-Remediation",
        priority: "high",
        steps: [
          "Patch all software and operating systems to latest versions",
          "Change all credentials used on the compromised system",
          "Rebuild system from trusted media if compromise is severe",
          "Implement EDR (Endpoint Detection & Response) solutions",
        ],
      },
    ],
    ddos_attack: [
      {
        title: "Immediate Mitigation",
        priority: "critical",
        steps: [
          "Activate DDoS mitigation service (Cloudflare, AWS Shield, Akamai)",
          "Enable rate limiting on web servers",
          "Block suspicious IP ranges at network perimeter",
          "Notify your ISP and hosting provider immediately",
        ],
      },
      {
        title: "Traffic Filtering",
        priority: "high",
        steps: [
          "Implement geo-blocking if attack originates from unexpected regions",
          "Use behavioral analysis to identify and block bot traffic",
          "Configure connection limits per IP address",
          "Implement CAPTCHA challenges for suspicious traffic patterns",
        ],
      },
      {
        title: "Infrastructure Hardening",
        priority: "high",
        steps: [
          "Scale infrastructure to handle increased traffic (cloud auto-scaling)",
          "Route traffic through Content Delivery Network (CDN)",
          "Implement anycast network for better traffic distribution",
          "Set up monitoring and alerting for traffic anomalies",
        ],
      },
    ],
    web_bruteforce: [
      {
        title: "Immediate Actions",
        priority: "critical",
        steps: [
          "Block or rate-limit requests from the source IP",
          "Review web server logs for successful unauthorized logins",
          "Check for web shell uploads or suspicious file modifications",
          "Force password reset for all user accounts",
        ],
      },
      {
        title: "Access Control Enhancement",
        priority: "high",
        steps: [
          "Implement account lockout policy (e.g., 5 failed attempts = 30 min lockout)",
          "Enable multi-factor authentication (MFA) for all users",
          "Implement CAPTCHA after N failed login attempts",
          "Use Web Application Firewall (WAF) rules for authentication endpoints",
        ],
      },
      {
        title: "Monitoring & Detection",
        priority: "medium",
        steps: [
          "Implement login attempt monitoring and alerting",
          "Log all failed authentication attempts with details",
          "Use security intelligence tools to detect credential stuffing",
          "Monitor for lateral movement attempts post-breach",
        ],
      },
    ],
  }

  return remediations[attackType] || []
}

export function getAttackTypeLabel(attackType: string): string {
  const labels: Record<string, string> = {
    ssh_bruteforce: "SSH Brute Force Attack",
    sql_injection: "SQL Injection Attack",
    malware_suspicious_activity: "Malware/Suspicious Activity",
    ddos_attack: "DDoS Attack",
    web_bruteforce: "Web Application Brute Force",
  }
  return labels[attackType] || attackType.replace(/_/g, " ")
}
