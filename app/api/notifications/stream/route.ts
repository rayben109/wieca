import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected", message: "Real-time notifications connected" })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up MongoDB change stream for real-time updates
      let changeStream: any = null

      const setupChangeStream = async () => {
        try {
          const { db } = await connectToDatabase()

          // Watch for changes in conversations, users, and notifications collections
          changeStream = db.collection("conversations").watch([{ $match: { "fullDocument.status": "flagged" } }])

          changeStream.on("change", (change: any) => {
            if (change.operationType === "update" && change.fullDocument?.status === "flagged") {
              const notification = {
                type: "conversation_flagged",
                id: change.fullDocument._id.toString(),
                message: "A conversation has been flagged for review",
                timestamp: new Date().toISOString(),
                data: {
                  conversationId: change.fullDocument._id.toString(),
                  participants: change.fullDocument.participants || [],
                },
              }

              const data = `data: ${JSON.stringify(notification)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          })

          // Also watch for user activities
          const userChangeStream = db.collection("users").watch()

          userChangeStream.on("change", (change: any) => {
            let notification: any = null

            if (change.operationType === "insert") {
              notification = {
                type: "user_registered",
                id: change.fullDocument._id.toString(),
                message: `New user registered: ${change.fullDocument.name || change.fullDocument.email}`,
                timestamp: new Date().toISOString(),
                data: {
                  userId: change.fullDocument._id.toString(),
                  userName: change.fullDocument.name || change.fullDocument.email,
                  userRole: change.fullDocument.role,
                },
              }
            } else if (change.operationType === "update" && change.updateDescription?.updatedFields?.role) {
              notification = {
                type: "user_role_changed",
                id: change.fullDocument._id.toString(),
                message: `User role changed: ${change.fullDocument.name || change.fullDocument.email}`,
                timestamp: new Date().toISOString(),
                data: {
                  userId: change.fullDocument._id.toString(),
                  userName: change.fullDocument.name || change.fullDocument.email,
                  newRole: change.updateDescription.updatedFields.role,
                },
              }
            }

            if (notification) {
              const data = `data: ${JSON.stringify(notification)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          })

          // Watch for mentorship requests
          const mentorshipChangeStream = db.collection("mentorshipRequests").watch()

          mentorshipChangeStream.on("change", (change: any) => {
            if (change.operationType === "insert") {
              const notification = {
                type: "mentorship_request",
                id: change.fullDocument._id.toString(),
                message: "New mentorship request submitted",
                timestamp: new Date().toISOString(),
                data: {
                  requestId: change.fullDocument._id.toString(),
                  mentorId: change.fullDocument.mentorId?.toString(),
                  menteeId: change.fullDocument.menteeId?.toString(),
                },
              }

              const data = `data: ${JSON.stringify(notification)}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          })
        } catch (error) {
          console.error("Error setting up change stream:", error)
        }
      }

      setupChangeStream()

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        const data = `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`
        controller.enqueue(encoder.encode(data))
      }, 30000)

      // Cleanup function
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
