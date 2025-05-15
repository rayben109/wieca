"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createMentorship, getAllMentors, getAllMentees } from "@/lib/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { User } from "@/lib/types"

export default function CreateMentorshipPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [mentors, setMentors] = useState<User[]>([])
  const [mentees, setMentees] = useState<User[]>([])

  // Form state
  const [formData, setFormData] = useState({
    mentorId: "",
    menteeId: "",
    notes: "",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [mentorsData, menteesData] = await Promise.all([getAllMentors(), getAllMentees()])

        setMentors(mentorsData)
        setMentees(menteesData)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error loading users",
          description: "Could not load mentors and mentees",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.mentorId || !formData.menteeId) {
        throw new Error("Please select both a mentor and mentee")
      }

      const result = await createMentorship({
        mentorId: formData.mentorId,
        menteeId: formData.menteeId,
        notes: formData.notes,
      })

      if (result.success) {
        toast({
          title: "Mentorship created successfully",
          description: "The mentorship relationship has been established",
        })
        router.push("/admin/mentorships")
      } else {
        throw new Error(result.error || "Failed to create mentorship")
      }
    } catch (error) {
      console.error("Error creating mentorship:", error)
      toast({
        title: "Error creating mentorship",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Find user names by ID
  const getMentorName = (id: string) => {
    const mentor = mentors.find((m) => m._id === id)
    return mentor ? mentor.name : "Unknown Mentor"
  }

  const getMenteeName = (id: string) => {
    const mentee = mentees.find((m) => m._id === id)
    return mentee ? mentee.name : "Unknown Mentee"
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create New Mentorship</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Mentorship Details</CardTitle>
          <CardDescription>Create a new mentorship relationship between a mentor and mentee</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mentorId">Select Mentor</Label>
                  <Select
                    name="mentorId"
                    value={formData.mentorId}
                    onValueChange={(value) => handleSelectChange("mentorId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.length > 0 ? (
                        mentors.map((mentor) => (
                          <SelectItem key={mentor._id} value={mentor._id}>
                            {mentor.name} ({mentor.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No mentors available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="menteeId">Select Mentee</Label>
                  <Select
                    name="menteeId"
                    value={formData.menteeId}
                    onValueChange={(value) => handleSelectChange("menteeId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a mentee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentees.length > 0 ? (
                        mentees.map((mentee) => (
                          <SelectItem key={mentee._id} value={mentee._id}>
                            {mentee.name} ({mentee.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No mentees available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {formData.mentorId && formData.menteeId && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="font-medium text-blue-800">Mentorship Preview:</p>
                    <p className="text-blue-700">
                      {getMentorName(formData.mentorId)} will mentor {getMenteeName(formData.menteeId)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional information about this mentorship"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/mentorships")}
              disabled={isLoading || isLoadingUsers}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingUsers || !formData.mentorId || !formData.menteeId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Mentorship"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
