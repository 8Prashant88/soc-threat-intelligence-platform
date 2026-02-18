/**
 * SecureLogTI - Mock Data
 * Simulated data for demonstration and development purposes
 */

import type {
  User,
  LogEntry,
  ThreatIntelligence,
  SecurityEvent,
  DashboardStats,
  AttacksByDay,
  TopAttackingIP,
} from "./types"
import { hashPassword } from "./auth"

// Mock users for authentication
// Passwords: admin123, analyst123, user123
export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@securelogti.com",
    name: "Admin User",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    createdAt: new Date("2024-01-01"),
    lastLogin: new Date(),
  },
  {
    id: "2",
    email: "analyst@securelogti.com",
    name: "Security Analyst",
    passwordHash: hashPassword("analyst123"),
    role: "analyst",
    createdAt: new Date("2024-02-15"),
    lastLogin: new Date(),
  },
  {
    id: "3",
    email: "user@securelogti.com",
    name: "Normal User",
    passwordHash: hashPassword("user123"),
    role: "user",
    createdAt: new Date("2024-03-01"),
    lastLogin: new Date(),
  },
]

// Mock log entries
export const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date("2025-01-16T10:30:00"),
    sourceIp: "192.168.1.100",
    logType: "auth",
    message: "Failed login attempt for user admin",
    severity: "warning",
  },
  {
    id: "2",
    timestamp: new Date("2025-01-16T10:25:00"),
    sourceIp: "10.0.0.50",
    logType: "firewall",
    message: "Blocked incoming connection on port 22",
    severity: "info",
  },
  {
    id: "3",
    timestamp: new Date("2025-01-16T10:20:00"),
    sourceIp: "203.0.113.45",
    logType: "system",
    message: "Unusual CPU spike detected on server-01",
    severity: "warning",
  },
  {
    id: "4",
    timestamp: new Date("2025-01-16T10:15:00"),
    sourceIp: "192.168.1.100",
    logType: "auth",
    message: "Multiple failed login attempts detected",
    severity: "error",
  },
  {
    id: "5",
    timestamp: new Date("2025-01-16T10:10:00"),
    sourceIp: "45.33.32.156",
    logType: "firewall",
    message: "Port scan detected from external IP",
    severity: "critical",
  },
  {
    id: "6",
    timestamp: new Date("2025-01-16T10:05:00"),
    sourceIp: "172.16.0.25",
    logType: "system",
    message: "Service httpd restarted successfully",
    severity: "info",
  },
  {
    id: "7",
    timestamp: new Date("2025-01-16T10:00:00"),
    sourceIp: "192.168.1.105",
    logType: "auth",
    message: "User analyst logged in successfully",
    severity: "info",
  },
  {
    id: "8",
    timestamp: new Date("2025-01-16T09:55:00"),
    sourceIp: "198.51.100.23",
    logType: "firewall",
    message: "DDoS attack attempt blocked",
    severity: "critical",
  },
]

// Mock threat intelligence data
export const mockThreats: ThreatIntelligence[] = [
  {
    id: "1",
    ipAddress: "45.33.32.156",
    threatScore: 95,
    threatLevel: "high",
    lastSeen: new Date("2025-01-16T10:10:00"),
    status: "active",
    failedLogins: 45,
    repeatedAccess: 120,
    description: "Known malicious IP - Port scanning activity",
  },
  {
    id: "2",
    ipAddress: "198.51.100.23",
    threatScore: 88,
    threatLevel: "high",
    lastSeen: new Date("2025-01-16T09:55:00"),
    status: "active",
    failedLogins: 0,
    repeatedAccess: 500,
    description: "DDoS attack source",
  },
  {
    id: "3",
    ipAddress: "192.168.1.100",
    threatScore: 65,
    threatLevel: "medium",
    lastSeen: new Date("2025-01-16T10:30:00"),
    status: "active",
    failedLogins: 25,
    repeatedAccess: 50,
    description: "Internal IP with multiple failed login attempts",
  },
  {
    id: "4",
    ipAddress: "203.0.113.45",
    threatScore: 42,
    threatLevel: "medium",
    lastSeen: new Date("2025-01-16T10:20:00"),
    status: "resolved",
    failedLogins: 5,
    repeatedAccess: 30,
    description: "Suspicious external access - Resolved",
  },
  {
    id: "5",
    ipAddress: "10.0.0.50",
    threatScore: 15,
    threatLevel: "low",
    lastSeen: new Date("2025-01-16T10:25:00"),
    status: "false_positive",
    failedLogins: 2,
    repeatedAccess: 10,
    description: "Internal server - False positive",
  },
]

// Mock security events
export const mockSecurityEvents: SecurityEvent[] = [
  {
    id: "1",
    timestamp: new Date("2025-01-16T10:30:00"),
    eventType: "Brute Force Attack",
    sourceIp: "192.168.1.100",
    description: "Multiple failed login attempts detected",
    severity: "error",
  },
  {
    id: "2",
    timestamp: new Date("2025-01-16T10:10:00"),
    eventType: "Port Scan",
    sourceIp: "45.33.32.156",
    description: "External port scanning activity detected",
    severity: "critical",
  },
  {
    id: "3",
    timestamp: new Date("2025-01-16T09:55:00"),
    eventType: "DDoS Attempt",
    sourceIp: "198.51.100.23",
    description: "Distributed denial of service attack blocked",
    severity: "critical",
  },
  {
    id: "4",
    timestamp: new Date("2025-01-16T09:45:00"),
    eventType: "Unauthorized Access",
    sourceIp: "203.0.113.45",
    description: "Attempted access to restricted resource",
    severity: "warning",
  },
  {
    id: "5",
    timestamp: new Date("2025-01-16T09:30:00"),
    eventType: "Malware Detected",
    sourceIp: "172.16.0.25",
    description: "Suspicious file upload blocked",
    severity: "error",
  },
]

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  totalLogs: 15847,
  suspiciousIps: 23,
  highRiskThreats: 5,
  resolvedThreats: 18,
}

// Mock attacks by day for reports
export const mockAttacksByDay: AttacksByDay[] = [
  { date: "2025-01-10", count: 45 },
  { date: "2025-01-11", count: 32 },
  { date: "2025-01-12", count: 67 },
  { date: "2025-01-13", count: 54 },
  { date: "2025-01-14", count: 89 },
  { date: "2025-01-15", count: 72 },
  { date: "2025-01-16", count: 38 },
]

// Mock top attacking IPs
export const mockTopAttackingIPs: TopAttackingIP[] = [
  { ipAddress: "45.33.32.156", attackCount: 156, threatLevel: "high" },
  { ipAddress: "198.51.100.23", attackCount: 142, threatLevel: "high" },
  { ipAddress: "192.168.1.100", attackCount: 89, threatLevel: "medium" },
  { ipAddress: "203.0.113.45", attackCount: 67, threatLevel: "medium" },
  { ipAddress: "185.220.101.1", attackCount: 45, threatLevel: "high" },
]
