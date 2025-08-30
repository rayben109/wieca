"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function getAllUsers() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    const users = await db
      .collection("users")
      .find(
        {},
        {
          projection: {
            password: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray()

    const usersWithId = users.map((user) => ({
      ...user,
      id: user._id.toString(),
      _id: undefined,
    }))

    return { success: true, users: usersWithId }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    // Don't allow deleting the current admin
    if (userId === session.user.id) {
      return { success: false, error: "Cannot delete your own account" }
    }

    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return { success: false, error: "User not found" }
    }

    // Also clean up related data
    await Promise.all([
      db.collection("mentorships").deleteMany({
        $or: [{ mentorId: new ObjectId(userId) }, { menteeId: new ObjectId(userId) }],
      }),
      db.collection("messages").deleteMany({
        $or: [{ senderId: new ObjectId(userId) }, { receiverId: new ObjectId(userId) }],
      }),
      db.collection("notifications").deleteMany({
        $or: [{ userId: new ObjectId(userId) }, { fromUserId: new ObjectId(userId) }],
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function updateUserRole(userId: string, newRole: "admin" | "mentor" | "mentee") {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: newRole,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return { success: false, error: "User not found or no changes made" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
  role: "admin" | "mentor" | "mentee"
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      email: userData.email.toLowerCase(),
    })

    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role,
      status: "active",
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("users").insertOne(newUser)

    return {
      success: true,
      userId: result.insertedId.toString(),
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function getAllConversations() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    // Get all conversations with participant details
    const conversations = await db
      .collection("conversations")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participantDetails",
          },
        },
        {
          $lookup: {
            from: "messages",
            let: { conversationId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$conversationId", "$$conversationId"] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "lastMessage",
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages",
          },
        },
        {
          $project: {
            participants: {
              $map: {
                input: "$participantDetails",
                as: "participant",
                in: {
                  id: { $toString: "$$participant._id" },
                  name: "$$participant.name",
                  email: "$$participant.email",
                  image: "$$participant.image",
                  role: "$$participant.role",
                },
              },
            },
            lastMessage: {
              $cond: {
                if: { $gt: [{ $size: "$lastMessage" }, 0] },
                then: {
                  content: { $arrayElemAt: ["$lastMessage.content", 0] },
                  timestamp: { $arrayElemAt: ["$lastMessage.createdAt", 0] },
                  senderId: { $toString: { $arrayElemAt: ["$lastMessage.senderId", 0] } },
                },
                else: {
                  content: "No messages yet",
                  timestamp: "$createdAt",
                  senderId: "",
                },
              },
            },
            messageCount: { $size: "$messages" },
            status: { $ifNull: ["$status", "active"] },
            flags: { $ifNull: ["$flags", []] },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
      ])
      .toArray()

    const conversationsWithId = conversations.map((conv) => ({
      ...conv,
      id: conv._id.toString(),
      _id: undefined,
    }))

    return { success: true, conversations: conversationsWithId }
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return { success: false, error: "Failed to fetch conversations" }
  }
}

export async function moderateConversation(conversationId: string, action: "approve" | "flag" | "block") {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    const updateData: any = {
      status: action === "approve" ? "approved" : action === "flag" ? "flagged" : "blocked",
      updatedAt: new Date(),
    }

    if (action === "flag") {
      updateData.$push = {
        flags: {
          reason: "Flagged by admin",
          reportedBy: session.user.id,
          timestamp: new Date(),
        },
      }
    }

    const result = await db
      .collection("conversations")
      .updateOne({ _id: new ObjectId(conversationId) }, action === "flag" ? updateData : { $set: updateData })

    if (result.modifiedCount === 0) {
      return { success: false, error: "Conversation not found" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error moderating conversation:", error)
    return { success: false, error: "Failed to moderate conversation" }
  }
}

export async function getAnalytics() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    const [totalUsers, totalMentors, totalMentees, activeMentorships, totalConversations, flaggedConversations] =
      await Promise.all([
        db.collection("users").countDocuments(),
        db.collection("users").countDocuments({ role: "mentor" }),
        db.collection("users").countDocuments({ role: "mentee" }),
        db.collection("mentorships").countDocuments({ status: "active" }),
        db.collection("conversations").countDocuments(),
        db.collection("conversations").countDocuments({ status: "flagged" }),
      ])

    return {
      success: true,
      analytics: {
        totalUsers,
        totalMentors,
        totalMentees,
        activeMentorships,
        totalConversations,
        flaggedConversations,
      },
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return { success: false, error: "Failed to fetch analytics" }
  }
}

export async function getDashboardStats() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()
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
    const acceptanceRate = totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0

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
        })),
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
        })),
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
          mentor: match.mentor[0]?.name || match.mentor[0]?.email.split("@")[0] || "Unknown",
          mentee: match.mentee[0]?.name || match.mentee[0]?.email.split("@")[0] || "Unknown",
          date: match.updatedAt?.toISOString() || match.createdAt?.toISOString(),
          status: "Active",
        })),
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
      error: error instanceof Error ? error.message : "Failed to get admin stats",
    }
  }
}

