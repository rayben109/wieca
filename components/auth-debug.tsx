"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AuthDebug() {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState<any>(null)
  const [authTest, setAuthTest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function testApi() {
    try {
      const res = await fetch("/api/test")
      const data = await res.json()
      setApiTest(data)
    } catch (err) {
      setApiTest({ error: "Failed to fetch API test" })
    }
  }

  async function testAuthApi() {
    try {
      const res = await fetch("/api/auth/session")
      const text = await res.text() // Get raw response first
      setAuthTest({ raw: text })

      try {
        // Try to parse as JSON
        const data = JSON.parse(text)
        setAuthTest((prev) => ({ ...prev, parsed: data }))
      } catch (parseErr) {
        setAuthTest((prev) => ({ ...prev, parseError: "Failed to parse as JSON" }))
      }
    } catch (err) {
      setAuthTest({ error: "Failed to fetch auth API" })
    }
  }

  useEffect(() => {
    // Listen for NextAuth errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.error.message && event.error.message.includes("NextAuth")) {
        setError(event.error.message)
      }
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>Diagnose authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Session Status: {status}</h3>
          {status === "authenticated" && (
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(session, null, 2)}</pre>
          )}
          {status === "loading" && <p>Loading session...</p>}
          {status === "unauthenticated" && <p>No active session</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-2 rounded">
            <h3 className="font-medium text-red-700">Error Detected:</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={testApi} variant="outline" size="sm">
            Test API
          </Button>
          <Button onClick={testAuthApi} variant="outline" size="sm">
            Test Auth API
          </Button>
        </div>

        {apiTest && (
          <div>
            <h3 className="font-medium mb-2">API Test Result:</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(apiTest, null, 2)}</pre>
          </div>
        )}

        {authTest && (
          <div>
            <h3 className="font-medium mb-2">Auth API Test Result:</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(authTest, null, 2)}</pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>NEXTAUTH_URL is set: {process.env.NEXTAUTH_URL ? "Yes" : "No"}</p>
        </div>
      </CardContent>
    </Card>
  )
}
