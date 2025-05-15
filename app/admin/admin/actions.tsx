"use server"
import { createClient } from "@supabase/supabase-js"
import { generateApiKey } from "@/lib/auth"

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function generateNewKey(planType: string, expirationDays: number) {
  try {
    const key = generateApiKey()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    // Using the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        key,
        plan_type: planType,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_by: "admin", // Required field
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
      expiresAt: expiresAt.toISOString(),
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
