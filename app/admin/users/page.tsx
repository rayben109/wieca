"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAllUsers, deleteUser, updateUserRole } from "@/lib/actions/admin-actions"
import type { User } from "@/lib/types"

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [userToUpdateRole, setUserToUpdateRole] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<"admin" | "mentor" | "mentee">("mentee")

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await getAllUsers()
      if (response.success && response.users) {
        setUsers(response.users)
        setFilteredUsers(response.users)
      } else {
        setError(response.error || "Failed to load users")
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const response = await deleteUser(userToDelete.id)
      if (response.success) {
        setUsers(users.filter((user) => user.id !== userToDelete.id))
        setShowDeleteModal(false)
        setUserToDelete(null)
      } else {
        setError(response.error || "Failed to delete user")
      }
    } catch (err) {
      console.error("Error deleting user:", err)
      setError("Failed to delete user. Please try again.")
    }
  }

  const handleRoleClick = (user: User) => {
    setUserToUpdateRole(user)
    setNewRole(user.role as "admin" | "mentor" | "mentee")
    setShowRoleModal(true)
  }

  const handleRoleConfirm = async () => {
    if (!userToUpdateRole) return

    try {
      const response = await updateUserRole(userToUpdateRole.id, newRole)
      if (response.success) {
        setUsers(users.map((user) => (user.id === userToUpdateRole.id ? { ...user, role: newRole } : user)))
        setShowRoleModal(false)
        setUserToUpdateRole(null)
      } else {
        setError(response.error || "Failed to update user role")
      }
    } catch (err) {
      console.error("Error updating user role:", err)
      setError("Failed to update user role. Please try again.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Link
          href="/admin/users/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New User
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
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

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.image ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.image || "/placeholder.svg"}
                              alt={user.name || "User"}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || "No name"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "mentor"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleRoleClick(user)} className="text-blue-600 hover:text-blue-900 mr-4">
                        Change Role
                      </button>
                      <Link
                        href={`/admin/users/edit/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-md mx-auto p-5">
            <div className="text-center">
              <svg
                className="mx-auto mb-4 w-14 h-14 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h3 className="mb-5 text-lg font-normal text-gray-800">Are you sure you want to delete this user?</h3>
              <p className="mb-5 text-sm text-gray-600">
                {userToDelete?.name || userToDelete?.email || "This user"} will be permanently removed from the system
                along with all associated data.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 border border-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Update Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-md mx-auto p-5">
            <div className="text-center">
              <h3 className="mb-5 text-lg font-normal text-gray-800">
                Change role for {userToUpdateRole?.name || userToUpdateRole?.email}
              </h3>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select new role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "mentor" | "mentee")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="mentor">Mentor</option>
                  <option value="mentee">Mentee</option>
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleRoleConfirm}
                  className="text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Update Role
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 border border-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
