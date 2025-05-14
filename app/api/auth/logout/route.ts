import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  // Delete the user token cookie
  cookies().delete("user_token")

  // Redirect to the login page
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}
