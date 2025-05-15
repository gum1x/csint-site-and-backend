"use server"

import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { generateApiKey } from "@/lib/auth"

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function generateNewKey(planType: string, expirationDays: number) {
  try {
    const key = generateApiKey()

    // Create key that remains valid until used
    // expires_at will be calculated when the key is redeemed with an email
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        key,
        plan_type: planType,
        duration_days: expirationDays,
        is_active: true,
        created_by: "admin", // Required field
        // Set a placeholder expiration date (will be updated on redemption)
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

// New function to generate multiple keys at once
export async function generateMultipleKeys(planType: string, expirationDays: number, count: number) {
  try {
    if (count <= 0 || count > 100) {
      return { success: false, error: "Count must be between 1 and 100" }
    }

    const keys = []
    const keyData = []

    // Generate the specified number of keys
    for (let i = 0; i < count; i++) {
      const key = generateApiKey()
      keys.push(key)
      keyData.push({
        key,
        plan_type: planType,
        duration_days: expirationDays,
        is_active: true,
        created_by: "admin",
        expires_at: new Date(2099, 0, 1).toISOString(),
      })
    }

    // Insert all keys in a single batch
    const { data, error } = await supabaseAdmin.from("api_keys").insert(keyData).select()

    if (error) {
      console.error("Error generating multiple keys:", error)
      return { success: false, error: "Failed to generate keys" }
    }

    return {
      success: true,
      keys,
      count: keys.length,
    }
  } catch (error) {
    console.error("Generate multiple keys error:", error)
    return { success: false, error: "Failed to generate keys" }
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
