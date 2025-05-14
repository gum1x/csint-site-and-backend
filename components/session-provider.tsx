"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSessionRefresh } from "@/hooks/use-session"

type SessionContextType = {
  refreshSession: () => Promise<boolean>
  isRefreshing: boolean
  lastRefreshed: Date | null
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { refreshSession, isRefreshing, lastRefreshed } = useSessionRefresh()
  const router = useRouter()

  // Handle API errors by refreshing the session
  useEffect(() => {
    const handleFetchResponse = async (event: Event) => {
      const response = event.target as Response

      // Check if the response is a 401 Unauthorized
      if (response.status === 401) {
        console.log("Unauthorized response detected, attempting to refresh session")
        const success = await refreshSession()

        if (success) {
          // If refresh was successful, retry the original request
          // This is simplified - in a real app you'd need to track and retry the original request
          console.log("Session refreshed, reloading page")
          router.refresh()
        } else {
          // If refresh failed, redirect to login
          console.log("Session refresh failed, redirecting to login")
          window.location.href = "/login"
        }
      }
    }

    // Add global fetch error handler
    window.addEventListener("fetch", handleFetchResponse as any)

    return () => {
      window.removeEventListener("fetch", handleFetchResponse as any)
    }
  }, [refreshSession, router])

  return (
    <SessionContext.Provider value={{ refreshSession, isRefreshing, lastRefreshed }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
