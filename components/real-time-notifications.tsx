"use client"

import { Bell, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function RealTimeNotifications() {
  const { notifications, isConnected, unreadCount, markAsRead, markAllAsRead } = useRealTimeNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)

    // Navigate based on notification type
    switch (notification.type) {
      case "flagged_conversation":
        router.push(`/admin/conversations?highlight=${notification.data?.conversationId}`)
        break
      case "new_user":
        router.push(`/admin/users?highlight=${notification.data?.userId}`)
        break
      case "new_mentorship_request":
        router.push(`/admin/mentorships?highlight=${notification.data?.requestId}`)
        break
      default:
        router.push("/admin")
    }
  }

  const getNotificationIcon = (type: string) => {
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <div
            className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Real-time Notifications</h4>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${isConnected ? "text-green-600" : "text-red-600"}`}>
              <Circle
                className={`h-2 w-2 ${isConnected ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"}`}
              />
              {isConnected ? "Live" : "Disconnected"}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-6 px-2">
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">You'll see real-time updates here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={`${notification.type}-${notification.id}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? "bg-blue-50 border-blue-200" : "bg-background"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
