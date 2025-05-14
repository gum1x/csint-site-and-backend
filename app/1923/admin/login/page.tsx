"use client"

import { useState, useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, User, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adminLoginAction } from "./actions"
import { useFormStatus } from "react-dom"

// Initial state for the form
const initialState = {
  success: false,
  error: null,
}

// Submit button with loading state
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 transition-all"
      disabled={pending}
    >
      {pending ? "Authenticating..." : "Access Admin Panel"}
    </Button>
  )
}

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction] = useActionState(adminLoginAction, initialState)
  const router = useRouter()

  // Handle redirection on the client side when login is successful
  useEffect(() => {
    if (state?.success) {
      console.log("Login successful, redirecting to admin panel")
      router.push("/1923/admin")
    }
  }, [state, router])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-900 rounded-full">
              <Terminal className="h-10 w-10 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Access</h1>
          <p className="mt-2 text-gray-400">Secure authentication required</p>
        </div>

        <div className="mt-8 rounded-xl bg-gray-900 p-6 md:p-8 shadow-2xl border border-gray-800">
          {state?.error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  placeholder="Enter admin username"
                  className="border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  className="border-gray-700 bg-gray-800 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <SubmitButton />
          </form>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Secure admin access for Csint Network</p>
          <p className="mt-1">Unauthorized access is prohibited</p>
        </div>
      </div>
    </div>
  )
}
