"use server"

import { cookies } from "next/headers"
import { createUserSession, verifyApiKey } from "@/lib/auth"

// Update the userLogin function to properly handle key redemption
export async function userLogin(email: string, apiKey: string) {
  try {
    console.log("Attempting login for:", email)

    // verifyApiKey now handles redemption logic internally
    const keyData = await verifyApiKey(apiKey, email)

    if (!keyData) {
      console.log("Invalid or expired API key")
      return { success: false, error: "Invalid or expired API key" }
    }

    console.log("API key verified successfully")

    // Create a user session
    const { token, expiresAt } = await createUserSession(email, keyData.id)

    // Set secure HTTP-only cookie with proper settings
    cookies().set({
      name: "user_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
      sameSite: "lax",
    })

    console.log("Session cookie set, login successful")

    return { success: true }
  } catch (error) {
    console.error("User login error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function userLogout() {
  cookies().delete("user_token")
  return { success: true }
}
