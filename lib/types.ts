/**
 * SecureLogTI - Type Definitions
 * Core types for the self-service log analysis platform
 *
 * This is a user-centric platform where each user manages their own logs
 * and threat analysis data in isolation.
 */

// User type for authentication (simplified - no roles)
export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
  lastLogin: Date
}

// Log entry type - now includes userId for data isolation
export type LogType = "auth" | "system" | "firewall" | "application" | "network"

export interface LogEntry {
  id: string
  userId: string // Added userId for data isolation
  timestamp: Date
  sourceIp: string
  logType: LogType
  message: string
  severity: "info" | "warning" | "error" | "critical"
  rawLog?: string // Store original raw log line
  parsedAt: Date // When the log was parsed/added
}

// Threat intelligence types - now includes userId
export type ThreatLevel = "low" | "medium" | "high"
export type ThreatStatus = "active" | "resolved" | "false_positive"

export interface ThreatIntelligence {
  id: string
  userId: string // Added userId for data isolation
  ipAddress: string
  threatScore: number
  threatLevel: ThreatLevel
  lastSeen: Date
  status: ThreatStatus
  failedLogins: number
  repeatedAccess: number
  description: string
  detectedAttackTypes?: string[]
  totalSuspiciousEvents?: number
  suspicious?: boolean
  enrichment?: {
    country?: string
    isp?: string
    abuseScore?: number
    reportCount?: number
    lastReported?: Date
  }
  // NEW: Algorithm explanation fields
  algorithmReasoning?: string // Human-readable explanation of threat detection
  detectionMethods?: string[] // Which algorithms detected this threat
  confidenceScore?: number // 0-100 confidence in detection
  riskFactors?: Array<{
    method: string
    confidence: number
    description: string
  }>
  recommendations?: string[] // Actionable security recommendations
}

// Alert types - specific alerts for detected attacks
export type AlertType = "brute_force" | "sql_injection" | "malware" | "ddos_attack" | "suspicious_activity"
export type AlertStatus = "new" | "acknowledged" | "resolved"

export interface SecurityAlert {
  id: string
  userId: string
  alertType: AlertType
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  sourceIp: string
  timestamp: Date
  detectedAt: Date
  status: AlertStatus
  threatId?: string // Reference to the threat that triggered this alert
  indicators?: Record<string, any>
  recommendation?: string
}

// Dashboard statistics - per user
export interface DashboardStats {
  totalLogs: number
  suspiciousIps: number
  highRiskThreats: number
  logsThisWeek: number // Added for user dashboard
}

// Security event for recent events table
export interface SecurityEvent {
  id: string
  userId: string // Added userId
  timestamp: Date
  eventType: string
  sourceIp: string
  description: string
  severity: "info" | "warning" | "error" | "critical"
}

// Report data types
export interface AttacksByDay {
  date: string
  count: number
}

export interface TopAttackingIP {
  ipAddress: string
  attackCount: number
  threatLevel: ThreatLevel
}

export interface ParsedLogResult {
  success: boolean
  entries: Omit<LogEntry, "id" | "userId" | "parsedAt">[]
  errors: string[]
  totalLines: number
  parsedLines: number
}

export interface ApiEndpointInfo {
  url: string
  method: string
  headers: Record<string, string>
  examplePayload: string
}
