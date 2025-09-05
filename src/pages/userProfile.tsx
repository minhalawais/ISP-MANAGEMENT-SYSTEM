"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Phone, Key, Edit2, Save, X } from "react-feather"
import axiosInstance from "../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import { getToken } from "../utils/auth.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    document.title = "MBA NET - User Profile"
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const token = getToken()
      const response = await axiosInstance.get("/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUserData(response.data)
      setFormData(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch user data", error)
      toast.error("Failed to load user profile", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const token = getToken()
      await axiosInstance.put("/user/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setUserData(formData)
      setIsEditing(false)
      toast.success("Profile updated successfully", {
        style: { background: "#D1FAE5", color: "#065F46" },
      })
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to update profile", error)
      toast.error("Failed to update profile", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      setIsLoading(false)
    }
  }

  if (isLoading && !userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EBF5FF]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-[#3A86FF] mb-4"></div>
          <div className="h-4 w-32 bg-[#3A86FF] rounded mb-2"></div>
          <div className="h-3 w-24 bg-[#3A86FF] rounded opacity-70"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#EBF5FF]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF] text-white">
              <h2 className="text-2xl font-bold">User Profile</h2>
              <p className="text-sm opacity-80 mt-1">Manage your personal information</p>
            </div>
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-[#4A5568] mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-[#4A5568] mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#4A5568] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact_number" className="block text-sm font-medium text-[#4A5568] mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:border-transparent transition-all duration-200"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(userData)
                        setIsEditing(false)
                      }}
                      className="flex items-center px-4 py-2 border border-slate-300 rounded-md text-[#4A5568] bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:ring-opacity-50 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#3A86FF] hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3A86FF] focus:ring-opacity-50 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200">
                    <div className="flex items-center mb-4 sm:mb-0">
                      <div className="w-16 h-16 rounded-full bg-[#EBF5FF] flex items-center justify-center text-[#3A86FF] mr-4">
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#2A5C8A]">
                          {userData.first_name} {userData.last_name}
                        </h3>
                        <p className="text-[#4A5568]">{userData.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 rounded-md text-white bg-[#3A86FF] hover:bg-[#2563EB] transition-colors duration-200 shadow-sm"
                    >
                      <Edit2 size={16} className="mr-2" />
                      Edit Profile
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center p-3 rounded-lg hover:bg-[#EBF5FF] transition-colors duration-200">
                      <Mail className="text-[#3A86FF] w-5 h-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-[#4A5568]">Email</p>
                        <p className="text-[#2A5C8A] font-medium">{userData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg hover:bg-[#EBF5FF] transition-colors duration-200">
                      <Phone className="text-[#3A86FF] w-5 h-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-[#4A5568]">Contact Number</p>
                        <p className="text-[#2A5C8A] font-medium">{userData.contact_number || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 rounded-lg hover:bg-[#EBF5FF] transition-colors duration-200">
                      <Key className="text-[#3A86FF] w-5 h-5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-[#4A5568]">Role</p>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2A5C8A] text-white">
                            {userData.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
