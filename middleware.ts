import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of allowed origins for CORS
const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", "https://csint-network.vercel.app"]

// List of protected routes that require authentication
const protectedRoutes = ["/dashboard", "/api/search", "/api/auth/refresh", "/1923/admin"]

// List of public routes that don't need protection
const publicRoutes = ["/", "/login", "/api/auth/check"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin") || ""

  // CORS handling for API routes
  if (pathname.startsWith("/api/")) {
    // Check if the origin is allowed
    const isAllowedOrigin = allowedOrigins.includes(origin)

    // Create base response
    const response = NextResponse.next()

    // Set security headers for API routes
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")

    // Set strict Content-Security-Policy for API routes
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none';",
    )

    // Only set CORS headers if the origin is allowed
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
      response.headers.set("Access-Control-Max-Age", "86400")
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return response
    }

    // Check for API rate limiting (implemented in the API routes)

    return response
  }

  // Authentication check for protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // For admin routes
    if (pathname.startsWith("/1923/admin") && !pathname.includes("/login") && !pathname.includes("/direct-login")) {
      const token = request.cookies.get("admin_token")?.value

      if (!token) {
        return NextResponse.redirect(new URL("/1923/admin/login", request.url))
      }
    }

    // For user dashboard routes
    else if (pathname.startsWith("/dashboard")) {
      const token = request.cookies.get("user_token")?.value

      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }
  }

  // For all page routes (not API), set security headers
  const response = NextResponse.next()

  // Set basic security headers for all routes
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")

  // Set Content-Security-Policy for page routes
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none';",
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
