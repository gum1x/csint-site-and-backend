import Link from "next/link"
import { Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SecurityViolationPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl p-8 border border-red-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-900/50 rounded-full">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Security Violation Detected</h1>

        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-red-200 font-medium">Unauthorized activity has been detected.</p>
            <p className="text-red-300/80 text-sm mt-1">
              For security reasons, your session has been terminated and all sensitive data has been cleared.
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          The use of developer tools, debugging tools, or other inspection methods is strictly prohibited on this
          platform. This security measure is in place to protect sensitive information and maintain the integrity of our
          services.
        </p>

        <div className="flex justify-center">
          <Button asChild className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          If you believe this is an error, please contact our support team.
        </p>
      </div>
    </div>
  )
}
