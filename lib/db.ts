import type {
  AlertStatus,
  AttacksByDay,
  DashboardStats,
  LogEntry,
  SecurityAlert,
  ThreatIntelligence,
  TopAttackingIP,
  User,
} from "./types"
import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import { analyzeUserLogs } from "./threat-algorithm"
import { analyzeIpReputation } from "./ip-reputation-check"
import { generateApiKey, hashApiKey } from "./api-keys"

const ALERT_TYPE_MAP: Record<string, { type: string; severity: string }> = {
  ssh_bruteforce: { type: "brute_force", severity: "high" },
  web_bruteforce: { type: "brute_force", severity: "high" },
  sql_injection: { type: "sql_injection", severity: "critical" },
  malware_suspicious_activity: { type: "malware", severity: "critical" },
  ddos_attack: { type: "ddos_attack", severity: "critical" },
}

function mapDbUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }
}

function mapDbLogEntry(entry: any): LogEntry {
  return {
    id: entry.id,
    userId: entry.userId,
    timestamp: new Date(entry.timestamp),
    sourceIp: entry.sourceIp,
    logType: entry.logType,
    message: entry.message,
    severity: entry.severity,
    rawLog: entry.rawLog ?? undefined,
    parsedAt: new Date(entry.parsedAt),
  }
}

function mapDbThreat(entry: any): ThreatIntelligence {
  return {
    id: entry.id,
    userId: entry.userId,
    ipAddress: entry.ipAddress,
    threatScore: entry.threatScore,
    threatLevel: entry.threatLevel as ThreatIntelligence["threatLevel"],
    lastSeen: new Date(entry.lastSeen),
    status: entry.status as ThreatIntelligence["status"],
    failedLogins: entry.failedLogins,
    repeatedAccess: entry.repeatedAccess,
    description: entry.description,
    detectedAttackTypes: entry.detectedAttackTypes ? JSON.parse(entry.detectedAttackTypes) : [],
    totalSuspiciousEvents: entry.totalSuspiciousEvents ?? undefined,
    suspicious: entry.suspicious ?? undefined,
    enrichment: entry.enrichment ? JSON.parse(entry.enrichment) : undefined,
    algorithmReasoning: entry.algorithmReasoning ?? undefined,
    detectionMethods: entry.detectionMethods ? JSON.parse(entry.detectionMethods) : [],
    confidenceScore: entry.confidenceScore ?? undefined,
    riskFactors: entry.riskFactors ? JSON.parse(entry.riskFactors) : undefined,
    recommendations: entry.recommendations ? JSON.parse(entry.recommendations) : [],
  }
}

function mapDbAlert(entry: any): SecurityAlert {
  return {
    id: entry.id,
    userId: entry.userId,
    alertType: entry.alertType as SecurityAlert["alertType"],
    severity: entry.severity as SecurityAlert["severity"],
    title: entry.title,
    description: entry.description,
    sourceIp: entry.sourceIp,
    timestamp: new Date(entry.timestamp),
    detectedAt: new Date(entry.detectedAt),
    status: entry.status as AlertStatus,
    threatId: entry.threatId ?? undefined,
    indicators: entry.indicators ? JSON.parse(entry.indicators) : undefined,
    recommendation: entry.recommendation ?? undefined,
  }
}

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error("User not found")
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  })
  return user ? mapDbUser(user) : null
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  })
  return user ? mapDbUser(user) : null
}

export async function createUser(input: {
  name: string
  email: string
  passwordHash: string
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      createdAt: new Date(),
      lastLogin: new Date(),
    },
  })
  return mapDbUser(user)
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  })
}

// ---------------------------------------------------------------------------
// API keys (device authentication for log ingestion)
// ---------------------------------------------------------------------------

export interface ApiKeySummary {
  id: string
  name: string
  prefix: string
  createdAt: Date
  lastUsedAt: Date | null
  revoked: boolean
}

function mapApiKey(entry: any): ApiKeySummary {
  return {
    id: entry.id,
    name: entry.name,
    prefix: entry.prefix,
    createdAt: new Date(entry.createdAt),
    lastUsedAt: entry.lastUsedAt ? new Date(entry.lastUsedAt) : null,
    revoked: entry.revoked,
  }
}

export async function listApiKeys(userId: string): Promise<ApiKeySummary[]> {
  await ensureUserExists(userId)
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return keys.map(mapApiKey)
}

/**
 * Create a new API key. Returns the summary plus the one-time plaintext key
 * (the only moment it is ever available).
 */
export async function createApiKey(
  userId: string,
  name: string,
): Promise<ApiKeySummary & { plaintext: string }> {
  await ensureUserExists(userId)
  const generated = generateApiKey()
  const created = await prisma.apiKey.create({
    data: {
      userId,
      name: name.trim() || "Unnamed device",
      keyHash: generated.keyHash,
      prefix: generated.prefix,
    },
  })
  return { ...mapApiKey(created), plaintext: generated.plaintext }
}

