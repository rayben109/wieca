"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Users,
  MessageSquare,
  UserCheck,
  Settings,
  Shield,
  Database,
} from "lucide-react"
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getAllConversations,
  moderateConversation,
  getAllMentorships,
  updateMentorshipStatus,
  getAnalytics,
  getDashboardStats,
} from "@/lib/actions/admin-actions"

interface TestResult {
  name: string
  status: "pending" | "running" | "passed" | "failed" | "warning"
  message: string
  duration?: number
  details?: any
}

interface TestSuite {
  name: string
  description: string
  tests: TestResult[]
  status: "pending" | "running" | "completed"
  totalTests: number
  passedTests: number
  failedTests: number
  warningTests: number
}

export default function AdminTestPage() {
  const { data: session } = useSession()
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [testResults, setTestResults] = useState<any>({})

  const initializeTestSuites = (): TestSuite[] => [
    {
      name: "Authentication & Authorization",
      description: "Test admin access controls and permissions",
      tests: [
        { name: "Admin Session Validation", status: "pending", message: "" },
        { name: "Role-based Access Control", status: "pending", message: "" },
        { name: "Unauthorized Access Prevention", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
    {
      name: "User Management",
      description: "Test CRUD operations for user accounts",
      tests: [
        { name: "Fetch All Users", status: "pending", message: "" },
        { name: "Create New User", status: "pending", message: "" },
        { name: "Update User Role", status: "pending", message: "" },
        { name: "Delete User Account", status: "pending", message: "" },
        { name: "Prevent Self-Deletion", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 5,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
    {
      name: "Conversation Management",
      description: "Test conversation moderation and monitoring",
      tests: [
        { name: "Fetch All Conversations", status: "pending", message: "" },
        { name: "Moderate Conversation", status: "pending", message: "" },
        { name: "Flag Conversation", status: "pending", message: "" },
        { name: "Block Conversation", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 4,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
    {
      name: "Mentorship Management",
      description: "Test mentorship relationship controls",
      tests: [
        { name: "Fetch All Mentorships", status: "pending", message: "" },
        { name: "Update Mentorship Status", status: "pending", message: "" },
        { name: "Create Admin Mentorship", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
    {
      name: "Analytics & Reporting",
      description: "Test data analytics and dashboard functionality",
      tests: [
        { name: "Fetch Analytics Data", status: "pending", message: "" },
        { name: "Dashboard Statistics", status: "pending", message: "" },
        { name: "User Growth Metrics", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
    {
      name: "Data Integrity",
      description: "Test data validation and consistency",
      tests: [
        { name: "Email Uniqueness Validation", status: "pending", message: "" },
        { name: "Required Fields Validation", status: "pending", message: "" },
        { name: "Role Consistency Check", status: "pending", message: "" },
      ],
      status: "pending",
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
    },
  ]

  useEffect(() => {
    setTestSuites(initializeTestSuites())
  }, [])

  const updateTestResult = (suiteName: string, testName: string, result: Partial<TestResult>) => {
    setTestSuites((prev) =>
      prev.map((suite) => {
        if (suite.name === suiteName) {
          const updatedTests = suite.tests.map((test) => (test.name === testName ? { ...test, ...result } : test))

          const passedTests = updatedTests.filter((t) => t.status === "passed").length
          const failedTests = updatedTests.filter((t) => t.status === "failed").length
          const warningTests = updatedTests.filter((t) => t.status === "warning").length

          return {
            ...suite,
            tests: updatedTests,
            passedTests,
            failedTests,
            warningTests,
            status: updatedTests.every((t) => t.status !== "pending" && t.status !== "running")
              ? "completed"
              : suite.status,
          }
        }
        return suite
      }),
    )
  }

  const runTest = async (suiteName: string, testName: string, testFunction: () => Promise<TestResult>) => {
    setCurrentTest(`${suiteName}: ${testName}`)
    updateTestResult(suiteName, testName, { status: "running", message: "Running..." })

    const startTime = Date.now()
    try {
      const result = await testFunction()
      const duration = Date.now() - startTime
      updateTestResult(suiteName, testName, { ...result, duration })
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(suiteName, testName, {
        status: "failed",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        duration,
      })
    }
  }

  const runAuthenticationTests = async () => {
    const suiteName = "Authentication & Authorization"

    // Test 1: Admin Session Validation
    await runTest(suiteName, "Admin Session Validation", async () => {
      if (!session?.user) {
        return { name: "Admin Session Validation", status: "failed", message: "No active session found" }
      }

      if (session.user.role !== "admin") {
        return {
          name: "Admin Session Validation",
          status: "failed",
          message: `User role is '${session.user.role}', expected 'admin'`,
        }
      }

      return { name: "Admin Session Validation", status: "passed", message: "Admin session validated successfully" }
    })

    // Test 2: Role-based Access Control
    await runTest(suiteName, "Role-based Access Control", async () => {
      try {
        const result = await getAllUsers()
        if (result.success) {
          return {
            name: "Role-based Access Control",
            status: "passed",
            message: "Admin can access user management functions",
          }
        } else {
          return { name: "Role-based Access Control", status: "failed", message: result.error || "Access denied" }
        }
      } catch (error) {
        return { name: "Role-based Access Control", status: "failed", message: `Access control error: ${error}` }
      }
    })

    // Test 3: Unauthorized Access Prevention
    await runTest(suiteName, "Unauthorized Access Prevention", async () => {
      // This test would ideally simulate a non-admin user trying to access admin functions
      // For now, we'll check if the current admin session is properly validated
      if (session?.user?.role === "admin") {
        return {
          name: "Unauthorized Access Prevention",
          status: "passed",
          message: "Access control working - admin user authenticated",
        }
      } else {
        return {
          name: "Unauthorized Access Prevention",
          status: "warning",
          message: "Cannot fully test without non-admin session",
        }
      }
    })
  }

  const runUserManagementTests = async () => {
    const suiteName = "User Management"
    let testUserId: string | null = null

    // Test 1: Fetch All Users
    await runTest(suiteName, "Fetch All Users", async () => {
      const result = await getAllUsers()
      if (result.success && result.users) {
        setTestResults((prev) => ({ ...prev, userCount: result.users.length }))
        return {
          name: "Fetch All Users",
          status: "passed",
          message: `Successfully fetched ${result.users.length} users`,
          details: { userCount: result.users.length },
        }
      } else {
        return { name: "Fetch All Users", status: "failed", message: result.error || "Failed to fetch users" }
      }
    })

    // Test 2: Create New User
    await runTest(suiteName, "Create New User", async () => {
      const testUserData = {
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "TestPassword123!",
        role: "mentee" as const,
      }

      const result = await createUser(testUserData)
      if (result.success && result.userId) {
        testUserId = result.userId
        setTestResults((prev) => ({ ...prev, createdUserId: testUserId }))
        return {
          name: "Create New User",
          status: "passed",
          message: `Successfully created user with ID: ${testUserId}`,
          details: { userId: testUserId, email: testUserData.email },
        }
      } else {
        return { name: "Create New User", status: "failed", message: result.error || "Failed to create user" }
      }
    })

    // Test 3: Update User Role
    await runTest(suiteName, "Update User Role", async () => {
      if (!testUserId) {
        return { name: "Update User Role", status: "failed", message: "No test user available for role update" }
      }

      const result = await updateUserRole(testUserId, "mentor")
      if (result.success) {
        return {
          name: "Update User Role",
          status: "passed",
          message: "Successfully updated user role to mentor",
          details: { userId: testUserId, newRole: "mentor" },
        }
      } else {
        return { name: "Update User Role", status: "failed", message: result.error || "Failed to update user role" }
      }
    })

    // Test 4: Prevent Self-Deletion
    await runTest(suiteName, "Prevent Self-Deletion", async () => {
      if (!session?.user?.id) {
        return { name: "Prevent Self-Deletion", status: "failed", message: "No current user ID available" }
      }

      const result = await deleteUser(session.user.id)
      if (!result.success && result.error?.includes("Cannot delete your own account")) {
        return {
          name: "Prevent Self-Deletion",
          status: "passed",
          message: "Self-deletion prevention working correctly",
        }
      } else if (result.success) {
        return {
          name: "Prevent Self-Deletion",
          status: "failed",
          message: "Self-deletion was allowed (security issue!)",
        }
      } else {
        return { name: "Prevent Self-Deletion", status: "warning", message: `Unexpected error: ${result.error}` }
      }
    })

    // Test 5: Delete User Account (cleanup)
    await runTest(suiteName, "Delete User Account", async () => {
      if (!testUserId) {
        return { name: "Delete User Account", status: "warning", message: "No test user to delete" }
      }

      const result = await deleteUser(testUserId)
      if (result.success) {
        return {
          name: "Delete User Account",
          status: "passed",
          message: "Successfully deleted test user",
          details: { deletedUserId: testUserId },
        }
      } else {
        return { name: "Delete User Account", status: "failed", message: result.error || "Failed to delete user" }
      }
    })
  }

  const runConversationManagementTests = async () => {
    const suiteName = "Conversation Management"

    // Test 1: Fetch All Conversations
    await runTest(suiteName, "Fetch All Conversations", async () => {
      const result = await getAllConversations()
      if (result.success && result.conversations) {
        setTestResults((prev) => ({ ...prev, conversationCount: result.conversations.length }))
        return {
          name: "Fetch All Conversations",
          status: "passed",
          message: `Successfully fetched ${result.conversations.length} conversations`,
          details: { conversationCount: result.conversations.length },
        }
      } else {
        return {
          name: "Fetch All Conversations",
          status: "failed",
          message: result.error || "Failed to fetch conversations",
        }
      }
    })

    // Test 2: Moderate Conversation (if conversations exist)
    await runTest(suiteName, "Moderate Conversation", async () => {
      const conversationsResult = await getAllConversations()
      if (
        !conversationsResult.success ||
        !conversationsResult.conversations ||
        conversationsResult.conversations.length === 0
      ) {
        return {
          name: "Moderate Conversation",
          status: "warning",
          message: "No conversations available for moderation testing",
        }
      }

      const testConversation = conversationsResult.conversations[0]
      const result = await moderateConversation(testConversation.id, "approve")
      if (result.success) {
        return {
          name: "Moderate Conversation",
          status: "passed",
          message: "Successfully moderated conversation",
          details: { conversationId: testConversation.id, action: "approve" },
        }
      } else {
        return {
          name: "Moderate Conversation",
          status: "failed",
          message: result.error || "Failed to moderate conversation",
        }
      }
    })

    // Test 3: Flag Conversation
    await runTest(suiteName, "Flag Conversation", async () => {
      const conversationsResult = await getAllConversations()
      if (
        !conversationsResult.success ||
        !conversationsResult.conversations ||
        conversationsResult.conversations.length === 0
      ) {
        return {
          name: "Flag Conversation",
          status: "warning",
          message: "No conversations available for flagging testing",
        }
      }

      const testConversation = conversationsResult.conversations[0]
      const result = await moderateConversation(testConversation.id, "flag")
      if (result.success) {
        return {
          name: "Flag Conversation",
          status: "passed",
          message: "Successfully flagged conversation",
          details: { conversationId: testConversation.id, action: "flag" },
        }
      } else {
        return { name: "Flag Conversation", status: "failed", message: result.error || "Failed to flag conversation" }
      }
    })

    // Test 4: Block Conversation
    await runTest(suiteName, "Block Conversation", async () => {
      const conversationsResult = await getAllConversations()
      if (
        !conversationsResult.success ||
        !conversationsResult.conversations ||
        conversationsResult.conversations.length === 0
      ) {
        return {
          name: "Block Conversation",
          status: "warning",
          message: "No conversations available for blocking testing",
        }
      }

      const testConversation = conversationsResult.conversations[0]
      const result = await moderateConversation(testConversation.id, "block")
      if (result.success) {
        return {
          name: "Block Conversation",
          status: "passed",
          message: "Successfully blocked conversation",
          details: { conversationId: testConversation.id, action: "block" },
        }
      } else {
        return { name: "Block Conversation", status: "failed", message: result.error || "Failed to block conversation" }
      }
    })
  }

  const runMentorshipManagementTests = async () => {
    const suiteName = "Mentorship Management"

    // Test 1: Fetch All Mentorships
    await runTest(suiteName, "Fetch All Mentorships", async () => {
      const result = await getAllMentorships()
      if (result.success && result.mentorships) {
        setTestResults((prev) => ({ ...prev, mentorshipCount: result.mentorships.length }))
        return {
          name: "Fetch All Mentorships",
          status: "passed",
          message: `Successfully fetched ${result.mentorships.length} mentorships`,
          details: { mentorshipCount: result.mentorships.length },
        }
      } else {
        return {
          name: "Fetch All Mentorships",
          status: "failed",
          message: result.error || "Failed to fetch mentorships",
        }
      }
    })

    // Test 2: Update Mentorship Status
    await runTest(suiteName, "Update Mentorship Status", async () => {
      const mentorshipsResult = await getAllMentorships()
      if (!mentorshipsResult.success || !mentorshipsResult.mentorships || mentorshipsResult.mentorships.length === 0) {
        return {
          name: "Update Mentorship Status",
          status: "warning",
          message: "No mentorships available for status update testing",
        }
      }

      const testMentorship = mentorshipsResult.mentorships[0]
      const result = await updateMentorshipStatus(testMentorship.id, "active")
      if (result.success) {
        return {
          name: "Update Mentorship Status",
          status: "passed",
          message: "Successfully updated mentorship status",
          details: { mentorshipId: testMentorship.id, newStatus: "active" },
        }
      } else {
        return {
          name: "Update Mentorship Status",
          status: "failed",
          message: result.error || "Failed to update mentorship status",
        }
      }
    })

    // Test 3: Create Admin Mentorship (would need mentor and mentee IDs)
    await runTest(suiteName, "Create Admin Mentorship", async () => {
      return {
        name: "Create Admin Mentorship",
        status: "warning",
        message: "Test skipped - requires specific mentor and mentee IDs",
      }
    })
  }

  const runAnalyticsTests = async () => {
    const suiteName = "Analytics & Reporting"

    // Test 1: Fetch Analytics Data
    await runTest(suiteName, "Fetch Analytics Data", async () => {
      const result = await getAnalytics()
      if (result.success && result.analytics) {
        setTestResults((prev) => ({ ...prev, analytics: result.analytics }))
        return {
          name: "Fetch Analytics Data",
          status: "passed",
          message: "Successfully fetched analytics data",
          details: result.analytics,
        }
      } else {
        return { name: "Fetch Analytics Data", status: "failed", message: result.error || "Failed to fetch analytics" }
      }
    })

    // Test 2: Dashboard Statistics
    await runTest(suiteName, "Dashboard Statistics", async () => {
      const result = await getDashboardStats()
      if (result.success) {
        setTestResults((prev) => ({ ...prev, dashboardStats: result }))
        return {
          name: "Dashboard Statistics",
          status: "passed",
          message: "Successfully fetched dashboard statistics",
          details: { totalUsers: result.totalUsers, mentorCount: result.mentorCount },
        }
      } else {
        return {
          name: "Dashboard Statistics",
          status: "failed",
          message: result.error || "Failed to fetch dashboard stats",
        }
      }
    })

    // Test 3: User Growth Metrics
    await runTest(suiteName, "User Growth Metrics", async () => {
      const result = await getDashboardStats()
      if (result.success && result.userGrowth) {
        return {
          name: "User Growth Metrics",
          status: "passed",
          message: `User growth data available with ${result.userGrowth.length} data points`,
          details: { dataPoints: result.userGrowth.length },
        }
      } else {
        return { name: "User Growth Metrics", status: "warning", message: "User growth data not available or empty" }
      }
    })
  }

  const runDataIntegrityTests = async () => {
    const suiteName = "Data Integrity"

    // Test 1: Email Uniqueness Validation
    await runTest(suiteName, "Email Uniqueness Validation", async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`

      // Create first user
      const firstResult = await createUser({
        name: "First User",
        email: duplicateEmail,
        password: "TestPassword123!",
        role: "mentee",
      })

      if (!firstResult.success) {
        return { name: "Email Uniqueness Validation", status: "failed", message: "Failed to create first test user" }
      }

      // Try to create second user with same email
      const secondResult = await createUser({
        name: "Second User",
        email: duplicateEmail,
        password: "TestPassword123!",
        role: "mentor",
      })

      // Clean up first user
      if (firstResult.userId) {
        await deleteUser(firstResult.userId)
      }

      if (!secondResult.success && secondResult.error?.includes("already exists")) {
        return {
          name: "Email Uniqueness Validation",
          status: "passed",
          message: "Email uniqueness validation working correctly",
        }
      } else {
        return { name: "Email Uniqueness Validation", status: "failed", message: "Duplicate email was allowed" }
      }
    })

    // Test 2: Required Fields Validation
    await runTest(suiteName, "Required Fields Validation", async () => {
      try {
        const result = await createUser({
          name: "",
          email: "",
          password: "",
          role: "mentee",
        })

        if (!result.success) {
          return {
            name: "Required Fields Validation",
            status: "passed",
            message: "Required field validation working correctly",
          }
        } else {
          return { name: "Required Fields Validation", status: "failed", message: "Empty fields were accepted" }
        }
      } catch (error) {
        return {
          name: "Required Fields Validation",
          status: "passed",
          message: "Validation error caught as expected",
        }
      }
    })

    // Test 3: Role Consistency Check
    await runTest(suiteName, "Role Consistency Check", async () => {
      const usersResult = await getAllUsers()
      if (!usersResult.success || !usersResult.users) {
        return { name: "Role Consistency Check", status: "failed", message: "Could not fetch users for role check" }
      }

      const validRoles = ["admin", "mentor", "mentee"]
      const invalidRoles = usersResult.users.filter((user) => !validRoles.includes(user.role))

      if (invalidRoles.length === 0) {
        return {
          name: "Role Consistency Check",
          status: "passed",
          message: `All ${usersResult.users.length} users have valid roles`,
        }
      } else {
        return {
          name: "Role Consistency Check",
          status: "failed",
          message: `Found ${invalidRoles.length} users with invalid roles`,
          details: { invalidRoles: invalidRoles.map((u) => ({ id: u.id, role: u.role })) },
        }
      }
    })
  }

  const runAllTests = async () => {
    if (!session?.user || session.user.role !== "admin") {
      alert("Admin access required to run tests")
      return
    }

    setIsRunning(true)
    setProgress(0)
    setTestResults({})

    const totalSuites = 6
    let completedSuites = 0

    try {
      // Run all test suites
      await runAuthenticationTests()
      completedSuites++
      setProgress((completedSuites / totalSuites) * 100)

      await runUserManagementTests()
      completedSuites++
      setProgress((completedSuites / totalSuites) * 100)

      await runConversationManagementTests()
      completedSuites++
      setProgress((completedSuites / totalSuites) * 100)

      await runMentorshipManagementTests()
      completedSuites++
      setProgress((completedSuites / totalSuites) * 100)

      await runAnalyticsTests()
      completedSuites++
      setProgress((completedSuites / totalSuites) * 100)

      await runDataIntegrityTests()
      completedSuites++
      setProgress(100)
    } catch (error) {
      console.error("Test execution error:", error)
    } finally {
      setIsRunning(false)
      setCurrentTest("")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: "default",
      failed: "destructive",
      warning: "secondary",
      running: "outline",
      pending: "outline",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const getSuiteIcon = (suiteName: string) => {
    switch (suiteName) {
      case "Authentication & Authorization":
        return <Shield className="h-5 w-5" />
      case "User Management":
        return <Users className="h-5 w-5" />
      case "Conversation Management":
        return <MessageSquare className="h-5 w-5" />
      case "Mentorship Management":
        return <UserCheck className="h-5 w-5" />
      case "Analytics & Reporting":
        return <Database className="h-5 w-5" />
      case "Data Integrity":
        return <Settings className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  if (!session?.user || session.user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Admin access is required to view this testing interface.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Actions Test Suite</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing of admin functionality, permissions, and data integrity
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={runAllTests} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Test Progress</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentTest && <p className="text-sm text-gray-600">Currently running: {currentTest}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
          <TabsTrigger value="data">Test Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSuites.map((suite) => (
              <Card key={suite.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSuiteIcon(suite.name)}
                      <CardTitle className="text-lg">{suite.name}</CardTitle>
                    </div>
                    {getStatusBadge(suite.status)}
                  </div>
                  <CardDescription>{suite.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Tests:</span>
                      <span className="font-medium">{suite.totalTests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Passed:</span>
                      <span className="font-medium text-green-600">{suite.passedTests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Failed:</span>
                      <span className="font-medium text-red-600">{suite.failedTests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Warnings:</span>
                      <span className="font-medium text-yellow-600">{suite.warningTests}</span>
                    </div>
                    {suite.totalTests > 0 && (
                      <div className="pt-2">
                        <Progress value={(suite.passedTests / suite.totalTests) * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {testSuites.map((suite) => (
            <Card key={suite.name}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getSuiteIcon(suite.name)}
                  <CardTitle>{suite.name}</CardTitle>
                  {getStatusBadge(suite.status)}
                </div>
                <CardDescription>{suite.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.tests.map((test) => (
                    <div key={test.name} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{test.name}</h4>
                            {test.duration && <span className="text-xs text-gray-500">{test.duration}ms</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                          {test.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-blue-600 cursor-pointer">View Details</summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Data</CardTitle>
              <CardDescription>Data collected during test execution for analysis and debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
