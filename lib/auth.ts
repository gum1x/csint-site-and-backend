import { randomBytes, createHash } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseClient"

// Initialize Supabase admin client
const adminCredentials = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "password",
}

// Generate a random API key
export function generateApiKey(): string {
  // Generate a random string of 32 bytes and convert to hex
  const randomString = randomBytes(32).toString("hex")

  // Create a hash of the random string
  const hash = createHash("sha256").update(randomString).digest("hex")

  // Return the first 32 characters of the hash
  return hash.substring(0, 32)
}

// Generate a random token for sessions
export function generateToken(): string {
  return randomBytes(64).toString("hex")
}

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    // In a real app, you would check against a database
    // For now, we'll use environment variables or hardcoded values for demo
    return username === adminCredentials.username && password === adminCredentials.password
  } catch (error) {
    console.error("Error verifying admin credentials:", error)
    return false
  }
}

// Create an admin session
export async function createAdminSession(username: string) {
  try {
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    // Store the session in the database
    await supabaseAdmin.from("admin_sessions").insert({
      username,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    return { token, expiresAt }
  } catch (error) {
    console.error("Error creating admin session:", error)
    throw error
  }
}

// Verify an admin session
export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.from("admin_sessions").select("*").eq("session_token", token).single()

    if (error || !data) {
      return false
    }

    // Check if the session is expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    return now < expiresAt
  } catch (error) {
    console.error("Error verifying admin session:", error)
    return false
  }
}

// Create a user session
export async function createUserSession(email: string, apiKeyId: string) {
  try {
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

    // Store the session in the database
    await supabaseAdmin.from("user_sessions").insert({
      email,
      api_key_id: apiKeyId,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    return { token, expiresAt }
  } catch (error) {
    console.error("Error creating user session:", error)
    throw error
  }
}

// Verify a user session
export async function verifyUserSession(token: string) {
  try {
    const { data, error } = await supabaseAdmin.from("user_sessions").select("*").eq("session_token", token).single()

    if (error || !data) {
      return null
    }

    // Check if the session is expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    if (now >= expiresAt) {
      return null
    }

    return data
  } catch (error) {
    console.error("Error verifying user session:", error)
    return null
  }
}

// Verify key and handle first-time redemption
export async function verifyApiKey(key: string, email: string) {
  console.log("Verifying API key for email:", email)

  try {
    // Check if the key exists and is active
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("key", key)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      console.log("API key not found or not active")
      return null
    }

    // Check if this is the first time the key is being used (redemption)
    if (!data.email) {
      console.log("First time key usage - activating key and connecting email")

      // Calculate the actual expiration date based on duration_days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (data.duration_days || 30))

      // Update the key with email and redemption info and actual expiration
      const { error: updateError } = await supabaseAdmin
        .from("api_keys")
        .update({
          redeemed_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          email: email,
        })
        .eq("id", data.id)

      if (updateError) {
        console.error("Error redeeming API key:", updateError)
        return null
      }

      // Return the updated key data
      return {
        ...data,
        redeemed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        email: email,
      }
    }

    // For already redeemed keys, check if key is expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)

    if (now > expiresAt) {
      console.log("API key is expired")
      return null
    }

    // If email is already associated with this key, verify it matches
    if (data.email && data.email !== email) {
      console.log("Email mismatch for API key")
      return null
    }

    // Update last used timestamp
    await supabaseAdmin.from("api_keys").update({ last_used: new Date().toISOString() }).eq("id", data.id)

    console.log("API key verification successful")
    return data
  } catch (error) {
    console.error("Error verifying API key:", error)
    return null
  }
}
