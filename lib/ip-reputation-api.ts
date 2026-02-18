/**
 * SecureLogTI - Real IP Reputation API Integration
 * Connects to actual threat intelligence services
 *
 * Supported Services:
 * - AbuseIPDB (Primary - free tier available)
 * - Fallback to local cache when API unavailable
 *
 * Setup:
 * 1. Get free API key from https://www.abuseipdb.com/
 * 2. Add to .env.local: NEXT_PUBLIC_ABUSEIPDB_API_KEY=your_key
 * 3. System will automatically use real data
 */

import type { IpReputationData } from "./ip-reputation-check"

/**
 * Re-export IpReputationData for convenience
 */
export type { IpReputationData }
interface AbuseIPDBResponse {
  data: {
    ipAddress: string
    abuseConfidenceScore: number
    countryCode: string
    usageType: string
    isp: string
    domain: string
    hostnames: string[] | null
    totalReports: number
    numDistinctUsers: number
    lastReportedAt: string | null
    isWhitelisted: boolean
    reports?: Array<{
      reportedAt: string
      comment: string
      reporterCountryCode: string
      abuseCategory: number[]
    }>
  }
  errors?: Array<{
    detail: string
    status: number
  }>
}

/**
 * Cache implementation for API responses
 * Prevents excessive API calls and respects rate limits
 */
