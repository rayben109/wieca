"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { NotificationToast } from "@/components/notification-toast"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session || session.user?.role !== "admin") {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4">{children}</div>
      </main>
      <NotificationToast />
    </div>
  )
}
