import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyUserSession, generateToken } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase admin client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    // Get the current token
    const currentToken = cookies().get("user_token")?.value

    if (!currentToken) {
      return NextResponse.json({ success: false, error: "No session found" }, { status: 401 })
    }

    // Verify the current session
    const session = await verifyUserSession(currentToken)

    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    // Generate a new token
    const newToken = generateToken()

    // Set expiration to 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Update the session in the database
    const { error } = await supabaseAdmin
      .from("user_sessions")
      .update({
        session_token: newToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq("session_token", currentToken)

    if (error) {
      console.error("Failed to refresh session:", error)
      return NextResponse.json({ success: false, error: "Failed to refresh session" }, { status: 500 })
    }

    // Create a response
    const response = NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })

    // Set the new cookie
    response.cookies.set({
      name: "user_token",
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({ success: false, error: "Failed to refresh session" }, { status: 500 })
  }
}
