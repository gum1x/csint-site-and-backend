import type React from "react"
import { SessionProvider } from "@/components/session-provider"
import { DailyPlanStats } from "@/components/daily-plan-stats"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-black">
        <DailyPlanStats />
        {children}
      </div>
    </SessionProvider>
  )
}
