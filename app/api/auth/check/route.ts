import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyUserSession } from "@/lib/auth"

export async function GET() {
  try {
    const token = cookies().get("user_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false, reason: "No token" }, { status: 401 })
    }

    const session = await verifyUserSession(token)

    if (!session) {
      return NextResponse.json({ authenticated: false, reason: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false, error: "Failed to check authentication" }, { status: 500 })
  }
}
