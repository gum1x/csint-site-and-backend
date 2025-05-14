"use server"

import { cookies } from "next/headers"
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth"

// Remove the redirect and return success status instead
export async function adminLoginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  try {
    console.log("Admin login attempt for username:", username)
    const isValid = await verifyAdminCredentials(username, password)

    if (!isValid) {
      console.log("Invalid credentials")
      return { success: false, error: "Invalid credentials" }
    }

    console.log("Credentials valid, creating session")
    const { token, expiresAt } = await createAdminSession(username)
    console.log("Session created with token:", token.substring(0, 10) + "...")

    // Set secure HTTP-only cookie
    cookies().set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
      sameSite: "lax",
    })
    console.log("Cookie set, returning success")

    // Return success instead of redirecting
    return { success: true }
  } catch (error) {
    console.error("Admin login error:", error)
    return { success: false, error: "Authentication failed" }
  }
}
