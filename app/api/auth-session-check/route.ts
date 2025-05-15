import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkDatabaseConnection } from "@/lib/mongodb"

export async function GET() {
  try {
    // First check database connection
    const dbStatus = await checkDatabaseConnection()

    if (!dbStatus.connected) {
      return NextResponse.json(
        {
          status: "error",
          error: "database_connection_error",
          message: "Unable to connect to database",
          details: dbStatus,
        },
        { status: 503 },
      )
    }

    // Then check session
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      status: "success",
      authenticated: !!session,
      session: session
        ? {
            expires: session.expires,
            user: {
              name: session.user?.name,
              email: session.user?.email,
              role: session.user?.role,
            },
          }
        : null,
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Auth session check error:", error)

    return NextResponse.json(
      {
        status: "error",
        error: "session_check_error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
