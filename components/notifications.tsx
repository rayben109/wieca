"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { getNotifications, markNotificationAsRead } from "@/lib/actions/notification-actions"
import type { Notification } from "@/lib/types"

export function NotificationsPopover() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  async function loadNotifications() {
    setIsLoading(true)
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id)
        setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    // Navigate based on notification type
    if (notification.type === "message" && notification.relatedId) {
      router.push(`/messages/${notification.relatedId}`)
    } else if (notification.type === "request" && notification.relatedId) {
      router.push("/requests")
    } else if (notification.type === "session" && notification.relatedId) {
      router.push("/calendar")
    }

    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-[#DB7C27]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 font-medium">Notifications</div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-[#DB7C27] mt-1.5 shrink-0"></div>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
