"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getAdminStats } from "@/lib/actions/admin-actions"
import { SystemStatus } from "@/components/system-status"
import type { AdminStats } from "@/lib/types"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/")
      } else {
        loadStats()
      }
    }
  }, [status, session, router])

  async function loadStats() {
    setIsLoading(true)
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load admin stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  if (status === "authenticated" && session?.user?.role !== "admin") {
    return null // This will redirect in the useEffect
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={loadStats} variant="outline" className="gap-2" disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* System Status Component */}
      <div className="mb-6">
        <SystemStatus adminOnly={false} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="mentorships">Mentorships</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Existing tabs content */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Existing overview content */}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {/* Existing users content */}
        </TabsContent>

        <TabsContent value="mentorships" className="mt-6">
          {/* Existing mentorships content */}
        </TabsContent>

        {/* New System tab */}
        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>View and manage system configuration and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Environment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Node Environment:</span>
                          <span>{process.env.NODE_ENV}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">NextAuth URL:</span>
                          <span>{process.env.NEXTAUTH_URL ? "Set" : "Not Set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">MongoDB URI:</span>
                          <span>{process.env.MONGODB_URI ? "Set" : "Not Set"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Auth Provider:</span>
                          <span>NextAuth.js (Credentials)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">JWT Secret:</span>
                          <span>{process.env.NEXTAUTH_SECRET ? "Set" : "Not Set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email Provider:</span>
                          <span>{process.env.EMAIL_SERVER_HOST ? "Configured" : "Not Configured"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagnostics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => window.open("/api/auth-diagnostics", "_blank")}>
                          Run Auth Diagnostics
                        </Button>
                        <Button variant="outline" onClick={() => window.open("/api/health", "_blank")}>
                          Check System Health
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Use these tools to diagnose issues with authentication or system configuration.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
