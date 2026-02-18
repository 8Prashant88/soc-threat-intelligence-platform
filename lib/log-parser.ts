/**
 * SecureLogTI - Advanced Log Parser
 * Parses multiple log formats into structured LogEntry objects
 *
 * Supported formats:
 * - Syslog (standard Linux format)
 * - Auth logs (SSH, sudo, PAM)
 * - Firewall logs (iptables, ufw, pfSense)
 * - Web server logs (Apache, Nginx)
 * - Windows Event Logs (XML format)
 * - Docker container logs
 * - Kubernetes logs
 * - Mac OSX unified logs (modern macOS 10.12+)
 * - Mac system logs (traditional format)
 * - Mac Console logs
 * - Database audit logs (MySQL, PostgreSQL)
 * - JSON structured logs
 */

import type { LogEntry, LogType, ParsedLogResult } from "./types"

// Common regex patterns for log parsing
const SYSLOG_PATTERN = /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(\S+?)(?:\[\d+\])?\s*:\s*(.+)$/
const ISO_TIMESTAMP_PATTERN = /(\d{4}[-\/]\d{2}[-\/]\d{2}[T\s]\d{2}:\d{2}:\d{2})/
const IP_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const AUTH_FAILED_PATTERN = /(?:failed|invalid|error|denied|rejected)/i
const AUTH_SUCCESS_PATTERN = /(?:accepted|successful|opened)/i
const WINDOWS_EVENTLOG_PATTERN = /<Event>[\s\S]*?<\/Event>/g
const DOCKER_LOG_PATTERN = /^(?:\d+-\d+-\d+T\d+:\d+:\d+)|(?:\[[\d.]+\s)/
const K8S_LOG_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
const JSON_LOG_PATTERN = /^{.*}$/
const HTTP_LOG_PATTERN = /(\d+\.\d+\.\d+\.\d+).*?"([A-Z]+)\s+(\S+).*?"\s+(\d+)/
// Mac OSX log patterns
const MAC_UNIFIED_LOG_PATTERN = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+[\+\-]\d{4}\s+\d+x[a-f0-9]+\s+\[([^\]]+)\]/
const MAC_SYSTEM_LOG_PATTERN = /^(\w+\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^\[]+)(?:\[(\d+)\])?\s*:\s*(.+)$/
const MAC_CONSOLE_PATTERN = /(?:Error|Warning|Notice|Debug):\s+/i

interface ParsedLine {
  timestamp: Date
  sourceIp: string
  logType: LogType
  message: string
  severity: LogEntry["severity"]
  rawLog: string
}

/**
 * Parse a single log line into structured data
 * Auto-detects log format and parses accordingly
 */
function parseSingleLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length < 10) return null

  // Try different formats in order
  
  // 1. Try JSON format first
  if (JSON_LOG_PATTERN.test(trimmed)) {
    return parseJSONLog(trimmed)
  }

  // 2. Try ISO timestamp (Docker, Kubernetes, modern logs)
  const isoMatch = trimmed.match(ISO_TIMESTAMP_PATTERN)
  if (isoMatch) {
    if (trimmed.includes("namespace=") || trimmed.includes("pod=")) {
      return parseKubernetesLog(trimmed)
    } else {
      return parseDockerLog(trimmed)
    }
  }

  // 3. Try Mac unified logging format (modern macOS)
  if (MAC_UNIFIED_LOG_PATTERN.test(trimmed)) {
    return parseMacUnifiedLog(trimmed)
  }

  // 4. Try Mac system log format
  const macSystemMatch = trimmed.match(MAC_SYSTEM_LOG_PATTERN)
  if (macSystemMatch && !trimmed.includes("@") && !trimmed.includes("[")) {
    return parseMacSystemLog(trimmed)
  }

  // 5. Try HTTP log format (Apache/Nginx)
  if (HTTP_LOG_PATTERN.test(trimmed)) {
    return parseHTTPLog(trimmed)
  }

  // 6. Try syslog format (default Linux)
  const syslogMatch = trimmed.match(SYSLOG_PATTERN)
  if (syslogMatch) {
    return parseSyslogLine(trimmed, syslogMatch)
  }

  // 7. Try Windows Event Log XML
  if (trimmed.includes("<Event>") || trimmed.includes("<System>")) {
    return parseWindowsEventLog(trimmed)
  }

  // 8. Try database audit log
  if (trimmed.match(/QUERY|EXECUTE|UPDATE|DELETE|INSERT/i)) {
    return parseDatabaseAuditLog(trimmed)
  }

  // Fallback: treat as generic message
  return {
    timestamp: new Date(),
    sourceIp: extractIP(trimmed) || "0.0.0.0",
    logType: "system",
    message: trimmed,
    severity: determineSeverity(trimmed),
    rawLog: trimmed,
  }
}

