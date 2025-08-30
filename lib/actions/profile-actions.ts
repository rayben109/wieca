"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import type { ProfileData } from "@/lib/types"
import { ObjectId } from "mongodb"
import { Parser } from "json2csv"


export async function getUserProfiles(filter?: { role?: string }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" }
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

          // profile fields
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
      pipeline.unshift({
        $match: { role: filter.role },
      })
    }

    const profiles = await db.collection("users").aggregate(pipeline).toArray()
    return { success: true, data: profiles }
  } catch (error) {
    console.error("Get user profiles error:", error)
    return { success: false, error: "Failed to fetch user profiles" }
  }
}


export async function exportUserProfiles(filter?: { role?: string }) {
  const result = await getUserProfiles(filter)

  if (!result.success) {
    return result
  }

  const fields = [
    "id",
    "name",
    "email",
    "role",
    "status",
    "createdAt",
    "bio",
    "education",
    "expertise",
    "sector",
    "organization",
    "yearsOfExperience",
    "careerGoals",
    "interests",
    "phoneNumber",
    "gender",
    "availability",
  ]

  const parser = new Parser({ fields })
  const csv = parser.parse(result.data)

  return { success: true, csv }
}

