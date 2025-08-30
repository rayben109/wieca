"use client"

import { Bell, Check, X, AlertTriangle, User, MessageSquare, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRealTimeNotifications, type Notification } from "@/hooks/use-real-time-notifications"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

function getNotificationIcon(type: string) {
  switch (type) {
    case "conversation_flagged":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "user_registered":
      return <User className="h-4 w-4 text-green-500" />
    case "user_role_changed":
      return <Users className="h-4 w-4 text-blue-500" />
    case "mentorship_request":
      return <MessageSquare className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

function getNotificationAction(notification: Notification, router: any) {
  switch (notification.type) {
    case "conversation_flagged":
      return () => router.push("/admin/conversations")
    case "user_registered":
    case "user_role_changed":
      return () => router.push("/admin/users")
    case "mentorship_request":
      return () => router.push("/admin/mentorships")
    default:
      return undefined
  }
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onAction?: () => void
}

function NotificationItem({ notification, onMarkAsRead, onAction }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (onAction) {
      onAction()
    }
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.read ? "bg-gray-50 hover:bg-gray-100" : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
      }`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  )
}

export function RealTimeNotifications() {
  const { notifications, isConnected, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useRealTimeNotifications()

  const router = useRouter()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {isConnected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">{isConnected ? "Connected and listening..." : "Connecting..."}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onAction={getNotificationAction(notification, router)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {isConnected ? (
              <span className="flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live updates active
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Reconnecting...
              </span>
            )}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
