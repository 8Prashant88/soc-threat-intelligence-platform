/**
 * SecureLogTI - IP Reputation Check System
 * Integrated IP reputation scoring for threat detection enhancement
 *
 * Features:
 * - IP reputation database with known malicious IPs
 * - Abuse score calculation (0-100)
 * - Report count tracking
 * - Geolocation-based risk assessment
 * - Reputation change history
 * - ISP risk categorization
 */

/**
 * IP reputation data structure
 */
export interface IpReputationData {
  ipAddress: string
  abuseScore: number // 0-100, higher = worse
  reportCount: number // Total abuse reports
  lastReported: Date
  isBlacklisted: boolean // Known malicious IP
  country: string
  isp: string
  reputationTrend: "improving" | "stable" | "declining" // Trend over time
  threatCategories: string[] // e.g., ["botnet", "malware", "spam"]
  riskLevel: "low" | "medium" | "high" | "critical"
  lastUpdated: Date
}

export interface IpReputationAnalysis {
  ipAddress: string
  reputation: IpReputationData
  confidenceScore: number // 0-100
  recommendations: string[]
  reputationBoost: number // Additional score to add to threat calculation (-20 to +50)
}

// ============================================================================
// REPUTATION DATA - Simulated Database
// ============================================================================

/**
 * Known malicious IP ranges (CIDR blocks)
 * In production, these would come from:
 * - AbuseIPDB API
 * - Spamhaus blocklists
 * - Custom threat intelligence feeds
 */
const KNOWN_MALICIOUS_RANGES = [
  { range: "192.168.1.0/24", category: "internal_network", riskLevel: "low" as const },
  { range: "10.0.0.0/8", category: "private_network", riskLevel: "low" as const },
  { range: "172.16.0.0/12", category: "private_network", riskLevel: "low" as const },
  { range: "203.0.113.0/24", category: "botnet_c2", riskLevel: "critical" as const },
  { range: "198.51.100.0/24", category: "malware_distribution", riskLevel: "critical" as const },
  { range: "192.0.2.0/24", category: "phishing", riskLevel: "high" as const },
]

/**
 * High-risk countries for additional reputation penalty
 * (In production, this would be Geo-IP lookup based)
 */
const HIGH_RISK_COUNTRIES = ["KP", "IR", "SY"] // North Korea, Iran, Syria

/**
 * Known malicious autonomous systems (AS numbers)
 * These ISPs have history of hosting attacks
 */
const SUSPICIOUS_ASNS = [
  { asn: "AS6128", name: "Akorn ISP", riskScore: 40 },
  { asn: "AS9002", name: "RETN ISP", riskScore: 35 },
  { asn: "AS34224", name: "Neterra ISP", riskScore: 30 },
]

/**
 * Simulated IP reputation database
 * In production, would query external APIs like AbuseIPDB, AlienVault, etc.
 */
const IP_REPUTATION_DB: Map<string, IpReputationData> = new Map([
  // Benign IPs (safe)
  [
    "8.8.8.8",
    {
      ipAddress: "8.8.8.8",
      abuseScore: 0,
      reportCount: 0,
      lastReported: new Date("2020-01-01"),
      isBlacklisted: false,
      country: "US",
      isp: "Google",
      reputationTrend: "stable",
      threatCategories: [],
      riskLevel: "low",
      lastUpdated: new Date(),
    },
  ],
  [
    "1.1.1.1",
    {
      ipAddress: "1.1.1.1",
      abuseScore: 0,
      reportCount: 0,
      lastReported: new Date("2020-01-01"),
      isBlacklisted: false,
      country: "US",
      isp: "Cloudflare",
      reputationTrend: "stable",
      threatCategories: [],
      riskLevel: "low",
      lastUpdated: new Date(),
    },
  ],
  // Medium reputation (some reports, but not critical)
  [
    "203.0.113.50",
    {
      ipAddress: "203.0.113.50",
      abuseScore: 45,
      reportCount: 12,
      lastReported: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      isBlacklisted: false,
      country: "CN",
      isp: "China ISP",
      reputationTrend: "declining",
      threatCategories: ["spam", "malware"],
      riskLevel: "medium",
      lastUpdated: new Date(),
    },
  ],
  // High reputation (suspicious)
  [
    "198.51.100.100",
    {
      ipAddress: "198.51.100.100",
      abuseScore: 78,
      reportCount: 156,
      lastReported: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isBlacklisted: true,
      country: "RU",
      isp: "Russian ISP",
      reputationTrend: "declining",
      threatCategories: ["botnet", "malware", "ddos"],
      riskLevel: "high",
      lastUpdated: new Date(),
    },
  ],
  // Critical (definitely malicious)
  [
    "192.0.2.100",
    {
      ipAddress: "192.0.2.100",
      abuseScore: 95,
      reportCount: 523,
      lastReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isBlacklisted: true,
      country: "KP",
      isp: "North Korea Network",
      reputationTrend: "declining",
      threatCategories: ["botnet", "malware", "ransomware", "ddos"],
      riskLevel: "critical",
      lastUpdated: new Date(),
    },
  ],
  // Attacker IP from logs
  [
    "192.168.1.100",
    {
      ipAddress: "192.168.1.100",
      abuseScore: 62,
      reportCount: 34,
      lastReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isBlacklisted: false,
      country: "US",
      isp: "Home ISP",
      reputationTrend: "stable",
      threatCategories: ["brute_force", "malware"],
      riskLevel: "high",
      lastUpdated: new Date(),
    },
  ],
  // Another attacker type
  [
    "10.0.0.50",
    {
      ipAddress: "10.0.0.50",
      abuseScore: 38,
      reportCount: 8,
      lastReported: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      isBlacklisted: false,
      country: "US",
      isp: "Corporate Network",
      reputationTrend: "improving",
      threatCategories: ["suspicious_activity"],
      riskLevel: "medium",
      lastUpdated: new Date(),
    },
  ],
])

