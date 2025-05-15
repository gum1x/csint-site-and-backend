"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Search, Info } from "lucide-react"
import { useSession } from "@/hooks/use-session"

export function SearchTool() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchInfo, setSearchInfo] = useState(null)
  const { session } = useSession()

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!query.trim()) {
      setError("Please enter a search query")
      return
    }

    if (!session?.apiKey) {
      setError("API key not found. Please log in again.")
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          apiKey: session.apiKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search failed")
      }

      setResults(data.results || [])
      setSearchInfo({
        remaining: data.remaining,
        limit: data.limit,
      })
    } catch (err) {
      setError(err.message || "An error occurred during search")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Search Tool</CardTitle>
          <CardDescription>Search for information across multiple sources</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your search query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
                {!loading && <Search className="ml-2 h-4 w-4" />}
              </Button>
            </div>

            {searchInfo && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>
                    Daily searches used: {searchInfo.limit - searchInfo.remaining}/{searchInfo.limit}
                  </span>
                  <span>Remaining: {searchInfo.remaining}</span>
                </div>
                <Progress value={((searchInfo.limit - searchInfo.remaining) / searchInfo.limit) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  <Info className="inline h-3 w-3 mr-1" />
                  Search limits reset daily at midnight UTC
                </p>
              </div>
            )}
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Searching across multiple sources...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <h4 className="text-md font-medium">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {result.title || "No title"}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{result.url}</p>
                      <p className="mt-2 text-sm">{result.snippet || "No description available"}</p>
                      {result.date && <p className="text-xs text-gray-500 mt-1">{formatDate(result.date)}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && !error && query && (
            <div className="mt-4 text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No results found. Try a different search query.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-gray-500">Powered by CSINT Network Search</CardFooter>
      </Card>
    </div>
  )
}
