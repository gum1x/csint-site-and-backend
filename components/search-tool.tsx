"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search } from "lucide-react"
import { SearchResults } from "@/components/search-results"

interface SearchToolProps {
  searchLimit: number
  searchCount: number
}

export function SearchTool({ searchLimit, searchCount }: SearchToolProps) {
  const [searchType, setSearchType] = useState<string>("email")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query is required",
        description: "Please enter a search term",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: searchType,
          query: searchQuery,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during the search")
      }

      setResults(data)
    } catch (err) {
      console.error("Search error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const remainingSearches = searchLimit - searchCount
  const isLimitReached = remainingSearches <= 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OSINT Search Tool</CardTitle>
          <CardDescription>
            Search for information about emails, domains, usernames, IPs, and phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Select value={searchType} onValueChange={setSearchType} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder={`Enter ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading && !isLimitReached) {
                        handleSearch()
                      }
                    }}
                  />
                  <Button onClick={handleSearch} disabled={isLoading || isLimitReached}>
                    {isLoading ? (
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
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className={`text-sm ${isLimitReached ? "text-red-500" : "text-gray-500"}`}>
            {isLimitReached
              ? "Daily search limit reached. Upgrade your plan for more searches."
              : `${remainingSearches} searches remaining today`}
          </p>
        </CardFooter>
      </Card>

      {(results || error) && (
        <SearchResults results={results} searchType={searchType} searchQuery={searchQuery} error={error || undefined} />
      )}
    </div>
  )
}