/**
 * Parse JSON structured logs
 */
function parseJSONLog(line: string): ParsedLine | null {
  try {
    const json = JSON.parse(line)
    const timestamp = new Date(json.timestamp || json.time || json.ts || Date.now())
    const sourceIp = json.source_ip || json.sourceIp || json.src || extractIP(JSON.stringify(json)) || "0.0.0.0"
    const message = json.message || json.msg || json.content || JSON.stringify(json).substring(0, 200)
    const logType = json.type || json.level || "system"

    return {
      timestamp,
      sourceIp,
      logType: (logType === "auth" || logType === "authentication" ? "auth" : "system") as LogType,
      message,
      severity: json.severity || json.level || determineSeverity(message),
      rawLog: line,
    }
  } catch {
    return null
  }
}

/**
 * Parse Docker container logs
 * Format: 2024-01-16T10:30:00.123456789Z container-name message
 */
function parseDockerLog(line: string): ParsedLine | null {
  const isoMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
  const parts = line.split(" ")

  let timestamp = new Date()
  if (isoMatch) {
    timestamp = new Date(isoMatch[1])
  }

  const sourceIp = extractIP(line) || "0.0.0.0"
  const message = parts.slice(1).join(" ") || line

  return {
    timestamp,
    sourceIp,
    logType: "application",
    message,
    severity: determineSeverity(message),
    rawLog: line,
  }
}

/**
 * Parse Kubernetes logs
 * Format: timestamp namespace=ns pod=pod-name container=name message
 */
function parseKubernetesLog(line: string): ParsedLine | null {
  const isoMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
  const timestamp = isoMatch ? new Date(isoMatch[1]) : new Date()

  const namespaceMatch = line.match(/namespace=([^\s]+)/)
  const podMatch = line.match(/pod=([^\s]+)/)
  const containerMatch = line.match(/container=([^\s]+)/)

  const sourceIp = extractIP(line) || "0.0.0.0"
  const message = line.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*/g, "").trim()

  return {
    timestamp,
    sourceIp,
    logType: "application",
    message: `[${namespaceMatch?.[1]}/${podMatch?.[1]}/${containerMatch?.[1] || "app"}] ${message}`,
    severity: determineSeverity(message),
    rawLog: line,
  }
}

/**
 * Parse HTTP server logs (Apache/Nginx)
 * Format: 192.168.1.100 - user [16/Jan/2024:10:30:00] "GET /path HTTP/1.1" 200 512
 */
function parseHTTPLog(line: string): ParsedLine | null {
  const httpMatch = line.match(
    /(\d+\.\d+\.\d+\.\d+).*?\[([^\]]+)\].*?"([A-Z]+)\s+(\S+).*?"\s+(\d+)\s+(\d+)/
  )

  if (!httpMatch) return null

  const [, ip, dateStr, method, path, statusCode, bytes] = httpMatch
  const timestamp = parseHTTPDate(dateStr) || new Date()

  const message = `${method} ${path} - HTTP ${statusCode} (${bytes} bytes)`
  const severity = statusCode.startsWith("5") ? "error" : statusCode.startsWith("4") ? "warning" : "info"

  return {
    timestamp,
    sourceIp: ip,
    logType: "application",
    message,
    severity,
    rawLog: line,
  }
}

/**
 * Parse Windows Event Log (simplified XML parsing)
 */
function parseWindowsEventLog(line: string): ParsedLine | null {
  const eventIdMatch = line.match(/<EventID[^>]*>(\d+)</)
  const levelMatch = line.match(/<Level>(\d+)</)
  const messageMatch = line.match(/(?:<Data[^>]*>|Message>)([^<]+)</)
  const computerMatch = line.match(/<Computer>([^<]+)</)
  const timeMatch = line.match(/<SystemTime>([^<]+)</)

  const timestamp = timeMatch ? new Date(timeMatch[1]) : new Date()
  const severityMap: Record<string, LogEntry["severity"]> = {
    "1": "critical",
    "2": "error",
    "3": "warning",
    "4": "info",
    "5": "info",
  }

  return {
    timestamp,
    sourceIp: "0.0.0.0",
    logType: "system",
    message: messageMatch?.[1] || line,
    severity: severityMap[levelMatch?.[1] || "4"] || "info",
    rawLog: line,
  }
}