// ============================================================================
// IP REPUTATION CHECKING
// ============================================================================

/**
 * Mock geolocation lookup
 * In production: MaxMind GeoIP2, IP2Location, etc.
 */
function getGeoLocation(
  ipAddress: string
): { country: string; isp: string; asn?: string } {
  // Simulate based on IP patterns
  if (ipAddress.startsWith("192.")) return { country: "US", isp: "US ISP", asn: "AS1234" }
  if (ipAddress.startsWith("203.")) return { country: "CN", isp: "China ISP", asn: "AS9002" }
  if (ipAddress.startsWith("198.")) return { country: "RU", isp: "Russian ISP", asn: "AS6128" }
  if (ipAddress.startsWith("10.")) return { country: "US", isp: "Private Network", asn: "AS65000" }
  return { country: "Unknown", isp: "Unknown", asn: "Unknown" }
}

/**
 * Check if IP falls within a CIDR range
 * Simplified version - production would use proper CIDR library
 */
function isInCidrRange(ip: string, cidr: string): boolean {
  // Simplified check - in production use IPADDR.js or similar
  const ipParts = ip.split(".").map(Number)
  const cidrParts = cidr.split("/")[0].split(".").map(Number)
  const maskBits = parseInt(cidr.split("/")[1], 10)

  const bytesToCheck = Math.ceil(maskBits / 8)
  for (let i = 0; i < bytesToCheck; i++) {
    if (ipParts[i] !== cidrParts[i]) return false
  }
  return true
}

/**
 * Get IP reputation from database or generate fresh check
 */
function getIpReputation(ipAddress: string): IpReputationData {
  // Check if in database
  if (IP_REPUTATION_DB.has(ipAddress)) {
    return IP_REPUTATION_DB.get(ipAddress)!
  }

  // Check against known malicious ranges
  for (const range of KNOWN_MALICIOUS_RANGES) {
    if (isInCidrRange(ipAddress, range.range)) {
      const reputation: IpReputationData = {
        ipAddress,
        abuseScore: range.riskLevel === "critical" ? 85 : range.riskLevel === "high" ? 65 : 20,
        reportCount: range.riskLevel === "critical" ? 200 : 10,
        lastReported: new Date(),
        isBlacklisted: range.riskLevel === "critical",
        country: "Unknown",
        isp: "Unknown ISP",
        reputationTrend: "stable",
        threatCategories: [range.category],
        riskLevel: range.riskLevel,
        lastUpdated: new Date(),
      }
      IP_REPUTATION_DB.set(ipAddress, reputation)
      return reputation
    }
  }

  // Generate new reputation data based on patterns and geolocation
  const geo = getGeoLocation(ipAddress)
  const baseScore = HIGH_RISK_COUNTRIES.includes(geo.country) ? 30 : 5

  const reputation: IpReputationData = {
    ipAddress,
    abuseScore: baseScore,
    reportCount: baseScore > 20 ? Math.floor(Math.random() * 50) : Math.floor(Math.random() * 5),
    lastReported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    isBlacklisted: baseScore > 70,
    country: geo.country,
    isp: geo.isp,
    reputationTrend: baseScore > 50 ? "declining" : "stable",
    threatCategories: baseScore > 40 ? ["suspicious"] : [],
    riskLevel: baseScore > 70 ? "critical" : baseScore > 50 ? "high" : baseScore > 25 ? "medium" : "low",
    lastUpdated: new Date(),
  }

  IP_REPUTATION_DB.set(ipAddress, reputation)
  return reputation
}

/**
 * Calculate reputation boost to threat score
 * Positive = increases threat score
 * Negative = decreases threat score
 *
 * Score range: -20 (very trusted) to +50 (definitely malicious)
 */
