"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MentorsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // This would be replaced with actual data from your API
  const [mentors, setMentors] = useState([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      role: "Solar Energy Specialist",
      organization: "Renewable Solutions Inc.",
      profileImage: "",
      status: "active",
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "Wind Energy Consultant",
      organization: "Green Power Associates",
      profileImage: "",
      status: "active",
    },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "mentee") {
      router.push("/mentees")
    } else {
      // Load mentors data
      setIsLoading(false)
    }
  }, [status, session, router])

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  if (status === "loading" || isLoading) {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Mentors</h1>

      {mentors.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You don't have any mentors yet.</p>
          <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/search")}>
            Find Mentors
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <Card key={mentor.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentor.profileImage || "/placeholder.svg"} alt={mentor.name} />
                  <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{mentor.name}</CardTitle>
                  <CardDescription>{mentor.role}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Organization: {mentor.organization}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/messages/${mentor.id}`)}>
                    Message
                  </Button>
                  <Button className="flex-1 bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push(`/calendar`)}>
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
