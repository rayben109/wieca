"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getConversations } from "@/lib/actions/messaging-actions"
import type { Conversation } from "@/lib/types"

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadConversations()
    }
  }, [status, router])

  async function loadConversations() {
    setIsLoading(true)
    try {
      const data = await getConversations()
      setConversations(data)
    } catch (error) {
      console.error("Failed to load conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Button onClick={() => loadConversations()} variant="outline" className="gap-2" disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">You don't have any conversations yet.</p>
          <p className="text-muted-foreground mb-6">
            Start a conversation with a mentor or mentee from your connections.
          </p>
          <Button
            className="bg-[#DB7C27] hover:bg-[#c06a1f]"
            onClick={() => router.push(session?.user?.role === "mentee" ? "/search" : "/requests")}
          >
            {session?.user?.role === "mentee" ? "Find Mentors" : "View Requests"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link href={`/messages/${conversation.id}`} key={conversation.id}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                    {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">{conversation.otherParticipant.name}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unreadCount > 0 && <Badge className="bg-[#DB7C27]">{conversation.unreadCount}</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
