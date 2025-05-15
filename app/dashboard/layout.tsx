import type React from "react"
import { SessionProvider } from "@/components/session-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-black">{children}</div>
    </SessionProvider>
  )
}
