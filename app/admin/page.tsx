"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SystemStatus } from "@/components/system-status"
import { getDashboardStats } from "@/lib/actions/admin-actions"
import { PieChart, BarChart, LineChart } from "@/components/charts"
import { Loader2, RefreshCw, UsersRound, Users2, LucideLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [errorMessage, setErrorMessage] = useState("")

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
    setErrorMessage("")
    try {
      const data = await getDashboardStats()
      if (data.success) {
        setStats(data)
      } else {
        setErrorMessage(data.error || "Failed to load dashboard stats")
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error)
      setErrorMessage("An unexpected error occurred while loading dashboard stats")
    } finally {
      setIsLoading(false)
    }
  }

  const chartColors = ["#DB7C27", "#3B82F6", "#10B981", "#F97316", "#8B5CF6"]

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#DB7C27]" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={loadStats} variant="outline" className="gap-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isLoading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

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

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersRound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.userGrowth?.length > 0 &&
                    `+${stats.userGrowth[stats.userGrowth.length - 1]?.count || 0} new this month`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentors</CardTitle>
                <Users2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.mentorCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalUsers
                    ? `${Math.round((stats.mentorCount / stats.totalUsers) * 100)}% of all users`
                    : "0% of all users"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                <Users2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.menteeCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalUsers
                    ? `${Math.round((stats.menteeCount / stats.totalUsers) * 100)}% of all users`
                    : "0% of all users"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Mentorships</CardTitle>
                <LucideLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeMentorships || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.requestStats?.acceptanceRate !== undefined
                    ? `${stats.requestStats.acceptanceRate}% acceptance rate`
                    : "0% acceptance rate"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats?.userGrowth?.length > 0 ? (
                  <LineChart
                    data={stats.userGrowth}
                    xAxisKey="date"
                    yAxisKey="count"
                    categories={["count"]}
                    colors={[chartColors[0]]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Mentorship Statistics</CardTitle>
                <CardDescription>Breakdown of mentorship requests by status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats?.requestStats ? (
                  <BarChart
                    data={[
                      { name: "Pending", value: stats.requestStats.pending },
                      { name: "Accepted", value: stats.requestStats.accepted },
                      { name: "Declined", value: stats.requestStats.declined },
                    ]}
                    xAxisKey="name"
                    yAxisKey="value"
                    categories={["value"]}
                    colors={[chartColors[0]]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Matches</CardTitle>
                <CardDescription>Recently formed mentor-mentee relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentMatches?.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentMatches.map((match: any, i: number) => (
                      <div key={i} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {match.mentor} + {match.mentee}
                          </p>
                          <p className="text-sm text-muted-foreground">{new Date(match.date).toLocaleDateString()}</p>
                        </div>
                        <div className="ml-auto font-medium">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {match.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex py-10 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No recent matches</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Expertise Distribution</CardTitle>
                <CardDescription>User expertise by area of interest</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {stats?.expertiseDistribution?.length > 0 ? (
                  <PieChart data={stats.expertiseDistribution.slice(0, 5)} colors={chartColors} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Administrators</CardTitle>
                      <CardDescription>System administrators with full access</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.adminCount || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Mentors</CardTitle>
                      <CardDescription>Registered mentors providing guidance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.mentorCount || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Mentees</CardTitle>
                      <CardDescription>Registered mentees seeking guidance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.menteeCount || 0}</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-center">
                  <Link href="/admin/users">
                    <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">
                      <UsersRound className="h-4 w-4 mr-2" />
                      Manage Users
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentorships" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mentorship Management</CardTitle>
              <CardDescription>View and manage mentorship connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Active Mentorships</CardTitle>
                      <CardDescription>Currently active connections</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.activeMentorships || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Pending Requests</CardTitle>
                      <CardDescription>Mentorship requests awaiting approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats?.requestStats?.pending || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Acceptance Rate</CardTitle>
                      <CardDescription>Percentage of accepted requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats?.requestStats?.acceptanceRate !== undefined
                          ? `${stats.requestStats.acceptanceRate}%`
                          : "0%"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-center">
                  <Link href="/admin/mentorships">
                    <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]">
                      <LucideLink className="h-4 w-4 mr-2" />
                      Manage Mentorships
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
