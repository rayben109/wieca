import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== "admin") {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up MongoDB change stream
      let changeStream: any = null

      const setupChangeStream = async () => {
        try {
          const { db } = await connectToDatabase()

          // Watch for changes in conversations collection
          changeStream = db.collection("conversations").watch([
            {
              $match: {
                $or: [{ "fullDocument.flagged": true }, { "updateDescription.updatedFields.flagged": true }],
              },
            },
          ])

          changeStream.on("change", (change: any) => {
            const notification = {
              type: "flagged_conversation",
              id: change.fullDocument?._id || change.documentKey._id,
              message: "A conversation has been flagged for review",
              timestamp: new Date().toISOString(),
              data: {
                conversationId: change.fullDocument?._id || change.documentKey._id,
                participants: change.fullDocument?.participants || [],
              },
            }

            const data = `data: ${JSON.stringify(notification)}\n\n`
            controller.enqueue(encoder.encode(data))
          })

          // Watch for new user registrations
          const userChangeStream = db.collection("users").watch([
            {
              $match: {
                operationType: "insert",
              },
            },
          ])

          userChangeStream.on("change", (change: any) => {
            const notification = {
              type: "new_user",
              id: change.fullDocument._id,
              message: `New ${change.fullDocument.role} registered: ${change.fullDocument.name}`,
              timestamp: new Date().toISOString(),
              data: {
                userId: change.fullDocument._id,
                name: change.fullDocument.name,
                email: change.fullDocument.email,
                role: change.fullDocument.role,
              },
            }

            const data = `data: ${JSON.stringify(notification)}\n\n`
            controller.enqueue(encoder.encode(data))
          })

          // Watch for mentorship requests
          const requestChangeStream = db.collection("mentorshipRequests").watch([
            {
              $match: {
                operationType: "insert",
              },
            },
          ])

          requestChangeStream.on("change", (change: any) => {
            const notification = {
              type: "new_mentorship_request",
              id: change.fullDocument._id,
              message: "New mentorship request submitted",
              timestamp: new Date().toISOString(),
              data: {
                requestId: change.fullDocument._id,
                mentorId: change.fullDocument.mentorId,
                menteeId: change.fullDocument.menteeId,
              },
            }

            const data = `data: ${JSON.stringify(notification)}\n\n`
            controller.enqueue(encoder.encode(data))
          })
        } catch (error) {
          console.error("Error setting up change stream:", error)
          const errorData = `data: ${JSON.stringify({ type: "error", message: "Connection error" })}\n\n`
          controller.enqueue(encoder.encode(errorData))
        }
      }

      setupChangeStream()

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        const heartbeatData = `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`
        controller.enqueue(encoder.encode(heartbeatData))
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        if (changeStream) {
          changeStream.close()
        }
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
