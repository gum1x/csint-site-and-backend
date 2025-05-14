import { cookies } from "next/headers"
import { verifyAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminTestPage() {
  const token = cookies().get("admin_token")?.value

  if (!token) {
    return redirect("/1923/admin/login")
  }

  const isValid = await verifyAdminSession(token)

  if (!isValid) {
    return redirect("/1923/admin/login")
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Authentication Test</h1>
      <div className="bg-green-900/30 border border-green-800 rounded-md p-4 text-green-200">
        <p>✅ Authentication successful!</p>
        <p className="mt-2">Your admin token is valid.</p>
      </div>
      <div className="mt-4">
        <a href="/1923/admin" className="text-emerald-400 hover:underline">
          Go to Admin Panel
        </a>
      </div>
    </div>
  )
}
