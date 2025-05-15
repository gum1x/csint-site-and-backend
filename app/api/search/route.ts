import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyUserSession } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { validateSearchQuery, sanitizeInput } from "@/lib/security"
import { headers } from "next/headers"

const SUPPORTED_TYPES = ["email", "username", "domain", "phone", "ip"]

// Define search limits by plan type
const PLAN_SEARCH_LIMITS = {
  basic: 50,
  standard: 100,
  premium: 200,
  enterprise: 1000,
}

// Define API call limits by plan type
const PLAN_API_LIMITS = {
  basic: 200,
  standard: 500,
  premium: 1000,
  enterprise: 5000,
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 30 // Maximum requests per minute

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore: Record<string, { count: number; resetTime: number }> = {}

// Initialize Supabase admin client
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown"

    // Check rate limit
    const now = Date.now()
    if (!rateLimitStore[clientIp]) {
      rateLimitStore[clientIp] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
    } else if (rateLimitStore[clientIp].resetTime < now) {
      rateLimitStore[clientIp] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
    }

    rateLimitStore[clientIp].count++

    if (rateLimitStore[clientIp].count > RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    // Get the user token from cookies
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

    // Get the plan type and corresponding limits
    const planType = apiKey.plan_type || "standard"
    const searchLimit = PLAN_SEARCH_LIMITS[planType as keyof typeof PLAN_SEARCH_LIMITS] || 100
    const apiLimit = PLAN_API_LIMITS[planType as keyof typeof PLAN_API_LIMITS] || 500

    // Check if the user has a record in search_count
    const { data: searchCount } = await supabaseAdmin
      .from("search_count")
      .select("*")
      .eq("email", session.email)
      .single()

    // If user has search count record, check if they've exceeded their limit
    if (searchCount) {
      if (searchCount.search_count >= searchLimit) {
        return NextResponse.json(
          {
            error: `You have reached your search limit (${searchLimit}) for your ${planType} plan. Please upgrade your plan for more searches.`,
          },
          { status: 403 },
        )
      }

      if (searchCount.api_call_count >= apiLimit) {
        return NextResponse.json(
          {
            error: `You have reached your API call limit (${apiLimit}) for your ${planType} plan. Please upgrade your plan for more API calls.`,
          },
          { status: 403 },
        )
      }
    }

    // Parse and validate the request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { type, query } = body

    if (!type || !query) {
      return NextResponse.json({ error: "Missing 'type' or 'query' in request body" }, { status: 400 })
    }

    // Sanitize and validate the type
    const sanitizedType = sanitizeInput(type.toLowerCase())
    if (!SUPPORTED_TYPES.includes(sanitizedType)) {
      return NextResponse.json(
        {
          error: `Invalid type. Supported types: ${SUPPORTED_TYPES.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Validate and sanitize the query
    const validatedQuery = validateSearchQuery(sanitizedType, query)
    if (!validatedQuery) {
      return NextResponse.json(
        {
          error: `Invalid query format for type: ${sanitizedType}`,
        },
        { status: 400 },
      )
    }

    // Make request to OsintDog API
    const osintDogResponse = await fetch("https://osintdog.com/search/api/search", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.OSINTDOG_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ field: [{ [sanitizedType]: validatedQuery }] }),
    })

    if (!osintDogResponse.ok) {
      console.log("Search API: Error from search provider:", osintDogResponse.statusText)
      return NextResponse.json(
        {
          error: `Error from search provider: ${osintDogResponse.statusText}`,
        },
        { status: osintDogResponse.status },
      )
    }

    const data = await osintDogResponse.json()

    // Clean the data
    const cleanedData = cleanData(data)

    // Log the search for analytics
    await supabaseAdmin.from("search_logs").insert({
      user_id: session.email, // Use email as user_id
      search_type: sanitizedType,
      query: validatedQuery,
    })

    // Increment the search count for this user
    try {
      // First check if the user has a record in search_count
      if (searchCount) {
        // Update existing record
        await supabaseAdmin
          .from("search_count")
          .update({
            search_count: searchCount.search_count + 1,
            api_call_count: searchCount.api_call_count + 1,
            search_limit: searchLimit,
            api_call_limit: apiLimit,
            updated_at: new Date().toISOString(),
          })
          .eq("email", session.email)
      } else {
        // Create new record
        await supabaseAdmin.from("search_count").insert({
          email: session.email,
          search_count: 1,
          api_call_count: 1,
          search_limit: searchLimit,
          api_call_limit: apiLimit,
        })
      }
    } catch (error) {
      console.error("Error updating search count:", error)
      // Continue with the search even if counting fails
    }

    // Set response headers for additional security
    const response = NextResponse.json({
      credits: "CSINT Network",
      scan_type: sanitizedType,
      query: validatedQuery,
      timestamp: new Date().toISOString(),
      csint: cleanedData,
    })

    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Cache-Control", "no-store, max-age=0")

    return response
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
