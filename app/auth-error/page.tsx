"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Log the error for debugging
    if (error) {
      console.error("Auth error:", error)
    }

    // If there's an error, try to fetch diagnostic information
    if (error && (error === "Configuration" || error === "AccessDenied" || error === "DatabaseError")) {
      fetchDiagnostics()
    }
  }, [error])

  async function fetchDiagnostics() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth-diagnostics")
      const data = await res.json()
      setDiagnosticInfo(data)
    } catch (e) {
      console.error("Failed to fetch diagnostics:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration. Please check the NEXTAUTH_URL and database settings."
      case "AccessDenied":
        return "You do not have permission to sign in."
      case "Verification":
        return "The verification link is invalid or has expired."
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
      case "OAuthAccountNotLinked":
      case "EmailSignin":
      case "CredentialsSignin":
        return "There was a problem with your sign in. Please check your credentials and try again."
      case "SessionRequired":
        return "You must be signed in to access this page."
      case "DatabaseError":
        return "Could not connect to the database. Please check your database configuration."
      default:
        return "An unexpected error occurred. Please try again."
    }
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
        return "Please contact the administrator to verify the database connection."
      case "CredentialsSignin":
        return "Please check your email and password and try again."
      default:
        return "Please try signing in again or contact support if the problem persists."
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
                      </>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {diagnosticInfo && (
              <div className="mt-4 text-left">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details (for administrators)
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
