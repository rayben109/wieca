"use client"

import { useState, useEffect } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface SystemStatusProps {
  adminOnly?: boolean
}

interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "error"
  application: {
    name: string
    environment: string
    version: string
    timestamp: string
  }
  database: {
    connected: boolean
    error?: string
  }
  configuration: {
    valid: boolean
    criticalIssuesCount: number
    warningsCount: number
  }
}

export function SystemStatus({ adminOnly = true }: SystemStatusProps) {
  const [health, setHealth] = useState<HealthCheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in and has admin role
    const checkUserRole = async () => {
      try {
        const res = await fetch("/api/auth/session")
        const session = await res.json()

        if (session && session.user) {
          setUserRole(session.user.role)
        }
      } catch (e) {
        console.error("Failed to check user role:", e)
      }
    }

    checkUserRole()
  }, [])

  useEffect(() => {
    if (adminOnly && userRole !== "admin") {
      return
    }

    checkHealth()
  }, [adminOnly, userRole])

  const checkHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/health", { cache: "no-store" })

      if (!res.ok) {
        throw new Error(`Health check failed with status: ${res.status}`)
      }

      const data = await res.json()
      setHealth(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // If admin-only and user is not admin, don't render
  if (adminOnly && userRole !== "admin") {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Checking System Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Verifying database connection and configuration...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>System Status Check Failed</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={checkHealth} className="mt-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!health) {
    return null
  }

  // Only show warning if there are issues
  if (health.status === "healthy" && !showDetails) {
    return null
  }

  return (
    <Card className={health.status === "healthy" ? "border-green-500" : "border-red-500"}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {health.status === "healthy" ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              System Status: Operational
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 mr-2 text-red-500" />
              System Status: Issues Detected
            </>
          )}
        </CardTitle>
        <CardDescription>Last checked: {new Date(health.application.timestamp).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!health.database.connected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Connection Failed</AlertTitle>
            <AlertDescription>
              {health.database.error || "Could not connect to the database. Please check your configuration."}
            </AlertDescription>
          </Alert>
        )}

        {!health.configuration.valid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Issues</AlertTitle>
            <AlertDescription>
              {health.configuration.criticalIssuesCount > 0 && (
                <p>Critical issues: {health.configuration.criticalIssuesCount}</p>
              )}
              {health.configuration.warningsCount > 0 && <p>Warnings: {health.configuration.warningsCount}</p>}
              <p className="mt-2">Please check the server logs or contact an administrator.</p>
            </AlertDescription>
          </Alert>
        )}

        {showDetails && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">System Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Environment:</div>
              <div>{health.application.environment}</div>

              <div>Application Version:</div>
              <div>{health.application.version}</div>

              <div>Database Status:</div>
              <div className={health.database.connected ? "text-green-500" : "text-red-500"}>
                {health.database.connected ? "Connected" : "Disconnected"}
              </div>

              <div>Configuration Status:</div>
              <div className={health.configuration.valid ? "text-green-500" : "text-red-500"}>
                {health.configuration.valid ? "Valid" : "Invalid"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
        <Button variant="outline" size="sm" onClick={checkHealth}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}
