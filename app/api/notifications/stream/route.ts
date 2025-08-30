import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const maxDuration = 60

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

        // Set up heartbeat to keep connection alive
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
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Set up MongoDB change streams
        let changeStream: any = null

        const setupChangeStreams = async () => {
          try {
            const { db } = await connectToDatabase()

            // Watch for changes in conversations collection
            changeStream = db.collection("conversations").watch([
              {
                $match: {
                  $or: [{ "fullDocument.status": "flagged" }, { operationType: "insert" }, { operationType: "update" }],
                },
              },
            ])

            changeStream.on("change", (change: any) => {
              try {
                let notificationData: any = {
                  type: "notification",
                  timestamp: new Date().toISOString(),
                  data: change,
                }

                if (change.operationType === "insert") {
                  notificationData = {
                    ...notificationData,
                    message: "New conversation created",
                    priority: "low",
                  }
                } else if (change.operationType === "update" && change.fullDocument?.status === "flagged") {
                  notificationData = {
                    ...notificationData,
                    message: "Conversation flagged for review",
                    priority: "high",
                  }
                }

                const eventData = `data: ${JSON.stringify(notificationData)}\n\n`
                controller.enqueue(encoder.encode(eventData))
              } catch (error) {
                console.error("Change stream notification error:", error)
              }
            })

            changeStream.on("error", (error: any) => {
              console.error("Change stream error:", error)
              // Try to reconnect after a delay
              setTimeout(setupChangeStreams, 5000)
            })
          } catch (error) {
            console.error("Setup change streams error:", error)
            // Send error notification
            const errorData = `data: ${JSON.stringify({
              type: "error",
              message: "Failed to setup real-time monitoring",
              timestamp: new Date().toISOString(),
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
          }
        }

        // Initialize change streams
        setupChangeStreams()

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          if (changeStream) {
            changeStream.close()
          }
          controller.close()
        })

        // Auto-close after maxDuration to prevent timeout
        setTimeout(() => {
          clearInterval(heartbeat)
          if (changeStream) {
            changeStream.close()
          }
          controller.close()
        }, 55000) // Close 5 seconds before maxDuration
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
