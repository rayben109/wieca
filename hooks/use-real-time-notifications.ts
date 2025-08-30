"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export interface RealTimeNotification {
  type:
    | "conversation_flagged"
    | "user_registered"
    | "user_role_changed"
    | "mentorship_request"
    | "connected"
    | "heartbeat"
  id?: string
  message: string
  timestamp: string
  data?: any
  read?: boolean
}

export function useRealTimeNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification: RealTimeNotification) => {
    if (notification.type === "connected" || notification.type === "heartbeat") {
      setIsConnected(true)
      return
    }

    setNotifications((prev) => {
      const newNotification = { ...notification, read: false }
      const updated = [newNotification, ...prev.slice(0, 49)] // Keep only last 50 notifications
      return updated
    })

    setUnreadCount((prev) => prev + 1)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      return
    }

    let eventSource: EventSource | null = null

    const connectToStream = () => {
      eventSource = new EventSource("/api/notifications/stream")

      eventSource.onopen = () => {
        setIsConnected(true)
        console.log("Real-time notifications connected")
      }

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as RealTimeNotification
          addNotification(notification)
        } catch (error) {
          console.error("Error parsing notification:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error)
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource?.readyState === EventSource.CLOSED) {
            connectToStream()
          }
        }, 5000)
      }
    }

    connectToStream()

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [session, addNotification])

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}
