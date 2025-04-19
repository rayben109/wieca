"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Calendar, Info } from "lucide-react"
import { getMyMentees } from "@/lib/actions/mentor-mentee-actions"
import { createConversation } from "@/lib/actions/messaging-actions"
import { toast } from "@/components/ui/use-toast"

export default function MenteesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [mentees, setMentees] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "mentor") {
      router.push("/mentors")
    } else if (status === "authenticated") {
      loadMentees()
    }
  }, [status, session, router])

  async function loadMentees() {
    setIsLoading(true)
    try {
      const result = await getMyMentees()
      if (result.success) {
        setMentees(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load mentees",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load mentees:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartConversation(menteeId: string) {
    try {
      const result = await createConversation(menteeId)
      if (result.success) {
        router.push(`/messages/${result.conversationId}`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to start conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to start conversation:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

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

  if (status === "loading") {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">My Mentees</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Mentees</h1>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter className="flex gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : mentees.length === 0 ? (
        <div className="text-center py-10">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-orange-100 p-3">
              <Info className="h-6 w-6 text-[#DB7C27]" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">No Mentees Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You don't have any mentees yet. Check your mentorship requests to see if anyone has requested your guidance.
          </p>
          <Button className="bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/requests")}>
            View Requests
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentees.map((mentee) => (
            <Card key={mentee.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentee.profileImage || "/placeholder.svg"} alt={mentee.name} />
                  <AvatarFallback>{getInitials(mentee.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{mentee.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mt-1">
                      Mentee
                    </Badge>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {mentee.bio ? (
                  <p className="text-sm line-clamp-2 mb-3">{mentee.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-3">No bio available</p>
                )}
                {mentee.interests && (
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Interests:</span> {mentee.interests}
                  </p>
                )}
                {mentee.careerGoals && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Career Goals:</span> {mentee.careerGoals}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStartConversation(mentee.id)}
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button
                  className="flex-1 bg-[#DB7C27] hover:bg-[#c06a1f]"
                  onClick={() => router.push(`/calendar`)}
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
