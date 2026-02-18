import type React from "react"
/**
 * SecureLogTI - Dashboard Layout
 * Layout wrapper for all authenticated dashboard pages
 */

import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64">{children}</main>
    </div>
  )
}
