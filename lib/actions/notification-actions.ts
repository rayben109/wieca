"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Notification } from "@/lib/types"

export async function getNotifications(): Promise<Notification[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const notificationsCollection = db.collection("notifications")

    // Get notifications for the current user
    const notifications = await notificationsCollection
      .find({
        userId: new ObjectId(session.user.id),
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return notifications.map((notification) => ({
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId?.toString(),
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Get notifications error:", error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const notificationsCollection = db.collection("notifications")

    // Verify the notification belongs to this user
    const notification = await notificationsCollection.findOne({
      _id: new ObjectId(notificationId),
      userId: new ObjectId(session.user.id),
    })

    if (!notification) {
      return { success: false, error: "Notification not found" }
    }

    // Mark as read
    await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true, updatedAt: new Date() } },
    )

    return { success: true }
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
}: {
  userId: string
  type: "message" | "request" | "session" | "system"
  title: string
  message: string
  relatedId?: string
}) {
  try {
    const db = await connectToDatabase()
    const notificationsCollection = db.collection("notifications")

    // Create notification
    const result = await notificationsCollection.insertOne({
      userId: new ObjectId(userId),
      type,
      title,
      message,
      relatedId: relatedId ? new ObjectId(relatedId) : undefined,
      read: false,
      createdAt: new Date(),
    })

    return { success: true, notificationId: result.insertedId.toString() }
  } catch (error) {
    console.error("Create notification error:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return 0
    }

    const db = await connectToDatabase()
    const notificationsCollection = db.collection("notifications")

    // Count unread notifications
    const count = await notificationsCollection.countDocuments({
      userId: new ObjectId(session.user.id),
      read: false,
    })

    return count
  } catch (error) {
    console.error("Get unread notification count error:", error)
    return 0
  }
}
