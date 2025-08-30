"use client"

import { useState, useEffect } from "react"
import { getAllConversations, moderateConversation } from "@/lib/actions/admin-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, AlertTriangle, CheckCircle, XCircle, Eye, Flag, Clock, Users } from "lucide-react"

interface Conversation {
  id: string
  participants: {
    id: string
    name: string
    email: string
    image?: string
    role: string
  }[]
  lastMessage: {
    content: string
    timestamp: string
    senderId: string
  }
  messageCount: number
  status: "active" | "flagged" | "approved" | "blocked"
  createdAt: string
  updatedAt: string
  flags?: {
    reason: string
    reportedBy: string
    timestamp: string
  }[]
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [showConversationModal, setShowConversationModal] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    filterConversations()
  }, [conversations, searchTerm, statusFilter])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const response = await getAllConversations()
      if (response.success && response.conversations) {
        setConversations(response.conversations)
        setFilteredConversations(response.conversations)
      } else {
        setError(response.error || "Failed to load conversations")
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Failed to load conversations. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterConversations = () => {
    let filtered = [...conversations]

    if (searchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv.participants.some(
            (p) =>
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.email.toLowerCase().includes(searchTerm.toLowerCase()),
          ) || conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter)
    }

    setFilteredConversations(filtered)
  }

  const handleModerateConversation = async (conversationId: string, action: "approve" | "flag" | "block") => {
    try {
      const response = await moderateConversation(conversationId, action)
      if (response.success) {
        setConversations(
          conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, status: action === "approve" ? "approved" : action === "flag" ? "flagged" : "blocked" }
              : conv,
          ),
        )
      } else {
        setError(response.error || "Failed to moderate conversation")
      }
    } catch (err) {
      console.error("Error moderating conversation:", err)
      setError("Failed to moderate conversation. Please try again.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "flagged":
        return "bg-red-100 text-red-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "blocked":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "flagged":
        return <AlertTriangle className="h-4 w-4" />
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "blocked":
        return <XCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversation Management</h1>
          <p className="text-gray-600">Monitor and moderate conversations between mentors and mentees</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {filteredConversations.length} conversations
          </Badge>
          <Badge variant="destructive" className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            {filteredConversations.filter((c) => c.status === "flagged").length} flagged
          </Badge>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
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
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-3 text-gray-500">Loading conversations...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No conversations found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex -space-x-2">
                        {conversation.participants.map((participant, index) => (
                          <Avatar key={participant.id} className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={participant.image || ""} alt={participant.name} />
                            <AvatarFallback className="text-xs">
                              {participant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {conversation.participants.map((p) => p.name).join(" & ")}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {conversation.participants.map((p) => p.role).join(" - ")}
                        </p>
                      </div>
                      <Badge className={`ml-auto ${getStatusColor(conversation.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(conversation.status)}
                          {conversation.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        <strong>Last message:</strong> {conversation.lastMessage.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {conversation.messageCount} messages
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </div>
                      {conversation.flags && conversation.flags.length > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <Flag className="h-4 w-4" />
                          {conversation.flags.length} flag{conversation.flags.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedConversation(conversation)
                        setShowConversationModal(true)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    {conversation.status === "flagged" && (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleModerateConversation(conversation.id, "approve")}
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleModerateConversation(conversation.id, "block")}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {conversation.status === "active" && (
                      <Button
                        onClick={() => handleModerateConversation(conversation.id, "flag")}
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation Detail Modal */}
      {showConversationModal && selectedConversation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-4xl mx-auto p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Conversation Details</h2>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedConversation.participants.map((participant) => (
                      <Avatar key={participant.id} className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={participant.image || ""} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedConversation.participants.map((p) => p.name).join(" & ")}</p>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.participants.map((p) => p.role).join(" - ")}
                    </p>
                  </div>
                  <Badge className={getStatusColor(selectedConversation.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedConversation.status)}
                      {selectedConversation.status}
                    </span>
                  </Badge>
                </div>
              </div>
              <Button onClick={() => setShowConversationModal(false)} variant="outline" size="sm">
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedConversation.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.image || ""} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-500">{participant.email}</p>
                        <Badge variant="outline" className="text-xs">
                          {participant.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Messages</label>
                    <p className="text-lg font-semibold">{selectedConversation.messageCount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Started</label>
                    <p>{new Date(selectedConversation.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Activity</label>
                    <p>{new Date(selectedConversation.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={getStatusColor(selectedConversation.status)}>{selectedConversation.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Last Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 mb-2">{selectedConversation.lastMessage.content}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedConversation.lastMessage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {selectedConversation.flags && selectedConversation.flags.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Flag className="h-5 w-5" />
                      Flags & Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedConversation.flags.map((flag, index) => (
                        <div key={index} className="border-l-4 border-red-400 pl-4 py-2">
                          <p className="font-medium text-red-800">{flag.reason}</p>
                          <p className="text-sm text-gray-600">
                            Reported by: {flag.reportedBy} on {new Date(flag.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
              {selectedConversation.status === "flagged" && (
                <>
                  <Button
                    onClick={() => {
                      handleModerateConversation(selectedConversation.id, "approve")
                      setShowConversationModal(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Conversation
                  </Button>
                  <Button
                    onClick={() => {
                      handleModerateConversation(selectedConversation.id, "block")
                      setShowConversationModal(false)
                    }}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Block Conversation
                  </Button>
                </>
              )}

              {selectedConversation.status === "active" && (
                <Button
                  onClick={() => {
                    handleModerateConversation(selectedConversation.id, "flag")
                    setShowConversationModal(false)
                  }}
                  variant="outline"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag for Review
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
