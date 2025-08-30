"use client"

import { useState } from "react"
import { Bell, X, Check, Users, MessageSquare, UserPlus, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRealTimeNotifications, type RealTimeNotification } from "@/hooks/use-real-time-notifications"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

export function RealTimeNotifications() {
  const router = useRouter()
  const { notifications, isConnected, unreadCount, markAsRead, markAllAsRead, clearNotifications } =
    useRealTimeNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: RealTimeNotification["type"]) => {
    switch (type) {
      case "conversation_flagged":
        return <MessageSquare className="h-4 w-4 text-red-500" />
      case "user_registered":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "user_role_changed":
        return <Shield className="h-4 w-4 text-blue-500" />
      case "mentorship_request":
        return <Users className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: RealTimeNotification["type"]) => {
    switch (type) {
      case "conversation_flagged":
        return "border-l-red-500 bg-red-50"
      case "user_registered":
        return "border-l-green-500 bg-green-50"
      case "user_role_changed":
        return "border-l-blue-500 bg-blue-50"
      case "mentorship_request":
        return "border-l-purple-500 bg-purple-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  const handleNotificationClick = (notification: RealTimeNotification) => {
    if (notification.id && !notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "conversation_flagged":
        router.push("/admin/conversations")
        break
      case "user_registered":
      case "user_role_changed":
        router.push("/admin/users")
        break
      case "mentorship_request":
        router.push("/admin/mentorships")
        break
    }

    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Real-time Notifications
                  {isConnected ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      <div className="h-2 w-2 bg-red-500 rounded-full mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex gap-1">
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
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications yet</p>
                    <p className="text-sm">You'll see real-time updates here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification, index) => (
                      <div
                        key={`${notification.id || index}-${notification.timestamp}`}
                        className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getNotificationColor(
                          notification.type,
                        )} ${!notification.read ? "bg-opacity-100" : "bg-opacity-50"}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? "font-semibold" : "font-normal"}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                              {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
