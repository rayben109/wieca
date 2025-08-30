"use client"

import { useState, useEffect } from "react"
import { getUserProfiles, exportUserProfiles } from "@/lib/actions/profile-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, Search, Eye, Mail, MapPin, Calendar, Award, Target } from "lucide-react"
import type { User } from "@/lib/types"

interface UserProfile extends User {
  profile?: {
    bio?: string
    skills?: string[]
    interests?: string[]
    experience?: string
    education?: string
    location?: string
    phone?: string
    linkedin?: string
    github?: string
    website?: string
    availability?: string
    mentorshipGoals?: string[]
    achievements?: string[]
  }
  mentorships?: {
    active: number
    completed: number
    pending: number
  }
  lastActive?: string
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    filterProfiles()
  }, [profiles, searchTerm, roleFilter])

  const fetchProfiles = async () => {
    setIsLoading(true)
    try {
      const response = await getUserProfiles()
      if (response.success && response.profiles) {
        setProfiles(response.profiles)
        setFilteredProfiles(response.profiles)
      } else {
        setError(response.error || "Failed to load profiles")
      }
    } catch (err) {
      console.error("Error fetching profiles:", err)
      setError("Failed to load profiles. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterProfiles = () => {
    let filtered = [...profiles]

    if (searchTerm) {
      filtered = filtered.filter(
        (profile) =>
          profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.profile?.bio?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((profile) => profile.role === roleFilter)
    }

    setFilteredProfiles(filtered)
  }

  const handleExportProfiles = async () => {
    setIsExporting(true)
    try {
      const response = await exportUserProfiles(filteredProfiles.map((p) => p.id))
      if (response.success && response.csvData) {
        // Create and download CSV file
        const blob = new Blob([response.csvData], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `user-profiles-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError(response.error || "Failed to export profiles")
      }
    } catch (err) {
      console.error("Error exporting profiles:", err)
      setError("Failed to export profiles. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewProfile = (profile: UserProfile) => {
    setSelectedProfile(profile)
    setShowProfileModal(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profiles</h1>
          <p className="text-gray-600">Comprehensive view of all user profile data</p>
        </div>
        <Button
          onClick={handleExportProfiles}
          disabled={isExporting || filteredProfiles.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Profiles"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-3 text-gray-500">Loading profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No profiles found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.image || ""} alt={profile.name || ""} />
                    <AvatarFallback>{profile.name ? profile.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{profile.name || "No name"}</CardTitle>
                    <CardDescription className="truncate">{profile.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge
                    variant={
                      profile.role === "admin" ? "destructive" : profile.role === "mentor" ? "default" : "secondary"
                    }
                  >
                    {profile.role}
                  </Badge>
                  <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                    {profile.status || "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  {profile.profile?.bio && <p className="line-clamp-2">{profile.profile.bio}</p>}

                  {profile.profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{profile.profile.location}</span>
                    </div>
                  )}

                  {profile.lastActive && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Last active: {new Date(profile.lastActive).toLocaleDateString()}</span>
                    </div>
                  )}

                  {profile.mentorships && (
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>
                        {profile.mentorships.active} active, {profile.mentorships.completed} completed
                      </span>
                    </div>
                  )}

                  {profile.profile?.skills && profile.profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.profile.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {profile.profile.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.profile.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Button onClick={() => handleViewProfile(profile)} variant="outline" size="sm" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-4xl mx-auto p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedProfile.image || ""} alt={selectedProfile.name || ""} />
                  <AvatarFallback className="text-lg">
                    {selectedProfile.name ? selectedProfile.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedProfile.name || "No name"}</h2>
                  <p className="text-gray-600">{selectedProfile.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant={
                        selectedProfile.role === "admin"
                          ? "destructive"
                          : selectedProfile.role === "mentor"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {selectedProfile.role}
                    </Badge>
                    <Badge variant={selectedProfile.status === "active" ? "default" : "secondary"}>
                      {selectedProfile.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowProfileModal(false)} variant="outline" size="sm">
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p>{selectedProfile.email}</p>
                  </div>
                  {selectedProfile.profile?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p>{selectedProfile.profile.phone}</p>
                    </div>
                  )}
                  {selectedProfile.profile?.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location</label>
                      <p>{selectedProfile.profile.location}</p>
                    </div>
                  )}
                  {selectedProfile.profile?.linkedin && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                      <p className="text-blue-600 hover:underline">
                        <a href={selectedProfile.profile.linkedin} target="_blank" rel="noopener noreferrer">
                          {selectedProfile.profile.linkedin}
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedProfile.profile?.experience && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p>{selectedProfile.profile.experience}</p>
                    </div>
                  )}
                  {selectedProfile.profile?.education && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Education</label>
                      <p>{selectedProfile.profile.education}</p>
                    </div>
                  )}
                  {selectedProfile.profile?.availability && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Availability</label>
                      <p>{selectedProfile.profile.availability}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p>{new Date(selectedProfile.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bio */}
              {selectedProfile.profile?.bio && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{selectedProfile.profile.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {selectedProfile.profile?.skills && selectedProfile.profile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interests */}
              {selectedProfile.profile?.interests && selectedProfile.profile.interests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.profile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mentorship Goals */}
              {selectedProfile.profile?.mentorshipGoals && selectedProfile.profile.mentorshipGoals.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Mentorship Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedProfile.profile.mentorshipGoals.map((goal, index) => (
                        <li key={index} className="text-gray-700">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Mentorship Statistics */}
              {selectedProfile.mentorships && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Mentorship Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{selectedProfile.mentorships.active}</div>
                        <div className="text-sm text-gray-500">Active</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{selectedProfile.mentorships.completed}</div>
                        <div className="text-sm text-gray-500">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{selectedProfile.mentorships.pending}</div>
                        <div className="text-sm text-gray-500">Pending</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
