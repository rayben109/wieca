export interface User {
  id: string
  name?: string | null
  email: string
  image?: string | null
  role: "admin" | "mentor" | "mentee"
  status?: "active" | "inactive" | "suspended"
  createdAt: Date
  updatedAt?: Date
  emailVerified?: Date | null
  profile?: UserProfile
}

export interface UserProfile {
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

export interface Mentorship {
  id: string
  mentorId: string
  menteeId: string
  status: "pending" | "active" | "completed" | "cancelled"
  startDate?: Date
  endDate?: Date
  goals?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
  mentor?: User
  mentee?: User
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  type: "text" | "file" | "image"
  readAt?: Date
  createdAt: Date
  updatedAt: Date
  sender?: User
  receiver?: User
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  messageCount: number
  status: "active" | "flagged" | "approved" | "blocked"
  flags?: ConversationFlag[]
  createdAt: Date
  updatedAt: Date
}

export interface ConversationFlag {
  reason: string
  reportedBy: string
  timestamp: Date
}

export interface Notification {
  id: string
  userId: string
  type: "message" | "mentorship_request" | "mentorship_accepted" | "mentorship_declined" | "system"
  title: string
  message: string
  read: boolean
  data?: any
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  attendees: string[]
  type: "meeting" | "session" | "reminder"
  mentorshipId?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface AdminAnalytics {
  totalUsers: number
  totalMentors: number
  totalMentees: number
  activeMentorships: number
  totalConversations: number
  flaggedConversations: number
  userGrowth?: {
    period: string
    count: number
  }[]
  mentorshipStats?: {
    pending: number
    active: number
    completed: number
    cancelled: number
  }
}
