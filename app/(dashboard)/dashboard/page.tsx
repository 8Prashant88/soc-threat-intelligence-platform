/**
 * SecureLogTI - User Dashboard Page
 * Personalized security overview for the logged-in user
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import { useInterval } from "@/hooks/use-interval"
import { Header } from "@/components/layout/header"
import { UserDashboardStats } from "@/components/dashboard/user-dashboard-stats"
import { UserAttacksChart } from "@/components/dashboard/user-attacks-chart"
import { UserTopThreats } from "@/components/dashboard/user-top-threats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getUserStats, getUserAttacksByDay, getUserTopAttackingIPs } from "@/lib/data-store"
import type { DashboardStats, AttacksByDay, TopAttackingIP } from "@/lib/types"
import { FileText, Shield, BarChart3, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalLogs: 0,
    suspiciousIps: 0,
    highRiskThreats: 0,
    logsThisWeek: 0,
  })
  const [attacksData, setAttacksData] = useState<AttacksByDay[]>([])
  const [topThreats, setTopThreats] = useState<TopAttackingIP[]>([])

  useEffect(() => {
    if (!user?.id) {
      setStats({
        totalLogs: 0,
        suspiciousIps: 0,
        highRiskThreats: 0,
        logsThisWeek: 0,
      })
      setAttacksData([])
      setTopThreats([])
      return
    }

    let isMounted = true

    Promise.all([
      getUserStats(user.id),
      getUserAttacksByDay(user.id),
      getUserTopAttackingIPs(user.id),
    ])
      .then(([statsResult, attacksResult, topResult]) => {
        if (isMounted) {
          setStats(statsResult)
          setAttacksData(attacksResult)
          setTopThreats(topResult)
        }
      })
      .catch(() => {
        if (isMounted) {
          setStats({
            totalLogs: 0,
            suspiciousIps: 0,
            highRiskThreats: 0,
            logsThisWeek: 0,
          })
          setAttacksData([])
          setTopThreats([])
        }
      })

    return () => {
      isMounted = false
    }
  }, [user?.id])

  // Live updates: refresh stats, charts, and top threats every 5s so newly
  // ingested device logs and their analysis show up automatically.
  const refresh = useCallback(() => {
    if (!user?.id) return
    Promise.all([getUserStats(user.id), getUserAttacksByDay(user.id), getUserTopAttackingIPs(user.id)])
      .then(([statsResult, attacksResult, topResult]) => {
        setStats(statsResult)
        setAttacksData(attacksResult)
        setTopThreats(topResult)
      })
      .catch(() => {})
  }, [user?.id])

  useInterval(refresh, user?.id ? 5000 : null)

  return (
    <div className="min-h-screen">
      <Header title={`Welcome, ${user?.name?.split(" ")[0] || "User"}`} subtitle="Your personal security overview" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <UserDashboardStats stats={stats} />

        {/* Quick Actions - shown when no logs */}
        {stats.totalLogs === 0 && (
          <Card className="bg-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-card-foreground">Get Started</CardTitle>
              <CardDescription>Upload your first logs to begin security analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/logs">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                    <FileText className="h-6 w-6 text-primary" />
                    <span>Upload Logs</span>
                  </Button>
                </Link>
                <Link href="/threats">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                    <Shield className="h-6 w-6 text-primary" />
                    <span>View Threats</span>
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 bg-transparent">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <span>View Reports</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UserAttacksChart data={attacksData} />
          <UserTopThreats data={topThreats} />
        </div>

        {/* Quick Links */}
        {stats.totalLogs > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/logs">
              <Card className="bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium text-card-foreground">Manage Logs</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/threats">
              <Card className="bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium text-card-foreground">View Threats</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports">
              <Card className="bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-medium text-card-foreground">View Reports</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
