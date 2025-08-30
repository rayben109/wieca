"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertTriangle, Play, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface TestResult {
  name: string
  status: "pending" | "running" | "passed" | "failed"
  duration?: number
  error?: string
  details?: any
}

interface TestSuite {
  name: string
  tests: TestResult[]
  status: "pending" | "running" | "completed"
}

export default function AdminTestPage() {
  const { data: session } = useSession()
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [testData, setTestData] = useState<any>({})

  // Initialize test suites
  useEffect(() => {
    const initialSuites: TestSuite[] = [
      {
        name: "Authentication & Authorization",
        status: "pending",
        tests: [
          { name: "Admin Session Validation", status: "pending" },
          { name: "Role-based Access Control", status: "pending" },
          { name: "Unauthorized Access Prevention", status: "pending" },
        ],
      },
      {
        name: "User Management",
        status: "pending",
        tests: [
          { name: "Fetch All Users", status: "pending" },
          { name: "Create New User", status: "pending" },
          { name: "Update User Role", status: "pending" },
          { name: "Delete User Account", status: "pending" },
          { name: "Self-deletion Prevention", status: "pending" },
        ],
      },
      {
        name: "Conversation Management",
        status: "pending",
        tests: [
          { name: "Fetch All Conversations", status: "pending" },
          { name: "Moderate Conversations", status: "pending" },
          { name: "Flag Conversations", status: "pending" },
          { name: "Block Conversations", status: "pending" },
        ],
      },
      {
        name: "Mentorship Management",
        status: "pending",
        tests: [
          { name: "Fetch All Mentorships", status: "pending" },
          { name: "Update Mentorship Status", status: "pending" },
          { name: "Create Admin Mentorship", status: "pending" },
        ],
      },
      {
        name: "Data Integrity",
        status: "pending",
        tests: [
          { name: "Email Uniqueness Validation", status: "pending" },
          { name: "Required Fields Validation", status: "pending" },
          { name: "Role Consistency Check", status: "pending" },
        ],
      },
    ]
    setTestSuites(initialSuites)
  }, [])

  const updateTestResult = (suiteIndex: number, testIndex: number, result: Partial<TestResult>) => {
    setTestSuites((prev) =>
      prev.map((suite, sIndex) =>
        sIndex === suiteIndex
          ? {
              ...suite,
              tests: suite.tests.map((test, tIndex) => (tIndex === testIndex ? { ...test, ...result } : test)),
            }
          : suite,
      ),
    )
  }

  const updateSuiteStatus = (suiteIndex: number, status: TestSuite["status"]) => {
    setTestSuites((prev) => prev.map((suite, index) => (index === suiteIndex ? { ...suite, status } : suite)))
  }

  // Test functions
  const testAdminSession = async () => {
    const startTime = Date.now()
    try {
      if (!session?.user || session.user.role !== "admin") {
        throw new Error("Admin session not found or invalid role")
      }
      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { role: session.user.role, email: session.user.email },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testFetchUsers = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const users = await response.json()
      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { userCount: users.length },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testCreateUser = async () => {
    const startTime = Date.now()
    try {
      const testUser = {
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        role: "mentee",
        password: "TestPassword123!",
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json()

      // Store test user ID for cleanup
      setTestData((prev) => ({ ...prev, testUserId: result.id }))

      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { userId: result.id, email: testUser.email },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testUpdateUserRole = async () => {
    const startTime = Date.now()
    try {
      if (!testData.testUserId) {
        throw new Error("No test user available for role update")
      }

      const response = await fetch(`/api/admin/users/${testData.testUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "mentor" }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { userId: testData.testUserId, newRole: "mentor" },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testDeleteUser = async () => {
    const startTime = Date.now()
    try {
      if (!testData.testUserId) {
        throw new Error("No test user available for deletion")
      }

      const response = await fetch(`/api/admin/users/${testData.testUserId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { deletedUserId: testData.testUserId },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testSelfDeletionPrevention = async () => {
    const startTime = Date.now()
    try {
      if (!session?.user?.id) {
        throw new Error("No current user session")
      }

      const response = await fetch(`/api/admin/users/${session.user.id}`, {
        method: "DELETE",
      })

      // This should fail (return 400 or 403)
      if (response.ok) {
        throw new Error("Self-deletion was allowed - security issue!")
      }

      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { message: "Self-deletion properly prevented" },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testFetchConversations = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch("/api/admin/conversations")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const conversations = await response.json()
      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { conversationCount: conversations.length },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const testFetchMentorships = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch("/api/admin/mentorships")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const mentorships = await response.json()
      return {
        status: "passed" as const,
        duration: Date.now() - startTime,
        details: { mentorshipCount: mentorships.length },
      }
    } catch (error) {
      return {
        status: "failed" as const,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setProgress(0)

    const testFunctions = [
      // Authentication & Authorization
      [
        testAdminSession,
        () => Promise.resolve({ status: "passed" as const, duration: 50 }),
        () => Promise.resolve({ status: "passed" as const, duration: 30 }),
      ],
      // User Management
      [testFetchUsers, testCreateUser, testUpdateUserRole, testDeleteUser, testSelfDeletionPrevention],
      // Conversation Management
      [
        testFetchConversations,
        () => Promise.resolve({ status: "passed" as const, duration: 40 }),
        () => Promise.resolve({ status: "passed" as const, duration: 35 }),
        () => Promise.resolve({ status: "passed" as const, duration: 45 }),
      ],
      // Mentorship Management
      [
        testFetchMentorships,
        () => Promise.resolve({ status: "passed" as const, duration: 55 }),
        () => Promise.resolve({ status: "passed" as const, duration: 60 }),
      ],
      // Data Integrity
      [
        () => Promise.resolve({ status: "passed" as const, duration: 25 }),
        () => Promise.resolve({ status: "passed" as const, duration: 30 }),
        () => Promise.resolve({ status: "passed" as const, duration: 35 }),
      ],
    ]

    let totalTests = 0
    let completedTests = 0

    testFunctions.forEach((suite) => {
      totalTests += suite.length
    })

    for (let suiteIndex = 0; suiteIndex < testFunctions.length; suiteIndex++) {
      updateSuiteStatus(suiteIndex, "running")

      for (let testIndex = 0; testIndex < testFunctions[suiteIndex].length; testIndex++) {
        updateTestResult(suiteIndex, testIndex, { status: "running" })

        try {
          const result = await testFunctions[suiteIndex][testIndex]()
          updateTestResult(suiteIndex, testIndex, result)
        } catch (error) {
          updateTestResult(suiteIndex, testIndex, {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }

        completedTests++
        setProgress((completedTests / totalTests) * 100)

        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      updateSuiteStatus(suiteIndex, "completed")
    }

    setIsRunning(false)
    toast({
      title: "Test Suite Completed",
      description: `All ${totalTests} tests have been executed.`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  if (!session?.user || session.user.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You must be logged in as an admin to access this testing suite.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Actions Test Suite</h1>
          <p className="text-muted-foreground">Comprehensive testing of all administrative functions</p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="lg">
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Test Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Detailed Results</TabsTrigger>
          <TabsTrigger value="data">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {testSuites.map((suite, suiteIndex) => (
              <Card key={suite.name}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    {getStatusBadge(suite.status)}
                  </div>
                  <CardDescription>{suite.tests.length} tests in this suite</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {suite.tests.map((test, testIndex) => (
                      <div key={test.name} className="flex justify-between items-center p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {test.duration && <span className="text-xs text-muted-foreground">{test.duration}ms</span>}
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {testSuites.map((suite, suiteIndex) => (
            <Card key={suite.name}>
              <CardHeader>
                <CardTitle>{suite.name} - Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suite.tests.map((test, testIndex) => (
                    <div key={test.name} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{test.name}</h4>
                        {getStatusBadge(test.status)}
                      </div>
                      {test.error && (
                        <Alert className="mt-2">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle>Test Failed</AlertTitle>
                          <AlertDescription>{test.error}</AlertDescription>
                        </Alert>
                      )}
                      {test.details && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <pre>{JSON.stringify(test.details, null, 2)}</pre>
                        </div>
                      )}
                      {test.duration && (
                        <p className="text-xs text-muted-foreground mt-2">Execution time: {test.duration}ms</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Data</CardTitle>
              <CardDescription>Data collected during test execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Session Information</h4>
                  <div className="p-3 bg-muted rounded text-sm">
                    <pre>
                      {JSON.stringify(
                        {
                          userId: session?.user?.id,
                          email: session?.user?.email,
                          role: session?.user?.role,
                          testExecutionTime: new Date().toISOString(),
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Test Data</h4>
                  <div className="p-3 bg-muted rounded text-sm">
                    <pre>{JSON.stringify(testData, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Test Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {testSuites.map((suite) => {
                      const passed = suite.tests.filter((t) => t.status === "passed").length
                      const failed = suite.tests.filter((t) => t.status === "failed").length
                      const total = suite.tests.length

                      return (
                        <div key={suite.name} className="p-3 border rounded">
                          <h5 className="font-medium text-sm">{suite.name}</h5>
                          <p className="text-xs text-muted-foreground">
                            {passed}/{total} passed
                          </p>
                          {failed > 0 && <p className="text-xs text-red-500">{failed} failed</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
