import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyUserSession } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const SUPPORTED_TYPES = ["email", "username", "domain", "phone", "ip"]

// Initialize Supabase admin client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Get the user token from cookies - use the same method as the dashboard
    const token = cookies().get("user_token")?.value

    if (!token) {
      console.log("Search API: No token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token directly using our auth helper
    const session = await verifyUserSession(token)

    if (!session) {
      console.log("Search API: Invalid or expired token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Search API: User authenticated:", session.email)

    // Get the user's API key directly from the session data
    const apiKeyId = session.api_key_id

    // Fetch the API key details
    const { data: apiKey, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("id", apiKeyId)
      .eq("is_active", true)
      .single()

    if (keyError || !apiKey) {
      console.log("Search API: No active API key found")
      return NextResponse.json({ error: "No active API key found" }, { status: 403 })
    }

    // Parse the request body
    const body = await request.json()
    const { type, query } = body

    if (!type || !query) {
      return NextResponse.json({ error: "Missing 'type' or 'query' in request body" }, { status: 400 })
    }

    if (!SUPPORTED_TYPES.includes(type.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid type. Supported types: ${SUPPORTED_TYPES.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Make request to OsintDog API
    const response = await fetch("https://osintdog.com/search/api/search", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.OSINTDOG_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field: [{ [type]: query }] }),
    })

    if (!response.ok) {
      console.log("Search API: Error from search provider:", response.statusText)
      return NextResponse.json(
        {
          error: `Error from search provider: ${response.statusText}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Clean the data
    const cleanedData = cleanData(data)

    // Log the search for analytics
    await supabaseAdmin.from("search_logs").insert({
      user_id: session.email, // Use email as user_id
      search_type: type,
      query: query,
    })

    // Increment the search count for this user
    try {
      // First check if the user has a record in search_count
      const { data: searchCount } = await supabaseAdmin
        .from("search_count")
        .select("*")
        .eq("email", session.email)
        .single()

      if (searchCount) {
        // Update existing record
        await supabaseAdmin
          .from("search_count")
          .update({
            search_count: searchCount.search_count + 1,
            api_call_count: searchCount.api_call_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("email", session.email)
      } else {
        // Create new record
        await supabaseAdmin.from("search_count").insert({
          email: session.email,
          search_count: 1,
          api_call_count: 1,
        })
      }
    } catch (error) {
      console.error("Error updating search count:", error)
      // Continue with the search even if counting fails
    }

    return NextResponse.json({
      credits: "CSINT Network",
      scan_type: type,
      query: query,
      timestamp: new Date().toISOString(),
      csint: cleanedData,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to clean the data
function cleanData(data: any) {
  if (data && typeof data === "object") {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (typeof data[key] === "object" && data[key] !== null) {
          cleanData(data[key])
        }
        if (key === "credit" && data[key] === "lookup made by https://osintdog.com") {
          delete data[key]
        }
        if (key === "osintdog") {
          delete data[key]
        }
      }
    }
  }
  return data
}
