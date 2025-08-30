"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export interface Notification {
  type: string
  id: string
  message: string
  timestamp: string
  data?: any
  read?: boolean
}

export function useRealTimeNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      // Avoid duplicates
      const exists = prev.some((n) => n.id === notification.id && n.type === notification.type)
      if (exists) return prev

      const newNotifications = [{ ...notification, read: false }, ...prev].slice(0, 50) // Keep only last 50
      return newNotifications
    })
    setUnreadCount((prev) => prev + 1)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  useEffect(() => {
    if (!session || session.user?.role !== "admin") {
      return
    }

    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5

    const connect = () => {
      try {
        eventSource = new EventSource("/api/notifications/stream")

        eventSource.onopen = () => {
          console.log("SSE connection opened")
          setIsConnected(true)
          reconnectAttempts = 0
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === "connected") {
              setIsConnected(true)
            } else if (data.type === "heartbeat") {
              // Keep connection alive
            } else if (data.type === "error") {
              console.error("SSE error:", data.message)
            } else {
              // It's a notification
              addNotification(data)
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error)
          }
        }

        eventSource.onerror = (error) => {
          console.error("SSE error:", error)
          setIsConnected(false)

          if (eventSource) {
            eventSource.close()
          }

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts) * 1000 // 1s, 2s, 4s, 8s, 16s
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++
              connect()
            }, delay)
          }
        }
      } catch (error) {
        console.error("Error creating EventSource:", error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      setIsConnected(false)
    }
  }, [session, addNotification])

  return {
    notifications,
    isConnected,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}
