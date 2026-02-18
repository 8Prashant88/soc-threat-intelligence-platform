/**
 * SecureLogTI - Authentication Utilities
 * Handles password hashing and session management
 *
 * NOTE: This is a simplified implementation for academic purposes.
 * In production, use bcrypt/argon2 for hashing and secure session management.
 */

import type { User } from "./types"

// Simple hash function for demo purposes
// In production, use bcrypt: await bcrypt.hash(password, 10)
export function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`
}

// Verify password against hash
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Session storage key
const SESSION_KEY = "securelogti_session"

// Session interface - removed role from session
export interface Session {
  user: Omit<User, "passwordHash">
  expiresAt: number
}

// Store session in localStorage
export function setSession(user: User): void {
  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLogin: new Date(),
    },
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

// Get current session
export function getSession(): Session | null {
  if (typeof window === "undefined") return null

  const sessionData = localStorage.getItem(SESSION_KEY)
  if (!sessionData) return null

  try {
    const session: Session = JSON.parse(sessionData)
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

// Clear session (logout)
export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function getRedirectPath(): string {
  return "/dashboard"
}

export function hasRouteAccess(pathname: string): boolean {
  const publicRoutes = ["/", "/signup"]
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/threats") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings")
  )
}
