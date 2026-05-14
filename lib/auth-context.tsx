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
import { getSession, setSession, clearSession, hashPassword, getRedirectPath } from "./auth"
import { login as apiLogin, signup as apiSignup } from "./data-store"

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

      try {
        const result = await apiLogin(email, password)
        if (!result.success || !result.user) {
          return { success: false, error: result.error || "Invalid email or password" }
        }

        setSession(result.user)
        const session = getSession()
        if (session) {
          setUser(session.user)
        }

        router.push(getRedirectPath())
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error?.message || "Login failed" }
      }
    },
    [router],
  )

  // Signup function
  const signup = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 500))

      try {
        const result = await apiSignup(name, email, password)
        if (!result.success || !result.user) {
          return { success: false, error: result.error || "Signup failed" }
        }

        setSession(result.user)
        const session = getSession()
        if (session) {
          setUser(session.user)
        }

        router.push(getRedirectPath())
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error?.message || "Signup failed" }
      }
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
