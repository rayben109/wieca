"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { sendEmailNotification } from "@/lib/email"
import type { Message, Conversation } from "@/lib/types"

export async function getConversations(): Promise<Conversation[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const conversationsCollection = db.collection("conversations")
    const usersCollection = db.collection("users")

    // Find conversations where the user is a participant
    const conversations = await conversationsCollection
      .find({
        participants: new ObjectId(session.user.id),
      })
      .sort({ updatedAt: -1 })
      .toArray()

    if (conversations.length === 0) {
      return []
    }

    // Get all participant IDs
    const participantIds = conversations.flatMap((conv) => conv.participants)
    const uniqueParticipantIds = [...new Set(participantIds.map((id) => id.toString()))]

    // Get user details for all participants
    const users = await usersCollection
      .find({
        _id: { $in: uniqueParticipantIds.map((id) => new ObjectId(id)) },
      })
      .toArray()

    // Map conversations with participant details
    const conversationsWithDetails = conversations.map((conv) => {
      // Find the other participant (not the current user)
      const otherParticipantId = conv.participants.find((id) => id.toString() !== session.user.id)?.toString()

      const otherParticipant = users.find((u) => u._id.toString() === otherParticipantId)

      return {
        id: conv._id.toString(),
        otherParticipant: {
          id: otherParticipantId || "",
          name: otherParticipant?.name || otherParticipant?.email || "Unknown User",
          email: otherParticipant?.email || "",
          role: otherParticipant?.role || "",
        },
        lastMessage: conv.lastMessage || "",
        lastMessageTime: conv.updatedAt.toISOString(),
        unreadCount: conv.unreadCount?.[session.user.id] || 0,
      }
    })

    return conversationsWithDetails
  } catch (error) {
    console.error("Get conversations error:", error)
    return []
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return []
    }

    const db = await connectToDatabase()
    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")

    // Verify the user is a participant in this conversation
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(session.user.id),
    })

    if (!conversation) {
      return []
    }

    // Mark messages as read
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { [`unreadCount.${session.user.id}`]: 0 } },
    )

    // Get messages
    const messages = await messagesCollection
      .find({
        conversationId: new ObjectId(conversationId),
      })
      .sort({ createdAt: 1 })
      .toArray()

    return messages.map((msg) => ({
      id: msg._id.toString(),
      conversationId: msg.conversationId.toString(),
      senderId: msg.senderId.toString(),
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      isCurrentUser: msg.senderId.toString() === session.user.id,
    }))
  } catch (error) {
    console.error("Get messages error:", error)
    return []
  }
}

export async function sendMessage(conversationId: string, content: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" }
    }

    const db = await connectToDatabase()
    const messagesCollection = db.collection("messages")
    const conversationsCollection = db.collection("conversations")
    const usersCollection = db.collection("users")

    // Verify the conversation exists and user is a participant
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(session.user.id),
    })

    if (!conversation) {
      return { success: false, error: "Conversation not found or you're not a participant" }
    }

    // Get the other participant
    const otherParticipantId = conversation.participants.find((id) => id.toString() !== session.user.id)?.toString()

    if (!otherParticipantId) {
      return { success: false, error: "Other participant not found" }
    }

    // Create message
    const now = new Date()
    const messageResult = await messagesCollection.insertOne({
      conversationId: new ObjectId(conversationId),
      senderId: new ObjectId(session.user.id),
      content,
      createdAt: now,
    })

    // Update conversation with last message and increment unread count for other participant
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: content,
          updatedAt: now,
        },
        $inc: { [`unreadCount.${otherParticipantId}`]: 1 },
      },
    )

    // Get recipient details for notification
    const recipient = await usersCollection.findOne({ _id: new ObjectId(otherParticipantId) })
    const sender = await usersCollection.findOne({ _id: new ObjectId(session.user.id) })

    if (recipient && recipient.email) {
      // Send email notification
      await sendEmailNotification({
        to: recipient.email,
        subject: "New message in WIECA Mentor Connect",
        template: "new-message",
        data: {
          recipientName: recipient.name || recipient.email,
          senderName: sender?.name || sender?.email || "A user",
          messagePreview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          conversationUrl: `/messages/${conversationId}`,
        },
      })
    }

    return {
      success: true,
      messageId: messageResult.insertedId.toString(),
    }
  } catch (error) {
    console.error("Send message error:", error)
    return { success: false, error: "Failed to send message" }
  }
}

export async function createConversation(participantId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const db = await connectToDatabase()
    const conversationsCollection = db.collection("conversations")
    const usersCollection = db.collection("users")

    // Verify the other user exists
    const otherUser = await usersCollection.findOne({ _id: new ObjectId(participantId) })

    if (!otherUser) {
      return { success: false, error: "User not found" }
    }

    // Check if conversation already exists
    const existingConversation = await conversationsCollection.findOne({
      participants: {
        $all: [new ObjectId(session.user.id), new ObjectId(participantId)],
      },
    })

    if (existingConversation) {
      return {
        success: true,
        conversationId: existingConversation._id.toString(),
        isNew: false,
      }
    }

    // Create new conversation
    const result = await conversationsCollection.insertOne({
      participants: [new ObjectId(session.user.id), new ObjectId(participantId)],
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: {
        [session.user.id]: 0,
        [participantId]: 0,
      },
    })

    return {
      success: true,
      conversationId: result.insertedId.toString(),
      isNew: true,
    }
  } catch (error) {
    console.error("Create conversation error:", error)
    return { success: false, error: "Failed to create conversation" }
  }
}
