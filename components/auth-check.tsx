"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthCheck() {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        const data = await response.json()

        if (!data.authenticated) {
          console.log("Not authenticated, redirecting to login")
          router.push("/login")
        } else {
          console.log("Authentication confirmed")
          setIsChecking(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return null // Or a loading spinner
  }

  return null
}
