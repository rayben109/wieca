"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { updatePlatformSettings } from "@/lib/actions/admin-actions"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "WIECA Mentor Connect",
    supportEmail: "support@wiecamentorconnect.org",
    maxMentorshipsPerMentor: "3",
    welcomeMessage: "Welcome to WIECA Mentor Connect! We're excited to have you join our mentorship platform.",
  })

  const [emailSettings, setEmailSettings] = useState({
    enableEmailNotifications: true,
    enableWelcomeEmail: true,
    enableMentorshipRequestEmails: true,
    enableMessageNotifications: true,
    emailFooterText: "WIECA Mentor Connect - Connecting mentors and mentees for success.",
  })

  const [featureSettings, setFeatureSettings] = useState({
    enableMentorSearch: true,
    enableDirectMessaging: true,
    enableCalendarIntegration: true,
    enableMentorshipRequests: true,
    enablePublicProfiles: false,
    enableSkillsMatching: true,
  })

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmailToggle = (name: string, checked: boolean) => {
    setEmailSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleEmailTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEmailSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleFeatureToggle = (name: string, checked: boolean) => {
    setFeatureSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const settings = {
        ...generalSettings,
        ...emailSettings,
        ...featureSettings,
        maxMentorshipsPerMentor: Number.parseInt(generalSettings.maxMentorshipsPerMentor),
      }

      const result = await updatePlatformSettings(settings)

      if (result.success) {
        toast({
          title: "Settings updated successfully",
          description: "Your platform settings have been saved",
        })
      } else {
        throw new Error(result.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error updating settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Platform Settings</h1>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email Notifications</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure the basic settings for your mentorship platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    name="platformName"
                    value={generalSettings.platformName}
                    onChange={handleGeneralChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    name="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={handleGeneralChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMentorshipsPerMentor">Maximum Mentorships Per Mentor</Label>
                  <Input
                    id="maxMentorshipsPerMentor"
                    name="maxMentorshipsPerMentor"
                    type="number"
                    min="1"
                    max="10"
                    value={generalSettings.maxMentorshipsPerMentor}
                    onChange={handleGeneralChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    The maximum number of mentees a mentor can have at one time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Welcome Message</Label>
                  <Textarea
                    id="welcomeMessage"
                    name="welcomeMessage"
                    rows={4}
                    value={generalSettings.welcomeMessage}
                    onChange={handleGeneralChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be displayed to new users after registration
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Notification Settings</CardTitle>
                <CardDescription>Configure email notifications for users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable all email notifications</p>
                  </div>
                  <Switch
                    id="enableEmailNotifications"
                    checked={emailSettings.enableEmailNotifications}
                    onCheckedChange={(checked) => handleEmailToggle("enableEmailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableWelcomeEmail">Welcome Email</Label>
                    <p className="text-sm text-muted-foreground">Send a welcome email to new users</p>
                  </div>
                  <Switch
                    id="enableWelcomeEmail"
                    checked={emailSettings.enableWelcomeEmail}
                    onCheckedChange={(checked) => handleEmailToggle("enableWelcomeEmail", checked)}
                    disabled={!emailSettings.enableEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableMentorshipRequestEmails">Mentorship Request Emails</Label>
                    <p className="text-sm text-muted-foreground">Send emails for mentorship requests and updates</p>
                  </div>
                  <Switch
                    id="enableMentorshipRequestEmails"
                    checked={emailSettings.enableMentorshipRequestEmails}
                    onCheckedChange={(checked) => handleEmailToggle("enableMentorshipRequestEmails", checked)}
                    disabled={!emailSettings.enableEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableMessageNotifications">Message Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications for new messages</p>
                  </div>
                  <Switch
                    id="enableMessageNotifications"
                    checked={emailSettings.enableMessageNotifications}
                    onCheckedChange={(checked) => handleEmailToggle("enableMessageNotifications", checked)}
                    disabled={!emailSettings.enableEmailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFooterText">Email Footer Text</Label>
                  <Textarea
                    id="emailFooterText"
                    name="emailFooterText"
                    rows={3}
                    value={emailSettings.emailFooterText}
                    onChange={handleEmailTextChange}
                    disabled={!emailSettings.enableEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Settings</CardTitle>
                <CardDescription>Enable or disable platform features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableMentorSearch">Mentor Search</Label>
                    <p className="text-sm text-muted-foreground">Allow mentees to search for mentors</p>
                  </div>
                  <Switch
                    id="enableMentorSearch"
                    checked={featureSettings.enableMentorSearch}
                    onCheckedChange={(checked) => handleFeatureToggle("enableMentorSearch", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableDirectMessaging">Direct Messaging</Label>
                    <p className="text-sm text-muted-foreground">Allow users to send direct messages</p>
                  </div>
                  <Switch
                    id="enableDirectMessaging"
                    checked={featureSettings.enableDirectMessaging}
                    onCheckedChange={(checked) => handleFeatureToggle("enableDirectMessaging", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableCalendarIntegration">Calendar Integration</Label>
                    <p className="text-sm text-muted-foreground">Enable calendar scheduling features</p>
                  </div>
                  <Switch
                    id="enableCalendarIntegration"
                    checked={featureSettings.enableCalendarIntegration}
                    onCheckedChange={(checked) => handleFeatureToggle("enableCalendarIntegration", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableMentorshipRequests">Mentorship Requests</Label>
                    <p className="text-sm text-muted-foreground">Allow mentees to send mentorship requests</p>
                  </div>
                  <Switch
                    id="enableMentorshipRequests"
                    checked={featureSettings.enableMentorshipRequests}
                    onCheckedChange={(checked) => handleFeatureToggle("enableMentorshipRequests", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enablePublicProfiles">Public Profiles</Label>
                    <p className="text-sm text-muted-foreground">Make user profiles publicly accessible</p>
                  </div>
                  <Switch
                    id="enablePublicProfiles"
                    checked={featureSettings.enablePublicProfiles}
                    onCheckedChange={(checked) => handleFeatureToggle("enablePublicProfiles", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableSkillsMatching">Skills Matching</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable automatic mentor-mentee matching based on skills
                    </p>
                  </div>
                  <Switch
                    id="enableSkillsMatching"
                    checked={featureSettings.enableSkillsMatching}
                    onCheckedChange={(checked) => handleFeatureToggle("enableSkillsMatching", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
