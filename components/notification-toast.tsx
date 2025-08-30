"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"

export function NotificationToast() {
  const { notifications } = useRealTimeNotifications()

  useEffect(() => {
    // Show toast for the most recent unread notification
    const latestNotification = notifications.find((n) => !n.read)

    if (latestNotification) {
      const getToastIcon = (type: string) => {
        switch (type) {
          case "flagged_conversation":
            return "🚩"
          case "new_user":
            return "👤"
          case "new_mentorship_request":
            return "🤝"
          default:
            return "📢"
        }
      }

      toast({
        title: `${getToastIcon(latestNotification.type)} ${latestNotification.message}`,
        description: `Just now`,
        duration: 5000,
      })
    }
  }, [notifications])

  return null
}
