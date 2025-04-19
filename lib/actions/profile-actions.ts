"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import type { ProfileData } from "@/lib/types"
import { ObjectId } from "mongodb"

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
