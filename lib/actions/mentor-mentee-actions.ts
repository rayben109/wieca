"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getMyMentors() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "mentee") {
      return { success: false, error: "Unauthorized", data: [] }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Find accepted mentorship requests where the current user is the mentee
    const acceptedRequests = await requestsCollection
      .find({
        menteeId: new ObjectId(session.user.id),
        status: "accepted",
      })
      .toArray()

    if (acceptedRequests.length === 0) {
      return { success: true, data: [] }
    }

    // Get mentor IDs from the requests
    const mentorIds = acceptedRequests.map((req) => req.mentorId)

    // Get mentor user documents
    const mentorUsers = await usersCollection
      .find({
        _id: { $in: mentorIds },
      })
      .toArray()

    // Get mentor profiles
    const mentorProfiles = await profilesCollection
      .find({
        userId: { $in: mentorIds },
      })
      .toArray()

    // Combine user and profile data
    const mentors = mentorUsers.map((user) => {
      const profile = mentorProfiles.find((p) => p.userId.toString() === user._id.toString()) || {}
      const request = acceptedRequests.find((r) => r.mentorId.toString() === user._id.toString())

      return {
        id: user._id.toString(),
        name: profile.name || user.name || user.email,
        email: user.email,
        role: profile.role || "",
        organization: profile.organization || "",
        bio: profile.bio || "",
        expertise: profile.expertise || [],
        sector: profile.sector || "",
        profileImage: profile.profileImage || "",
        requestId: request ? request._id.toString() : "",
        requestDate: request ? request.createdAt : null,
      }
    })

    return { success: true, data: mentors }
  } catch (error) {
    console.error("Get my mentors error:", error)
    return { success: false, error: "Failed to fetch mentors", data: [] }
  }
}

export async function getMyMentees() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "mentor") {
      return { success: false, error: "Unauthorized", data: [] }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Find accepted mentorship requests where the current user is the mentor
    const acceptedRequests = await requestsCollection
      .find({
        mentorId: new ObjectId(session.user.id),
        status: "accepted",
      })
      .toArray()

    if (acceptedRequests.length === 0) {
      return { success: true, data: [] }
    }

    // Get mentee IDs from the requests
    const menteeIds = acceptedRequests.map((req) => req.menteeId)

    // Get mentee user documents
    const menteeUsers = await usersCollection
      .find({
        _id: { $in: menteeIds },
      })
      .toArray()

    // Get mentee profiles
    const menteeProfiles = await profilesCollection
      .find({
        userId: { $in: menteeIds },
      })
      .toArray()

    // Combine user and profile data
    const mentees = menteeUsers.map((user) => {
      const profile = menteeProfiles.find((p) => p.userId.toString() === user._id.toString()) || {}
      const request = acceptedRequests.find((r) => r.menteeId.toString() === user._id.toString())

      return {
        id: user._id.toString(),
        name: profile.name || user.name || user.email,
        email: user.email,
        interests: profile.interests || "",
        careerGoals: profile.careerGoals || "",
        bio: profile.bio || "",
        profileImage: profile.profileImage || "",
        requestId: request ? request._id.toString() : "",
        requestDate: request ? request.createdAt : null,
      }
    })

    return { success: true, data: mentees }
  } catch (error) {
    console.error("Get my mentees error:", error)
    return { success: false, error: "Failed to fetch mentees", data: [] }
  }
}
