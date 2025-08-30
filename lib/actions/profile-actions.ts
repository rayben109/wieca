"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import type { ProfileData } from "@/lib/types"
import { ObjectId } from "mongodb"
import { Parser } from "json2csv"

export async function updateProfile(profileData: ProfileData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const profilesCollection = db.collection("profiles")

    // Check if profile exists
    const existingProfile = await profilesCollection.findOne({
      userId: new ObjectId(session.user.id),
    })

    if (existingProfile) {
      // Update existing profile
      await profilesCollection.updateOne(
        { userId: new ObjectId(session.user.id) },
        { $set: { ...profileData, updatedAt: new Date() } },
      )
    } else {
      // Create new profile
      await profilesCollection.insertOne({
        userId: new ObjectId(session.user.id),
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Update user name in users collection
    if (profileData.name) {
      const usersCollection = db.collection("users")
      await usersCollection.updateOne(
        { _id: new ObjectId(session.user.id) },
        {
          $set: {
            name: profileData.name,
            profileImage: profileData.profileImage,
          },
        },
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function getProfile() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return null
    }

    const db = await connectToDatabase()
    const profilesCollection = db.collection("profiles")

    const profile = await profilesCollection.findOne({
      userId: new ObjectId(session.user.id),
    })

    if (!profile) {
      return {
        name: "",
        bio: "",
        education: "",
        expertise: [],
        sector: "",
        role: "",
        organization: "",
        yearsOfExperience: 0,
        previousMentorship: false,
        mentorshipResources: "",
        mentorshipExpectations: "",
        communicationPreferences: [],
        communicationPlatforms: [],
        careerGoals: "",
        interests: "",
        phoneNumber: "",
        gender: "",
        profileImage: "",
        availability: "",
      }
    }

    return profile
  } catch (error) {
    console.error("Get profile error:", error)
    return null
  }
}

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
