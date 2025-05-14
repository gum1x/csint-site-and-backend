import { NextResponse } from "next/server"
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const isValid = await verifyAdminCredentials(username, password)

    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const { token, expiresAt } = await createAdminSession(username)

    // Create a response
    const response = NextResponse.json({ success: true })

    // Set the cookie
    response.cookies.set({
      name: "admin_token",
      value: token,
      expires: expiresAt,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("API login error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
