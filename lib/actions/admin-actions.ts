"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { hash } from "bcryptjs"

export async function getAdminStats() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")
    const requestsCollection = db.collection("mentorshipRequests")
    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")
    const notificationsCollection = db.collection("notifications")
    const settingsCollection = db.collection("settings")

    // Get user counts
    const totalUsers = await usersCollection.countDocuments()
    const adminCount = await usersCollection.countDocuments({ role: "admin" })
    const mentorCount = await usersCollection.countDocuments({ role: "mentor" })
    const menteeCount = await usersCollection.countDocuments({ role: "mentee" })

    // Get mentorship stats
    const totalRequests = await requestsCollection.countDocuments()
    const acceptedRequests = await requestsCollection.countDocuments({
      status: "accepted",
    })
    const pendingRequests = await requestsCollection.countDocuments({
      status: "pending",
    })
    const declinedRequests = await requestsCollection.countDocuments({
      status: "declined",
    })

    // Calculate acceptance rate
    const acceptanceRate =
      totalRequests > 0
        ? Math.round((acceptedRequests / totalRequests) * 100)
        : 0

    // Get recent users
    const recentUsers = await usersCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
      .then((users) =>
        users.map((user) => ({
          id: user._id.toString(),
          name: user.name || user.email.split("@")[0],
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        }))
      )

    // Get user growth data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const usersByMonth = await usersCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ])
      .toArray()

    const userGrowth = usersByMonth.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1, 1)
      return {
        date: date.toISOString().split("T")[0],
        count: item.count,
      }
    })

    // Get expertise distribution
    const expertiseDistribution = await profilesCollection
      .aggregate([
        {
          $unwind: "$expertise",
        },
        {
          $group: {
            _id: "$expertise",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ])
      .toArray()
      .then((items) =>
        items.map((item) => ({
          name: item._id,
          value: item.count,
        }))
      )

    // Get recent matches
    const recentMatches = await requestsCollection
      .aggregate([
        {
          $match: { status: "accepted" },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: "users",
            localField: "mentorId",
            foreignField: "_id",
            as: "mentor",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "menteeId",
            foreignField: "_id",
            as: "mentee",
          },
        },
      ])
      .toArray()
      .then((matches) =>
        matches.map((match) => ({
          id: match._id.toString(),
          mentor:
            match.mentor[0]?.name ||
            match.mentor[0]?.email.split("@")[0] ||
            "Unknown",
          mentee:
            match.mentee[0]?.name ||
            match.mentee[0]?.email.split("@")[0] ||
            "Unknown",
          date:
            match.updatedAt?.toISOString() || match.createdAt?.toISOString(),
          status: "Active",
        }))
      )

    // Calculate average response time (in hours)
    const avgResponseTime = 24 // Placeholder - would need more complex query in real implementation

    return {
      success: true,
      totalUsers,
      adminCount,
      mentorCount,
      menteeCount,
      activeMentorships: acceptedRequests,
      requestStats: {
        total: totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests,
        declined: declinedRequests,
        acceptanceRate,
        avgResponseTime,
      },
      recentUsers,
      userGrowth,
      expertiseDistribution,
      recentMatches,
    }
  } catch (error) {
    console.error("Get admin stats error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get admin stats",
    }
  }
}

export async function getDashboardStats() {
  // Reuse the existing getAdminStats function
  return getAdminStats()
}

// Add the missing getAnalyticsData function
export async function getAnalyticsData() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const requestsCollection = db.collection("mentorshipRequests")
    const messagesCollection = db.collection("messages")

    // Get user growth data (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const usersByMonth = await usersCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ])
      .toArray()

    const userGrowth = usersByMonth.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1, 1)
      return {
        date: date.toISOString().split("T")[0],
        count: item.count,
      }
    })

    // Get mentorship requests by status
    const requestsByStatus = await requestsCollection
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()
      .then((items) =>
        items.map((item) => ({
          name: item._id,
          value: item.count,
        }))
      )

    // Get user roles distribution
    const userRoles = await usersCollection
      .aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()
      .then((items) =>
        items.map((item) => ({
          name: item._id || "unknown",
          value: item.count,
        }))
      )

    // Get message activity over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const messagesByDay = await messagesCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ])
      .toArray()

    const messageActivity = messagesByDay.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day)
      return {
        date: date.toISOString().split("T")[0],
        count: item.count,
      }
    })

    return {
      success: true,
      userGrowth,
      requestsByStatus,
      userRoles,
      messageActivity,
    }
  } catch (error) {
    console.error("Get analytics data error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get analytics data",
    }
  }
}

