"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  UserPlus,
  Shield,
  Database,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useRealTimeNotifications } from "@/hooks/use-real-time-notifications"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
]

const userManagement = [
  {
    name: "All Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Create User",
    href: "/admin/users/create",
    icon: UserPlus,
  },
  {
    name: "Profile Data",
    href: "/admin/users/profiles",
    icon: Database,
  },
]

const communication = [
  {
    name: "Conversations",
    href: "/admin/conversations",
    icon: MessageSquare,
  },
  {
    name: "Moderation",
    href: "/admin/conversations",
    icon: Flag,
  },
]

const mentorshipManagement = [
  {
    name: "All Mentorships",
    href: "/admin/mentorships",
    icon: Shield,
  },
  {
    name: "Create Mentorship",
    href: "/admin/mentorships/create",
    icon: UserPlus,
  },
]

const systemSettings = [
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { unreadCount, isConnected } = useRealTimeNotifications()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        {isConnected && (
          <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</h3>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", isActive && "bg-white shadow-sm")}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* User Management */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">User Management</h3>
            <nav className="space-y-1">
              {userManagement.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", isActive && "bg-white shadow-sm")}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* Communication */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              Communication
              {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
            </h3>
            <nav className="space-y-1">
              {communication.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", isActive && "bg-white shadow-sm")}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                      {item.name === "Conversations" && unreadCount > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs">{unreadCount}</Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* Mentorship Management */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Mentorship Management
            </h3>
            <nav className="space-y-1">
              {mentorshipManagement.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", isActive && "bg-white shadow-sm")}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          <Separator />

          {/* System Settings */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System</h3>
            <nav className="space-y-1">
              {systemSettings.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", isActive && "bg-white shadow-sm")}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
