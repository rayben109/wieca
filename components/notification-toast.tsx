"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"
import { AlertTriangle, User, MessageSquare, Users } from "lucide-react"

function getToastIcon(type: string) {
  switch (type) {
    case "conversation_flagged":
      return <AlertTriangle className="h-4 w-4" />
    case "user_registered":
      return <User className="h-4 w-4" />
    case "user_role_changed":
      return <Users className="h-4 w-4" />
    case "mentorship_request":
      return <MessageSquare className="h-4 w-4" />
    default:
      return null
  }
}

function getToastVariant(type: string): "default" | "destructive" {
  switch (type) {
    case "conversation_flagged":
      return "destructive"
    default:
      return "default"
  }
}

export function NotificationToast() {
  const { notifications } = useRealTimeNotifications()

  useEffect(() => {
    // Show toast for the most recent unread notification
    const latestNotification = notifications.find((n) => !n.read)

    if (latestNotification && latestNotification.type !== "heartbeat" && latestNotification.type !== "connected") {
      toast({
        title: "New Notification",
        description: latestNotification.message,
        variant: getToastVariant(latestNotification.type),
        duration: 5000,
      })
    }
  }, [notifications])

  return null // This component doesn't render anything visible
}
