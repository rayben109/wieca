import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export const maxDuration = 60 // Set to 60 seconds (valid range is 1-60)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return new Response("Unauthorized", { status: 401 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({
          type: "connected",
          message: "Real-time notifications connected",
          timestamp: new Date().toISOString(),
        })}\n\n`
        controller.enqueue(encoder.encode(data))

        // Set up periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = `data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            })}\n\n`
            controller.enqueue(encoder.encode(heartbeatData))
          } catch (error) {
            console.error("Heartbeat error:", error)
            clearInterval(heartbeat)
            controller.close()
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Set up MongoDB change streams
        setupChangeStreams(controller, encoder).catch((error) => {
          console.error("Change stream setup error:", error)
        })

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          controller.close()
        })

        // Auto-close after 55 seconds to stay within the 60-second limit
        setTimeout(() => {
          clearInterval(heartbeat)
          controller.close()
        }, 55000)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    })
  } catch (error) {
    console.error("Notification stream error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function setupChangeStreams(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  try {
    const { db } = await connectToDatabase()

    // Watch for changes in conversations collection
    const conversationChangeStream = db
      .collection("conversations")
      .watch([{ $match: { "fullDocument.flagged": true } }])

    conversationChangeStream.on("change", (change) => {
      try {
        const notification = {
          type: "conversation_flagged",
          data: change.fullDocument,
          timestamp: new Date().toISOString(),
        }

        const data = `data: ${JSON.stringify(notification)}\n\n`
        controller.enqueue(encoder.encode(data))
      } catch (error) {
        console.error("Conversation change stream error:", error)
      }
    })

    // Watch for changes in users collection
    const userChangeStream = db.collection("users").watch()

    userChangeStream.on("change", (change) => {
      try {
        if (change.operationType === "insert") {
          const notification = {
            type: "new_user",
            data: change.fullDocument,
            timestamp: new Date().toISOString(),
          }

          const data = `data: ${JSON.stringify(notification)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      } catch (error) {
        console.error("User change stream error:", error)
      }
    })

    // Watch for changes in mentorships collection
    const mentorshipChangeStream = db.collection("mentorships").watch()

    mentorshipChangeStream.on("change", (change) => {
      try {
        if (change.operationType === "insert" || change.operationType === "update") {
          const notification = {
            type: "mentorship_update",
            data: change.fullDocument,
            timestamp: new Date().toISOString(),
          }

          const data = `data: ${JSON.stringify(notification)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      } catch (error) {
        console.error("Mentorship change stream error:", error)
      }
    })
  } catch (error) {
    console.error("Failed to setup change streams:", error)
    // Send error notification
    const errorNotification = {
      type: "error",
      message: "Failed to setup real-time monitoring",
      timestamp: new Date().toISOString(),
    }

    const data = `data: ${JSON.stringify(errorNotification)}\n\n`
    controller.enqueue(encoder.encode(data))
  }
}
