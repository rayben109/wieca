import type React from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated and has admin role
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    redirect("/login?callbackUrl=/admin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
