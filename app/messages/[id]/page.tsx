"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Send } from "lucide-react"
import { getMessages, sendMessage } from "@/lib/actions/messaging-actions"
import type { Message } from "@/lib/types"

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = useParams()
  const conversationId = Array.isArray(id) ? id[0] : id

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadMessages()
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 10000) // Poll every 10 seconds
      return () => clearInterval(interval)
    }
  }, [status, router, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadMessages() {
    try {
      const data = await getMessages(conversationId)
      setMessages(data)
      if (isLoading) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      if (isLoading) {
        setIsLoading(false)
      }
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const result = await sendMessage(conversationId, newMessage)
      if (result.success) {
        setNewMessage("")
        loadMessages() // Reload messages to include the new one
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (status === "loading") {
    return <div className="container flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container py-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 py-2 border-b mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Conversation</h1>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] ${i % 2 === 0 ? "bg-muted" : "bg-[#DB7C27] text-white"} rounded-lg p-3`}>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isCurrentUser ? "bg-[#DB7C27] text-white" : "bg-muted"
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 p-2 border-t">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading || isSending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || isSending || !newMessage.trim()}
          className="bg-[#DB7C27] hover:bg-[#c06a1f]"
        >
          {isSending ? "Sending..." : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  )
}
