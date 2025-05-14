"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DirectLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      // Make a direct fetch request to set the cookie
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "59dbZ9$0#m?WOHRc",
          password: "w#nWy#!ctRr92ZFMLxu0l8J@oEvi",
        }),
      })

      if (response.ok) {
        router.push("/1923/admin")
      } else {
        console.error("Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Direct Admin Login</h1>
        <p className="mb-6 text-gray-400">
          This page will attempt to log you in directly with the hardcoded credentials.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md font-medium"
        >
          {isLoading ? "Logging in..." : "Login as Admin"}
        </button>
      </div>
    </div>
  )
}
