"use client"

import { useEffect, useState } from "react"
import { X, Bell, MessageSquare, Users, UserPlus, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRealTimeNotifications, type RealTimeNotification } from "@/hooks/use-real-time-notifications"

interface ToastNotification extends RealTimeNotification {
  id: string
  show: boolean
}

export function NotificationToast() {
  const { notifications } = useRealTimeNotifications()
  const [toasts, setToasts] = useState<ToastNotification[]>([])

  useEffect(() => {
    // Get the latest notification
    const latestNotification = notifications[0]

    if (latestNotification && latestNotification.type !== "connected" && latestNotification.type !== "heartbeat") {
      const toastId = `${latestNotification.id || Date.now()}-${latestNotification.timestamp}`

      // Check if this toast already exists
      const existingToast = toasts.find((t) => t.id === toastId)
      if (!existingToast) {
        const newToast: ToastNotification = {
          ...latestNotification,
          id: toastId,
          show: true,
        }

        setToasts((prev) => [newToast, ...prev.slice(0, 2)]) // Keep max 3 toasts

        // Auto-remove toast after 5 seconds
        setTimeout(() => {
          setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, show: false } : t)))

          // Remove from array after animation
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId))
          }, 300)
        }, 5000)
      }
    }
  }, [notifications, toasts])

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, show: false } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId))
    }, 300)
  }

  const getToastIcon = (type: RealTimeNotification["type"]) => {
    switch (type) {
      case "conversation_flagged":
        return <MessageSquare className="h-5 w-5 text-red-500" />
      case "user_registered":
        return <UserPlus className="h-5 w-5 text-green-500" />
      case "user_role_changed":
        return <Shield className="h-5 w-5 text-blue-500" />
      case "mentorship_request":
        return <Users className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getToastColor = (type: RealTimeNotification["type"]) => {
    switch (type) {
      case "conversation_flagged":
        return "border-red-200 bg-red-50"
      case "user_registered":
        return "border-green-200 bg-green-50"
      case "user_role_changed":
        return "border-blue-200 bg-blue-50"
      case "mentorship_request":
        return "border-purple-200 bg-purple-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          className={`w-80 shadow-lg border-l-4 transition-all duration-300 ${
            toast.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          } ${getToastColor(toast.type)}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{getToastIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Real-time Update</p>
                <p className="text-sm text-gray-700 mt-1">{toast.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
