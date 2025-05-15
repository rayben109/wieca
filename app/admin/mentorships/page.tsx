"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getAllMentorships,
  createMentorship,
  updateMentorshipStatus,
  getMentorsList,
  getMenteesList,
} from "@/lib/actions/admin-actions"
import { AlertCircle, HandshakeIcon, Link2, Link2OffIcon as LinkOff, Loader2, Search } from "lucide-react"

interface Mentorship {
  id: string
  mentorId: string
  menteeId: string
  mentorName: string
  menteeName: string
  status: string
  message: string
  createdAt: string
  updatedAt: string
}

interface UserOption {
  id: string
  name: string
  email: string
}

export default function AdminMentorshipsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [filteredMentorships, setFilteredMentorships] = useState<Mentorship[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // New mentorship dialog
  const [isNewMentorshipDialogOpen, setIsNewMentorshipDialogOpen] = useState(false)
  const [newMentorshipData, setNewMentorshipData] = useState({
    mentorId: "",
    menteeId: "",
    message: "",
  })
  const [isCreatingMentorship, setIsCreatingMentorship] = useState(false)
  const [newMentorshipErrors, setNewMentorshipErrors] = useState({
    mentorId: "",
    menteeId: "",
    message: "",
  })

  // Available mentors and mentees for selection
  const [mentors, setMentors] = useState<UserOption[]>([])
  const [mentees, setMentees] = useState<UserOption[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Mentorship action dialog
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [selectedMentorship, setSelectedMentorship] = useState<Mentorship | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Error state
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/")
      } else {
        loadMentorships()
      }
    }
  }, [status, session, router])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, mentorships, activeTab])

  async function loadMentorships() {
    setIsLoading(true)
    setErrorMessage("")
    try {
      const result = await getAllMentorships()
      if (result.success) {
        setMentorships(result.mentorships)
      } else {
        setErrorMessage(result.error || "Failed to load mentorships")
        toast({
          title: "Error",
          description: result.error || "Failed to load mentorships",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load mentorships:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading mentorships",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadUsers() {
    setLoadingUsers(true)
    setErrorMessage("")
    try {
      const [mentorsResult, menteesResult] = await Promise.all([getMentorsList(), getMenteesList()])

      if (mentorsResult.success) {
        setMentors(mentorsResult.mentors)
      }

      if (menteesResult.success) {
        setMentees(menteesResult.mentees)
      }

      if (!mentorsResult.success || !menteesResult.success) {
        setErrorMessage("Failed to load user options")
        toast({
          title: "Error",
          description: "Failed to load user options",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load users:", error)
      setErrorMessage("An unexpected error occurred while loading users")
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading users",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  function applyFilters() {
    let result = [...mentorships]

    // Filter by tab
    if (activeTab !== "all") {
      result = result.filter((mentorship) => mentorship.status === activeTab)
    }

    // Filter by status if selected
    if (statusFilter !== "all") {
      result = result.filter((mentorship) => mentorship.status === statusFilter)
    }

    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      result = result.filter(
        (mentorship) =>
          mentorship.mentorName.toLowerCase().includes(search) || mentorship.menteeName.toLowerCase().includes(search),
      )
    }

    setFilteredMentorships(result)
  }

  function validateNewMentorshipData() {
    const errors = {
      mentorId: !newMentorshipData.mentorId ? "Please select a mentor" : "",
      menteeId: !newMentorshipData.menteeId ? "Please select a mentee" : "",
      message: !newMentorshipData.message ? "Please provide a message" : "",
    }

    setNewMentorshipErrors(errors)
    return !Object.values(errors).some((error) => error)
  }

  function handleOpenNewMentorshipDialog() {
    loadUsers()
    setIsNewMentorshipDialogOpen(true)
  }

  async function handleCreateMentorship() {
    if (!validateNewMentorshipData()) {
      return
    }

    setIsCreatingMentorship(true)
    setErrorMessage("")
    try {
      const result = await createMentorship(newMentorshipData)
      if (result.success) {
        toast({
          title: "Success",
          description: "Mentorship has been created successfully",
        })
        setIsNewMentorshipDialogOpen(false)
        setNewMentorshipData({
          mentorId: "",
          menteeId: "",
          message: "",
        })
        loadMentorships()
      } else {
        setErrorMessage(result.error || "Failed to create mentorship")
        toast({
          title: "Error",
          description: result.error || "Failed to create mentorship",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create mentorship:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating mentorship",
        variant: "destructive",
      })
    } finally {
      setIsCreatingMentorship(false)
    }
  }

  function handleActionClick(mentorship: Mentorship, action: string) {
    setSelectedMentorship(mentorship)
    setNewStatus(action)
    setIsActionDialogOpen(true)
  }

  async function handleUpdateMentorshipStatus() {
    if (!selectedMentorship || !newStatus) return

    setIsUpdatingStatus(true)
    setErrorMessage("")
    try {
      const result = await updateMentorshipStatus(selectedMentorship.id, newStatus)
      if (result.success) {
        toast({
          title: "Success",
          description: `Mentorship has been ${newStatus} successfully`,
        })
        setIsActionDialogOpen(false)
        setSelectedMentorship(null)
        setNewStatus("")
        loadMentorships()
      } else {
        setErrorMessage(result.error || `Failed to ${newStatus} mentorship`)
        toast({
          title: "Error",
          description: result.error || `Failed to ${newStatus} mentorship`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to ${newStatus} mentorship:`, error)
      setErrorMessage("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: `An unexpected error occurred while updating mentorship status`,
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="container flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#DB7C27]" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mentorship Management</h1>
        <Button onClick={handleOpenNewMentorshipDialog} className="bg-[#DB7C27] hover:bg-[#c06a1f]">
          <HandshakeIcon className="h-4 w-4 mr-2" />
          Create Mentorship
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Mentorships</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Narrow down the mentorship list with these filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by mentor or mentee name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Mentee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMentorships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    {isLoading ? (
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#DB7C27]" />
                        <span className="ml-2">Loading mentorships...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-muted-foreground">No mentorships found</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => {
                            setSearchTerm("")
                            setStatusFilter("all")
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMentorships.map((mentorship) => (
                  <TableRow key={mentorship.id}>
                    <TableCell className="font-medium">{mentorship.mentorName}</TableCell>
                    <TableCell>{mentorship.menteeName}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadgeColor(mentorship.status)}`}>
                        {mentorship.status.charAt(0).toUpperCase() + mentorship.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(mentorship.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(mentorship.updatedAt || mentorship.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {mentorship.status === "pending" ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleActionClick(mentorship, "accepted")}
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleActionClick(mentorship, "declined")}
                          >
                            <LinkOff className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      ) : mentorship.status === "accepted" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleActionClick(mentorship, "declined")}
                        >
                          <LinkOff className="h-4 w-4 mr-1" />
                          Terminate
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleActionClick(mentorship, "accepted")}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Mentorship Dialog */}
      <Dialog open={isNewMentorshipDialogOpen} onOpenChange={setIsNewMentorshipDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Mentorship</DialogTitle>
            <DialogDescription>
              Manually create a new mentorship connection between a mentor and mentee
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mentor">
                Select Mentor
                <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={newMentorshipData.mentorId}
                onValueChange={(value) => setNewMentorshipData({ ...newMentorshipData, mentorId: value })}
              >
                <SelectTrigger id="mentor" className={newMentorshipErrors.mentorId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a mentor" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading mentors...
                    </div>
                  ) : mentors.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">No mentors available</div>
                  ) : (
                    mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.name || mentor.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {newMentorshipErrors.mentorId && (
                <p className="text-sm text-destructive">{newMentorshipErrors.mentorId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentee">
                Select Mentee
                <span className="text-destructive"> *</span>
              </Label>
              <Select
                value={newMentorshipData.menteeId}
                onValueChange={(value) => setNewMentorshipData({ ...newMentorshipData, menteeId: value })}
              >
                <SelectTrigger id="mentee" className={newMentorshipErrors.menteeId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a mentee" />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading mentees...
                    </div>
                  ) : mentees.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">No mentees available</div>
                  ) : (
                    mentees.map((mentee) => (
                      <SelectItem key={mentee.id} value={mentee.id}>
                        {mentee.name || mentee.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {newMentorshipErrors.menteeId && (
                <p className="text-sm text-destructive">{newMentorshipErrors.menteeId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Connection Message
                <span className="text-destructive"> *</span>
              </Label>
              <Textarea
                id="message"
                value={newMentorshipData.message}
                onChange={(e) => setNewMentorshipData({ ...newMentorshipData, message: e.target.value })}
                placeholder="Provide a message explaining this connection (will be visible to both parties)"
                className={newMentorshipErrors.message ? "border-destructive" : ""}
                rows={4}
              />
              {newMentorshipErrors.message && <p className="text-sm text-destructive">{newMentorshipErrors.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewMentorshipDialogOpen(false)}
              disabled={isCreatingMentorship}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMentorship}
              className="bg-[#DB7C27] hover:bg-[#c06a1f]"
              disabled={isCreatingMentorship}
            >
              {isCreatingMentorship ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <HandshakeIcon className="mr-2 h-4 w-4" />
                  Create Mentorship
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newStatus === "accepted"
                ? selectedMentorship?.status === "declined"
                  ? "Restore Mentorship"
                  : "Accept Mentorship"
                : "Decline Mentorship"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "accepted"
                ? selectedMentorship?.status === "declined"
                  ? "Restore this mentorship connection and make it active again"
                  : "Accept this mentorship request and create a connection"
                : "Decline this mentorship request or terminate an existing connection"}
            </DialogDescription>
          </DialogHeader>
          {selectedMentorship && (
            <div className="py-4">
              <div className="space-y-2">
                <p>
                  <strong>Mentor:</strong> {selectedMentorship.mentorName}
                </p>
                <p>
                  <strong>Mentee:</strong> {selectedMentorship.menteeName}
                </p>
                <p>
                  <strong>Current Status:</strong>{" "}
                  {selectedMentorship.status.charAt(0).toUpperCase() + selectedMentorship.status.slice(1)}
                </p>
                <p>
                  <strong>Created:</strong> {new Date(selectedMentorship.createdAt).toLocaleDateString()}
                </p>
                {selectedMentorship.message && (
                  <div className="mt-2">
                    <p>
                      <strong>Request Message:</strong>
                    </p>
                    <p className="text-sm text-muted-foreground italic bg-muted p-2 rounded-md">
                      {selectedMentorship.message}
                    </p>
                  </div>
                )}
              </div>

              {newStatus === "declined" && selectedMentorship.status === "accepted" && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Terminating this mentorship will end the connection between the mentor and mentee. Both parties will
                    be notified.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)} disabled={isUpdatingStatus}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMentorshipStatus}
              className={newStatus === "accepted" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : newStatus === "accepted" ? (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  {selectedMentorship?.status === "declined" ? "Restore Mentorship" : "Accept Mentorship"}
                </>
              ) : (
                <>
                  <LinkOff className="mr-2 h-4 w-4" />
                  {selectedMentorship?.status === "accepted" ? "Terminate Mentorship" : "Decline Mentorship"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