export async function revokeApiKey(userId: string, keyId: string): Promise<boolean> {
  await ensureUserExists(userId)
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, userId },
    data: { revoked: true },
  })
  return result.count > 0
}

/**
 * Resolve a plaintext API key to its owner. Returns the userId on success and
 * records the last-used timestamp. Revoked or unknown keys return null.
 */
export async function resolveApiKey(plaintext: string): Promise<string | null> {
  const keyHash = hashApiKey(plaintext)
  const key = await prisma.apiKey.findUnique({ where: { keyHash } })
  if (!key || key.revoked) {
    return null
  }
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  })
  return key.userId
}

export async function getUserLogs(userId: string): Promise<LogEntry[]> {
  await ensureUserExists(userId)
  const logs = await prisma.logEntry.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  })
  return logs.map(mapDbLogEntry)
}

export async function addUserLogs(
  userId: string,
  newLogs: Omit<LogEntry, "id" | "userId" | "parsedAt">[],
): Promise<LogEntry[]> {
  await ensureUserExists(userId)
  const createdLogs = await Promise.all(
    newLogs.map((log) =>
      prisma.logEntry.create({
        data: {
          userId,
          timestamp: new Date(log.timestamp),
          sourceIp: log.sourceIp,
          logType: log.logType,
          message: log.message,
          severity: log.severity,
          rawLog: log.rawLog ?? null,
          parsedAt: new Date(),
        },
      }),
    ),
  )

  await analyzeLogsForThreats(userId)
  return createdLogs.map(mapDbLogEntry)
}

export async function deleteUserLog(userId: string, logId: string): Promise<boolean> {
  await ensureUserExists(userId)
  const result = await prisma.logEntry.deleteMany({
    where: {
      id: logId,
      userId,
    },
  })

  if (result.count > 0) {
    await analyzeLogsForThreats(userId)
    return true
  }

  return false
}

export async function clearUserLogs(userId: string): Promise<void> {
  await ensureUserExists(userId)
  await prisma.$transaction([
    prisma.logEntry.deleteMany({ where: { userId } }),
    prisma.threatIntelligence.deleteMany({ where: { userId } }),
    prisma.securityAlert.deleteMany({ where: { userId } }),
  ])
}

export async function getUserThreats(userId: string): Promise<ThreatIntelligence[]> {
  await ensureUserExists(userId)
  const threats = await prisma.threatIntelligence.findMany({
    where: { userId },
    orderBy: { lastSeen: "desc" },
  })
  return threats.map(mapDbThreat)
}

export async function updateThreatStatus(
  userId: string,
  threatId: string,
  status: ThreatIntelligence["status"],
): Promise<boolean> {
  await ensureUserExists(userId)
  const threat = await prisma.threatIntelligence.updateMany({
    where: { id: threatId, userId },
    data: { status },
  })
  return threat.count > 0
}

export async function getUserAlerts(userId: string): Promise<SecurityAlert[]> {
  await ensureUserExists(userId)
  const alerts = await prisma.securityAlert.findMany({
    where: { userId },
    orderBy: { detectedAt: "desc" },
  })
  return alerts.map(mapDbAlert)
}

export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: SecurityAlert["status"],
): Promise<boolean> {
  await ensureUserExists(userId)
  const alert = await prisma.securityAlert.updateMany({
    where: { id: alertId, userId },
    data: { status },
  })
  return alert.count > 0
}

export async function getUserStats(userId: string): Promise<DashboardStats> {
  await ensureUserExists(userId)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [totalLogs, logsThisWeek, activeHighRisk, suspiciousThreats] = await Promise.all([
    prisma.logEntry.count({ where: { userId } }),
    prisma.logEntry.count({ where: { userId, timestamp: { gte: oneWeekAgo } } }),
    prisma.threatIntelligence.count({
      where: { userId, threatLevel: "high", status: "active" },
    }),
    prisma.threatIntelligence.findMany({
      where: { userId, threatScore: { gte: 40 } },
      select: { ipAddress: true },
    }),
  ])

  return {
    totalLogs,
    suspiciousIps: new Set(suspiciousThreats.map((t) => t.ipAddress)).size,
    highRiskThreats: activeHighRisk,
    logsThisWeek,
  }
}

export async function getUserAttacksByDay(userId: string): Promise<AttacksByDay[]> {
  await ensureUserExists(userId)
  const logs = await prisma.logEntry.findMany({
    where: {
      userId,
      severity: {
        in: ["warning", "error", "critical"],
      },
    },
    orderBy: { timestamp: "asc" },
  })

  const byDay = new Map<string, number>()
  logs.forEach((log) => {
    const date = log.timestamp.toISOString().split("T")[0]
    byDay.set(date, (byDay.get(date) || 0) + 1)
  })

  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
}

export async function getUserTopAttackingIPs(userId: string): Promise<TopAttackingIP[]> {
  await ensureUserExists(userId)
  const threats = await prisma.threatIntelligence.findMany({
    where: { userId, status: "active" },
    orderBy: { threatScore: "desc" },
    take: 5,
  })

  return threats.map((threat) => ({
    ipAddress: threat.ipAddress,
    attackCount: threat.failedLogins + threat.repeatedAccess,
    threatLevel: threat.threatLevel as TopAttackingIP["threatLevel"],
  }))
}

