"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { MentorProfile } from "@/lib/types"

// Calculate similarity score between mentor and mentee
function calculateSimilarityScore(mentorProfile: any, menteeProfile: any): number {
  let score = 0
  const weights = {
    expertise: 0.4,
    sector: 0.2,
    interests: 0.2,
    communicationPreferences: 0.2,
  }

  // Match expertise areas
  if (mentorProfile.expertise && menteeProfile.expertise) {
    const mentorExpertise = new Set(mentorProfile.expertise)
    const menteeExpertise = new Set(menteeProfile.expertise)
    const commonExpertise = new Set([...mentorExpertise].filter((x) => menteeExpertise.has(x)))
    score += weights.expertise * (commonExpertise.size / Math.max(1, menteeExpertise.size))
  }

  // Match sector
  if (mentorProfile.sector && menteeProfile.sector && mentorProfile.sector === menteeProfile.sector) {
    score += weights.sector
  }

  // Match interests (text similarity)
  if (mentorProfile.interests && menteeProfile.interests) {
    const mentorInterests = mentorProfile.interests.toLowerCase().split(/\W+/)
    const menteeInterests = menteeProfile.interests.toLowerCase().split(/\W+/)
    const mentorInterestsSet = new Set(mentorInterests)
    const menteeInterestsSet = new Set(menteeInterests)
    const commonInterests = new Set([...mentorInterestsSet].filter((x) => menteeInterestsSet.has(x)))
    score += weights.interests * (commonInterests.size / Math.max(1, menteeInterestsSet.size))
  }

  // Match communication preferences
  if (mentorProfile.communicationPreferences && menteeProfile.communicationPreferences) {
    const mentorPrefs = new Set(mentorProfile.communicationPreferences)
    const menteePrefs = new Set(menteeProfile.communicationPreferences)
    const commonPrefs = new Set([...mentorPrefs].filter((x) => menteePrefs.has(x)))
    score += weights.communicationPreferences * (commonPrefs.size / Math.max(1, menteePrefs.size))
  }

  return score
}

export async function getRecommendedMentors(): Promise<MentorProfile[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "mentee") {
      return []
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")
    const requestsCollection = db.collection("mentorshipRequests")

    // Get mentee profile
    const menteeProfile = await profilesCollection.findOne({
      userId: new ObjectId(session.user.id),
    })

    if (!menteeProfile) {
      return []
    }

    // Get all mentor users
    const mentorUsers = await usersCollection.find({ role: "mentor" }).toArray()

    if (mentorUsers.length === 0) {
      return []
    }

    // Get mentor IDs
    const mentorIds = mentorUsers.map((user) => user._id)

    // Get mentor profiles
    const mentorProfiles = await profilesCollection
      .find({
        userId: { $in: mentorIds },
      })
      .toArray()

    // Get existing requests to exclude mentors already requested
    const existingRequests = await requestsCollection
      .find({
        menteeId: new ObjectId(session.user.id),
      })
      .toArray()

    const requestedMentorIds = new Set(existingRequests.map((req) => req.mentorId.toString()))

    // Calculate similarity scores
    const scoredMentors = mentorProfiles
      .map((profile) => {
        const user = mentorUsers.find((u) => u._id.toString() === profile.userId.toString())
        if (!user) return null

        // Skip mentors that have already been requested
        if (requestedMentorIds.has(user._id.toString())) return null

        const similarityScore = calculateSimilarityScore(profile, menteeProfile)

        return {
          id: user._id.toString(),
          name: profile.name || user.name || user.email,
          email: user.email,
          bio: profile.bio || "",
          role: profile.role || "",
          sector: profile.sector || "",
          expertise: profile.expertise || [],
          similarityScore,
        }
      })
      .filter(Boolean)
      .sort((a, b) => b!.similarityScore - a!.similarityScore)
      .slice(0, 6) // Get top 6 recommendations

    return scoredMentors as MentorProfile[]
  } catch (error) {
    console.error("Get recommended mentors error:", error)
    return []
  }
}
