-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "logType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "rawLog" TEXT,
    "parsedAt" DATETIME NOT NULL,
    CONSTRAINT "LogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThreatIntelligence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "threatScore" INTEGER NOT NULL,
    "threatLevel" TEXT NOT NULL,
    "lastSeen" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "failedLogins" INTEGER NOT NULL,
    "repeatedAccess" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "detectedAttackTypes" TEXT NOT NULL DEFAULT '[]',
    "totalSuspiciousEvents" INTEGER,
    "suspicious" BOOLEAN,
    "enrichment" TEXT,
    "algorithmReasoning" TEXT,
    "detectionMethods" TEXT NOT NULL DEFAULT '[]',
    "confidenceScore" INTEGER,
    "riskFactors" TEXT,
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "ThreatIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "detectedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "threatId" TEXT,
    "indicators" TEXT,
    "recommendation" TEXT,
    CONSTRAINT "SecurityAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
