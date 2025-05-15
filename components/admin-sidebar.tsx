"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, UserPlus, Handshake, LayoutDashboard, Settings, BarChart3 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" className="border-r border-gray-200">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="font-bold text-xl">Admin Portal</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Dashboard">
                  <Link href="/admin">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/analytics"} tooltip="Analytics">
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-5 w-5" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>User Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/users"} tooltip="Users">
                  <Link href="/admin/users">
                    <Users className="h-5 w-5" />
                    <span>All Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/users/create"} tooltip="Create User">
                  <Link href="/admin/users/create">
                    <UserPlus className="h-5 w-5" />
                    <span>Create User</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mentorship</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/mentorships"} tooltip="Mentorships">
                  <Link href="/admin/mentorships">
                    <Handshake className="h-5 w-5" />
                    <span>Mentorships</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/settings"} tooltip="Settings">
                  <Link href="/admin/settings">
                    <Settings className="h-5 w-5" />
                    <span>Platform Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500">Admin Portal v1.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}
