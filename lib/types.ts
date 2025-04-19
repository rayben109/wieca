export interface ProfileData {
  name: string
  bio: string
  education: string
  expertise: string[]
  sector: string
  role: string
  organization?: string
  yearsOfExperience?: number
  previousMentorship?: boolean
  mentorshipResources?: string
  mentorshipExpectations?: string
  communicationPreferences: string[]
  communicationPlatforms?: string[]
  careerGoals: string
  interests: string
  phoneNumber?: string
  gender?: string
  profileImage?: string
  availability?: string
}

export interface MentorProfile {
  id: string
  name: string
  bio: string
  role: string
  organization?: string
  sector: string
  expertise: string[]
  yearsOfExperience?: number
  profileImage?: string
  similarityScore?: number
}

export interface MentorshipRequest {
  id: string
  mentorId: string
  menteeId: string
  message: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
  mentor: {
    name: string
    email: string
    profileImage?: string
  }
  mentee: {
    name: string
    email: string
    profileImage?: string
  }
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  isCurrentUser: boolean
}

export interface Conversation {
  id: string
  otherParticipant: {
    id: string
    name: string
    email: string
    role: string
    profileImage?: string
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface MentorshipSession {
  id: string
  title: string
  description: string
  startTime: string
  status: "pending" | "confirmed" | "cancelled"
  isCreator: boolean
  participant: {
    id: string
    name: string
    email: string
    profileImage?: string
  }
}

export interface Notification {
  id: string
  userId: string
  type: "message" | "request" | "session" | "system"
  title: string
  message: string
  relatedId?: string
  read: boolean
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  mentorCount: number
  menteeCount: number
  activeMentorships: number
  requestStats: {
    total: number
    pending: number
    accepted: number
    declined: number
    acceptanceRate: number
    avgResponseTime: number
  }
  recentUsers: {
    id: string
    name: string
    email: string
    role: string
    createdAt: Date
  }[]
  userGrowth: {
    date: string
    count: number
  }[]
  expertiseDistribution: {
    name: string
    count: number
  }[]
  recentMatches: {
    id: string
    mentor: string
    mentee: string
    date: string
    status: string
  }[]
}
