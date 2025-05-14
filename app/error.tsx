"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-900/50 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Something went wrong</h1>

        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-200">
            An unexpected error occurred. This could be due to a temporary issue or a security violation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700"
          >
            Try again
          </Button>

          <Button asChild variant="outline" className="border-gray-700 hover:bg-gray-800">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}
