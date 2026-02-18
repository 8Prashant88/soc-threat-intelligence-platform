/**
 * SecureLogTI - Threat Intelligence Page
 * View and manage threats detected from user's logs
 */

"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { ThreatScoreCalculator } from "@/components/threats/threat-score-calculator"
import { DetectedThreatsSummary } from "@/components/threats/detected-threats-summary"
import { IpReputationLookup } from "@/components/threats/ip-reputation-lookup"
import { useAuth } from "@/lib/auth-context"
import { getUserThreats } from "@/lib/data-store"
import type { ThreatIntelligence } from "@/lib/types"

export default function ThreatsPage() {
  const { user } = useAuth()
  const [threats, setThreats] = useState<ThreatIntelligence[]>([])

  useEffect(() => {
    if (user?.id) {
      setThreats(getUserThreats(user.id))
    }
  }, [user?.id])

  return (
    <div className="min-h-screen">
      <Header title="Threat Intelligence" subtitle="Analyze and manage threats detected from your logs" />

      <div className="p-6 space-y-6">
        {/* IP Reputation Lookup - Check if any IP is suspicious */}
        <IpReputationLookup />

        {/* Threat Score Calculator - Educational tool */}
        <ThreatScoreCalculator />

        {/* Threats Detected - Shows detected threats with remediation */}
        <DetectedThreatsSummary threats={threats} />
      </div>
    </div>
  )
}
