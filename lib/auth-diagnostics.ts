import { checkDatabaseConnection } from "./mongodb"

export async function checkAuthConfig() {
  const issues: { message: string; severity: "critical" | "warning" }[] = []

  if (!process.env.NEXTAUTH_URL) {
    issues.push({ message: "NEXTAUTH_URL is not set", severity: "critical" })
  } else {
    try {
      new URL(process.env.NEXTAUTH_URL)
    } catch (e) {
      issues.push({ message: "NEXTAUTH_URL is not a valid URL", severity: "critical" })
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    issues.push({ message: "NEXTAUTH_SECRET is not set", severity: "critical" })
  }

  if (!process.env.MONGODB_URI) {
    issues.push({ message: "MONGODB_URI is not set", severity: "critical" })
  }

  const dbStatus = await checkDatabaseConnection()
  if (!dbStatus.connected) {
    issues.push({ message: `Database connection failed: ${dbStatus.error}`, severity: "critical" })
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

export async function validateCriticalConfig() {
  const issues: { message: string; severity: "critical" | "warning" }[] = []

  if (!process.env.NEXTAUTH_URL) {
    issues.push({ message: "NEXTAUTH_URL is not set", severity: "critical" })
  } else {
    try {
      new URL(process.env.NEXTAUTH_URL)
    } catch (e) {
      issues.push({ message: "NEXTAUTH_URL is not a valid URL", severity: "critical" })
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    issues.push({ message: "NEXTAUTH_SECRET is not set", severity: "critical" })
  }

  if (!process.env.MONGODB_URI) {
    issues.push({ message: "MONGODB_URI is not set", severity: "critical" })
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