async function analyzeLogsForThreats(userId: string): Promise<void> {
  const userLogs = await getUserLogs(userId)
  const analyzed = analyzeUserLogs(userLogs, userId)

  const enrichedThreats = analyzed.map((threat) => ({
    ...threat,
    enrichment: analyzeIpReputation(threat.ipAddress).reputation,
    detectedAttackTypes: threat.detectedAttackTypes ?? [],
    detectionMethods: threat.detectionMethods ?? [],
    recommendations: threat.recommendations ?? [],
  }))

  const existingThreats = await prisma.threatIntelligence.findMany({ where: { userId } })
  const incomingIds = new Set(enrichedThreats.map((t) => t.id))
  const removedIds = existingThreats.filter((t) => !incomingIds.has(t.id)).map((t) => t.id)

  const operations: Prisma.PrismaPromise<unknown>[] = enrichedThreats.map((threat) =>
    prisma.threatIntelligence.upsert({
      where: { id: threat.id },
      create: {
        id: threat.id,
        userId,
        ipAddress: threat.ipAddress,
        threatScore: threat.threatScore,
        threatLevel: threat.threatLevel,
        lastSeen: threat.lastSeen,
        status: threat.status,
        failedLogins: threat.failedLogins,
        repeatedAccess: threat.repeatedAccess,
        description: threat.description,
        detectedAttackTypes: JSON.stringify(threat.detectedAttackTypes),
        totalSuspiciousEvents: threat.totalSuspiciousEvents ?? null,
        suspicious: threat.suspicious ?? null,
        enrichment: threat.enrichment ? JSON.stringify(threat.enrichment) : null,
        algorithmReasoning: threat.algorithmReasoning ?? null,
        detectionMethods: JSON.stringify(threat.detectionMethods),
        confidenceScore: threat.confidenceScore ?? null,
        riskFactors: threat.riskFactors ? JSON.stringify(threat.riskFactors) : null,
        recommendations: JSON.stringify(threat.recommendations),
      },
      update: {
        ipAddress: threat.ipAddress,
        threatScore: threat.threatScore,
        threatLevel: threat.threatLevel,
        lastSeen: threat.lastSeen,
        status: threat.status,
        failedLogins: threat.failedLogins,
        repeatedAccess: threat.repeatedAccess,
        description: threat.description,
        detectedAttackTypes: JSON.stringify(threat.detectedAttackTypes),
        totalSuspiciousEvents: threat.totalSuspiciousEvents ?? null,
        suspicious: threat.suspicious ?? null,
        enrichment: threat.enrichment ? JSON.stringify(threat.enrichment) : null,
        algorithmReasoning: threat.algorithmReasoning ?? null,
        detectionMethods: JSON.stringify(threat.detectionMethods),
        confidenceScore: threat.confidenceScore ?? null,
        riskFactors: threat.riskFactors ? JSON.stringify(threat.riskFactors) : null,
        recommendations: JSON.stringify(threat.recommendations),
      },
    }),
  )

  if (removedIds.length) {
    operations.unshift(
      prisma.threatIntelligence.deleteMany({
        where: {
          id: { in: removedIds },
        },
      }),
    )
  }

  await prisma.$transaction(operations)
  await generateAlertsFromThreats(userId)
}

function buildAlertFromThreat(userId: string, threat: ThreatIntelligence, attackType: string) {
  const config = ALERT_TYPE_MAP[attackType] || { type: "suspicious_activity", severity: "medium" }

  return {
    userId,
    alertType: config.type,
    severity: config.severity,
    title: `${attackType.replace(/_/g, " ").toUpperCase()} Attack Detected`,
    description: threat.description,
    sourceIp: threat.ipAddress,
    timestamp: threat.lastSeen,
    detectedAt: new Date(),
    status: "new" as const,
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

async function generateAlertsFromThreats(userId: string): Promise<void> {
  const threats = await getUserThreats(userId)
  const existingAlerts = await prisma.securityAlert.findMany({ where: { userId } })

  const newAlerts: Array<Promise<void>> = []

  for (const threat of threats) {
    if (!threat.detectedAttackTypes || threat.detectedAttackTypes.length === 0) {
      continue
    }

    for (const attackType of threat.detectedAttackTypes) {
      const config = ALERT_TYPE_MAP[attackType] || { type: "suspicious_activity", severity: "medium" }
      const alreadyExists = existingAlerts.some(
        (alert) => alert.threatId === threat.id && alert.alertType === config.type && alert.status === "new",
      )

      if (!alreadyExists) {
        const alert = buildAlertFromThreat(userId, threat, attackType)
        newAlerts.push(
          prisma.securityAlert
            .create({
              data: {
                ...alert,
                indicators: alert.indicators ? JSON.stringify(alert.indicators) : null,
              },
            })
            .then(() => {}),
        )
      }
    }
  }

  await Promise.all(newAlerts)
}
