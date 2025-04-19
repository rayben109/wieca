import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/mongodb"
import { validateCriticalConfig } from "@/lib/auth-diagnostics"

export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection()

    // Check auth configuration
    const configStatus = await validateCriticalConfig()

    // Basic application info
    const appInfo = {
      name: "WIECA Mentor Connect",
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || "1.0.0",
      timestamp: new Date().toISOString(),
    }

    // Determine overall health status
    const isHealthy = dbStatus.connected && configStatus.valid

    // Return health status
    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        application: appInfo,
        database: dbStatus,
        configuration: {
          valid: configStatus.valid,
          criticalIssuesCount: configStatus.issues.filter((i) => i.severity === "critical").length,
          warningsCount: configStatus.issues.filter((i) => i.severity === "warning").length,
        },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to perform health check",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  }
}
