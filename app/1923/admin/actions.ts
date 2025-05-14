"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createAdminSession, verifyAdminCredentials, generateApiKey } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Update the adminLogin function to be more robust and add debugging
export async function adminLogin(username: string, password: string) {
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
      sameSite: "strict",
    })
    console.log("Cookie set, login successful")

    return { success: true }
  } catch (error) {
    console.error("Admin login error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export async function adminLogout() {
  cookies().delete("admin_token")
  redirect("/1923/admin/login")
}

export async function generateNewApiKey(planType: string, expirationDays: number) {
  try {
    const adminToken = cookies().get("admin_token")?.value

    if (!adminToken) {
      return { success: false, error: "Not authenticated" }
    }

    const key = generateApiKey()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        key,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
        created_by: adminToken,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error generating API key:", error)
      return { success: false, error: "Failed to generate API key" }
    }

    return {
      success: true,
      key,
      expiresAt: expiresAt.toISOString(),
      id: data.id,
    }
  } catch (error) {
    console.error("Generate API key error:", error)
    return { success: false, error: "Failed to generate API key" }
  }
}

export async function getApiKeys() {
  try {
    const { data, error } = await supabaseAdmin.from("api_keys").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching API keys:", error)
      return { success: false, error: "Failed to fetch API keys" }
    }

    return { success: true, keys: data }
  } catch (error) {
    console.error("Get API keys error:", error)
    return { success: false, error: "Failed to fetch API keys" }
  }
}

export async function deactivateApiKey(id: string) {
  try {
    const { error } = await supabaseAdmin.from("api_keys").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("Error deactivating API key:", error)
      return { success: false, error: "Failed to deactivate API key" }
    }

    return { success: true }
  } catch (error) {
    console.error("Deactivate API key error:", error)
    return { success: false, error: "Failed to deactivate API key" }
  }
}
