import { prisma } from "../lib/prisma"
import { hashPassword } from "../lib/auth"
import { analyzeUserLogs } from "../lib/threat-algorithm"
import { analyzeIpReputation } from "../lib/ip-reputation-check"

async function main() {
  // Check if demo user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@securelogti.com" },
  })

  if (!existingUser) {
    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: "demo@securelogti.com",
        name: "Demo User",
        passwordHash: hashPassword("demo123"),
        createdAt: new Date("2025-01-01"),
        lastLogin: new Date(),
      },
    })

    // Add sample logs
    const sampleLogs = [
      {
        userId: demoUser.id,
        timestamp: new Date("2025-01-16T10:30:00"),
        sourceIp: "192.168.1.100",
        logType: "auth" as const,
        message: "Failed password for admin from 192.168.1.100 port 22 ssh2",
        severity: "warning" as const,
        rawLog: "Jan 16 10:30:00 server sshd[1234]: Failed password for admin from 192.168.1.100 port 22 ssh2",
        parsedAt: new Date(),
      },
      {
        userId: demoUser.id,
        timestamp: new Date("2025-01-16T10:31:00"),
        sourceIp: "192.168.1.100",
        logType: "auth" as const,
        message: "Failed password for root from 192.168.1.100 port 22 ssh2",
        severity: "error" as const,
        rawLog: "Jan 16 10:31:00 server sshd[1235]: Failed password for root from 192.168.1.100 port 22 ssh2",
        parsedAt: new Date(),
      },
      {
        userId: demoUser.id,
        timestamp: new Date("2025-01-16T10:32:00"),
        sourceIp: "192.168.1.100",
        logType: "auth" as const,
        message: "Invalid user guest from 192.168.1.100 port 22",
        severity: "warning" as const,
        rawLog: "Jan 16 10:32:00 server sshd[1236]: Invalid user guest from 192.168.1.100 port 22",
        parsedAt: new Date(),
      },
      {
        userId: demoUser.id,
        timestamp: new Date("2025-01-16T10:35:00"),
        sourceIp: "203.0.113.45",
        logType: "application" as const,
        message: "GET /api/users?id=' OR '1'='1 HTTP/1.1 401",
        severity: "critical" as const,
        rawLog: "203.0.113.45 - - [16/Jan/2025:10:35:00] GET /api/users?id=' OR '1'='1 HTTP/1.1 401",
        parsedAt: new Date(),
      },
      {
        userId: demoUser.id,
        timestamp: new Date("2025-01-16T10:36:00"),
        sourceIp: "203.0.113.45",
        logType: "application" as const,
        message: "POST /api/login - UNION SELECT * FROM users",
        severity: "critical" as const,
        rawLog: "203.0.113.45 - - [16/Jan/2025:10:36:00] POST /api/login - UNION SELECT * FROM users",
        parsedAt: new Date(),
      },
    ]

    const createdLogs = await prisma.logEntry.createMany({
      data: sampleLogs,
    })

    // Analyze logs for threats
    const logsToAnalyze = sampleLogs.map((log, idx) => ({
      id: `seed-log-${idx}`,
      ...log,
    }))

    const threats = analyzeUserLogs(logsToAnalyze as any, demoUser.id)

    // Store threats in database
    for (const threat of threats) {
      const ipRepCheck = analyzeIpReputation(threat.ipAddress)
      await prisma.threatIntelligence.create({
        data: {
          userId: demoUser.id,
          ipAddress: threat.ipAddress,
          threatScore: threat.threatScore,
          threatLevel: threat.threatLevel,
          lastSeen: threat.lastSeen,
          status: threat.status,
          failedLogins: threat.failedLogins,
          repeatedAccess: threat.repeatedAccess,
          description: threat.description,
          detectedAttackTypes: JSON.stringify(threat.detectedAttackTypes || []),
          totalSuspiciousEvents: threat.totalSuspiciousEvents || null,
          suspicious: threat.suspicious || null,
          enrichment: JSON.stringify(ipRepCheck.reputation || {}),
          algorithmReasoning: threat.algorithmReasoning || null,
          detectionMethods: JSON.stringify(threat.detectionMethods || []),
          confidenceScore: threat.confidenceScore || null,
          riskFactors: JSON.stringify(threat.riskFactors || []),
          recommendations: JSON.stringify(threat.recommendations || []),
        },
      })

      // Create corresponding alerts
      await prisma.securityAlert.create({
        data: {
          userId: demoUser.id,
          alertType: threat.detectedAttackTypes?.[0] || "suspicious_activity",
          severity: threat.threatLevel,
          title: `Detected ${threat.detectedAttackTypes?.[0] || "Suspicious Activity"} from ${threat.ipAddress}`,
          description: threat.description,
          sourceIp: threat.ipAddress,
          timestamp: threat.lastSeen,
          detectedAt: new Date(),
          status: "open",
          indicators: JSON.stringify(threat.detectedAttackTypes || []),
          recommendation: threat.recommendations?.[0] || "Monitor this IP address for further suspicious activity",
        },
      })
    }

    console.log("✅ Demo user, sample logs, and threat analysis created successfully")
  } else {
    console.log("✅ Demo user already exists")
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
