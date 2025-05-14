import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith("/1923/admin") && !pathname.includes("/login") && !pathname.includes("/direct-login")) {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/1923/admin/login", request.url))
    }

    return NextResponse.next()
  }

  // Protect user dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("user_token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/1923/admin/:path*", "/dashboard/:path*"],
}
