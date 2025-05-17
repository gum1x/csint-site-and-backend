"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PdfDownloadButton } from "@/components/pdf-download-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchResultsProps {
  results: any
  searchType: string
  searchQuery: string
  isLoading: boolean
}

export function SearchResults({ results, searchType, searchQuery, isLoading }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("summary")

  // Reset active tab when new results come in
  useEffect(() => {
    if (results) {
      setActiveTab("summary")
    }
  }, [results])

  if (!results || Object.keys(results).length === 0) {
    return null
  }

  return (
    <Card className="mt-6 overflow-hidden border-purple-200 shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 pb-2 pt-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            Results for {searchType}: {searchQuery}
          </CardTitle>
          <div className="flex items-center">
            <Badge variant="outline" className="mr-2 border-white text-white">
              {searchType.toUpperCase()}
            </Badge>
            <PdfDownloadButton searchType={searchType} searchQuery={searchQuery} disabled={isLoading} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-purple-50">
            <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              Summary
            </TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              Details
            </TabsTrigger>
            <TabsTrigger value="raw" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              Raw Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="p-4">
            <SummaryTab results={results} searchType={searchType} />
          </TabsContent>

          <TabsContent value="details" className="p-4">
            <DetailsTab results={results} searchType={searchType} />
          </TabsContent>

          <TabsContent value="raw" className="p-4">
            <RawDataTab results={results} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SummaryTab({ results, searchType }: { results: any; searchType: string }) {
  switch (searchType) {
    case "email":
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">Email Information</h3>
            <p>
              <span className="font-medium">Email:</span> {results.email}
            </p>
            <p>
              <span className="font-medium">Valid:</span>{" "}
              <Badge variant={results.valid ? "success" : "destructive"}>{results.valid ? "Yes" : "No"}</Badge>
            </p>
            {results.disposable !== undefined && (
              <p>
                <span className="font-medium">Disposable:</span>{" "}
                <Badge variant={!results.disposable ? "success" : "destructive"}>
                  {results.disposable ? "Yes" : "No"}
                </Badge>
              </p>
            )}
          </div>

          {results.breaches && results.breaches.length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-red-800">Breach Information</h3>
              <p>
                <span className="font-medium">Found in breaches:</span>{" "}
                <Badge variant="destructive">{results.breaches.length}</Badge>
              </p>
            </div>
          )}

          {results.profiles && results.profiles.length > 0 && (
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-blue-800">Social Profiles</h3>
              <p>
                <span className="font-medium">Found profiles:</span> <Badge>{results.profiles.length}</Badge>
              </p>
            </div>
          )}
        </div>
      )

    case "domain":
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">Domain Information</h3>
            <p>
              <span className="font-medium">Domain:</span> {results.domain}
            </p>
            {results.registrar && (
              <p>
                <span className="font-medium">Registrar:</span> {results.registrar}
              </p>
            )}
            {results.creation_date && (
              <p>
                <span className="font-medium">Created:</span> {results.creation_date}
              </p>
            )}
            {results.expiration_date && (
              <p>
                <span className="font-medium">Expires:</span> {results.expiration_date}
              </p>
            )}
          </div>

          {results.ip_addresses && results.ip_addresses.length > 0 && (
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-blue-800">IP Addresses</h3>
              <p>
                <span className="font-medium">IP Count:</span> <Badge>{results.ip_addresses.length}</Badge>
              </p>
            </div>
          )}
        </div>
      )

    case "ip":
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">IP Information</h3>
            <p>
              <span className="font-medium">IP:</span> {results.ip}
            </p>
            {results.type && (
              <p>
                <span className="font-medium">Type:</span> {results.type}
              </p>
            )}
          </div>

          {results.location && (
            <div className="rounded-md bg-green-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-green-800">Location</h3>
              {results.location.country && (
                <p>
                  <span className="font-medium">Country:</span> {results.location.country}
                </p>
              )}
              {results.location.city && (
                <p>
                  <span className="font-medium">City:</span> {results.location.city}
                </p>
              )}
            </div>
          )}

          {results.security && (
            <div className="rounded-md bg-amber-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-amber-800">Security</h3>
              {results.security.tor !== undefined && (
                <p>
                  <span className="font-medium">Tor:</span>{" "}
                  <Badge variant={results.security.tor ? "destructive" : "success"}>
                    {results.security.tor ? "Yes" : "No"}
                  </Badge>
                </p>
              )}
              {results.security.proxy !== undefined && (
                <p>
                  <span className="font-medium">Proxy:</span>{" "}
                  <Badge variant={results.security.proxy ? "warning" : "success"}>
                    {results.security.proxy ? "Yes" : "No"}
                  </Badge>
                </p>
              )}
              {results.security.vpn !== undefined && (
                <p>
                  <span className="font-medium">VPN:</span>{" "}
                  <Badge variant={results.security.vpn ? "warning" : "success"}>
                    {results.security.vpn ? "Yes" : "No"}
                  </Badge>
                </p>
              )}
            </div>
          )}
        </div>
      )

    case "username":
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">Username Information</h3>
            <p>
              <span className="font-medium">Username:</span> {results.username}
            </p>
          </div>

          {results.profiles && results.profiles.length > 0 && (
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-blue-800">Social Profiles</h3>
              <p>
                <span className="font-medium">Found profiles:</span> <Badge>{results.profiles.length}</Badge>
              </p>
              <p>
                <span className="font-medium">Confirmed profiles:</span>{" "}
                <Badge variant="success">{results.profiles.filter((p: any) => p.status === "found").length}</Badge>
              </p>
            </div>
          )}
        </div>
      )

    case "phone":
      return (
        <div className="space-y-4">
          <div className="rounded-md bg-purple-50 p-4">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">Phone Information</h3>
            <p>
              <span className="font-medium">Phone:</span> {results.phone}
            </p>
            {results.valid !== undefined && (
              <p>
                <span className="font-medium">Valid:</span>{" "}
                <Badge variant={results.valid ? "success" : "destructive"}>{results.valid ? "Yes" : "No"}</Badge>
              </p>
            )}
            {results.type && (
              <p>
                <span className="font-medium">Type:</span> {results.type}
              </p>
            )}
            {results.carrier && (
              <p>
                <span className="font-medium">Carrier:</span> {results.carrier}
              </p>
            )}
          </div>

          {results.location && (
            <div className="rounded-md bg-green-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-green-800">Location</h3>
              {results.location.country && (
                <p>
                  <span className="font-medium">Country:</span> {results.location.country}
                </p>
              )}
              {results.location.region && (
                <p>
                  <span className="font-medium">Region:</span> {results.location.region}
                </p>
              )}
              {results.location.city && (
                <p>
                  <span className="font-medium">City:</span> {results.location.city}
                </p>
              )}
            </div>
          )}
        </div>
      )

    default:
      return <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
  }
}

