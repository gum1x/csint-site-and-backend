import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyUserSession } from "@/lib/auth"
import { cookies } from "next/headers"

// Initialize Supabase admin client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Get the user token from cookies
    const token = cookies().get("user_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token
    const session = await verifyUserSession(token)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.email

    // Get the API key ID from the session
    const apiKeyId = session.api_key_id

    // Fetch the API key details to get the plan type
    const { data: apiKey, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("id", apiKeyId)
      .single()

    if (keyError) {
      console.error("Error fetching API key:", keyError)
      return NextResponse.json({ error: "Failed to fetch plan information" }, { status: 500 })
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Get the user's search count for today
    const { data: searchCountData, error: searchCountError } = await supabaseAdmin
      .from("search_count")
      .select("*")
      .eq("email", email)
      .eq("date", today)
      .single()

    if (searchCountError && searchCountError.code !== "PGRST116") {
      console.error("Error fetching search count:", searchCountError)
      return NextResponse.json({ error: "Failed to fetch usage statistics" }, { status: 500 })
    }

    // Get the plan limits
    const planType = apiKey.plan_type || "basic"

    // Define plan limits
    const planLimits = {
      basic: { searches: 50, apiCalls: 200 },
      standard: { searches: 100, apiCalls: 500 },
      premium: { searches: 200, apiCalls: 1000 },
      enterprise: { searches: 1000, apiCalls: 5000 },
    }

    const limits = planLimits[planType as keyof typeof planLimits] || planLimits.basic

    // If no record exists for today, return zeros with plan limits
    if (!searchCountData) {
      return NextResponse.json({
        plan_type: planType,
        search_count: 0,
        api_call_count: 0,
        search_limit: limits.searches,
        api_call_limit: limits.apiCalls,
        date: today,
      })
    }

    // Return the daily plan statistics
    return NextResponse.json({
      plan_type: planType,
      search_count: searchCountData.search_count,
      api_call_count: searchCountData.api_call_count,
      search_limit: limits.searches,
      api_call_limit: limits.apiCalls,
      date: searchCountData.date,
    })
  } catch (error) {
    console.error("Plan stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
