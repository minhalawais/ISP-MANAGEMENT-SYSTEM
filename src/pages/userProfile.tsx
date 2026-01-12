"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { User, Mail, Phone, Key, Edit2, Save, X, Camera, Lock, Eye, EyeOff, Upload, Shield } from "lucide-react"
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

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Profile picture state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)

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

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New password and confirm password do not match", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      return
    }

    if (passwordData.new_password.length < 6) {
      toast.error("New password must be at least 6 characters", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      return
    }

    try {
      setIsChangingPassword(true)
      const token = getToken()
      await axiosInstance.post("/user/change-password", passwordData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success("Password changed successfully", {
        style: { background: "#D1FAE5", color: "#065F46" },
      })
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordSection(false)
      setIsChangingPassword(false)
    } catch (error: any) {
      console.error("Failed to change password", error)
      const errorMessage = error.response?.data?.error || "Failed to change password"
      toast.error(errorMessage, {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      setIsChangingPassword(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (PNG, JPG, GIF, or WEBP)", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB", {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      return
    }

    try {
      setIsUploadingPicture(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = getToken()
      const response = await axiosInstance.post("/user/profile-picture", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setUserData({ ...userData, picture: response.data.picture })
      toast.success("Profile picture updated successfully", {
        style: { background: "#D1FAE5", color: "#065F46" },
      })
      setIsUploadingPicture(false)
    } catch (error: any) {
      console.error("Failed to upload profile picture", error)
      const errorMessage = error.response?.data?.error || "Failed to upload profile picture"
      toast.error(errorMessage, {
        style: { background: "#FEE2E2", color: "#B91C1C" },
      })
      setIsUploadingPicture(false)
    }
  }

  const getProfilePictureUrl = () => {
    if (userData?.picture) {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'
      const path = userData.picture.startsWith('/') ? userData.picture.slice(1) : userData.picture
      return `${apiUrl}/${path}`
    }
    return null
  }

  if (isLoading && !userData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F0E8]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-[#89A8B2] mb-4"></div>
          <div className="h-4 w-32 bg-[#B3C8CF] rounded mb-2"></div>
          <div className="h-3 w-24 bg-[#E5E1DA] rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 mt-16 max-w-4xl">

            {/* Profile Header Card */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-[#E5E1DA] mb-6">
              <div className="px-8 py-8 bg-gradient-to-r from-[#2A5C8A] to-[#89A8B2] text-white">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Profile Picture */}
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                      {getProfilePictureUrl() ? (
                        <img
                          src={getProfilePictureUrl()!}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-white/80" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#2A5C8A] shadow-lg hover:bg-slate-50 transition-colors border-2 border-[#2A5C8A]"
                    >
                      {isUploadingPicture ? (
                        <div className="w-5 h-5 border-2 border-[#2A5C8A] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera size={18} />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>

                  {/* User Info */}
                  <div className="text-center sm:text-left">
                    <h2 className="text-3xl font-bold">
                      {userData?.first_name} {userData?.last_name}
                    </h2>
                    <p className="text-white/80 text-lg mt-1">{userData?.username}</p>
                    <span className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">
                      <Shield size={14} />
                      {userData?.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information Card */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-[#E5E1DA] mb-6">
              <div className="px-6 py-4 border-b border-[#E5E1DA] bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#2A5C8A] flex items-center gap-2">
                  <User size={20} className="text-[#89A8B2]" />
                  Personal Information
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-[#2A5C8A] hover:bg-[#1e4568] transition-colors shadow-sm"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-slate-600 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-slate-600 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_number" className="block text-sm font-medium text-slate-600 mb-2">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(userData)
                          setIsEditing(false)
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all"
                        disabled={isLoading}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-[#2A5C8A] hover:bg-[#1e4568] transition-all shadow-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <Mail className="text-[#89A8B2] w-5 h-5 mr-4" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                        <p className="text-slate-800 font-medium">{userData?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <Phone className="text-[#89A8B2] w-5 h-5 mr-4" />
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Number</p>
                        <p className="text-slate-800 font-medium">{userData?.contact_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Change Card */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-[#E5E1DA]">
              <div className="px-6 py-4 border-b border-[#E5E1DA] bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#2A5C8A] flex items-center gap-2">
                  <Lock size={20} className="text-[#89A8B2]" />
                  Security
                </h3>
                {!showPasswordSection && (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#2A5C8A] border border-[#2A5C8A] hover:bg-[#2A5C8A] hover:text-white transition-colors"
                  >
                    <Key size={16} />
                    Change Password
                  </button>
                )}
              </div>

              <div className="p-6">
                {showPasswordSection ? (
                  <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                    <div>
                      <label htmlFor="current_password" className="block text-sm font-medium text-slate-600 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="current_password"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordInputChange}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-slate-600 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new_password"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordInputChange}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-600 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordSection(false)
                          setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-all"
                        disabled={isChangingPassword}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-[#2A5C8A] hover:bg-[#1e4568] transition-all shadow-sm"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Changing...
                          </>
                        ) : (
                          <>
                            <Key size={16} />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <Key className="text-[#89A8B2] w-5 h-5 mr-4" />
                    <div>
                      <p className="text-slate-800 font-medium">Password</p>
                      <p className="text-sm text-slate-500">••••••••••••</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
