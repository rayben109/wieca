import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Set up Server-Sent Events headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    })

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "connected",
            message: "Real-time notifications connected",
            timestamp: new Date().toISOString(),
          })}\n\n`,
        )

        // Set up change streams for different collections
        const conversationChangeStream = db
          .collection("conversations")
          .watch([{ $match: { "fullDocument.status": "flagged" } }])

        const userChangeStream = db
          .collection("users")
          .watch([{ $match: { operationType: { $in: ["insert", "update"] } } }])

        const mentorshipChangeStream = db
          .collection("mentorshipRequests")
          .watch([{ $match: { operationType: "insert" } }])

        // Handle conversation changes
        conversationChangeStream.on("change", (change) => {
          if (change.operationType === "update" && change.fullDocument?.status === "flagged") {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "conversation_flagged",
                message: "A conversation has been flagged for review",
                data: {
                  conversationId: change.fullDocument._id.toString(),
                  participants: change.fullDocument.participants?.length || 0,
                },
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
          }
        })

        // Handle user changes
        userChangeStream.on("change", (change) => {
          if (change.operationType === "insert") {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "user_registered",
                message: `New user registered: ${change.fullDocument?.name || change.fullDocument?.email}`,
                data: {
                  userId: change.fullDocument?._id.toString(),
                  name: change.fullDocument?.name,
                  email: change.fullDocument?.email,
                  role: change.fullDocument?.role,
                },
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
          } else if (change.operationType === "update" && change.updateDescription?.updatedFields?.role) {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "user_role_changed",
                message: `User role updated to ${change.updateDescription.updatedFields.role}`,
                data: {
                  userId: change.documentKey._id.toString(),
                  newRole: change.updateDescription.updatedFields.role,
                },
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
          }
        })

        // Handle mentorship request changes
        mentorshipChangeStream.on("change", (change) => {
          if (change.operationType === "insert") {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "mentorship_request",
                message: "New mentorship request submitted",
                data: {
                  requestId: change.fullDocument?._id.toString(),
                  mentorId: change.fullDocument?.mentorId.toString(),
                  menteeId: change.fullDocument?.menteeId.toString(),
                },
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
          }
        })

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            })}\n\n`,
          )
        }, 30000)

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeatInterval)
          conversationChangeStream.close()
          userChangeStream.close()
          mentorshipChangeStream.close()
        }

        // Handle client disconnect
        request.signal.addEventListener("abort", cleanup)

        // Store cleanup function for later use
        ;(controller as any).cleanup = cleanup
      },

      cancel() {
        // Cleanup when stream is cancelled
        if ((this as any).cleanup) {
          ;(this as any).cleanup()
        }
      },
    })

    return new Response(stream, { headers })
  } catch (error) {
    console.error("Error setting up notification stream:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
