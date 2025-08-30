"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Users, MessageSquare, Settings, Home, UserPlus, Shield, Bell, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    children: [
      {
        title: "All Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Create User",
        href: "/admin/users/create",
        icon: UserPlus,
      },
      {
        title: "User Profiles",
        href: "/admin/users/profiles",
        icon: Eye,
      },
    ],
  },
  {
    title: "Mentorships",
    href: "/admin/mentorships",
    icon: MessageSquare,
    children: [
      {
        title: "All Mentorships",
        href: "/admin/mentorships",
        icon: MessageSquare,
      },
      {
        title: "Create Mentorship",
        href: "/admin/mentorships/create",
        icon: UserPlus,
      },
    ],
  },
  {
    title: "Conversations",
    href: "/admin/conversations",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { unreadCount, isConnected } = useRealTimeNotifications()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
        <Shield className="h-6 w-6" />
        <span className="text-lg font-semibold">Admin Panel</span>
        {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
                {item.title === "Conversations" && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount}
                  </Badge>
                )}
              </Link>

              {item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === child.href
                          ? "bg-gray-700 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white",
                      )}
                    >
                      <child.icon className="h-3 w-3" />
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Bell className="h-3 w-3" />
          <span>Real-time updates</span>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        </div>
      </div>
    </div>
  )
}
