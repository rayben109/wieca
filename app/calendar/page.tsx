"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getMentorshipSessions, scheduleSession, updateSessionStatus } from "@/lib/actions/calendar-actions"
import type { MentorshipSession } from "@/lib/types"

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate, { weekStartsOn: 1 }))
  const [sessions, setSessions] = useState<MentorshipSession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<MentorshipSession | null>(null)
  const [newSessionDialog, setNewSessionDialog] = useState(false)
  const [sessionDetailsDialog, setSessionDetailsDialog] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    participantId: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadSessions()
    }
  }, [status, router, weekStart])

  async function loadSessions() {
    setIsLoading(true)
    try {
      const weekEnd = addDays(weekStart, 6)
      const data = await getMentorshipSessions(weekStart.toISOString(), weekEnd.toISOString())
      setSessions(data)
    } catch (error) {
      console.error("Failed to load sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load calendar sessions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handlePreviousWeek() {
    setWeekStart(subWeeks(weekStart, 1))
  }

  function handleNextWeek() {
    setWeekStart(addWeeks(weekStart, 1))
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date)
    setNewSessionDialog(true)
  }

  function handleSessionClick(session: MentorshipSession) {
    setSelectedSession(session)
    setSessionDetailsDialog(true)
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !sessionForm.title || !sessionForm.participantId) return

    setIsLoading(true)
    try {
      const sessionDate = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":").map(Number)
      sessionDate.setHours(hours, minutes)

      const result = await scheduleSession({
        title: sessionForm.title,
        description: sessionForm.description,
        participantId: sessionForm.participantId,
        startTime: sessionDate.toISOString(),
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Session scheduled successfully",
        })
        setNewSessionDialog(false)
        setSessionForm({
          title: "",
          description: "",
          participantId: "",
        })
        setSelectedDate(null)
        setSelectedTime(null)
        loadSessions()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to schedule session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create session:", error)
      toast({
        title: "Error",
        description: "Failed to schedule session",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdateSessionStatus(status: "confirmed" | "cancelled") {
    if (!selectedSession) return

    setIsLoading(true)
    try {
      const result = await updateSessionStatus(selectedSession.id, status)

      if (result.success) {
        toast({
          title: "Success",
          description: `Session ${status}`,
        })
        setSessionDetailsDialog(false)
        loadSessions()
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${status} session`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to ${status} session:`, error)
      toast({
        title: "Error",
        description: `Failed to ${status} session`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mentorship Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div key={day.toString()} className="p-2 text-center font-medium border-r last:border-r-0">
                <div>{format(day, "EEE")}</div>
                <div className="text-sm text-muted-foreground">{format(day, "MMM d")}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 h-[600px] overflow-y-auto">
            {weekDays.map((day) => (
              <div key={day.toString()} className="border-r last:border-r-0 min-h-full">
                <div className="p-2 h-full flex flex-col">
                  {timeSlots.map((time) => {
                    const dayDate = new Date(day)
                    const [hours, minutes] = time.split(":").map(Number)
                    dayDate.setHours(hours, minutes)

                    const sessionsAtTime = sessions.filter((s) => {
                      const sessionDate = new Date(s.startTime)
                      return (
                        isSameDay(sessionDate, day) &&
                        sessionDate.getHours() === hours &&
                        sessionDate.getMinutes() === minutes
                      )
                    })

                    return (
                      <div key={time} className="flex-1 min-h-[60px] border-t p-1 relative">
                        <div className="text-xs text-muted-foreground absolute top-1 left-1">{time}</div>
                        {sessionsAtTime.length > 0 ? (
                          sessionsAtTime.map((s) => (
                            <div
                              key={s.id}
                              className={`mt-5 p-1 text-xs rounded cursor-pointer ${
                                s.status === "confirmed"
                                  ? "bg-green-100 border border-green-300 dark:bg-green-900/30 dark:border-green-800"
                                  : s.status === "cancelled"
                                    ? "bg-red-100 border border-red-300 dark:bg-red-900/30 dark:border-red-800 line-through"
                                    : "bg-[#DB7C27]/20 border border-[#DB7C27]/30"
                              }`}
                              onClick={() => handleSessionClick(s)}
                            >
                              {s.title}
                            </div>
                          ))
                        ) : (
                          <div
                            className="w-full h-full cursor-pointer hover:bg-muted/50 rounded"
                            onClick={() => {
                              const clickDate = new Date(day)
                              clickDate.setHours(hours, minutes)
                              handleDateClick(clickDate)
                            }}
                          ></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Session Dialog */}
      <Dialog open={newSessionDialog} onOpenChange={setNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>
              Create a new mentorship session on {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
              {selectedTime}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSession}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select value={selectedTime || ""} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant">Participant</Label>
                <Select
                  value={sessionForm.participantId}
                  onValueChange={(value) => setSessionForm({ ...sessionForm, participantId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would be populated with actual connections */}
                    <SelectItem value="participant1">John Doe</SelectItem>
                    <SelectItem value="participant2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setNewSessionDialog(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#DB7C27] hover:bg-[#c06a1f]"
                disabled={isLoading || !selectedTime || !sessionForm.title || !sessionForm.participantId}
              >
                {isLoading ? "Scheduling..." : "Schedule Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={sessionDetailsDialog} onOpenChange={setSessionDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSession?.title}</DialogTitle>
            <DialogDescription>
              {selectedSession && format(new Date(selectedSession.startTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedSession?.description && (
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedSession.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium">Participant</h3>
              <p className="text-sm">{selectedSession?.participant.name}</p>
            </div>

            <div>
              <h3 className="font-medium">Status</h3>
              <div
                className={`inline-block px-2 py-1 text-xs rounded-full ${
                  selectedSession?.status === "confirmed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : selectedSession?.status === "cancelled"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {selectedSession?.status?.charAt(0)?.toUpperCase() + selectedSession?.status?.slice(1) || ""}
              </div>
            </div>
          </div>

          <DialogFooter>
            {selectedSession?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateSessionStatus("cancelled")}
                  disabled={isLoading}
                >
                  Cancel Session
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateSessionStatus("confirmed")}
                  disabled={isLoading}
                >
                  Confirm Session
                </Button>
              </>
            )}
            {selectedSession?.status === "confirmed" && (
              <Button variant="destructive" onClick={() => handleUpdateSessionStatus("cancelled")} disabled={isLoading}>
                Cancel Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
