"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { updateProfile, getProfile } from "@/lib/actions/profile-actions"
import { ProfileImageUpload } from "@/components/profile-image-upload"
import type { ProfileData } from "@/lib/types"

const expertiseAreas = [
  "Renewable Energy",
  "Solar Power",
  "Wind Energy",
  "Hydroelectric Power",
  "Biomass Energy",
  "Geothermal Energy",
  "Energy Storage",
  "Energy Efficiency",
  "Sustainable Development",
  "Climate Policy",
  "Green Finance",
  "Energy Markets",
]

const communicationMethods = [
  { id: "email", label: "Email" },
  { id: "video", label: "Video Call" },
  { id: "phone", label: "Phone Call" },
  { id: "in-person", label: "In-Person Meeting" },
  { id: "text", label: "Text Chat" },
]

const communicationPlatforms = [
  { id: "zoom", label: "Zoom" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "google-meet", label: "Google Meet" },
  { id: "whatsapp", label: "Skype" },
]

const genderOptions = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "non-binary", label: "Non-binary" },
  { id: "prefer-not-to-say", label: "Prefer not to say" },
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    bio: "",
    education: "",
    expertise: [],
    sector: "",
    role: "",
    organization: "",
    yearsOfExperience: 0,
    previousMentorship: false,
    mentorshipResources: "",
    mentorshipExpectations: "",
    communicationPreferences: [],
    communicationPlatforms: [],
    careerGoals: "",
    interests: "",
    phoneNumber: "",
    gender: "",
    profileImage: "",
    availability: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadProfile()
    }
  }, [status, router])

  async function loadProfile() {
    try {
      const data = await getProfile()
      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateProfile(profile)

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      } else {
        toast({
          title: "Update failed",
          description: result.error || "An error occurred while updating your profile.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleExpertiseChange(area: string) {
    setProfile((prev) => {
      const expertise = prev.expertise || []
      if (expertise.includes(area)) {
        return { ...prev, expertise: expertise.filter((a) => a !== area) }
      } else {
        return { ...prev, expertise: [...expertise, area] }
      }
    })
  }

  function handleCommunicationChange(method: string) {
    setProfile((prev) => {
      const prefs = prev.communicationPreferences || []
      if (prefs.includes(method)) {
        return { ...prev, communicationPreferences: prefs.filter((m) => m !== method) }
      } else {
        return { ...prev, communicationPreferences: [...prefs, method] }
      }
    })
  }

  function handlePlatformChange(platform: string) {
    setProfile((prev) => {
      const platforms = prev.communicationPlatforms || []
      if (platforms.includes(platform)) {
        return { ...prev, communicationPlatforms: platforms.filter((p) => p !== platform) }
      } else {
        return { ...prev, communicationPlatforms: [...platforms, platform] }
      }
    })
  }

  function handleImageUpload(imageUrl: string) {
    setProfile((prev) => ({ ...prev, profileImage: imageUrl }))
  }

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          <CardDescription>
            Complete your profile to get the most out of the WIECA Mentor Connect Programme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="flex justify-center mb-6">
                  <ProfileImageUpload
                    currentImage={profile.profileImage}
                    name={profile.name}
                    onImageUpload={handleImageUpload}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={profile.phoneNumber}
                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Textarea
                    id="education"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                    placeholder="Your educational background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Personal Interests</Label>
                  <Textarea
                    id="interests"
                    value={profile.interests}
                    onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                    placeholder="Your hobbies and interests outside of work"
                  />
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Areas of Expertise</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {expertiseAreas.map((area) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox
                          id={`expertise-${area}`}
                          checked={profile.expertise?.includes(area)}
                          onCheckedChange={() => handleExpertiseChange(area)}
                        />
                        <Label htmlFor={`expertise-${area}`} className="font-normal">
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Professional Sector</Label>
                  <Select value={profile.sector} onValueChange={(value) => setProfile({ ...profile, sector: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academia">Academia</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="non-profit">Non-Profit</SelectItem>
                      <SelectItem value="private">Private Sector</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Current Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      placeholder="Your current job title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization/Institute</Label>
                    <Input
                      id="organization"
                      value={profile.organization}
                      onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                      placeholder="Your organization or institute name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    value={profile.yearsOfExperience?.toString() || "0"}
                    onChange={(e) =>
                      setProfile({ ...profile, yearsOfExperience: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="Years of professional experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careerGoals">Career Aspirations</Label>
                  <Textarea
                    id="careerGoals"
                    value={profile.careerGoals}
                    onChange={(e) => setProfile({ ...profile, careerGoals: e.target.value })}
                    placeholder="Your career goals and aspirations"
                  />
                </div>

                {session?.user?.role === "mentor" && (
                  <>
                    <div className="space-y-2">
                      <Label>Have you previously participated in a mentorship program?</Label>
                      <RadioGroup
                        value={profile.previousMentorship ? "yes" : "no"}
                        onValueChange={(value) => setProfile({ ...profile, previousMentorship: value === "yes" })}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="previous-yes" />
                          <Label htmlFor="previous-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="previous-no" />
                          <Label htmlFor="previous-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mentorshipResources">
                        What resources or support do you think would enhance your mentoring experience?
                      </Label>
                      <Textarea
                        id="mentorshipResources"
                        value={profile.mentorshipResources}
                        onChange={(e) => setProfile({ ...profile, mentorshipResources: e.target.value })}
                        placeholder="Describe resources or support that would help you as a mentor"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mentorshipExpectations">What do you expect from this mentorship program?</Label>
                      <Textarea
                        id="mentorshipExpectations"
                        value={profile.mentorshipExpectations}
                        onChange={(e) => setProfile({ ...profile, mentorshipExpectations: e.target.value })}
                        placeholder="Describe your expectations from the mentorship program"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Preferred Communication Methods</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {communicationMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`comm-${method.id}`}
                          checked={profile.communicationPreferences?.includes(method.id)}
                          onCheckedChange={() => handleCommunicationChange(method.id)}
                        />
                        <Label htmlFor={`comm-${method.id}`} className="font-normal">
                          {method.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Communication Platforms</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {communicationPlatforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`platform-${platform.id}`}
                          checked={profile.communicationPlatforms?.includes(platform.id)}
                          onCheckedChange={() => handlePlatformChange(platform.id)}
                        />
                        <Label htmlFor={`platform-${platform.id}`} className="font-normal">
                          {platform.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {session?.user?.role === "mentor" && (
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      value={profile.availability}
                      onValueChange={(value) => setProfile({ ...profile, availability: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="limited">Limited (1-2 hours/month)</SelectItem>
                        <SelectItem value="moderate">Moderate (3-5 hours/month)</SelectItem>
                        <SelectItem value="open">Open (6+ hours/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(session?.user?.role === "mentee" ? "/search" : "/requests")}
              >
                {activeTab === "preferences"
                  ? session?.user?.role === "mentee"
                    ? "Find Mentors"
                    : "View Requests"
                  : "Skip for now"}
              </Button>
              <Button type="submit" className="bg-[#DB7C27] hover:bg-[#c06a1f]" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="secondary">
                Export Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
