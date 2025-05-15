"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUser } from "@/lib/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function CreateUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState("mentee")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    userType: "mentee",
    bio: "",
    skills: "",
    interests: "",
    goals: "",
    experience: "",
    industry: "",
    location: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "userType") {
      setUserType(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare user data based on type
      const userData = {
        ...formData,
        skills: formData.skills.split(",").map((skill) => skill.trim()),
        interests: formData.interests.split(",").map((interest) => interest.trim()),
      }

      const result = await createUser(userData)

      if (result.success) {
        toast({
          title: "User created successfully",
          description: `${formData.name} has been added as a ${formData.userType}`,
        })
        router.push("/admin/users")
      } else {
        throw new Error(result.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create New User</h1>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Create a new user account for the mentorship platform</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">System Role</Label>
                    <Select
                      name="role"
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Regular User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">User Type</Label>
                  <Select
                    name="userType"
                    value={formData.userType}
                    onValueChange={(value) => handleSelectChange("userType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mentee">Mentee</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Brief description about the user"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Input
                      id="skills"
                      name="skills"
                      placeholder="Leadership, Communication, etc."
                      value={formData.skills}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500">Comma-separated list of skills</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      name="interests"
                      placeholder="Technology, Education, etc."
                      value={formData.interests}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500">Comma-separated list of interests</p>
                  </div>
                </div>

                {userType === "mentee" && (
                  <div className="space-y-2">
                    <Label htmlFor="goals">Goals</Label>
                    <Textarea
                      id="goals"
                      name="goals"
                      placeholder="What does this mentee want to achieve?"
                      value={formData.goals}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                )}

                {userType === "mentor" && (
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      name="experience"
                      placeholder="Relevant experience as a mentor"
                      value={formData.experience}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      name="industry"
                      value={formData.industry}
                      onValueChange={(value) => handleSelectChange("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/users")} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