export async function getAdminStats() {
  return getDashboardStats()
}

export async function getAnalyticsData() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
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
        })),
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
        })),
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
      error: error instanceof Error ? error.message : "Failed to get analytics data",
    }
  }
}

export async function getUsersAdmin() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Get all users
    const users = await usersCollection.find().sort({ createdAt: -1 }).toArray()

    // Get profiles for all users
    const userIds = users.map((user) => user._id)
    const profiles = await profilesCollection.find({ userId: { $in: userIds } }).toArray()

    // Map users with profile information
    const usersWithProfiles = users.map((user) => {
      const profile = profiles.find((p) => p.userId.toString() === user._id.toString())

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

export async function getAllMentors() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
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
      const profile = mentorProfiles.find((p) => p.userId.toString() === user._id.toString())

      return {
        id: user._id.toString(),
        name: user.name || profile?.name || user.email.split("@")[0],
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      }
    })

    return {
      success: true,
      users: mentors,
    }
  } catch (error) {
    console.error("Get mentors error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get mentors",
    }
  }
}

export async function getAllMentees() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
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
      const profile = menteeProfiles.find((p) => p.userId.toString() === user._id.toString())

      return {
        id: user._id.toString(),
        name: user.name || profile?.name || user.email.split("@")[0],
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      }
    })

    return {
      success: true,
      users: mentees,
    }
  } catch (error) {
    console.error("Get mentees error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get mentees",
    }
  }
}

export async function getAllMentorships() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")
    const usersCollection = db.collection("users")

    // Get all mentorship requests
    const requests = await requestsCollection.find().sort({ createdAt: -1 }).toArray()

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
      const mentor = users.find((u) => u._id.toString() === req.mentorId.toString())
      const mentee = users.find((u) => u._id.toString() === req.menteeId.toString())

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
      error: error instanceof Error ? error.message : "Failed to get mentorships",
    }
  }
}

export async function updateMentorshipStatus(mentorshipId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    if (!mentorshipId || !status) {
      return { success: false, error: "Mentorship ID and status are required" }
    }

    const { db } = await connectToDatabase()
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
      },
    )

    // If the status is accepted, create a conversation between mentor and mentee
    if (status === "accepted" && existingRequest.status !== "accepted") {
      const conversationsCollection = db.collection("conversations")

      // Check if a conversation already exists
      const existingConversation = await conversationsCollection.findOne({
        participants: {
          $all: [new ObjectId(existingRequest.mentorId), new ObjectId(existingRequest.menteeId)],
        },
      })

      if (!existingConversation) {
        // Create a new conversation
        await conversationsCollection.insertOne({
          participants: [new ObjectId(existingRequest.mentorId), new ObjectId(existingRequest.menteeId)],
          createdAt: new Date(),
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Update mentorship status error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update mentorship status",
    }
  }
}

export async function getMentorsList() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
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
      const profile = mentorProfiles.find((p) => p.userId.toString() === user._id.toString())

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
      error: error instanceof Error ? error.message : "Failed to get mentors list",
    }
  }
}

export async function getMenteesList() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
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
      const profile = menteeProfiles.find((p) => p.userId.toString() === user._id.toString())

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
      error: error instanceof Error ? error.message : "Failed to get mentees list",
    }
  }
}

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

    const { db } = await connectToDatabase()
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
      error: error instanceof Error ? error.message : "Failed to create mentorship",
    }
  }
}

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

    const { db } = await connectToDatabase()
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
      { upsert: true },
    )

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Update platform settings error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update platform settings",
    }
  }
}

export async function promoteToAdmin(userId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()
    const usersCollection = db.collection("users")

    await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { role: "admin" } })

    return { success: true }
  } catch (error) {
    console.error("Promote to admin error:", error)
    return { success: false, error: "Failed to promote user to admin" }
  }
}

export async function getUserProfiles(filter?: { role?: string }) {
  const res = await fetch(`/api/admin/user-profiles${filter?.role ? `?role=${filter.role}` : ""}`, { method: "GET" })
  return res.json()
}

// Additional aliases for compatibility
export const createUserAdmin = createUser
export const updateUserAdmin = updateUserRole
export const deleteUserAdmin = deleteUser

// Additional exports for compatibility
export const fetchAllUsers = getAllUsers
export const fetchAllConversations = getAllConversations
export const fetchAllMentorships = getAllMentorships
