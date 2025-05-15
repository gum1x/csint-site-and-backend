"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  ChevronRight,
  Download,
  Clock,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/components/session-provider"
import { Progress } from "@/components/ui/progress"
import { sanitizeInput, validateSearchQuery } from "@/lib/security"

const SEARCH_TYPES = [
  { value: "email", label: "Email", estimatedTime: 25 },
  { value: "username", label: "Username", estimatedTime: 32 },
  { value: "domain", label: "Domain", estimatedTime: 28 },
  { value: "phone", label: "Phone", estimatedTime: 26 },
  { value: "ip", label: "IP Address", estimatedTime: 30 },
]

interface SearchToolProps {
  planType?: string
}

export function SearchTool({ planType = "standard" }: SearchToolProps) {
  const [searchType, setSearchType] = useState("email")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("search")
  const { refreshSession, isRefreshing } = useSession()

  // New states for the estimated time feature
  const [progress, setProgress] = useState(0)
  const [estimatedSeconds, setEstimatedSeconds] = useState(5)
  const [remainingTime, setRemainingTime] = useState("")

  // Security-related state
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const [searchCount, setSearchCount] = useState(0)

  // Update estimated time based on search type
  useEffect(() => {
    const searchTypeInfo = SEARCH_TYPES.find((type) => type.value === searchType)
    if (searchTypeInfo) {
      setEstimatedSeconds(searchTypeInfo.estimatedTime)
    }
  }, [searchType])

  // Progress bar and estimated time countdown
  useEffect(() => {
    if (!loading) {
      setProgress(0)
      setRemainingTime("")
      return
    }

    const startTime = Date.now()
    const totalTime = estimatedSeconds * 1000

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(Math.floor((elapsed / totalTime) * 100), 99)
      setProgress(newProgress)

      const remaining = Math.max(0, Math.ceil((totalTime - elapsed) / 1000))
      setRemainingTime(`${remaining} second${remaining !== 1 ? "s" : ""}`)
    }

    // Update progress every 100ms
    const interval = setInterval(updateProgress, 100)

    return () => clearInterval(interval)
  }, [loading, estimatedSeconds])

  const handleSearch = async () => {
    // Validate input
    if (!query.trim()) {
      setError("Please enter a search query")
      return
    }

    // Validate query format
    const validatedQuery = validateSearchQuery(searchType, query.trim())
    if (!validatedQuery) {
      setError(`Invalid format for ${searchType} search. Please check your input.`)
      return
    }

    // Basic rate limiting on client side
    const now = Date.now()
    if (now - lastSearchTime < 2000) {
      // 2 seconds between searches
      setError("Please wait a moment before searching again")
      return
    }

    // Limit consecutive searches
    if (searchCount >= 10) {
      // Reset after 1 minute
      setTimeout(() => setSearchCount(0), 60000)
      setError("You've made too many searches in a short time. Please wait a minute.")
      return
    }

    setLastSearchTime(now)
    setSearchCount((prev) => prev + 1)
    setError(null)
    setLoading(true)
    setProgress(0)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: searchType, query: validatedQuery }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication error. Please try refreshing your session.")
        } else if (response.status === 403) {
          if (data.error && data.error.includes("limit")) {
            throw new Error(data.error)
          } else {
            throw new Error("Your API key doesn't have permission to perform this search.")
          }
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.")
        } else {
          throw new Error(data.error || "Failed to perform search")
        }
      }

      setResults(data)
      setProgress(100)
      setActiveTab("results")
    } catch (err: any) {
      console.error("Search error:", err)
      setError(err.message || "An error occurred while searching")
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setError(null)
    const success = await refreshSession()

    if (success) {
      // Try the search again
      handleSearch()
    } else {
      setError("Failed to refresh your session. Please try logging in again.")
    }
  }

  const renderResults = () => {
    if (!results) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-800">
                {searchType.toUpperCase()}
              </Badge>
              <h3 className="text-lg font-medium">{sanitizeInput(query)}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Searched at {new Date(results.timestamp).toLocaleString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (results) {
                // Create a sanitized version of results for export
                const exportData = {
                  credits: results.credits,
                  scan_type: results.scan_type,
                  query: results.query,
                  timestamp: results.timestamp,
                  csint: results.csint,
                }

                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `csint-search-${searchType}-${query}-${new Date().toISOString()}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url) // Clean up
              }
            }}
            className="h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
        </div>

        <ScrollArea className="h-[350px] rounded-md border border-gray-800 bg-black/50 p-4">
          <pre className="text-sm whitespace-pre-wrap overflow-auto font-mono text-gray-300">
            {JSON.stringify(results.csint, null, 2)}
          </pre>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
          <TabsTrigger value="search" className="data-[state=active]:bg-gray-800">
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!results} className="data-[state=active]:bg-gray-800">
            <ChevronRight className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-0">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardContent className="p-4 space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className={
                    error.includes("limit")
                      ? "bg-yellow-900/30 border-yellow-800 text-yellow-200"
                      : "bg-red-900/30 border-red-800 text-red-200"
                  }
                >
                  {error.includes("limit") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{error.includes("limit") ? "Search Limit Reached" : "Error"}</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <p>{error}</p>
                    {error.includes("limit") && (
                      <div className="mt-2 text-sm">
                        <p>
                          Your current plan ({planType}) allows{" "}
                          {error.includes("search") ? error.match(/$$(\d+)$$/)?.[1] : ""} searches.
                        </p>
                        <p className="mt-1">Consider upgrading your plan for more searches.</p>
                      </div>
                    )}
                    {(error.includes("Authentication") || error.includes("session")) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshSession}
                        disabled={isRefreshing}
                        className="self-start"
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Refreshing..." : "Refresh Session"}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col md:flex-row gap-3">
                <div className="w-full md:w-1/4">
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger id="search-type" className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select search type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {SEARCH_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex gap-2">
                  <Input
                    id="query"
                    placeholder={`Enter ${searchType}...`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border-gray-700 bg-gray-800 text-white"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading && query.trim()) {
                        handleSearch()
                      }
                    }}
                    maxLength={100} // Limit input length for security
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                      <span>Estimated time remaining: {remainingTime}</span>
                    </div>
                    <span>{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-1.5 bg-gray-800"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-cyan-600"
                  />
                  <p className="text-xs text-gray-500 italic">
                    Searching across multiple databases. Results will appear automatically when complete.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardContent className="p-4">
              {renderResults()}
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("search")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  size="sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  New Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
