"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  LogOut,
  Trash2,
  Calendar,
  Key,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Database,
  Shield,
  RefreshCw,
  Filter,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateNewKey, getKeys, deactivateKey } from "../admin/actions"

type ApiKey = {
  id: string
  key: string
  email: string | null
  plan_type: string
  created_at: string
  expires_at: string
  is_active: boolean
  last_used: string | null
  created_by: string
}

export default function AdminPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [filteredKeys, setFilteredKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newKey, setNewKey] = useState<{ key: string; expiresAt: string } | null>(null)
  const [planType, setPlanType] = useState("standard")
  const [expirationDays, setExpirationDays] = useState(30)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [copiedKey, setCopiedKey] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  // Check if user is authenticated
  useEffect(() => {
    // This is a simple check - in a real app, you'd verify with the server
    // We'll use localStorage to maintain login state
    const checkAuth = () => {
      // Store authentication state when coming from login page
      if (document.referrer.includes("/admin") && !document.referrer.includes("/admin/panel")) {
        localStorage.setItem("adminAuthenticated", "true")
      }

      // Check if authenticated
      const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true"

      if (!isAuthenticated) {
        router.push("/admin")
      }
    }

    checkAuth()
  }, [router])

  const fetchKeys = async () => {
    setIsLoading(true)
    try {
      const result = await getKeys()
      if (result.success) {
        setKeys(result.keys)
        setFilteredKeys(result.keys)
      } else {
        setError(result.error || "Failed to fetch keys")
      }
    } catch (err) {
      console.error("Error fetching keys:", err)
      setError("Failed to fetch keys")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = keys

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (key) =>
          key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (key.email && key.email.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((key) => (statusFilter === "active" ? key.is_active : !key.is_active))
    }

    // Plan filter
    if (planFilter !== "all") {
      result = result.filter((key) => key.plan_type === planFilter)
    }

    setFilteredKeys(result)
  }, [keys, searchTerm, statusFilter, planFilter])

  const handleGenerateKey = async () => {
    try {
      setIsGenerating(true)
      const result = await generateNewKey(planType, expirationDays)

      if (result.success) {
        setNewKey({
          key: result.key,
          expiresAt: result.expiresAt,
        })
        fetchKeys()
      } else {
        setError(result.error || "Failed to generate key")
      }
    } catch (err) {
      console.error("Error generating key:", err)
      setError("Failed to generate key")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeactivateKey = async (id: string) => {
    try {
      const result = await deactivateKey(id)

      if (result.success) {
        fetchKeys()
      } else {
        setError(result.error || "Failed to deactivate key")
      }
    } catch (err) {
      console.error("Error deactivating key:", err)
      setError("Failed to deactivate key")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    router.push("/admin")
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(""), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getKeyStatus = (key: ApiKey) => {
    if (!key.is_active) return "inactive"
    const now = new Date()
    const expiresAt = new Date(key.expires_at)
    if (expiresAt < now) return "expired"
    return "active"
  }

  const getActiveKeysCount = () => {
    return keys.filter((key) => key.is_active).length
  }

  const getExpiredKeysCount = () => {
    const now = new Date()
    return keys.filter((key) => key.is_active && new Date(key.expires_at) < now).length
  }

  const getAssignedKeysCount = () => {
    return keys.filter((key) => key.email).length
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            <span className="text-xl font-bold">Csint Network Admin</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Key className="h-5 w-5 mr-2 text-emerald-400" />
                Active Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getActiveKeysCount()}</div>
              <p className="text-sm text-gray-400 mt-1">Total active keys</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-cyan-400" />
                Assigned Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getAssignedKeysCount()}</div>
              <p className="text-sm text-gray-400 mt-1">Keys linked to users</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-400" />
                Expired Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getExpiredKeysCount()}</div>
              <p className="text-sm text-gray-400 mt-1">Keys past expiration date</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="bg-gray-900 border-gray-800 mb-6">
            <TabsTrigger value="keys" className="data-[state=active]:bg-gray-800">
              <Key className="h-4 w-4 mr-2" />
              Keys
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-0">
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search by key or email..."
                      className="border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] border-gray-700 bg-gray-800 text-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[130px] border-gray-700 bg-gray-800 text-white">
                      <Database className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={fetchKeys}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-4" />
                  <p className="text-gray-400">Loading keys...</p>
                </div>
              ) : filteredKeys.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-800">
                  <Database className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300">No keys found</h3>
                  <p className="text-gray-500 mt-2">
                    {searchTerm || statusFilter !== "all" || planFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Generate your first key to get started"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4">Key</th>
                        <th className="text-left py-3 px-4">Plan</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Created</th>
                        <th className="text-left py-3 px-4">Expires</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeys.map((key) => (
                        <tr key={key.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="font-mono text-sm truncate max-w-[180px]">{key.key}</div>
                              <button
                                onClick={() => copyToClipboard(key.key)}
                                className="ml-2 text-gray-400 hover:text-white"
                                aria-label="Copy key"
                              >
                                {copiedKey === key.key ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                key.plan_type === "premium"
                                  ? "bg-purple-900/50 text-purple-300"
                                  : key.plan_type === "enterprise"
                                    ? "bg-blue-900/50 text-blue-300"
                                    : key.plan_type === "standard"
                                      ? "bg-emerald-900/50 text-emerald-300"
                                      : "bg-gray-800 text-gray-300"
                              }`}
                            >
                              {key.plan_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {key.email ? (
                              <div className="text-sm truncate max-w-[180px]">{key.email}</div>
                            ) : (
                              <span className="text-gray-500 text-sm">Not assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{formatDate(key.created_at)}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {formatDate(key.expires_at)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                getKeyStatus(key) === "active"
                                  ? "bg-green-900/50 text-green-300"
                                  : getKeyStatus(key) === "expired"
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-red-900/50 text-red-300"
                              }`}
                            >
                              {getKeyStatus(key) === "active"
                                ? "Active"
                                : getKeyStatus(key) === "expired"
                                  ? "Expired"
                                  : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  disabled={!key.is_active}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                                <DialogHeader>
                                  <DialogTitle>Deactivate Key</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Are you sure you want to deactivate this key? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="bg-gray-800 p-4 rounded-md my-4 font-mono text-sm break-all">
                                  {key.key}
                                </div>
                                {key.email && (
                                  <div className="text-sm text-gray-400 mb-4">
                                    This key is assigned to <span className="text-white">{key.email}</span>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                                    onClick={() => {}}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDeactivateKey(key.id)}
                                  >
                                    Deactivate
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-0">
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-emerald-400" />
                Generate New Key
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-type">Plan Type</Label>
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Select the plan type for this key</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration (days)</Label>
                    <Input
                      id="expiration"
                      type="number"
                      min="1"
                      max="365"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(Number.parseInt(e.target.value))}
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                    <p className="text-xs text-gray-500">Number of days until the key expires</p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700"
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate New Key
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  {newKey ? (
                    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                      <h3 className="font-semibold text-emerald-300 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        New Key Generated
                      </h3>
                      <div className="bg-black p-4 rounded-md mb-4 font-mono text-sm break-all relative group">
                        {newKey.key}
                        <button
                          onClick={() => copyToClipboard(newKey.key)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-white"
                          aria-label="Copy key"
                        >
                          {copiedKey === newKey.key ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Expires: {formatDate(newKey.expiresAt)}</span>
                      </div>
                      <div className="bg-yellow-900/30 border border-yellow-800 rounded-md p-3 text-yellow-200 text-sm">
                        <AlertCircle className="h-4 w-4 inline-block mr-2" />
                        Copy this key now. For security reasons, you won't be able to see it again!
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="text-center">
                        <Key className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-300">No key generated yet</h3>
                        <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                          Fill out the form and click "Generate New Key" to create a key
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
