"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlanStats {
  plan_type: string
  search_count: number
  api_call_count: number
  search_limit: number
  api_call_limit: number
  date: string
}

export function DailyPlanStats() {
  const [stats, setStats] = useState<PlanStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/plans/daily-stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch daily plan statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching daily plan stats:", err)
      setError("Failed to load daily plan statistics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyStats()

    // Set up real-time updates
    const intervalId = setInterval(() => {
      fetchDailyStats()
    }, 60000) // Update every minute

    return () => clearInterval(intervalId) // Clean up on unmount
  }, [])

  const formatPlanType = (planType: string) => {
    return planType.charAt(0).toUpperCase() + planType.slice(1)
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin text-emerald-400" />
            Loading Daily Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchDailyStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const searchPercentage = Math.min(100, (stats.search_count / stats.search_limit) * 100)
  const apiCallPercentage = Math.min(100, (stats.api_call_count / stats.api_call_limit) * 100)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">Daily Usage Statistics</CardTitle>
        <CardDescription>
          {formatPlanType(stats.plan_type)} Plan • {new Date(stats.date).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-400">Searches</span>
              <span className="text-sm font-medium">
                {stats.search_count} / {stats.search_limit}
              </span>
            </div>
            <Progress value={searchPercentage} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-400">API Calls</span>
              <span className="text-sm font-medium">
                {stats.api_call_count} / {stats.api_call_limit}
              </span>
            </div>
            <Progress value={apiCallPercentage} className="h-2" />
          </div>

          <div className="pt-2">
            <Button onClick={fetchDailyStats} variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Statistics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
