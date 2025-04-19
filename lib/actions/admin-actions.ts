"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { AdminStats } from "@/lib/types"

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      throw new Error("Unauthorized")
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")
    const requestsCollection = db.collection("mentorshipRequests")

    // Get user counts
    const totalUsers = await usersCollection.countDocuments()
    const mentorCount = await usersCollection.countDocuments({ role: "mentor" })
    const menteeCount = await usersCollection.countDocuments({ role: "mentee" })

    // Get mentorship stats
    const totalRequests = await requestsCollection.countDocuments()
    const acceptedRequests = await requestsCollection.countDocuments({ status: "accepted" })
    const pendingRequests = await requestsCollection.countDocuments({ status: "pending" })
    const declinedRequests = await requestsCollection.countDocuments({ status: "declined" })

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
          count: item.count,
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
          date: match.updatedAt.toISOString(),
          status: "Active",
        })),
      )

    // Calculate average response time (in hours)
    const avgResponseTime = 24 // Placeholder - would need more complex query in real implementation

    return {
      totalUsers,
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
      totalUsers: 0,
      mentorCount: 0,
      menteeCount: 0,
      activeMentorships: 0,
      requestStats: {
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        acceptanceRate: 0,
        avgResponseTime: 0,
      },
      recentUsers: [],
      userGrowth: [],
      expertiseDistribution: [],
      recentMatches: [],
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

    await usersCollection.updateOne({ _id: new ObjectId(userId) }, { $set: { role: "admin" } })

    return { success: true }
  } catch (error) {
    console.error("Promote to admin error:", error)
    return { success: false, error: "Failed to promote user to admin" }
  }
}
