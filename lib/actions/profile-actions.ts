"use server"

import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function updateProfile(profileData: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          ...profileData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return { success: false, error: "Profile not found or no changes made" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function getProfile(userId?: string) {
  try {
    const session = await getServerSession(authOptions)
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "User ID required" }
    }

    const { db } = await connectToDatabase()

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(targetUserId) }, { projection: { password: 0 } })

    if (!user) {
      return { success: false, error: "Profile not found" }
    }

    return {
      success: true,
      profile: {
        ...user,
        id: user._id.toString(),
        _id: undefined,
      },
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
    return { success: false, error: "Failed to fetch profile" }
  }
}

export async function getUserProfiles() {
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
      .toArray()

    // Get mentorship statistics for each user
    const profilesWithStats = await Promise.all(
      users.map(async (user) => {
        const mentorships = await db
          .collection("mentorships")
          .aggregate([
            {
              $match: {
                $or: [{ mentorId: user._id }, { menteeId: user._id }],
              },
            },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray()

        const mentorshipStats = {
          active: mentorships.find((m) => m._id === "active")?.count || 0,
          completed: mentorships.find((m) => m._id === "completed")?.count || 0,
          pending: mentorships.find((m) => m._id === "pending")?.count || 0,
        }

        return {
          ...user,
          id: user._id.toString(),
          _id: undefined,
          mentorships: mentorshipStats,
          lastActive: user.lastLoginAt || user.updatedAt || user.createdAt,
        }
      }),
    )

    return {
      success: true,
      profiles: profilesWithStats,
    }
  } catch (error) {
    console.error("Error fetching user profiles:", error)
    return { success: false, error: "Failed to fetch user profiles" }
  }
}

export async function exportUserProfiles(userIds?: string[]) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Admin access required" }
    }

    const { db } = await connectToDatabase()

    let query = {}
    if (userIds && userIds.length > 0) {
      query = { _id: { $in: userIds.map((id) => new ObjectId(id)) } }
    }

    const users = await db
      .collection("users")
      .find(query, {
        projection: {
          password: 0,
        },
      })
      .toArray()

    // Convert to CSV format
    const headers = [
      "ID",
      "Name",
      "Email",
      "Role",
      "Status",
      "Created At",
      "Updated At",
      "Bio",
      "Skills",
      "Interests",
      "Experience",
      "Education",
      "Location",
      "Phone",
      "LinkedIn",
      "GitHub",
      "Website",
      "Availability",
      "Mentorship Goals",
    ]

    const csvRows = [
      headers.join(","),
      ...users.map((user) =>
        [
          user._id.toString(),
          `"${user.name || ""}"`,
          `"${user.email || ""}"`,
          user.role || "",
          user.status || "",
          user.createdAt ? new Date(user.createdAt).toISOString() : "",
          user.updatedAt ? new Date(user.updatedAt).toISOString() : "",
          `"${user.profile?.bio || ""}"`,
          `"${user.profile?.skills?.join("; ") || ""}"`,
          `"${user.profile?.interests?.join("; ") || ""}"`,
          `"${user.profile?.experience || ""}"`,
          `"${user.profile?.education || ""}"`,
          `"${user.profile?.location || ""}"`,
          `"${user.profile?.phone || ""}"`,
          `"${user.profile?.linkedin || ""}"`,
          `"${user.profile?.github || ""}"`,
          `"${user.profile?.website || ""}"`,
          `"${user.profile?.availability || ""}"`,
          `"${user.profile?.mentorshipGoals?.join("; ") || ""}"`,
        ].join(","),
      ),
    ]

    const csvData = csvRows.join("\n")

    return {
      success: true,
      csvData,
    }
  } catch (error) {
    console.error("Error exporting user profiles:", error)
    return { success: false, error: "Failed to export user profiles" }
  }
}