/**
 * Parse database audit logs
 * Format varies by DB - extract key elements
 */
function parseDatabaseAuditLog(line: string): ParsedLine | null {
  const queryMatch = line.match(/(?:QUERY|EXECUTE|UPDATE|DELETE|INSERT)\s+(.+)/i)
  const userMatch = line.match(/user[=:]?\s*([^\s,]+)/i)
  const hostMatch = line.match(/host[=:]?\s*(\d+\.\d+\.\d+\.\d+)/i)
  const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/)

  const timestamp = timeMatch ? new Date(timeMatch[1]) : new Date()
  const sourceIp = hostMatch?.[1] || extractIP(line) || "0.0.0.0"
  const message = queryMatch?.[1] || line

  return {
    timestamp,
    sourceIp,
    logType: "system",
    message: `[Database] ${message}`,
    severity: determineSeverity(message),
    rawLog: line,
  }
}

/**
 * Parse Mac unified logging format (modern macOS)
 * Format: 2024-01-16 10:30:00.123+0000 1234x5678 [com.apple.xpc.launchd] type:Default
 */
function parseMacUnifiedLog(line: string): ParsedLine | null {
  // Match: YYYY-MM-DD HH:MM:SS.sss+ZZZZ [process] message
  const unifiedMatch = line.match(
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d+)[\+\-]\d{4}\s+\d+x[a-f0-9]+\s+\[([^\]]+)\](.+)/i
  )

  if (!unifiedMatch) return null

  const [, year, month, day, hour, min, sec, , processName, message] = unifiedMatch

  const timestamp = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`)

  // Determine log type based on process name
  let logType: LogType = "system"
  const procLower = processName.toLowerCase()

  if (procLower.includes("ssh") || procLower.includes("auth") || procLower.includes("loginwindow")) {
    logType = "auth"
  } else if (procLower.includes("firewall") || procLower.includes("pf")) {
    logType = "firewall"
  } else if (procLower.includes("apache") || procLower.includes("nginx") || procLower.includes("httpd")) {
    logType = "application"
  } else if (procLower.includes("network") || procLower.includes("wifi") || procLower.includes("interface")) {
    logType = "network"
  }

  const sourceIp = extractIP(line) || "0.0.0.0"
  const severity = determineSeverity(message)

  return {
    timestamp,
    sourceIp,
    logType,
    message: `[${processName}] ${message.trim()}`,
    severity,
    rawLog: line,
  }
}

/**
 * Parse Mac system log format (traditional macOS logs)
 * Format: Jul 15 14:30:00 hostname processname[pid]: message
 */
function parseMacSystemLog(line: string): ParsedLine | null {
  // Match: MMM DD HH:MM:SS hostname process[pid]: message
  const macMatch = line.match(
    /^(\w+)\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+([^\s]+)\s+([^\[]+)(?:\[(\d+)\])?\s*:\s*(.+)$/
  )

  if (!macMatch) return null

  const [, monthStr, day, hour, min, sec, hostname, processName, pid, message] = macMatch

  // Parse month
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  }

  const monthIndex = monthMap[monthStr.toLowerCase()]
  if (monthIndex === undefined) return null

  // Use current year if not specified
  const year = new Date().getFullYear()
  const timestamp = new Date(year, monthIndex, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec))

  // Determine log type based on process name
  let logType: LogType = "system"
  const procLower = processName.toLowerCase()

  if (procLower.includes("ssh") || procLower.includes("auth") || procLower.includes("loginwindow") || procLower.includes("sudo")) {
    logType = "auth"
  } else if (procLower.includes("firewall") || procLower.includes("pf")) {
    logType = "firewall"
  } else if (procLower.includes("apache") || procLower.includes("nginx") || procLower.includes("httpd")) {
    logType = "application"
  } else if (procLower.includes("network") || procLower.includes("wifi") || procLower.includes("interface")) {
    logType = "network"
  }

  const sourceIp = extractIP(line) || "0.0.0.0"
  const severity = determineSeverity(message)

  return {
    timestamp,
    sourceIp,
    logType,
    message: `[${hostname}/${processName}] ${message}`,
    severity,
    rawLog: line,
  }
}

/**
 * Parse Mac Console error/warning logs
 * Format: Error: message | Warning: message | Debug: message
 */
function parseMacConsoleLog(line: string): ParsedLine | null {
  const consoleMatch = line.match(/^(Error|Warning|Notice|Debug|Info|Critical):\s+(.+)$/i)

  if (!consoleMatch) return null

  const [, level, message] = consoleMatch

  // Map console level to severity
  const severityMap: Record<string, LogEntry["severity"]> = {
    error: "error",
    warning: "warning",
    critical: "critical",
    notice: "info",
    debug: "info",
    info: "info",
  }

  return {
    timestamp: new Date(),
    sourceIp: extractIP(line) || "0.0.0.0",
    logType: "system",
    message,
    severity: severityMap[level.toLowerCase()] || "info",
    rawLog: line,
  }
}

/**
 * Parse standard syslog line
 */
function parseSyslogLine(trimmed: string, syslogMatch: RegExpMatchArray): ParsedLine {
  const [, dateStr, , service, msg] = syslogMatch

  const year = new Date().getFullYear()
  let timestamp = new Date(`${dateStr} ${year}`)
  if (isNaN(timestamp.getTime())) {
    timestamp = new Date()
  }

  let logType: LogType = "system"
  if (service.includes("sshd") || service.includes("auth") || service.includes("sudo") || service.includes("pam")) {
    logType = "auth"
  } else if (service.includes("kernel") || service.includes("iptables") || service.includes("firewall")) {
    logType = "firewall"
  } else if (service.includes("apache") || service.includes("nginx") || service.includes("httpd")) {
    logType = "application"
  } else if (service.includes("network") || service.includes("eth") || service.includes("wlan")) {
    logType = "network"
  }

  const sourceIp = extractIP(trimmed) || "0.0.0.0"
  const severity = determineSeverity(msg)

  return {
    timestamp,
    sourceIp,
    logType,
    message: msg,
    severity,
    rawLog: trimmed,
  }
}

/**
 * Extract IP address from text
 */
function extractIP(text: string): string | null {
  const ips = text.match(IP_PATTERN)
  return ips ? ips[0] : null
}

/**
 * Determine severity level from message content
 */
function determineSeverity(message: string): LogEntry["severity"] {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("critical") || lowerMessage.includes("emergency") || lowerMessage.includes("panic") || lowerMessage.includes("fatal")) {
    return "critical"
  }
  if (AUTH_FAILED_PATTERN.test(lowerMessage) || lowerMessage.includes("error") || lowerMessage.includes("failed") || lowerMessage.includes("denied")) {
    return "error"
  }
  if (lowerMessage.includes("warning") || lowerMessage.includes("warn") || lowerMessage.includes("blocked") || lowerMessage.includes("suspicious")) {
    return "warning"
  }

  return "info"
}

/**
 * Parse HTTP-style date
 */
function parseHTTPDate(dateStr: string): Date | null {
  try {
    // Format: 16/Jan/2024:10:30:00 +0000
    const parts = dateStr.match(/(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+)/)
    if (!parts) return null

    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }

    const [, day, month, year, hour, min, sec] = parts
    const monthIndex = months[month.toLowerCase()]

    if (monthIndex === undefined) return null

    return new Date(parseInt(year), monthIndex, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec))
  } catch {
    return null
  }
}

/**
 * Parse multiple log lines (from text input or file)
 */
export function parseLogs(content: string): ParsedLogResult {
  const lines = content.split("\n")
  const entries: Omit<LogEntry, "id" | "userId" | "parsedAt">[] = []
  const errors: string[] = []
  let parsedLines = 0

  lines.forEach((line, index) => {
    if (!line.trim()) return // Skip empty lines

    try {
      const parsed = parseSingleLine(line)
      if (parsed) {
        entries.push(parsed)
        parsedLines++
      } else {
        errors.push(`Line ${index + 1}: Could not parse log format`)
      }
    } catch (error) {
      errors.push(`Line ${index + 1}: ${error instanceof Error ? error.message : "Parse error"}`)
    }
  })

  return {
    success: entries.length > 0,
    entries,
    errors: errors.slice(0, 10), // Limit error messages
    totalLines: lines.filter((l) => l.trim()).length,
    parsedLines,
  }
}

/**
 * Validate if content looks like log data
 */
export function isValidLogContent(content: string): boolean {
  if (!content || content.length < 10) return false

  const lines = content.split("\n").filter((l) => l.trim())
  if (lines.length === 0) return false

  // Check if at least some lines look like logs
  const validLines = lines.filter((line) => {
    // Check for common log patterns
    return (
      SYSLOG_PATTERN.test(line) ||
      IP_PATTERN.test(line) ||
      /\d{4}[-/]\d{2}[-/]\d{2}/.test(line) || // Date pattern
      /\d{2}:\d{2}:\d{2}/.test(line) // Time pattern
    )
  })

  return validLines.length >= Math.min(lines.length * 0.3, 1) // At least 30% or 1 valid line
}

/**
 * Get sample log format for user reference
 */
export function getSampleLogFormats(): string[] {
  return [
    // Linux/Syslog formats
    "Jan 16 10:30:00 server sshd[1234]: Failed password for admin from 192.168.1.100 port 22 ssh2",
    "Jan 16 10:25:00 firewall kernel: DROP IN=eth0 SRC=10.0.0.50 DST=192.168.1.1 PROTO=TCP DPT=22",
    "Jan 16 10:20:00 server sudo: user1 : TTY=pts/0 ; PWD=/home/user1 ; USER=root ; COMMAND=/bin/bash",
    
    // Apache/Nginx HTTP logs
    '192.168.1.100 - - [16/Jan/2025:10:30:00 +0000] "GET /admin HTTP/1.1" 401 0',
    '10.0.0.50 admin [16/Jan/2025:10:35:22 +0000] "POST /login HTTP/1.1" 403 512',
    
    // Mac OSX unified logs (modern format)
    '2024-01-16 10:30:00.123+0000 1234x5678 [com.apple.xpc.launchd] Failed authentication attempt for user: admin from 192.168.1.100',
    '2024-01-16 10:32:15.456+0000 2345x6789 [com.apple.sshd] ERROR: Multiple failed SSH login attempts detected from 10.0.0.50',
    
    // Mac OSX system logs (traditional format)
    'Jul 15 14:30:00 MacBook-Pro sshd[1234]: Failed password for admin from 192.168.1.100 port 22',
    'Jul 15 14:35:22 MacBook-Pro loginwindow[567]: ERROR: Unauthorized access attempt detected',
    'Jul 15 14:40:00 MacBook-Pro kernel[0]: CRITICAL: Firewall blocked malicious traffic from 10.0.0.50',
    
    // Mac Console error logs
    'Error: SSH remote login failed for user admin from 192.168.1.100',
    'Critical: Potential malware detected in /Applications/UnknownApp.app',
    'Warning: Multiple failed authentication attempts for root user (5 attempts)',
    
    // Docker logs (ISO timestamp)
    '2024-01-16T10:30:00.123456789Z container-web ERROR Connection refused from 192.168.1.100',
    '2024-01-16T10:32:15.987654321Z container-db ERROR Failed login attempt for user root',
    
    // Kubernetes logs
    '2024-01-16T10:30:00 namespace=default pod=web-deployment-5d8f7 container=nginx WARN High memory usage detected',
    '2024-01-16T10:31:45 namespace=security pod=firewall-agent container=firewall CRITICAL Multiple failed SSH attempts from 192.168.1.100',
    
    // JSON structured logs
    '{"timestamp":"2024-01-16T10:30:00Z","source_ip":"192.168.1.100","severity":"error","message":"Unauthorized access attempt to /admin","type":"auth"}',
    '{"time":"2024-01-16T10:32:00Z","src":"10.0.0.50","level":"critical","msg":"SQL injection detected in request","event_type":"security"}',
    
    // Windows Event Log (simplified)
    '<Event><System><EventID>4625</EventID><Level>2</Level><Computer>SERVER-01</Computer><SystemTime>2024-01-16T10:30:00Z</SystemTime></System><EventData><Data>Administrator</Data><Data>10.0.0.50</Data></EventData></Event>',
    
    // Database audit logs
    'EXECUTE user=root host=192.168.1.100 database=accounts query=SELECT * FROM users WHERE 1=1 timestamp=2024-01-16 10:30:00',
    'UPDATE user=analyst host=10.0.0.50 database=logs table=access_logs affected_rows=1500 timestamp=2024-01-16 10:32:15',
  ]
}
