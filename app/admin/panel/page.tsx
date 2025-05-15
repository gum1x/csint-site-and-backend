"use client"

import { useState, useEffect } from "react"
import { getKeys, deactivateKey } from "../admin/actions"
import { generateNewKey, generateMultipleKeys } from "../admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clipboard, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AdminPanel() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [planType, setPlanType] = useState("basic")
  const [expirationDays, setExpirationDays] = useState(30)
  const [generatedKey, setGeneratedKey] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [keyCount, setKeyCount] = useState(10)
  const [generatedKeys, setGeneratedKeys] = useState([])
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    const result = await getKeys()
    if (result.success) {
      setKeys(result.keys)
    } else {
      setError("Failed to fetch keys")
    }
    setLoading(false)
  }

  const handleGenerateKey = async () => {
    setError(null)
    setSuccess(null)
    setGeneratedKey(null)

    if (bulkMode) {
      // Generate multiple keys
      const result = await generateMultipleKeys(planType, Number.parseInt(expirationDays), Number.parseInt(keyCount))
      if (result.success) {
        setGeneratedKeys(result.keys)
        setSuccess(`Successfully generated ${result.count} keys`)
        fetchKeys()
      } else {
        setError(result.error || "Failed to generate keys")
      }
    } else {
      // Generate a single key
      const result = await generateNewKey(planType, Number.parseInt(expirationDays))
      if (result.success) {
        setGeneratedKey(result.key)
        setSuccess("Key generated successfully")
        fetchKeys()
      } else {
        setError(result.error || "Failed to generate key")
      }
    }
  }

  const handleDeactivateKey = async (id) => {
    setError(null)
    const result = await deactivateKey(id)
    if (result.success) {
      setSuccess("Key deactivated successfully")
      fetchKeys()
    } else {
      setError(result.error || "Failed to deactivate key")
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const copyAllKeys = () => {
    const keysText = generatedKeys.map((k) => k.key).join("\n")
    navigator.clipboard.writeText(keysText)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const downloadKeysAsCSV = () => {
    const keysCSV = generatedKeys.map((k) => k.key).join("\n")
    const blob = new Blob([keysCSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `api_keys_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  const getKeyStatus = (key) => {
    if (!key.is_active) return "inactive"
    if (!key.email) return "unused"
    if (key.redeemed_at && new Date(key.expires_at) < new Date()) return "expired"
    return "active"
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge className="bg-red-500">Inactive</Badge>
      case "unused":
        return <Badge className="bg-blue-500">Unused</Badge>
      case "expired":
        return <Badge className="bg-gray-500">Expired</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate Keys</TabsTrigger>
          <TabsTrigger value="manage">Manage Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate API Keys</CardTitle>
              <CardDescription>Create new API keys for users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="bulkMode" className="flex items-center space-x-2">
                  <input
                    id="bulkMode"
                    type="checkbox"
                    checked={bulkMode}
                    onChange={() => setBulkMode(!bulkMode)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Bulk Generation Mode</span>
                </Label>
              </div>

              {bulkMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyCount">Number of Keys</Label>
                    <Input
                      id="keyCount"
                      type="number"
                      min="1"
                      max="100"
                      value={keyCount}
                      onChange={(e) => setKeyCount(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">Maximum 100 keys at once</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planType">Plan Type</Label>
                  <Select value={planType} onValueChange={setPlanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Expiration (days)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min="1"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerateKey}>Generate {bulkMode ? `${keyCount} Keys` : "Key"}</Button>
            </CardFooter>
          </Card>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          {generatedKey && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Generated API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <code className="text-sm font-mono">{generatedKey}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedKey)}>
                    <Clipboard className="h-4 w-4" />
                    <span className="ml-1">{copySuccess ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bulkMode && generatedKeys.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Generated API Keys</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyAllKeys}>
                    <Clipboard className="h-4 w-4 mr-1" />
                    {copySuccess ? "Copied!" : "Copy All"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadKeysAsCSV}>
                    <Download className="h-4 w-4 mr-1" />
                    Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {generatedKeys.map((keyObj, index) => (
                      <div key={keyObj.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                        <code className="text-sm font-mono">{keyObj.key}</code>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage API Keys</CardTitle>
              <CardDescription>View and manage existing API keys</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading keys...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Key</th>
                        <th className="p-2 text-left">Plan</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Created</th>
                        <th className="p-2 text-left">Expires</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((key) => (
                        <tr key={key.id} className="border-t">
                          <td className="p-2 font-mono text-sm">{key.key.substring(0, 12)}...</td>
                          <td className="p-2">{key.plan_type}</td>
                          <td className="p-2">{getStatusBadge(getKeyStatus(key))}</td>
                          <td className="p-2">{key.email || "Not assigned"}</td>
                          <td className="p-2">{formatDate(key.created_at)}</td>
                          <td className="p-2">
                            {key.redeemed_at
                              ? formatDate(key.expires_at)
                              : `${key.duration_days} days after activation`}
                          </td>
                          <td className="p-2">
                            {key.is_active && (
                              <Button variant="destructive" size="sm" onClick={() => handleDeactivateKey(key.id)}>
                                Deactivate
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
