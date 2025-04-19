import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkAuthConfig } from "@/lib/auth-diagnostics"

export async function GET() {
  // Only allow in development or with admin access
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
  }

  const diagnostics = await checkAuthConfig()
  return NextResponse.json(diagnostics)
}
