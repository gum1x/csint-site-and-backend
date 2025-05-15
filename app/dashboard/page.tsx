"use client"

import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SearchTool } from "@/components/search-tool"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyIcon, SearchIcon, UserIcon, TerminalIcon, LogOutIcon, BarChartIcon } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

// Define search limits by plan type
const PLAN_SEARCH_LIMITS = {
  basic: 50,
  standard: 100,
  premium: 200,
  enterprise: 1000,
}

// Define API call limits by plan type
const PLAN_API_LIMITS = {
  basic: 200,
  standard: 500,
  premium: 1000,
  enterprise: 5000,
}

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export default async function Dashboard() {
  // Get the user token from cookies - similar to admin panel approach
  const token = cookies().get("user_token")?.value

  // If no token, redirect to login
  if (!token) {
    return redirect("/login")
  }

  try {
    // Verify the token by checking the user_sessions table
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .select("*, api_keys(*)")
      .eq("session_token", token)
      .single()

    // If no valid session or error, redirect to login
    if (sessionError || !session) {
      console.log("Invalid session, redirecting to login")
      return redirect("/login")
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (now >= expiresAt) {
      console.log("Session expired, redirecting to login")
      return redirect("/login")
    }

    // Get the user's API key
    const { data: apiKeys } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("id", session.api_key_id)
      .eq("is_active", true)
      .single()

    const hasActiveKey = !!apiKeys
    const planType = apiKeys?.plan_type || "standard"

    // Get the search and API limits based on plan type
    const searchLimit = PLAN_SEARCH_LIMITS[planType as keyof typeof PLAN_SEARCH_LIMITS] || 100
    const apiLimit = PLAN_API_LIMITS[planType as keyof typeof PLAN_API_LIMITS] || 500

    // Get the user's search count
    const { data: searchCount } = await supabaseAdmin
      .from("search_count")
      .select("*")
      .eq("email", session.email)
      .single()

    // Default values if no search count record exists
    const searchStats = searchCount || {
      search_count: 0,
      api_call_count: 0,
      search_limit: searchLimit,
      api_call_limit: apiLimit,
    }

    const [usageData, setUsageData] = useState(searchStats)
    const [isLoading, setIsLoading] = useState(false)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const fetchUsageData = async () => {
      setIsLoading(true)
      try {
        // Fetch the latest usage data
        const response = await fetch("/api/usage/stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsageData(data)
      } catch (error) {
        console.error("Error fetching usage data:", error)
        setFetchError("Failed to load usage statistics")
      } finally {
        setIsLoading(false)
      }
    }

    // Add this near other useEffect hooks
    useEffect(() => {
      // Refresh the usage data immediately on component mount
      fetchUsageData()

      // Set up real-time updates for usage statistics
      const intervalId = setInterval(() => {
        // Refresh the usage data
        fetchUsageData()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(intervalId) // Clean up on unmount
    }, [])

    // Inside the Dashboard component, add this helper function:
    const formatKeyValidity = (key: any) => {
      if (!key.redeemed_at) {
        return `Valid for ${key.duration_days || 30} days after first use`
      }

      // If already redeemed, show the expiration date
      return `Expires: ${new Date(key.expires_at).toLocaleString()}`
    }

    // Render the dashboard content
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header with gradient border */}
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 mb-8 shadow-xl relative overflow-hidden">
            {/* Decorative gradient element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 p-2 rounded-lg shadow-lg">
                    <TerminalIcon className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    CSINT Dashboard
                  </h1>
                </div>
                <p className="text-gray-400 mt-1">Access powerful cyber intelligence tools</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-gray-800 rounded-full px-4 py-1.5 text-sm flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span>{session.email}</span>
                </div>
                <form action="/api/auth/logout" method="post">
                  <Button variant="outline" size="sm" type="submit" className="border-gray-700 hover:bg-gray-800">
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar with stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-emerald-400" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">PLAN TYPE</p>
                      <p className="font-medium capitalize">{apiKeys?.plan_type || "No Active Plan"}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">API KEY STATUS</p>
                      <div className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full ${hasActiveKey ? "bg-emerald-500" : "bg-red-500"} mr-2`}
                        ></div>
                        <p className="font-medium">{hasActiveKey ? "Active" : "Inactive"}</p>
                      </div>
                    </div>

                    {hasActiveKey && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">VALIDITY</p>
                        <p className="font-medium">{formatKeyValidity(apiKeys)}</p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">SESSION EXPIRES</p>
                      <p className="font-medium">{new Date(session.expires_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChartIcon className="h-5 w-5 mr-2 text-cyan-400" />
                    Usage Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Searches</span>
                        <span className="font-mono">
                          {usageData.search_count}/{searchLimit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600"
                          style={{
                            width: `${Math.min(100, (usageData.search_count / searchLimit) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>API Calls</span>
                        <span className="font-mono">
                          {usageData.api_call_count}/{apiLimit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600"
                          style={{
                            width: `${Math.min(100, (usageData.api_call_count / apiLimit) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Remove the 'View All Data' option */}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs defaultValue={hasActiveKey ? "search" : "account"} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800">
                  <TabsTrigger value="search" disabled={!hasActiveKey} className="data-[state=active]:bg-gray-800">
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search
                  </TabsTrigger>
                  <TabsTrigger value="account" className="data-[state=active]:bg-gray-800">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="api-keys" className="data-[state=active]:bg-gray-800">
                    <KeyIcon className="mr-2 h-4 w-4" />
                    API Keys
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="mt-4">
                  {hasActiveKey ? (
                    <SearchTool planType={planType} />
                  ) : (
                    <Card className="bg-gray-900 border-gray-800 shadow-xl">
                      <CardHeader>
                        <CardTitle>No Active API Key</CardTitle>
                        <CardDescription>You need an active API key to use the search tool</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          asChild
                          className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700"
                        >
                          <Link href="?tab=api-keys">Get API Key</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="account" className="mt-4">
                  <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader className="border-b border-gray-800">
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>Manage your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">Email Address</p>
                            <div className="bg-gray-800 p-3 rounded-md font-medium">{session.email}</div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">Account Type</p>
                            <div className="bg-gray-800 p-3 rounded-md font-medium capitalize">
                              {apiKeys?.plan_type || "Standard"}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">API Key ID</p>
                            <div className="bg-gray-800 p-3 rounded-md font-mono text-sm overflow-hidden text-ellipsis">
                              {session.api_key_id}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">Session Expires</p>
                            <div className="bg-gray-800 p-3 rounded-md font-medium">
                              {new Date(session.expires_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col md:flex-row gap-4">
                          <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                            Update Profile
                          </Button>
                          <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="api-keys" className="mt-4">
                  <Card className="bg-gray-900 border-gray-800 shadow-xl">
                    <CardHeader className="border-b border-gray-800">
                      <CardTitle>API Keys</CardTitle>
                      <CardDescription>Manage your API keys for accessing CSINT Network services</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {hasActiveKey ? (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-800">
                              <div className="flex justify-between items-center">
                                <h3 className="font-medium">Active API Key</h3>
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-900/30 text-emerald-300 border-emerald-800"
                                >
                                  {apiKeys.plan_type.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="bg-black/50 p-3 rounded-md font-mono text-sm break-all border border-gray-800">
                                {apiKeys.key}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500">CREATED</p>
                                  <p className="text-sm">{new Date(apiKeys.created_at).toLocaleString()}</p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500">STATUS</p>
                                  <div className="flex items-center">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
                                    <p className="text-sm">Active</p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500">VALIDITY</p>
                                  <p className="text-sm">{formatKeyValidity(apiKeys)}</p>
                                </div>
                              </div>

                              <div className="mt-4 p-3 bg-gray-800 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium">Plan Limits</h4>
                                  <Badge variant="outline" className="bg-gray-700/50 text-gray-300 border-gray-600">
                                    {planType.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500">SEARCH LIMIT</p>
                                    <p className="text-sm">{searchLimit} searches</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500">API CALL LIMIT</p>
                                    <p className="text-sm">{apiLimit} calls</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-4">
                            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                              <KeyIcon className="h-4 w-4 mr-2" />
                              Manage Keys
                            </Button>
                            <Button variant="destructive">Request New Key</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="bg-gray-800/50 rounded-lg border border-gray-800 p-6 text-center">
                            <KeyIcon className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-gray-300">No Active API Keys</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                              You don't have any active API keys. Contact your administrator or request a new key to
                              access CSINT Network services.
                            </p>
                          </div>

                          <div className="flex justify-center">
                            <Button
                              asChild
                              className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700"
                            >
                              <Link href="/admin">Request API Key</Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    // If any error occurs during verification, redirect to login
    return redirect("/login")
  }
}
