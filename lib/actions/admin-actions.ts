"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

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
