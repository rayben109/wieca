"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmailNotification } from "@/lib/email"
import type { MentorshipSession } from "@/lib/types"

export async function getMentorshipSessions(startDate: string, endDate: string): Promise<MentorshipSession[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const sessionsCollection = db.collection("mentorshipSessions")
    const usersCollection = db.collection("users")

    // Find sessions where the user is a participant
    const sessions = await sessionsCollection
      .find({
        $or: [{ creatorId: new ObjectId(session.user.id) }, { participantId: new ObjectId(session.user.id) }],
        startTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
      .sort({ startTime: 1 })
      .toArray()

    if (sessions.length === 0) {
      return []
    }

    // Get all participant IDs
    const participantIds = sessions.flatMap((s) => [s.creatorId, s.participantId])
    const uniqueParticipantIds = [...new Set(participantIds.map((id) => id.toString()))]

    // Get user details for all participants
    const users = await usersCollection
      .find({
        _id: { $in: uniqueParticipantIds.map((id) => new ObjectId(id)) },
      })
      .toArray()

    // Map sessions with participant details
    const sessionsWithDetails = sessions.map((s) => {
      const isCreator = s.creatorId.toString() === session.user.id
      const otherParticipantId = isCreator ? s.participantId : s.creatorId
      const otherParticipant = users.find((u) => u._id.toString() === otherParticipantId.toString())

      return {
        id: s._id.toString(),
        title: s.title,
        description: s.description || "",
        startTime: s.startTime.toISOString(),
        status: s.status,
        isCreator,
        participant: {
          id: otherParticipantId.toString(),
          name: otherParticipant?.name || otherParticipant?.email || "Unknown User",
          email: otherParticipant?.email || "",
        },
      }
    })

    return sessionsWithDetails
  } catch (error) {
    console.error("Get mentorship sessions error:", error)
    return []
  }
}

interface ScheduleSessionParams {
  title: string
  description: string
  participantId: string
  startTime: string
}

export async function scheduleSession({ title, description, participantId, startTime }: ScheduleSessionParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const sessionsCollection = db.collection("mentorshipSessions")
    const usersCollection = db.collection("users")

    // Verify the participant exists
    const participant = await usersCollection.findOne({ _id: new ObjectId(participantId) })

    if (!participant) {
      return { success: false, error: "Participant not found" }
    }

    // Create session
    const result = await sessionsCollection.insertOne({
      title,
      description,
      creatorId: new ObjectId(session.user.id),
      participantId: new ObjectId(participantId),
      startTime: new Date(startTime),
      status: "pending",
      createdAt: new Date(),
    })

    // Send email notification to participant
    if (participant.email) {
      await sendEmailNotification({
        to: participant.email,
        subject: "New Mentorship Session Invitation",
        template: "new-request", // Reusing the request template for now
        data: {
          mentorName: participant.name || participant.email,
          menteeName: session.user.name || session.user.email || "A user",
          message: `You have been invited to a mentorship session: ${title}. ${description ? `\n\n${description}` : ""}`,
          requestUrl: `/calendar`, // Link to calendar
        },
      })
    }

    return {
      success: true,
      sessionId: result.insertedId.toString(),
    }
  } catch (error) {
    console.error("Schedule session error:", error)
    return { success: false, error: "Failed to schedule session" }
  }
}

export async function updateSessionStatus(sessionId: string, status: "confirmed" | "cancelled") {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const sessionsCollection = db.collection("mentorshipSessions")
    const usersCollection = db.collection("users")

    // Verify the session exists and user is a participant
    const mentorshipSession = await sessionsCollection.findOne({
      _id: new ObjectId(sessionId),
      $or: [{ creatorId: new ObjectId(session.user.id) }, { participantId: new ObjectId(session.user.id) }],
    })

    if (!mentorshipSession) {
      return { success: false, error: "Session not found or you don't have permission" }
    }

    // Update session status
    await sessionsCollection.updateOne({ _id: new ObjectId(sessionId) }, { $set: { status, updatedAt: new Date() } })

    // Determine the other participant to notify
    const otherParticipantId =
      mentorshipSession.creatorId.toString() === session.user.id
        ? mentorshipSession.participantId
        : mentorshipSession.creatorId

    // Get other participant details
    const otherParticipant = await usersCollection.findOne({ _id: otherParticipantId })

    if (otherParticipant?.email) {
      // Send email notification
      await sendEmailNotification({
        to: otherParticipant.email,
        subject: `Mentorship Session ${status === "confirmed" ? "Confirmed" : "Cancelled"}`,
        template: "request-status", // Reusing the request status template
        data: {
          menteeName: otherParticipant.name || otherParticipant.email,
          mentorName: session.user.name || session.user.email || "A user",
          status,
          dashboardUrl: `/calendar`,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Update session status error:", error)
    return { success: false, error: `Failed to ${status} session` }
  }
}