export async function getUsersAdmin() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Get all users
    const users = await usersCollection.find().sort({ createdAt: -1 }).toArray()

    // Get profiles for all users
    const userIds = users.map((user) => user._id)
    const profiles = await profilesCollection
      .find({ userId: { $in: userIds } })
      .toArray()

    // Map users with profile information
    const usersWithProfiles = users.map((user) => {
      const profile = profiles.find(
        (p) => p.userId.toString() === user._id.toString()
      )

      return {
        id: user._id.toString(),
        name: user.name || profile?.name || user.email.split("@")[0],
        email: user.email,
        role: user.role || "user",
        status: user.status || "active",
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      }
    })

    return {
      success: true,
      users: usersWithProfiles,
    }
  } catch (error) {
    console.error("Get users error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get users",
    }
  }
}

// Add alias for getAllUsers
export const getAllUsers = getUsersAdmin

export async function createUserAdmin(userData: {
  name: string
  email: string
  password: string
  role: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { name, email, password, role } = userData

    if (!email || !password || !role) {
      return { success: false, error: "Missing required fields" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create the user
    const result = await usersCollection.insertOne({
      email,
      name,
      password: hashedPassword,
      role,
      status: "active",
      createdAt: new Date(),
    })

    // Create a profile document
    if (name) {
      const profilesCollection = db.collection("profiles")
      await profilesCollection.insertOne({
        userId: result.insertedId,
        name,
        createdAt: new Date(),
      })
    }

    return { success: true, userId: result.insertedId.toString() }
  } catch (error) {
    console.error("Create user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    }
  }
}

// Add alias for createUser
export const createUser = createUserAdmin

export async function updateUserAdmin(userData: {
  id: string
  name: string
  role: string
  status: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { id, name, role, status } = userData

    if (!id) {
      return { success: false, error: "User ID is required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if the user exists
    const existingUser = await usersCollection.findOne({
      _id: new ObjectId(id),
    })
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Update the user
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          role,
          status,
          updatedAt: new Date(),
        },
      }
    )

    // Update the profile name if it exists
    if (name) {
      const profilesCollection = db.collection("profiles")
      const existingProfile = await profilesCollection.findOne({
        userId: new ObjectId(id),
      })

      if (existingProfile) {
        await profilesCollection.updateOne(
          { userId: new ObjectId(id) },
          { $set: { name, updatedAt: new Date() } }
        )
      } else {
        await profilesCollection.insertOne({
          userId: new ObjectId(id),
          name,
          createdAt: new Date(),
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    }
  }
}

// Add updateUserRole function
export async function updateUserRole(userId: string, role: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    if (!userId || !role) {
      return { success: false, error: "User ID and role are required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if the user exists
    const existingUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    })
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Update the user's role
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    )

    return { success: true }
  } catch (error) {
    console.error("Update user role error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update user role",
    }
  }
}

export async function deleteUserAdmin(userId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    // Check if the user exists
    const existingUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    })
    if (!existingUser) {
      return { success: false, error: "User not found" }
    }

    // Don't allow admins to delete themselves
    if (userId === session.user.id) {
      return { success: false, error: "Cannot delete your own account" }
    }

    // Delete the user and associated data
    await usersCollection.deleteOne({ _id: new ObjectId(userId) })

    // Delete profile
    const profilesCollection = db.collection("profiles")
    await profilesCollection.deleteOne({ userId: new ObjectId(userId) })

    // Delete mentorship requests where the user is a participant
    const requestsCollection = db.collection("mentorshipRequests")
    await requestsCollection.deleteMany({
      $or: [
        { mentorId: new ObjectId(userId) },
        { menteeId: new ObjectId(userId) },
      ],
    })

    // Delete conversations where the user is a participant
    const conversationsCollection = db.collection("conversations")
    const userConversations = await conversationsCollection
      .find({
        participants: new ObjectId(userId),
      })
      .toArray()

    const conversationIds = userConversations.map((conv) => conv._id)

    // Delete messages in those conversations
    if (conversationIds.length > 0) {
      const messagesCollection = db.collection("messages")
      await messagesCollection.deleteMany({
        conversationId: { $in: conversationIds },
      })
    }

    // Delete the conversations
    await conversationsCollection.deleteMany({
      participants: new ObjectId(userId),
    })

    // Delete notifications
    const notificationsCollection = db.collection("notifications")
    await notificationsCollection.deleteMany({ userId: new ObjectId(userId) })

    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    }
  }
}

