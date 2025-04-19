"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function MenteesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // This would be replaced with actual data from your API
  const [mentees, setMentees] = useState([
    {
      id: "1",
      name: "Alex Rivera",
      interests: "Solar energy, sustainable development",
      profileImage: "",
      status: "active",
    },
    {
      id: "2",
      name: "Jamie Taylor",
      interests: "Wind energy, climate policy",
      profileImage: "",
      status: "active",
    },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "mentor") {
      router.push("/mentors")
    } else {
      // Load mentees data
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
      <h1 className="text-3xl font-bold mb-6">My Mentees</h1>

      {mentees.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You don't have any mentees yet.</p>
          <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/requests")}>
            View Requests
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentees.map((mentee) => (
            <Card key={mentee.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentee.profileImage || "/placeholder.svg"} alt={mentee.name} />
                  <AvatarFallback>{getInitials(mentee.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{mentee.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1">
                      {mentee.status}
                    </Badge>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Interests: {mentee.interests}</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/messages/${mentee.id}`)}>
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
