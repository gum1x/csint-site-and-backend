"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PdfDownloadButton } from "@/components/pdf-download-button"
import { AlertCircle, CheckCircle, XCircle, Globe, Mail, User, Phone, Network } from "lucide-react"

interface SearchResultsProps {
  results: any
  searchType: string
  searchQuery: string
  error?: string
}

export function SearchResults({ results, searchType, searchQuery, error }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Reset to overview tab when new results come in
  useEffect(() => {
    setActiveTab("overview")
  }, [results])

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!results) {
    return null
  }

  // Determine icon based on search type
  const getTypeIcon = () => {
    switch (searchType) {
      case "email":
        return <Mail className="h-5 w-5" />
      case "domain":
        return <Globe className="h-5 w-5" />
      case "username":
        return <User className="h-5 w-5" />
      case "phone":
        return <Phone className="h-5 w-5" />
      case "ip":
        return <Network className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {searchType.charAt(0).toUpperCase() + searchType.slice(1)} Search Results
          </CardTitle>
          <CardDescription>
            Results for: <span className="font-medium">{searchQuery}</span>
          </CardDescription>
        </div>
        <PdfDownloadButton searchType={searchType} searchQuery={searchQuery} />
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {searchType === "email" && results.breaches && results.breaches.length > 0 && (
              <TabsTrigger value="breaches">
                Breaches{" "}
                <Badge variant="outline" className="ml-2">
                  {results.breaches.length}
                </Badge>
              </TabsTrigger>
            )}
            {searchType === "username" && results.profiles && results.profiles.length > 0 && (
              <TabsTrigger value="profiles">
                Profiles{" "}
                <Badge variant="outline" className="ml-2">
                  {results.profiles.length}
                </Badge>
              </TabsTrigger>
            )}
            {searchType === "domain" && <TabsTrigger value="whois">WHOIS</TabsTrigger>}
            {searchType === "ip" && <TabsTrigger value="location">Location</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Email Overview */}
            {searchType === "email" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <strong>Email:</strong> {results.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Valid:</strong>
                    {results.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Disposable:</strong>
                    {results.disposable ? (
                      <CheckCircle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>Domain:</strong> {results.domain}
                  </div>
                </div>
                {results.breaches && results.breaches.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Breaches Detected</AlertTitle>
                    <AlertDescription>
                      This email was found in {results.breaches.length} data breaches.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Domain Overview */}
            {searchType === "domain" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <strong>Domain:</strong> {results.domain}
                </div>
                {results.registrar && (
                  <div className="flex items-center gap-2">
                    <strong>Registrar:</strong> {results.registrar}
                  </div>
                )}
                {results.creation_date && (
                  <div className="flex items-center gap-2">
                    <strong>Created:</strong> {new Date(results.creation_date).toLocaleDateString()}
                  </div>
                )}
                {results.expiration_date && (
                  <div className="flex items-center gap-2">
                    <strong>Expires:</strong> {new Date(results.expiration_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Username Overview */}
            {searchType === "username" && (
              <>
                <div className="flex items-center gap-2">
                  <strong>Username:</strong> {results.username}
                </div>
                {results.profiles && results.profiles.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Profiles Found</AlertTitle>
                    <AlertDescription>This username was found on {results.profiles.length} platforms.</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* IP Overview */}
            {searchType === "ip" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <strong>IP:</strong> {results.ip}
                </div>
                {results.type && (
                  <div className="flex items-center gap-2">
                    <strong>Type:</strong> {results.type}
                  </div>
                )}
                {results.isp && (
                  <div className="flex items-center gap-2">
                    <strong>ISP:</strong> {results.isp}
                  </div>
                )}
                {results.asn && (
                  <div className="flex items-center gap-2">
                    <strong>ASN:</strong> {results.asn}
                  </div>
                )}
                {results.security && (
                  <>
                    <div className="flex items-center gap-2">
                      <strong>Tor:</strong>
                      {results.security.tor ? (
                        <CheckCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Proxy:</strong>
                      {results.security.proxy ? (
                        <CheckCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>VPN:</strong>
                      {results.security.vpn ? (
                        <CheckCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Phone Overview */}
            {searchType === "phone" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <strong>Phone:</strong> {results.phone}
                </div>
                {results.valid !== undefined && (
                  <div className="flex items-center gap-2">
                    <strong>Valid:</strong>
                    {results.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
                {results.type && (
                  <div className="flex items-center gap-2">
                    <strong>Type:</strong> {results.type}
                  </div>
                )}
                {results.carrier && (
                  <div className="flex items-center gap-2">
                    <strong>Carrier:</strong> {results.carrier}
                  </div>
                )}
                {results.location && results.location.country && (
                  <div className="flex items-center gap-2">
                    <strong>Country:</strong> {results.location.country}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Email Breaches Tab */}
          {searchType === "email" && results.breaches && (
            <TabsContent value="breaches">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {results.breaches.map((breach: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{breach.name || "Unknown Breach"}</CardTitle>
                        {breach.date && (
                          <CardDescription>Breach Date: {new Date(breach.date).toLocaleDateString()}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {breach.description && <p>{breach.description}</p>}
                        {breach.data_classes && (
                          <div className="mt-2">
                            <strong>Compromised Data:</strong>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {breach.data_classes.map((dataClass: string, i: number) => (
                                <Badge key={i} variant="secondary">
                                  {dataClass}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Username Profiles Tab */}
          {searchType === "username" && results.profiles && (
            <TabsContent value="profiles">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {results.profiles.map((profile: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{profile.site || "Unknown Platform"}</CardTitle>
                        <CardDescription>
                          Status: {profile.status === "found" ? "Account Found" : "Not Found"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {profile.url && (
                          <a
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Profile
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          {/* Domain WHOIS Tab */}
          {searchType === "domain" && (
            <TabsContent value="whois">
              <Card>
                <CardHeader>
                  <CardTitle>WHOIS Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.whois ? (
                    <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm overflow-auto max-h-[400px]">
                      {results.whois}
                    </pre>
                  ) : (
                    <p>No WHOIS information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* IP Location Tab */}
          {searchType === "ip" && results.location && (
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.location.country && (
                      <div className="flex items-center gap-2">
                        <strong>Country:</strong> {results.location.country}
                      </div>
                    )}
                    {results.location.region && (
                      <div className="flex items-center gap-2">
                        <strong>Region:</strong> {results.location.region}
                      </div>
                    )}
                    {results.location.city && (
                      <div className="flex items-center gap-2">
                        <strong>City:</strong> {results.location.city}
                      </div>
                    )}
                    {results.location.postal_code && (
                      <div className="flex items-center gap-2">
                        <strong>Postal Code:</strong> {results.location.postal_code}
                      </div>
                    )}
                    {results.location.latitude && results.location.longitude && (
                      <div className="col-span-2">
                        <strong>Coordinates:</strong> {results.location.latitude}, {results.location.longitude}
                      </div>
                    )}
                  </div>

                  {results.location.latitude && results.location.longitude && (
                    <div className="mt-4 h-[300px] bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-500">Map view would be displayed here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