function DetailsTab({ results, searchType }: { results: any; searchType: string }) {
  switch (searchType) {
    case "email":
      return (
        <div className="space-y-6">
          {results.breaches && results.breaches.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">Breach Details</h3>
              <div className="space-y-4">
                {results.breaches.map((breach: any, index: number) => (
                  <Card key={index} className="border-red-200">
                    <CardHeader className="bg-red-50 pb-2 pt-2">
                      <CardTitle className="text-base text-red-800">{breach.name || "Unknown Breach"}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {breach.date && <p className="mb-2 text-sm">Date: {breach.date}</p>}
                      {breach.description && <p className="text-sm">{breach.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results.profiles && results.profiles.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">Social Profiles</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.profiles.map((profile: any, index: number) => (
                  <Card key={index} className="border-blue-200">
                    <CardHeader className="bg-blue-50 pb-2 pt-2">
                      <CardTitle className="text-base text-blue-800">{profile.site}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {profile.url && (
                        <a
                          href={profile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {profile.url}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    case "domain":
      return (
        <div className="space-y-6">
          {results.nameservers && results.nameservers.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">Nameservers</h3>
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <ul className="list-inside list-disc space-y-1">
                    {results.nameservers.map((ns: string, index: number) => (
                      <li key={index} className="text-sm">
                        {ns}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {results.ip_addresses && results.ip_addresses.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">IP Addresses</h3>
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <ul className="list-inside list-disc space-y-1">
                    {results.ip_addresses.map((ip: string, index: number) => (
                      <li key={index} className="text-sm">
                        {ip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {results.whois && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">WHOIS Information</h3>
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{results.whois}</pre>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )

    case "username":
      return (
        <div className="space-y-6">
          {results.profiles && results.profiles.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-purple-800">Social Profiles</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.profiles.map((profile: any, index: number) => (
                  <Card key={index} className={`border-${profile.status === "found" ? "green" : "gray"}-200`}>
                    <CardHeader className={`bg-${profile.status === "found" ? "green" : "gray"}-50 pb-2 pt-2`}>
                      <CardTitle className="text-base text-purple-800">{profile.site}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="mb-2 text-sm">
                        Status:{" "}
                        <Badge variant={profile.status === "found" ? "success" : "outline"}>
                          {profile.status === "found" ? "Found" : "Not Found"}
                        </Badge>
                      </p>
                      {profile.url && (
                        <a
                          href={profile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {profile.url}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return <pre className="whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
  }
}

function RawDataTab({ results }: { results: any }) {
  return (
    <div className="rounded-md bg-gray-50 p-4">
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(results, null, 2)}</pre>
    </div>
  )
}
