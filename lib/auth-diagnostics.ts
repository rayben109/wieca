"use server"

import { headers } from "next/headers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkDatabaseConnection } from "@/lib/mongodb"

// Function to validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

// Function to check if URL is accessible (can only be used client-side)
export async function isUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    })
    return response.ok
  } catch (error) {
    return false
  }
}

export async function checkAuthConfig() {
  try {
    // Check environment variables
    const nextAuthUrl = process.env.NEXTAUTH_URL || ""

    const envChecks = {
      NEXTAUTH_URL: {
        exists: !!nextAuthUrl,
        isValid: isValidUrl(nextAuthUrl),
        value: nextAuthUrl ? new URL(nextAuthUrl).origin : "Not set",
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        isValid: !!process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length > 16,
      },
      MONGODB_URI: {
        exists: !!process.env.MONGODB_URI,
        isValid: isValidUrl(process.env.MONGODB_URI || ""),
      },
      EMAIL_SERVER_HOST: {
        exists: !!process.env.EMAIL_SERVER_HOST,
      },
    }

    // Check database connection
    const dbConnection = await checkDatabaseConnection()

    // Check if we can get a session
    let sessionError = null
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (error) {
      sessionError = error instanceof Error ? error.message : String(error)
    }

    // Get request headers for debugging
    const headersList = headers()
    const relevantHeaders = {
      host: headersList.get("host"),
      origin: headersList.get("origin"),
      referer: headersList.get("referer"),
      "user-agent": headersList.get("user-agent"),
      "content-type": headersList.get("content-type"),
      cookie: headersList.has("cookie") ? "Present" : "Missing",
    }

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envChecks,
      database: dbConnection,
      session: session ? "Valid" : "Missing",
      sessionError,
      headers: relevantHeaders,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Function to validate critical configuration
export async function validateCriticalConfig() {
  const issues = []

  // Check NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL
  if (!nextAuthUrl) {
    issues.push({
      component: "NEXTAUTH_URL",
      severity: "critical",
      message: "NEXTAUTH_URL environment variable is not set",
      resolution: "Set the NEXTAUTH_URL environment variable to your site's full URL (e.g., https://example.com)",
    })
  } else if (!isValidUrl(nextAuthUrl)) {
    issues.push({
      component: "NEXTAUTH_URL",
      severity: "critical",
      message: "NEXTAUTH_URL is not a valid URL",
      resolution: "Ensure NEXTAUTH_URL is a complete URL including protocol (e.g., https://example.com)",
    })
  }

  // Check NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    issues.push({
      component: "NEXTAUTH_SECRET",
      severity: "critical",
      message: "NEXTAUTH_SECRET environment variable is not set",
      resolution: "Set a strong, random string as NEXTAUTH_SECRET for JWT encryption",
    })
  } else if (process.env.NEXTAUTH_SECRET.length < 16) {
    issues.push({
      component: "NEXTAUTH_SECRET",
      severity: "warning",
      message: "NEXTAUTH_SECRET is too short",
      resolution: "Use a longer, more secure string for NEXTAUTH_SECRET (at least 16 characters)",
    })
  }

  // Check database connection
  const dbStatus = await checkDatabaseConnection()
  if (!dbStatus.connected) {
    issues.push({
      component: "Database",
      severity: "critical",
      message: `Database connection failed: ${dbStatus.error}`,
      resolution: "Verify your MONGODB_URI is correct and the database server is accessible",
    })
  }

  return {
    valid: issues.length === 0,
    issues,
    timestamp: new Date().toISOString(),
  }
}