class IpReputationCache {
  private cache: Map<string, { data: IpReputationData; timestamp: number }>
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    this.cache = new Map()
  }

  get(ip: string): IpReputationData | null {
    const cached = this.cache.get(ip)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(ip)
      return null
    }

    return cached.data
  }

  set(ip: string, data: IpReputationData): void {
    this.cache.set(ip, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Global cache instance
const reputationCache = new IpReputationCache()

/**
 * Map AbuseIPDB categories to threat categories
 */
function mapAbuseCategoriestoThreatCategories(
  categories: number[],
  abuseScore: number
): string[] {
  const categoryMap: Record<number, string> = {
    2: "ddos",
    3: "spam",
    4: "malware",
    5: "phishing",
    6: "botnets",
    7: "exploit",
    8: "brute_force",
    9: "bad_reputation",
    10: "open_proxy",
    11: "web_spam",
    12: "email_spam",
    13: "fraud",
    14: "scanner",
    15: "denial_abuse",
    16: "ftp_abuse",
    17: "privilege_escalation",
    18: "sql_injection",
    19: "ssh_abuse",
    20: "vulnerability",
  }

  const mapped = categories.map((cat) => categoryMap[cat] || `category_${cat}`).filter(Boolean)
  if (mapped.length === 0 && abuseScore > 50) {
    mapped.push("suspicious")
  }
  return mapped
}

/**
 * Convert AbuseIPDB response to our IpReputationData format
 */
function convertAbuseIPDBResponse(response: AbuseIPDBResponse): IpReputationData {
  const data = response.data

  // Determine risk level based on abuse score
  let riskLevel: "low" | "medium" | "high" | "critical"
  if (data.abuseConfidenceScore >= 75) {
    riskLevel = "critical"
  } else if (data.abuseConfidenceScore >= 50) {
    riskLevel = "high"
  } else if (data.abuseConfidenceScore >= 25) {
    riskLevel = "medium"
  } else {
    riskLevel = "low"
  }

  // Determine reputation trend (simplified - would need multiple data points in production)
  let reputationTrend: "improving" | "stable" | "declining" = "stable"
  if (data.totalReports > 100) {
    reputationTrend = "declining"
  } else if (data.totalReports > 50) {
    reputationTrend = "stable"
  } else if (data.totalReports > 0 && data.totalReports < 5) {
    reputationTrend = "improving"
  }

  // Extract abuse categories from reports
  let threatCategories: string[] = []
  if (data.reports && data.reports.length > 0) {
    const allCategories = new Set<number>()
    data.reports.forEach((report) => {
      report.abuseCategory.forEach((cat) => allCategories.add(cat))
    })
    threatCategories = mapAbuseCategoriestoThreatCategories(
      Array.from(allCategories),
      data.abuseConfidenceScore
    )
  }

  return {
    ipAddress: data.ipAddress,
    abuseScore: data.abuseConfidenceScore,
    reportCount: data.totalReports,
    lastReported: data.lastReportedAt ? new Date(data.lastReportedAt) : new Date(0),
    isBlacklisted: data.abuseConfidenceScore >= 75 || data.isWhitelisted === false,
    country: data.countryCode || "Unknown",
    isp: data.isp || data.domain || "Unknown ISP",
    reputationTrend,
    threatCategories,
    riskLevel,
    lastUpdated: new Date(),
  }
}

/**
 * Check IP reputation using AbuseIPDB API
 * Requires: NEXT_PUBLIC_ABUSEIPDB_API_KEY environment variable
 *
 * Free tier: 1000 requests per day
 * Premium: More requests
 */
export async function checkIpReputationFromAPI(ipAddress: string): Promise<IpReputationData | null> {
  // Check cache first
  const cached = reputationCache.get(ipAddress)
  if (cached) {
    console.log(`[IP Reputation] Cache hit for ${ipAddress}`)
    return cached
  }

  // Get API key
  const apiKey = process.env.NEXT_PUBLIC_ABUSEIPDB_API_KEY || process.env.ABUSEIPDB_API_KEY
  if (!apiKey) {
    console.warn("[IP Reputation] AbuseIPDB API key not configured")
    return null
  }

  try {
    console.log(`[IP Reputation] Checking ${ipAddress} against AbuseIPDB...`)

    const response = await fetch("https://api.abuseipdb.com/api/v2/check", {
      method: "POST",
      headers: {
        Key: apiKey,
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        ipAddress,
        maxAgeInDays: "90", // Consider reports from last 90 days
      }).toString(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.error("[IP Reputation] Invalid AbuseIPDB API key")
      } else if (response.status === 429) {
        console.warn("[IP Reputation] Rate limit exceeded - daily quota reached")
      } else {
        console.error(`[IP Reputation] API error: ${response.status} ${response.statusText}`)
      }
      return null
    }

    const data: AbuseIPDBResponse = await response.json()

    if (data.errors && data.errors.length > 0) {
      console.error("[IP Reputation] API returned error:", data.errors[0].detail)
      return null
    }

    const reputationData = convertAbuseIPDBResponse(data)
    reputationCache.set(ipAddress, reputationData)

    console.log(`[IP Reputation] ${ipAddress} - Score: ${reputationData.abuseScore}, Reports: ${reputationData.reportCount}`)
    return reputationData
  } catch (error) {
    console.error("[IP Reputation] Failed to check API:", error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Batch check multiple IPs
 * Respects rate limiting - processes with delays
 */
export async function checkMultipleIpsFromAPI(
  ips: string[],
  delayBetweenRequests = 1000 // 1 second between requests to avoid rate limiting
): Promise<Map<string, IpReputationData>> {
  const results = new Map<string, IpReputationData>()
  const uniqueIps = [...new Set(ips)]

  for (const ip of uniqueIps) {
    const data = await checkIpReputationFromAPI(ip)
    if (data) {
      results.set(ip, data)
    }

    // Rate limiting delay (skip last IP)
    if (ip !== uniqueIps[uniqueIps.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests))
    }
  }

  return results
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cachedIps: reputationCache.size(),
    cacheTtlHours: 24,
  }
}

/**
 * Clear all cached data
 */
export function clearReputationCache() {
  reputationCache.clear()
}

/**
 * Test API connectivity
 */
export async function testAbuseIPDBConnection(): Promise<{
  connected: boolean
  message: string
  quotaRemaining?: number
}> {
  const apiKey = process.env.NEXT_PUBLIC_ABUSEIPDB_API_KEY || process.env.ABUSEIPDB_API_KEY
  if (!apiKey) {
    return {
      connected: false,
      message: "AbuseIPDB API key not configured. Add ABUSEIPDB_API_KEY to .env.local",
    }
  }

  try {
    const response = await fetch("https://api.abuseipdb.com/api/v2/check", {
      method: "POST",
      headers: {
        Key: apiKey,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        ipAddress: "8.8.8.8", // Google DNS - always safe to check
        maxAgeInDays: "90",
      }).toString(),
    })

    if (response.ok) {
      const remaining = response.headers.get("X-RateLimit-Remaining")
      return {
        connected: true,
        message: "✅ Successfully connected to AbuseIPDB API",
        quotaRemaining: remaining ? parseInt(remaining, 10) : undefined,
      }
    } else if (response.status === 401) {
      return {
        connected: false,
        message: "❌ Invalid API key. Check ABUSEIPDB_API_KEY in .env.local",
      }
    } else if (response.status === 429) {
      return {
        connected: false,
        message: "⚠️ Rate limit exceeded. Try again after reset (usually 24 hours)",
      }
    } else {
      return {
        connected: false,
        message: `❌ API returned status ${response.status}`,
      }
    }
  } catch (error) {
    return {
      connected: false,
      message: `❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Get AbuseIPDB account details (if available)
 * Shows quota usage
 */
export async function getAbuseIPDBAccountInfo(): Promise<{
  available: boolean
  message: string
  usage?: {
    requests_today: number
    max_daily_requests: number
  }
}> {
  const apiKey = process.env.NEXT_PUBLIC_ABUSEIPDB_API_KEY || process.env.ABUSEIPDB_API_KEY
  if (!apiKey) {
    return {
      available: false,
      message: "API key not configured",
    }
  }

  try {
    const response = await fetch("https://api.abuseipdb.com/api/v2/account-info", {
      method: "GET",
      headers: {
        Key: apiKey,
        Accept: "application/json",
      },
    })

    if (response.ok) {
      return {
        available: true,
        message: "Account info retrieved",
      }
    }

    return {
      available: false,
      message: "Could not retrieve account info",
    }
  } catch (error) {
    return {
      available: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}
