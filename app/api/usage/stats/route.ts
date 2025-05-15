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

    // If no record exists for today, return zeros
    if (!searchCountData) {
      return NextResponse.json({
        search_count: 0,
        api_call_count: 0,
        search_limit: 0,
        api_call_limit: 0,
        date: today,
      })
    }

    // Return the search count data
    return NextResponse.json({
      search_count: searchCountData.search_count,
      api_call_count: searchCountData.api_call_count,
      search_limit: searchCountData.search_limit,
      api_call_limit: searchCountData.api_call_limit,
      date: searchCountData.date,
    })
  } catch (error) {
    console.error("Usage stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
