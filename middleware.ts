import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple check for NEXTAUTH_URL at startup
const validateNextAuthUrl = () => {
  const url = process.env.NEXTAUTH_URL
  if (!url) {
    console.error("NEXTAUTH_URL environment variable is not set")
    return false
  }

  try {
    new URL(url)
    return true
  } catch (e) {
    console.error("NEXTAUTH_URL is not a valid URL:", url)
    return false
  }
}

// Run validation at startup
const isNextAuthUrlValid = validateNextAuthUrl()

export function middleware(request: NextRequest) {
  // Skip processing for NextAuth routes completely
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // Add a header to indicate if NEXTAUTH_URL is valid
  // This can be useful for debugging
  const response = NextResponse.next()
  response.headers.set("X-NextAuth-URL-Valid", isNextAuthUrlValid ? "true" : "false")

  // Add CORS headers for API routes to prevent issues with client-side fetching
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }
  }

  return response
}

// Configure middleware to run on all routes except NextAuth
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
