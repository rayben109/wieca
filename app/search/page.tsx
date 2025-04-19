"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { searchMentors, sendMentorshipRequest } from "@/lib/actions/mentorship-actions"
import { getRecommendedMentors } from "@/lib/actions/matching-algorithm"
import { createConversation } from "@/lib/actions/messaging-actions"
import type { MentorProfile } from "@/lib/types"

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<MentorProfile[]>([])
  const [recommendedMentors, setRecommendedMentors] = useState<MentorProfile[]>([])
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null)
  const [requestMessage, setRequestMessage] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("recommended")
  const [filters, setFilters] = useState({
    expertise: "",
    sector: "",
    searchTerm: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "mentee") {
      router.push("/requests")
    } else if (status === "authenticated") {
      loadRecommendedMentors()
    }
  }, [status, session, router])

  async function loadRecommendedMentors() {
    setIsLoading(true)
    try {
      const results = await getRecommendedMentors()
      setRecommendedMentors(results)
    } catch (error) {
      toast({
        title: "Failed to load recommendations",
        description: "Could not retrieve mentor recommendations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function performSearch() {
    setIsLoading(true)
    try {
      const results = await searchMentors(filters)
      setSearchResults(results)
      setActiveTab("search")
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to retrieve mentors. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendRequest() {
    if (!selectedMentor) return

    setIsLoading(true)
    try {
      const result = await sendMentorshipRequest({
        mentorId: selectedMentor.id,
        message: requestMessage,
      })

      if (result.success) {
        toast({
          title: "Request sent",
          description: "Your mentorship request has been sent successfully.",
        })
        setDialogOpen(false)
        setRequestMessage("")

        // Refresh recommendations after sending a request
        loadRecommendedMentors()
      } else {
        toast({
          title: "Request failed",
          description: result.error || "Failed to send mentorship request.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartConversation(mentorId: string) {
    setIsLoading(true)
    try {
      const result = await createConversation(mentorId)

      if (result.success) {
        router.push(`/messages/${result.conversationId}`)
      } else {
        toast({
          title: "Failed to start conversation",
          description: result.error || "Could not create conversation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to start conversation",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleMentorSelect(mentor: MentorProfile) {
    setSelectedMentor(mentor)
    setDialogOpen(true)
  }

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Find a Mentor</h1>

      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <div>
          <Label htmlFor="searchTerm">Search</Label>
          <Input
            id="searchTerm"
            placeholder="Search by name or keywords"
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="expertise">Expertise</Label>
          <Select value={filters.expertise} onValueChange={(value) => setFilters({ ...filters, expertise: value })}>
            <SelectTrigger id="expertise" className="mt-1">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              <SelectItem value="Renewable Energy">Renewable Energy</SelectItem>
              <SelectItem value="Solar Power">Solar Power</SelectItem>
              <SelectItem value="Wind Energy">Wind Energy</SelectItem>
              <SelectItem value="Hydroelectric Power">Hydroelectric Power</SelectItem>
              <SelectItem value="Energy Storage">Energy Storage</SelectItem>
              <SelectItem value="Energy Efficiency">Energy Efficiency</SelectItem>
              <SelectItem value="Sustainable Development">Sustainable Development</SelectItem>
              <SelectItem value="Climate Policy">Climate Policy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sector">Sector</Label>
          <Select value={filters.sector} onValueChange={(value) => setFilters({ ...filters, sector: value })}>
            <SelectTrigger id="sector" className="mt-1">
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              <SelectItem value="academia">Academia</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="non-profit">Non-Profit</SelectItem>
              <SelectItem value="private">Private Sector</SelectItem>
              <SelectItem value="startup">Startup</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <Button onClick={performSearch} className="bg-[#DB7C27] hover:bg-[#c06a1f]" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended">Recommended Mentors</TabsTrigger>
          <TabsTrigger value="search">Search Results</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="mt-6">
          {recommendedMentors.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {isLoading
                  ? "Loading recommendations..."
                  : "No recommended mentors found. Complete your profile to get personalized recommendations."}
              </p>
              {!isLoading && (
                <Button className="mt-4 bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={() => router.push("/profile")}>
                  Update Profile
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onRequestMentorship={() => handleMentorSelect(mentor)}
                  onStartConversation={() => handleStartConversation(mentor.id)}
                  showMatchScore={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          {searchResults.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {activeTab === "search"
                  ? "No mentors found matching your criteria. Try adjusting your filters."
                  : "Use the search filters above to find mentors."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onRequestMentorship={() => handleMentorSelect(mentor)}
                  onStartConversation={() => handleStartConversation(mentor.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a personalized message to {selectedMentor?.name} explaining why you'd like them to be your mentor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Introduce yourself and explain what you hope to gain from this mentorship..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#DB7C27] hover:bg-[#c06a1f]"
              onClick={handleSendRequest}
              disabled={isLoading || !requestMessage.trim()}
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MentorCard({
  mentor,
  onRequestMentorship,
  onStartConversation,
  showMatchScore = false,
}: {
  mentor: MentorProfile
  onRequestMentorship: () => void
  onStartConversation: () => void
  showMatchScore?: boolean
}) {
  return (
    <Card key={mentor.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>{mentor.name}</CardTitle>
        <CardDescription>{mentor.role}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-3">
          {mentor.expertise?.slice(0, 3).map((area) => (
            <Badge key={area} variant="secondary">
              {area}
            </Badge>
          ))}
          {mentor.expertise && mentor.expertise.length > 3 && (
            <Badge variant="outline">+{mentor.expertise.length - 3} more</Badge>
          )}
        </div>
        <p className="text-sm line-clamp-3 mb-2">{mentor.bio}</p>
        <div className="text-sm text-muted-foreground">
          <p>Sector: {mentor.sector}</p>
          {showMatchScore && mentor.similarityScore !== undefined && (
            <p className="mt-1">
              Match Score:{" "}
              <span className="font-medium text-[#DB7C27]">{Math.round(mentor.similarityScore * 100)}%</span>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1 bg-[#DB7C27] hover:bg-[#c06a1f]" onClick={onRequestMentorship}>
          Request Mentorship
        </Button>
        <Button variant="outline" onClick={onStartConversation}>
          Message
        </Button>
      </CardFooter>
    </Card>
  )
}
