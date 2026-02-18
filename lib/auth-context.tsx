/**
 * SecureLogTI - Authentication Context
 * Provides authentication state and methods throughout the application
 *
 * Simplified for self-service platform - no role-based access control
 */

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "./types"
import { getSession, setSession, clearSession, verifyPassword, hashPassword, getRedirectPath } from "./auth"
import { findUserByEmail, createUser, updateUserLastLogin } from "./data-store"

// Auth context type - simplified without roles
interface AuthContextType {
  user: Omit<User, "passwordHash"> | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check session on mount
  useEffect(() => {
    const session = getSession()
    if (session) {
      setUser(session.user)
    }
    setIsLoading(false)
  }, [])

  // Route protection - simplified without role checks
  useEffect(() => {
    if (isLoading) return

    const publicRoutes = ["/", "/signup"]
    const isPublicRoute = publicRoutes.includes(pathname)

    if (!user && !isPublicRoute) {
      // Not logged in and trying to access protected route
      router.push("/")
    }
  }, [user, isLoading, pathname, router])

  // Login function
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const foundUser = findUserByEmail(email)

      if (!foundUser) {
        return { success: false, error: "Invalid email or password" }
      }

      if (!verifyPassword(password, foundUser.passwordHash)) {
        return { success: false, error: "Invalid email or password" }
      }

      updateUserLastLogin(foundUser.id)
      setSession(foundUser)
      const session = getSession()
      if (session) {
        setUser(session.user)
      }

      router.push(getRedirectPath())
      return { success: true }
    },
    [router],
  )

  // Signup function
  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const existingUser = findUserByEmail(email)
      if (existingUser) {
        return { success: false, error: "An account with this email already exists" }
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      createUser(newUser)
      setSession(newUser)
      const session = getSession()
      if (session) {
        setUser(session.user)
      }

      router.push(getRedirectPath())
      return { success: true }
    },
    [router],
  )

  // Logout function
  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    router.push("/")
  }, [router])

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
