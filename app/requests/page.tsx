"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { getMentorshipRequests, updateRequestStatus } from "@/lib/actions/mentorship-actions"
import type { MentorshipRequest } from "@/lib/types"

export default function RequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [requests, setRequests] = useState<{
    pending: MentorshipRequest[]
    accepted: MentorshipRequest[]
    declined: MentorshipRequest[]
  }>({
    pending: [],
    accepted: [],
    declined: [],
  })
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadRequests()
    }
  }, [status, router])

  async function loadRequests() {
    setIsLoading(true)
    try {
      const data = await getMentorshipRequests()

      // Group requests by status
      const grouped = {
        pending: data.filter((req) => req.status === "pending"),
        accepted: data.filter((req) => req.status === "accepted"),
        declined: data.filter((req) => req.status === "declined"),
      }

      setRequests(grouped)
    } catch (error) {
      toast({
        title: "Failed to load requests",
        description: "An error occurred while loading your mentorship requests.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateStatus(requestId: string, status: "accepted" | "declined") {
    setIsLoading(true)
    try {
      const result = await updateRequestStatus(requestId, status)

      if (result.success) {
        toast({
          title: `Request ${status}`,
          description: `You have ${status} the mentorship request.`,
        })
        setDialogOpen(false)
        loadRequests() // Reload the requests
      } else {
        toast({
          title: "Action failed",
          description: result.error || `Failed to ${status} the request.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Action failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleViewRequest(request: MentorshipRequest) {
    setSelectedRequest(request)
    setDialogOpen(true)
  }

  const isMentor = session?.user?.role === "mentor"
  const pageTitle = isMentor ? "Mentorship Requests" : "Your Mentorship Requests"

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending
            {requests.pending.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requests.pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        {["pending", "accepted", "declined"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {requests[tab as keyof typeof requests].length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No {tab} requests found.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requests[tab as keyof typeof requests].map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle>{isMentor ? request.mentee.name : request.mentor.name}</CardTitle>
                      <CardDescription>
                        {isMentor ? "Mentee" : "Mentor"} • {new Date(request.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3 mb-4">{request.message}</p>
                      <Badge
                        className={
                          request.status === "pending"
                            ? "bg-yellow-500"
                            : request.status === "accepted"
                              ? "bg-green-500"
                              : "bg-red-500"
                        }
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-[#DB7C27] hover:bg-[#c06a1f]"
                        onClick={() => handleViewRequest(request)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mentorship Request</DialogTitle>
            <DialogDescription>{isMentor ? "Request from mentee" : "Your request to mentor"}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium">{isMentor ? "From" : "To"}</h3>
                <p>{isMentor ? selectedRequest.mentee.name : selectedRequest.mentor.name}</p>
              </div>

              <div>
                <h3 className="font-medium">Date</h3>
                <p>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <h3 className="font-medium">Message</h3>
                <p className="text-sm">{selectedRequest.message}</p>
              </div>

              <div>
                <h3 className="font-medium">Status</h3>
                <Badge
                  className={
                    selectedRequest.status === "pending"
                      ? "bg-yellow-500"
                      : selectedRequest.status === "accepted"
                        ? "bg-green-500"
                        : "bg-red-500"
                  }
                >
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            {isMentor && selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedRequest.id, "declined")}
                  disabled={isLoading}
                >
                  Decline
                </Button>
                <Button
                  className="bg-[#DB7C27] hover:bg-[#c06a1f]"
                  onClick={() => handleUpdateStatus(selectedRequest.id, "accepted")}
                  disabled={isLoading}
                >
                  Accept
                </Button>
              </>
            )}
            {(!isMentor || selectedRequest?.status !== "pending") && (
              <Button variant="outline" className="w-full" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
