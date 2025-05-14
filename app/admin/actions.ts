"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { generateApiKey } from "@/lib/auth"

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function generateNewKey(planType: string, expirationDays: number) {
  try {
    const key = generateApiKey()

    // We'll store duration_days instead of calculating expiration upfront
    // expires_at will be calculated when the key is redeemed
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        key,
        plan_type: planType,
        duration_days: expirationDays,
        is_active: true,
        created_by: "admin", // Required field
        // Set a far future date as placeholder (will be updated on redemption)
        expires_at: new Date(2099, 0, 1).toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error generating key:", error)
      return { success: false, error: "Failed to generate key" }
    }

    return {
      success: true,
      key,
      duration_days: expirationDays,
      id: data.id,
    }
  } catch (error) {
    console.error("Generate key error:", error)
    return { success: false, error: "Failed to generate key" }
  }
}

export async function getKeys() {
  try {
    const { data, error } = await supabaseAdmin.from("api_keys").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching keys:", error)
      return { success: false, error: "Failed to fetch keys" }
    }

    return { success: true, keys: data }
  } catch (error) {
    console.error("Get keys error:", error)
    return { success: false, error: "Failed to fetch keys" }
  }
}

export async function deactivateKey(id: string) {
  try {
    const { error } = await supabaseAdmin.from("api_keys").update({ is_active: false }).eq("id", id)

    if (error) {
      console.error("Error deactivating key:", error)
      return { success: false, error: "Failed to deactivate key" }
    }

    return { success: true }
  } catch (error) {
    console.error("Deactivate key error:", error)
    return { success: false, error: "Failed to deactivate key" }
  }
}

export async function adminLogout() {
  cookies().delete("admin_token")
  return { success: true }
}
