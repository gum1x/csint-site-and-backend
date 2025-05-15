import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyApiKey } from "@/lib/auth"
import { rateLimit } from "@/lib/security"

// Initialize Supabase client with service role key for admin access
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Define search limits based on plan type
const SEARCH_LIMITS = {
  basic: 5,
  pro: 20,
  enterprise: 50,
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request)
    if (rateLimitResult.limited) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    // Parse request body
    const body = await request.json()
    const { query, apiKey } = body

    if (!query || !apiKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verify API key
    const keyVerification = await verifyApiKey(apiKey)
    if (!keyVerification.valid) {
      return NextResponse.json({ error: keyVerification.message || "Invalid API key" }, { status: 401 })
    }

    const { email, planType } = keyVerification

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Check if user has a search count record for today
    const { data: searchCountData, error: searchCountError } = await supabaseAdmin
      .from("search_count")
      .select("*")
      .eq("email", email)
      .eq("date", today)
      .single()

    if (searchCountError && searchCountError.code !== "PGRST116") {
      console.error("Error checking search count:", searchCountError)
      return NextResponse.json({ error: "Failed to check search limits" }, { status: 500 })
    }

    // Get the daily search limit based on plan type
    const searchLimit = SEARCH_LIMITS[planType] || SEARCH_LIMITS.basic

    // If no record exists for today, create one
    if (!searchCountData) {
      const { error: insertError } = await supabaseAdmin.from("search_count").insert({
        email,
        search_count: 0,
        api_call_count: 0,
        search_limit: searchLimit,
        api_call_limit: searchLimit * 10, // API call limit is 10x search limit
        date: today,
      })

      if (insertError) {
        console.error("Error creating search count record:", insertError)
        return NextResponse.json({ error: "Failed to initialize search limits" }, { status: 500 })
      }
    }

    // Get the latest search count data
    const { data: latestSearchCount, error: latestSearchError } = await supabaseAdmin
      .from("search_count")
      .select("*")
      .eq("email", email)
      .eq("date", today)
      .single()

    if (latestSearchError) {
      console.error("Error getting latest search count:", latestSearchError)
      return NextResponse.json({ error: "Failed to check search limits" }, { status: 500 })
    }

    // Check if user has reached their daily search limit
    if (latestSearchCount.search_count >= latestSearchCount.search_limit) {
      return NextResponse.json(
        { error: "Daily search limit reached. Please upgrade your plan or try again tomorrow." },
        { status: 403 },
      )
    }

    // Make the API call to OsintDog
    const osintDogKey = process.env.OSINTDOG_KEY
    if (!osintDogKey) {
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    const cleanQuery = query.trim()
    const apiUrl = `https://api.osintdog.com/search?q=${encodeURIComponent(cleanQuery)}`

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": osintDogKey,
      },
    })

    if (!response.ok) {
      console.error("OsintDog API error:", response.status, await response.text())
      return NextResponse.json({ error: "Search service error" }, { status: response.status })
    }

    const searchResults = await response.json()

    // Log the search
    await supabaseAdmin.from("search_logs").insert({
      query: cleanQuery,
      user_id: email, // Using email as user_id for now
      search_type: "osintdog",
      date: today,
    })

    // Update search count
    await supabaseAdmin
      .from("search_count")
      .update({
        search_count: latestSearchCount.search_count + 1,
        api_call_count: latestSearchCount.api_call_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", latestSearchCount.id)

    // Update last_used timestamp for the API key
    await supabaseAdmin.from("api_keys").update({ last_used: new Date().toISOString() }).eq("key", apiKey)

    return NextResponse.json({
      results: searchResults,
      remaining: latestSearchCount.search_limit - (latestSearchCount.search_count + 1),
      limit: latestSearchCount.search_limit,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