// Add alias for deleteUser
export const deleteUser = deleteUserAdmin

export async function getAllMentorships() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")
    const usersCollection = db.collection("users")

    // Get all mentorship requests
    const requests = await requestsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray()

    // Get all user IDs involved in requests
    const userIds = requests.flatMap((req) => [req.mentorId, req.menteeId])
    const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))]

    // Get user details
    const users = await usersCollection
      .find({
        _id: { $in: uniqueUserIds.map((id) => new ObjectId(id)) },
      })
      .toArray()

    // Map requests with user details
    const mentorships = requests.map((req) => {
      const mentor = users.find(
        (u) => u._id.toString() === req.mentorId.toString()
      )
      const mentee = users.find(
        (u) => u._id.toString() === req.menteeId.toString()
      )

      return {
        id: req._id.toString(),
        mentorId: req.mentorId.toString(),
        menteeId: req.menteeId.toString(),
        mentorName: mentor?.name || mentor?.email || "Unknown Mentor",
        menteeName: mentee?.name || mentee?.email || "Unknown Mentee",
        status: req.status,
        message: req.message,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt?.toISOString(),
      }
    })

    return {
      success: true,
      mentorships,
    }
  } catch (error) {
    console.error("Get mentorships error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get mentorships",
    }
  }
}

