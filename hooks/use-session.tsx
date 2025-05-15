"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useSessionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const router = useRouter()

  // Function to refresh the session
  const refreshSession = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLastRefreshed(new Date())
        console.log("Session refreshed successfully")
        return true
      } else {
        console.error("Failed to refresh session:", data.error)
        return false
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      return false
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh the session on initial load and periodically
  useEffect(() => {
    // Refresh on initial load
    refreshSession()

    // Set up periodic refresh (every 24 hours)
    const intervalId = setInterval(
      () => {
        refreshSession()
      },
      24 * 60 * 60 * 1000,
    ) // 24 hours

    return () => clearInterval(intervalId)
  }, [])

  return { refreshSession, isRefreshing, lastRefreshed }
}
