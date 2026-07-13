import type {
  DashboardStats,
  LogEntry,
  ParsedLogResult,
  SecurityAlert,
  ThreatIntelligence,
  TopAttackingIP,
} from "./types"

const API_BASE = "/api"

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  })

  const json = await response.json()
  if (!response.ok || !json?.success) {
    throw new Error(json?.message || json?.error || "API request failed")
  }

  return json as T
}

function parseDate(value: unknown): Date {
  return value ? new Date(String(value)) : new Date()
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  return apiRequest(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function signup(name: string, email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  return apiRequest(`${API_BASE}/auth/signup`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
}

export async function getUserLogs(userId: string): Promise<LogEntry[]> {
  const json = await apiRequest<{ logs: LogEntry[] }>(`${API_BASE}/users/${userId}/logs`)
  return json.logs.map((entry) => ({
    ...entry,
    timestamp: parseDate(entry.timestamp),
    parsedAt: parseDate(entry.parsedAt),
  }))
}

export async function addUserLogs(
  userId: string,
  newLogs: Omit<LogEntry, "id" | "userId" | "parsedAt">[],
): Promise<LogEntry[]> {
  const json = await apiRequest<{ addedLogs: LogEntry[] }>(`${API_BASE}/users/${userId}/logs`, {
    method: "POST",
    body: JSON.stringify({ entries: newLogs }),
  })

  return json.addedLogs.map((entry) => ({
    ...entry,
    timestamp: parseDate(entry.timestamp),
    parsedAt: parseDate(entry.parsedAt),
  }))
}

export async function deleteUserLog(userId: string, logId: string): Promise<boolean> {
  await apiRequest(`${API_BASE}/users/${userId}/logs/${logId}`, {
    method: "DELETE",
  })
  return true
}

export async function clearUserLogs(userId: string): Promise<void> {
  await apiRequest(`${API_BASE}/users/${userId}/logs`, {
    method: "DELETE",
  })
}

export async function getUserThreats(userId: string): Promise<ThreatIntelligence[]> {
  const json = await apiRequest<{ threats: ThreatIntelligence[] }>(`${API_BASE}/users/${userId}/threats`)
  return json.threats.map((threat) => ({
    ...threat,
    lastSeen: parseDate(threat.lastSeen),
  }))
}

export async function getUserAlerts(userId: string): Promise<SecurityAlert[]> {
  const json = await apiRequest<{ alerts: SecurityAlert[] }>(`${API_BASE}/users/${userId}/alerts`)
  return json.alerts.map((alert) => ({
    ...alert,
    timestamp: parseDate(alert.timestamp),
    detectedAt: parseDate(alert.detectedAt),
  }))
}

export async function updateAlertStatus(userId: string, alertId: string, status: SecurityAlert["status"]): Promise<void> {
  await apiRequest(`${API_BASE}/users/${userId}/alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export async function getUserStats(userId: string): Promise<DashboardStats> {
  const json = await apiRequest<{ stats: DashboardStats }>(`${API_BASE}/users/${userId}/stats`)
  return json.stats
}

export async function getUserAttacksByDay(userId: string): Promise<{ date: string; count: number }[]> {
  const json = await apiRequest<{ attacksByDay: { date: string; count: number }[] }>(
    `${API_BASE}/users/${userId}/stats`,
  )
  return json.attacksByDay
}

export async function getUserTopAttackingIPs(userId: string): Promise<TopAttackingIP[]> {
  const json = await apiRequest<{ topAttackingIPs: TopAttackingIP[] }>(`${API_BASE}/users/${userId}/stats`)
  return json.topAttackingIPs
}

export interface ApiKeySummary {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  revoked: boolean
}

export async function getApiKeys(userId: string): Promise<ApiKeySummary[]> {
  const json = await apiRequest<{ keys: ApiKeySummary[] }>(`${API_BASE}/users/${userId}/api-keys`)
  return json.keys
}

export async function createApiKey(
  userId: string,
  name: string,
): Promise<ApiKeySummary & { plaintext: string }> {
  const json = await apiRequest<{ key: ApiKeySummary & { plaintext: string } }>(
    `${API_BASE}/users/${userId}/api-keys`,
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  )
  return json.key
}

export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  await apiRequest(`${API_BASE}/users/${userId}/api-keys/${keyId}`, {
    method: "DELETE",
  })
}