// Add updateMentorshipStatus function
export async function updateMentorshipStatus(
  mentorshipId: string,
  status: string
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    if (!mentorshipId || !status) {
      return { success: false, error: "Mentorship ID and status are required" }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")

    // Check if the mentorship exists
    const existingRequest = await requestsCollection.findOne({
      _id: new ObjectId(mentorshipId),
    })
    if (!existingRequest) {
      return { success: false, error: "Mentorship not found" }
    }

    // Update the mentorship status
    await requestsCollection.updateOne(
      { _id: new ObjectId(mentorshipId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )

    // If the status is accepted, create a conversation between mentor and mentee
    if (status === "accepted" && existingRequest.status !== "accepted") {
      const conversationsCollection = db.collection("conversations")

      // Check if a conversation already exists
      const existingConversation = await conversationsCollection.findOne({
        participants: {
          $all: [
            new ObjectId(existingRequest.mentorId),
            new ObjectId(existingRequest.menteeId),
          ],
        },
      })

      if (!existingConversation) {
        // Create a new conversation
        await conversationsCollection.insertOne({
          participants: [
            new ObjectId(existingRequest.mentorId),
            new ObjectId(existingRequest.menteeId),
          ],
          createdAt: new Date(),
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Update mentorship status error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update mentorship status",
    }
  }
}

export async function getMentorsList() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Get all mentor users
    const mentorUsers = await usersCollection
      .find({
        role: "mentor",
        status: "active",
      })
      .toArray()

    // Get profiles for mentors
    const mentorIds = mentorUsers.map((user) => user._id)
    const mentorProfiles = await profilesCollection
      .find({
        userId: { $in: mentorIds },
      })
      .toArray()

    // Map mentors with their profiles
    const mentors = mentorUsers.map((user) => {
      const profile = mentorProfiles.find(
        (p) => p.userId.toString() === user._id.toString()
      )

      return {
        id: user._id.toString(),
        name: user.name || profile?.name || user.email.split("@")[0],
        email: user.email,
      }
    })

    return {
      success: true,
      mentors,
    }
  } catch (error) {
    console.error("Get mentors list error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get mentors list",
    }
  }
}

// Add alias for getAllMentors
export const getAllMentors = getMentorsList

export async function getMenteesList() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Get all mentee users
    const menteeUsers = await usersCollection
      .find({
        role: "mentee",
        status: "active",
      })
      .toArray()

    // Get profiles for mentees
    const menteeIds = menteeUsers.map((user) => user._id)
    const menteeProfiles = await profilesCollection
      .find({
        userId: { $in: menteeIds },
      })
      .toArray()

    // Map mentees with their profiles
    const mentees = menteeUsers.map((user) => {
      const profile = menteeProfiles.find(
        (p) => p.userId.toString() === user._id.toString()
      )

      return {
        id: user._id.toString(),
        name: user.name || profile?.name || user.email.split("@")[0],
        email: user.email,
      }
    })

    return {
      success: true,
      mentees,
    }
  } catch (error) {
    console.error("Get mentees list error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get mentees list",
    }
  }
}

// Add alias for getAllMentees
export const getAllMentees = getMenteesList

export async function createMentorship(data: {
  mentorId: string
  menteeId: string
  message: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { mentorId, menteeId, message } = data

    if (!mentorId || !menteeId) {
      return { success: false, error: "Mentor ID and Mentee ID are required" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const requestsCollection = db.collection("mentorshipRequests")

    // Check if mentor and mentee exist
    const mentor = await usersCollection.findOne({
      _id: new ObjectId(mentorId),
      role: "mentor",
    })
    if (!mentor) {
      return { success: false, error: "Mentor not found" }
    }

    const mentee = await usersCollection.findOne({
      _id: new ObjectId(menteeId),
      role: "mentee",
    })
    if (!mentee) {
      return { success: false, error: "Mentee not found" }
    }

    // Check if a mentorship already exists between these users
    const existingRequest = await requestsCollection.findOne({
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(menteeId),
    })

    if (existingRequest) {
      return {
        success: false,
        error: "A mentorship already exists between these users",
      }
    }

    // Create the mentorship request
    const result = await requestsCollection.insertOne({
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(menteeId),
      message: message || "Admin created mentorship",
      status: "accepted", // Auto-accept when created by admin
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create a conversation between mentor and mentee
    const conversationsCollection = db.collection("conversations")
    await conversationsCollection.insertOne({
      participants: [new ObjectId(mentorId), new ObjectId(menteeId)],
      createdAt: new Date(),
    })

    return { success: true, mentorshipId: result.insertedId.toString() }
  } catch (error) {
    console.error("Create mentorship error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create mentorship",
    }
  }
}

// Add updatePlatformSettings function
export async function updatePlatformSettings(settings: {
  siteName?: string
  allowRegistration?: boolean
  maxMentorshipsPerMentor?: number
  autoApproveUsers?: boolean
  emailNotifications?: boolean
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const settingsCollection = db.collection("settings")

    // Update or create platform settings
    await settingsCollection.updateOne(
      { type: "platform" },
      {
        $set: {
          ...settings,
          updatedAt: new Date(),
          updatedBy: new ObjectId(session.user.id),
        },
      },
      { upsert: true }
    )

    return { success: true }
  } catch (error) {
    console.error("Update platform settings error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update platform settings",
    }
  }
}

export async function promoteToAdmin(userId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: "admin" } }
    )

    return { success: true }
  } catch (error) {
    console.error("Promote to admin error:", error)
    return { success: false, error: "Failed to promote user to admin" }
  }
}

/* export async function getUserProfilesFromDB(filter?: { role?: string }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  const db = await connectToDatabase()

  const pipeline: any[] = [
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "userId",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        id: { $toString: "$_id" },
        name: 1,
        email: 1,
        role: 1,
        status: 1,
        createdAt: 1,
        image: 1,
        emailVerified: 1,

        // profile-specific fields
        bio: "$profile.bio",
        education: "$profile.education",
        expertise: "$profile.expertise",
        sector: "$profile.sector",
        organization: "$profile.organization",
        yearsOfExperience: "$profile.yearsOfExperience",
        previousMentorship: "$profile.previousMentorship",
        mentorshipResources: "$profile.mentorshipResources",
        mentorshipExpectations: "$profile.mentorshipExpectations",
        communicationPreferences: "$profile.communicationPreferences",
        communicationPlatforms: "$profile.communicationPlatforms",
        careerGoals: "$profile.careerGoals",
        interests: "$profile.interests",
        phoneNumber: "$profile.phoneNumber",
        gender: "$profile.gender",
        profileImage: "$profile.profileImage",
        availability: "$profile.availability",
      },
    },
  ]

  if (filter?.role) {
    pipeline.unshift({ $match: { role: filter.role } })
  }

  return db.collection("users").aggregate(pipeline).toArray()
} */

export async function getUserProfiles(filter?: { role?: string }) {
  const res = await fetch(
    `/api/admin/user-profiles${filter?.role ? `?role=${filter.role}` : ""}`,
    { method: "GET" }
  )
  return res.json()
}