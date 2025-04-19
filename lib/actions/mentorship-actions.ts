"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { MentorProfile, MentorshipRequest } from "@/lib/types"

interface SearchFilters {
  expertise?: string
  sector?: string
  searchTerm?: string
}

export async function searchMentors(filters: SearchFilters = {}): Promise<MentorProfile[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

    // Build query
    const query: any = { role: "mentor" }

    // Get all mentor users
    const mentorUsers = await usersCollection.find(query).toArray()

    if (mentorUsers.length === 0) {
      return []
    }

    // Get mentor IDs
    const mentorIds = mentorUsers.map((user) => user._id)

    // Build profile query
    const profileQuery: any = {
      userId: { $in: mentorIds },
    }

    if (filters.expertise) {
      profileQuery.expertise = filters.expertise
    }

    if (filters.sector) {
      profileQuery.sector = filters.sector
    }

    if (filters.searchTerm) {
      profileQuery.$or = [
        { name: { $regex: filters.searchTerm, $options: "i" } },
        { bio: { $regex: filters.searchTerm, $options: "i" } },
        { role: { $regex: filters.searchTerm, $options: "i" } },
      ]
    }

    // Get mentor profiles
    const mentorProfiles = await profilesCollection.find(profileQuery).toArray()

    // Map users to profiles
    const mentorsWithProfiles = mentorProfiles.map((profile) => {
      const user = mentorUsers.find((u) => u._id.toString() === profile.userId.toString())

      return {
        id: user._id.toString(),
        name: profile.name || user.name || user.email,
        email: user.email,
        bio: profile.bio || "",
        role: profile.role || "",
        sector: profile.sector || "",
        expertise: profile.expertise || [],
      }
    })

    return mentorsWithProfiles
  } catch (error) {
    console.error("Search mentors error:", error)
    return []
  }
}

interface RequestParams {
  mentorId: string
  message: string
}

export async function sendMentorshipRequest({ mentorId, message }: RequestParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")

    // Check if request already exists
    const existingRequest = await requestsCollection.findOne({
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(session.user.id),
      status: "pending",
    })

    if (existingRequest) {
      return { success: false, error: "You already have a pending request with this mentor" }
    }

    // Create request
    const result = await requestsCollection.insertOne({
      mentorId: new ObjectId(mentorId),
      menteeId: new ObjectId(session.user.id),
      message,
      status: "pending",
      createdAt: new Date(),
    })

    return { success: true, requestId: result.insertedId.toString() }
  } catch (error) {
    console.error("Send request error:", error)
    return { success: false, error: "Failed to send mentorship request" }
  }
}

export async function getMentorshipRequests(): Promise<MentorshipRequest[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")
    const usersCollection = db.collection("users")

    // Build query based on user role
    const query =
      session.user.role === "mentor"
        ? { mentorId: new ObjectId(session.user.id) }
        : { menteeId: new ObjectId(session.user.id) }

    // Get requests
    const requests = await requestsCollection.find(query).sort({ createdAt: -1 }).toArray()

    if (requests.length === 0) {
      return []
    }

    // Get all user IDs involved in requests
    const userIds = requests.flatMap((req) => [req.mentorId, req.menteeId])

    // Get user details
    const users = await usersCollection
      .find({
        _id: { $in: userIds },
      })
      .toArray()

    // Map requests with user details
    const requestsWithUsers = requests.map((req) => {
      const mentor = users.find((u) => u._id.toString() === req.mentorId.toString())
      const mentee = users.find((u) => u._id.toString() === req.menteeId.toString())

      return {
        id: req._id.toString(),
        mentorId: req.mentorId.toString(),
        menteeId: req.menteeId.toString(),
        message: req.message,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
        mentor: {
          name: mentor?.name || mentor?.email,
          email: mentor?.email,
        },
        mentee: {
          name: mentee?.name || mentee?.email,
          email: mentee?.email,
        },
      }
    })

    return requestsWithUsers
  } catch (error) {
    console.error("Get requests error:", error)
    return []
  }
}

export async function updateRequestStatus(requestId: string, status: "accepted" | "declined") {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const requestsCollection = db.collection("mentorshipRequests")

    // Verify the request belongs to this mentor
    const request = await requestsCollection.findOne({
      _id: new ObjectId(requestId),
      mentorId: new ObjectId(session.user.id),
    })

    if (!request) {
      return { success: false, error: "Request not found or you don't have permission" }
    }

    // Update request status
    await requestsCollection.updateOne({ _id: new ObjectId(requestId) }, { $set: { status, updatedAt: new Date() } })

    return { success: true }
  } catch (error) {
    console.error("Update request status error:", error)
    return { success: false, error: "Failed to update request status" }
  }
}