function calculateReputationBoost(reputation: IpReputationData): number {
  let boost = 0

  // Abuse score contribution (0-40 points)
  boost += (reputation.abuseScore / 100) * 40

  // Recent reports are worse (0-10 points)
  const daysSinceReport = (Date.now() - reputation.lastReported.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceReport < 7) boost += 10 // Very recent
  else if (daysSinceReport < 30) boost += 5
  else if (daysSinceReport < 90) boost += 2

  // Blacklist status (instant +20)
  if (reputation.isBlacklisted) boost += 20

  // Report count (older reports matter less)
  const reportWeight = Math.min(reputation.reportCount / 100, 1) // Cap at 1.0
  boost += reportWeight * 10 // 0-10 points

  // High-risk countries get penalty (+10)
  if (HIGH_RISK_COUNTRIES.includes(reputation.country)) boost += 10

  // Trend analysis (capped at ±10)
  if (reputation.reputationTrend === "declining") boost += 8
  else if (reputation.reputationTrend === "improving") boost -= 5

  // Cap the final boost
  return Math.max(-20, Math.min(50, boost))
}

/**
 * Analyze a single IP address for reputation
 * Returns detailed reputation analysis with recommendations
 */
export function analyzeIpReputation(ipAddress: string): IpReputationAnalysis {
  const reputation = getIpReputation(ipAddress)
  const reputationBoost = calculateReputationBoost(reputation)

  // Calculate confidence score (0-100)
  let confidence = 50 // Base confidence
  confidence += Math.min(reputation.reportCount * 0.5, 30) // More reports = higher confidence
  confidence = Math.min(confidence, 100) // Cap at 100

  // Generate recommendations
  const recommendations: string[] = []

  if (reputation.isBlacklisted) {
    recommendations.push(`🚨 CRITICAL: IP is blacklisted - Add to firewall blocklist immediately`)
  }

  if (reputation.riskLevel === "critical") {
    recommendations.push(`Block source IP range on firewall or WAF`)
    recommendations.push(`Enable geo-blocking for ${reputation.country} if not needed`)
  } else if (reputation.riskLevel === "high") {
    recommendations.push(`Add IP to watchlist - Monitor for escalation`)
    recommendations.push(`Implement rate limiting for requests from this IP`)
  } else if (reputation.riskLevel === "medium") {
    recommendations.push(`Monitor requests from this IP closely`)
  }

  if (reputation.threatCategories.includes("botnet")) {
    recommendations.push(`Potential C2 (Command & Control) communication - Check outbound connections`)
  }
  if (reputation.threatCategories.includes("malware")) {
    recommendations.push(`IP has distributed malware - Scan systems for infections`)
  }
  if (reputation.threatCategories.includes("ddos")) {
    recommendations.push(`Enable DDoS protection - This IP participated in previous attacks`)
  }

  if (reputation.reputationTrend === "declining") {
    recommendations.push(`⚠️ Reputation declining - Increase monitoring sensitivity`)
  }

  if (reputation.reportCount === 0) {
    recommendations.push(`✅ No abuse reports on record - Likely safe IP`)
  }

  return {
    ipAddress,
    reputation,
    confidenceScore: confidence,
    recommendations,
    reputationBoost,
  }
}

/**
 * Batch analyze multiple IPs for reputation
 */
export function analyzeMultipleIps(ipAddresses: string[]): Map<string, IpReputationAnalysis> {
  const results = new Map<string, IpReputationAnalysis>()
  const uniqueIps = [...new Set(ipAddresses)]

  uniqueIps.forEach((ip) => {
    results.set(ip, analyzeIpReputation(ip))
  })

  return results
}

/**
 * Get reputation summary statistics
 */
export function getReputationStats(analyses: Map<string, IpReputationAnalysis>) {
  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0
  let totalReputationBoost = 0
  const threatCategories = new Set<string>()

  analyses.forEach((analysis) => {
    const level = analysis.reputation.riskLevel
    if (level === "critical") criticalCount++
    else if (level === "high") highCount++
    else if (level === "medium") mediumCount++
    else lowCount++

    totalReputationBoost += analysis.reputationBoost
    analysis.reputation.threatCategories.forEach((cat) => threatCategories.add(cat))
  })

  return {
    totalIps: analyses.size,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    averageReputationBoost: analyses.size > 0 ? totalReputationBoost / analyses.size : 0,
    threatCategories: Array.from(threatCategories),
  }
}

/**
 * Format reputation data for display
 */
export function formatReputationForDisplay(analysis: IpReputationAnalysis): string {
  const rep = analysis.reputation
  return `IP: ${rep.ipAddress} | Score: ${rep.abuseScore}/100 | Reports: ${rep.reportCount} | Risk: ${rep.riskLevel.toUpperCase()} | Status: ${rep.isBlacklisted ? "🔴 BLACKLISTED" : "🟢 OK"}`
}
