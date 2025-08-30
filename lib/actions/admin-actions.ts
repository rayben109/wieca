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
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const [totalUsers, totalMentors, totalMentees, activeMentorships, pendingRequests] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("users").countDocuments({ role: "mentor" }),
      db.collection("users").countDocuments({ role: "mentee" }),
      db.collection("mentorships").countDocuments({ status: "active" }),
      db.collection("mentorshipRequests").countDocuments({ status: "pending" }),
    ])

    return {
      totalUsers,
      totalMentors,
      totalMentees,
      activeMentorships,
      pendingRequests,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw new Error("Failed to fetch dashboard statistics")
  }
}

export async function getAnalyticsData() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "admin") {
      return { success: false, error: "Unauthorized" }
    }

    const { db } = await connectToDatabase()

    // Get user registration data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const userRegistrations = await db
      .collection("users")
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

    // Get mentorship success rate
    const mentorshipStats = await db
      .collection("mentorships")
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    return {
      userRegistrations,
      mentorshipStats,
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    throw new Error("Failed to fetch analytics data")
  }
}

export async function getAllMentorships() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const mentorships = await db
      .collection("mentorships")
      .aggregate([
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
        {
          $unwind: "$mentor",
        },
        {
          $unwind: "$mentee",
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray()

    return mentorships
  } catch (error) {
    console.error("Error fetching mentorships:", error)
    throw new Error("Failed to fetch mentorships")
  }
}

export async function createMentorship(mentorId: string, menteeId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    // Check if mentorship already exists
    const existingMentorship = await db.collection("mentorships").findOne({
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(menteeId),
    })

    if (existingMentorship) {
      throw new Error("Mentorship already exists between these users")
    }

    const mentorship = {
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(menteeId),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("mentorships").insertOne(mentorship)

    revalidatePath("/admin/mentorships")
    return { success: true, mentorshipId: result.insertedId }
  } catch (error) {
    console.error("Error creating mentorship:", error)
    throw new Error("Failed to create mentorship")
  }
}

export async function updateMentorshipStatus(mentorshipId: string, status: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    await db.collection("mentorships").updateOne(
      { _id: new ObjectId(mentorshipId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )

    revalidatePath("/admin/mentorships")
    return { success: true }
  } catch (error) {
    console.error("Error updating mentorship status:", error)
    throw new Error("Failed to update mentorship status")
  }
}

export async function getMentorsList() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const mentors = await db
      .collection("users")
      .find(
        { role: "mentor" },
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            expertise: 1,
            createdAt: 1,
            profileImage: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray()

    return mentors
  } catch (error) {
    console.error("Error fetching mentors list:", error)
    throw new Error("Failed to fetch mentors list")
  }
}

export async function getMenteesList() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const mentees = await db
      .collection("users")
      .find(
        { role: "mentee" },
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            interests: 1,
            createdAt: 1,
            profileImage: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .toArray()

    return mentees
  } catch (error) {
    console.error("Error fetching mentees list:", error)
    throw new Error("Failed to fetch mentees list")
  }
}

export async function updatePlatformSettings(settings: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    await db.collection("settings").updateOne(
      { type: "platform" },
      {
        $set: {
          ...settings,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      },
      { upsert: true },
    )

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating platform settings:", error)
    throw new Error("Failed to update platform settings")
  }
}

export async function getAllMentors() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const mentors = await db.collection("users").find({ role: "mentor" }).sort({ createdAt: -1 }).toArray()

    return mentors
  } catch (error) {
    console.error("Error fetching all mentors:", error)
    throw new Error("Failed to fetch all mentors")
  }
}

export async function getAllMentees() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const { db } = await connectToDatabase()

    const mentees = await db.collection("users").find({ role: "mentee" }).sort({ createdAt: -1 }).toArray()

    return mentees
  } catch (error) {
    console.error("Error fetching all mentees:", error)
    throw new Error("Failed to fetch all mentees")
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
