"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"
import { handleAuthError } from "@/lib/fetch-utils"

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Log the error for debugging
    if (error) {
      console.error("Auth error:", error)
    }

    // If there's an error, try to fetch diagnostic information
    if (error && (error === "Configuration" || error === "AccessDenied" || error === "DatabaseError")) {
      fetchDiagnostics()
    }
  }, [error, retryCount])

  async function fetchDiagnostics() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth-diagnostics", {
        // Add cache control to prevent stale responses
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!res.ok) {
        throw new Error(`Diagnostics API returned ${res.status}: ${res.statusText}`)
      }

      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text()
        console.error("Non-JSON response from diagnostics API:", text)
        throw new Error("Invalid response format from diagnostics API")
      }

      const data = await res.json()
      setDiagnosticInfo(data)
    } catch (e) {
      console.error("Failed to fetch diagnostics:", e)
      setDiagnosticInfo({ error: e instanceof Error ? e.message : String(e) })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshDiagnostics = () => {
    setRetryCount((prev) => prev + 1)
  }

  const getErrorMessage = () => {
    return handleAuthError(error || "Default")
  }

  const getErrorSeverity = () => {
    switch (error) {
      case "Configuration":
      case "DatabaseError":
        return "critical"
      case "AccessDenied":
      case "SessionRequired":
        return "warning"
      default:
        return "error"
    }
  }

  const getErrorIcon = () => {
    const severity = getErrorSeverity()
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-10 w-10 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-10 w-10 text-yellow-500" />
      default:
        return <AlertCircle className="h-10 w-10 text-red-500" />
    }
  }

  const getErrorTitle = () => {
    switch (error) {
      case "Configuration":
        return "Configuration Error"
      case "DatabaseError":
        return "Database Connection Error"
      case "AccessDenied":
        return "Access Denied"
      case "CredentialsSignin":
        return "Sign In Failed"
      default:
        return "Authentication Error"
    }
  }

  const getErrorResolution = () => {
    switch (error) {
      case "Configuration":
        return "Please contact the administrator to check the NEXTAUTH_URL and other configuration settings."
      case "DatabaseError":
        return "The system is currently unable to connect to the database. This could be temporary - please try again in a few moments."
      case "CredentialsSignin":
        return "Please check your email and password and try again."
      case "SessionRequired":
        return "You need to be signed in to access this page. Please sign in and try again."
      default:
        return "Please try signing in again or contact support if the problem persists."
    }
  }

  const getTroubleshootingSteps = () => {
    switch (error) {
      case "DatabaseError":
        return (
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache and cookies</li>
            <li>Try again in a few minutes</li>
          </ul>
        )
      case "CredentialsSignin":
        return (
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Make sure your email address is correct</li>
            <li>Check if Caps Lock is turned on</li>
            <li>Try resetting your password if you've forgotten it</li>
          </ul>
        )
      default:
        return null
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">{getErrorIcon()}</div>
            <CardTitle className="text-2xl text-center">{getErrorTitle()}</CardTitle>
            <CardDescription className="text-center">{getErrorMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{getErrorResolution()}</p>

            {getTroubleshootingSteps()}

            {(error === "Configuration" || error === "DatabaseError") && (
              <Alert variant="destructive" className="mt-4 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Configuration Issue</AlertTitle>
                <AlertDescription>
                  This appears to be a server configuration issue. The administrator should check:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {error === "Configuration" && (
                      <>
                        <li>NEXTAUTH_URL environment variable is set correctly</li>
                        <li>NEXTAUTH_SECRET environment variable is set</li>
                      </>
                    )}
                    {error === "DatabaseError" && (
                      <>
                        <li>MONGODB_URI environment variable is correct</li>
                        <li>Database server is running and accessible</li>
                        <li>Network firewall allows connections to the database</li>
                        <li>Database user has correct permissions</li>
                      </>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {diagnosticInfo && (
              <div className="mt-4 text-left">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center">
                    <span>Technical Details (for administrators)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        refreshDiagnostics()
                      }}
                      className="ml-2"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(diagnosticInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Link href="/login">
              <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">Try Again</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
