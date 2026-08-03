"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  User, Mail, Phone, Key, Edit2, Save, X, Camera, Lock, Eye, EyeOff,
  Upload, Shield, Building2, Globe, FileText, DollarSign, Image as ImageIcon,
  CheckCircle2, Info, RefreshCw
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import { getToken, getAssetUrl } from "../utils/auth.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import { useCompany } from "../context/CompanyContext.tsx"

const UserProfile: React.FC = () => {
  const { company, refreshCompany, setPageTitle } = useCompany()

  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')
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

  // Company Profile form state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    tagline: '',
    contact_number: '',
    email: '',
    website: '',
    tax_number: '',
    currency_symbol: 'Rs.',
    address: '',
    invoice_footer_notes: '',
  })
  const [isSavingCompany, setIsSavingCompany] = useState(false)

  // Logo & Favicon upload state
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    setPageTitle("User Profile")
    fetchUserData()
  }, [setPageTitle])

  // Sync company context data into companyForm when company loads
  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        tagline: company.tagline || '',
        contact_number: company.contact_number || '',
        email: company.email || '',
        website: company.website || '',
        tax_number: company.tax_number || '',
        currency_symbol: company.currency_symbol || 'Rs.',
        address: company.address || '',
        invoice_footer_notes: company.invoice_footer_notes || '',
      })
      if (company.logo_url) setLogoPreview(company.logo_url)
      if (company.favicon_url) setFaviconPreview(company.favicon_url)
    }
  }, [company])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const token = getToken()
      const response = await axiosInstance.get("/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserData(response.data)
      setFormData(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch user data", error)
      toast.error("Failed to load user profile")
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value })
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
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserData(formData)
      setIsEditing(false)
      toast.success("Profile updated successfully")
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to update profile", error)
      toast.error("Failed to update profile")
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New password and confirm password do not match")
      return
    }
    if (passwordData.new_password.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }

    try {
      setIsChangingPassword(true)
      const token = getToken()
      await axiosInstance.post("/user/change-password", passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Password changed successfully")
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordSection(false)
      setIsChangingPassword(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to change password")
      setIsChangingPassword(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (PNG, JPG, GIF, or WEBP)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    try {
      setIsUploadingPicture(true)
      const token = getToken()
      const pictureFormData = new FormData()
      pictureFormData.append('file', file)

      const response = await axiosInstance.post("/user/profile-picture", pictureFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      setUserData({ ...userData, picture: response.data.picture })
      toast.success("Profile picture updated successfully")
      setIsUploadingPicture(false)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to upload profile picture")
      setIsUploadingPicture(false)
    }
  }

  // Handle Logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Handle Favicon file selection
  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  // Submit Company Profile & Branding Updates
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSavingCompany(true)
      const token = getToken()

      const submitData = new FormData()
      Object.entries(companyForm).forEach(([key, val]) => {
        submitData.append(key, val)
      })

      if (logoFile) {
        submitData.append('logo', logoFile)
      }
      if (faviconFile) {
        submitData.append('favicon', faviconFile)
      }

      await axiosInstance.put("/company/profile", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      setLogoFile(null)
      setFaviconFile(null)
      toast.success("Company profile & branding updated successfully")
      await refreshCompany()
      setIsSavingCompany(false)
    } catch (error: any) {
      console.error("Failed to update company profile", error)
      toast.error(error.response?.data?.error || "Failed to update company settings")
      setIsSavingCompany(false)
    }
  }

  const getProfilePictureUrl = () => {
    return getAssetUrl(userData?.picture)
  }

  const canManageCompany = userData?.role === 'company_owner' || userData?.role === 'super_admin'

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

            {/* Header Card */}
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
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-3xl font-bold">
                      {userData?.first_name} {userData?.last_name}
                    </h2>
                    <p className="text-white/80 text-lg mt-1">{userData?.username}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        <Shield size={13} />
                        {userData?.role?.replace('_', ' ').toUpperCase()}
                      </span>
                      {company?.name && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                          <Building2 size={13} />
                          {company.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center gap-2 py-4 px-5 font-semibold text-sm transition-all border-b-2
                    ${activeTab === 'personal'
                      ? 'border-[#2A5C8A] text-[#2A5C8A] bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <User size={16} />
                  Personal Profile
                </button>

                {canManageCompany && (
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`flex items-center gap-2 py-4 px-5 font-semibold text-sm transition-all border-b-2
                      ${activeTab === 'company'
                        ? 'border-[#2A5C8A] text-[#2A5C8A] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <Building2 size={16} />
                    Company Settings & Branding
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: PERSONAL PROFILE */}
            {activeTab === 'personal' && (
              <div className="bg-white shadow-lg rounded-2xl p-8 border border-[#E5E1DA]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Account Details</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#2A5C8A] bg-[#EBF5FF] hover:bg-[#D6E9FF] transition-all"
                    >
                      <Edit2 size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setFormData(userData)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#2A5C8A] hover:bg-[#1e4568] transition-all shadow-sm"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A] transition-all"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium text-lg">{userData?.first_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A] transition-all"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium text-lg">{userData?.last_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A] transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-800 font-medium text-lg">
                        <Mail size={18} className="text-[#89A8B2]" />
                        {userData?.email || '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Contact Number</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A] transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-800 font-medium text-lg">
                        <Phone size={18} className="text-[#89A8B2]" />
                        {userData?.contact_number || '-'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Section */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">Security & Password</h4>
                      <p className="text-sm text-slate-500">Manage your account password</p>
                    </div>
                    {!showPasswordSection && (
                      <button
                        onClick={() => setShowPasswordSection(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#2A5C8A] bg-[#EBF5FF] hover:bg-[#D6E9FF] transition-all"
                      >
                        <Lock size={16} />
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordSection && (
                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordInputChange}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordInputChange}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordInputChange}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordSection(false)
                            setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
                          }}
                          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="flex-1 py-2.5 bg-[#2A5C8A] hover:bg-[#1e4568] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                        >
                          {isChangingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: COMPANY SETTINGS & BRANDING */}
            {activeTab === 'company' && canManageCompany && (
              <form onSubmit={handleCompanySubmit} className="space-y-8">

                {/* Company Details Card */}
                <div className="bg-white shadow-lg rounded-2xl p-8 border border-[#E5E1DA]">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <Building2 className="w-6 h-6 text-[#2A5C8A]" />
                    <h3 className="text-xl font-bold text-slate-800">Company Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={companyForm.name}
                        onChange={handleCompanyInputChange}
                        required
                        placeholder="e.g. MBA Communications"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tagline / Slogan</label>
                      <input
                        type="text"
                        name="tagline"
                        value={companyForm.tagline}
                        onChange={handleCompanyInputChange}
                        placeholder="e.g. High-Speed Fiber Internet Provider"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
                      <input
                        type="text"
                        name="contact_number"
                        value={companyForm.contact_number}
                        onChange={handleCompanyInputChange}
                        placeholder="e.g. 0300-1234567"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
                      <input
                        type="email"
                        name="email"
                        value={companyForm.email}
                        onChange={handleCompanyInputChange}
                        placeholder="e.g. support@mbacomm.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website URL</label>
                      <input
                        type="url"
                        name="website"
                        value={companyForm.website}
                        onChange={handleCompanyInputChange}
                        placeholder="https://mbacomm.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax / NTN Registration Number</label>
                      <input
                        type="text"
                        name="tax_number"
                        value={companyForm.tax_number}
                        onChange={handleCompanyInputChange}
                        placeholder="e.g. NTN-1234567-8"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency Symbol</label>
                      <input
                        type="text"
                        name="currency_symbol"
                        value={companyForm.currency_symbol}
                        onChange={handleCompanyInputChange}
                        placeholder="e.g. Rs. or $"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Office Physical Address</label>
                      <textarea
                        name="address"
                        rows={2}
                        value={companyForm.address}
                        onChange={handleCompanyInputChange}
                        placeholder="Full office street address..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Invoice Custom Terms / Notes</label>
                      <textarea
                        name="invoice_footer_notes"
                        rows={3}
                        value={companyForm.invoice_footer_notes}
                        onChange={handleCompanyInputChange}
                        placeholder="Custom payment instructions or disclaimers printed at the bottom of customer invoices..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A5C8A]/20 focus:border-[#2A5C8A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Branding Assets Upload Card */}
                <div className="bg-white shadow-lg rounded-2xl p-8 border border-[#E5E1DA]">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <ImageIcon className="w-6 h-6 text-[#2A5C8A]" />
                    <h3 className="text-xl font-bold text-slate-800">Branding Assets (Logo & Favicon)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Upload Box */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-[#2A5C8A] transition-colors bg-slate-50/50 text-center">
                      <p className="font-bold text-slate-800 text-base mb-1">Company Logo</p>
                      <p className="text-slate-400 text-xs mb-4">Recommended: PNG or SVG, transparent background (300x80px)</p>

                      <div className="h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-3 mb-4 overflow-hidden shadow-inner">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-slate-300 text-sm font-medium">No Logo Uploaded</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-[#2A5C8A] bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Choose Logo Image
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Favicon Upload Box */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-[#2A5C8A] transition-colors bg-slate-50/50 text-center">
                      <p className="font-bold text-slate-800 text-base mb-1">Browser Favicon</p>
                      <p className="text-slate-400 text-xs mb-4">Recommended: Square PNG or ICO icon (64x64px)</p>

                      <div className="h-28 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-3 mb-4 shadow-inner">
                        {faviconPreview ? (
                          <img src={faviconPreview} alt="Favicon" className="w-10 h-10 object-contain rounded-md shadow-sm" />
                        ) : (
                          <span className="text-slate-300 text-sm font-medium">Default Favicon</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-[#2A5C8A] bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                      >
                        <Upload size={16} />
                        Choose Favicon Icon
                      </button>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                        onChange={handleFaviconFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Floating Action Button */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingCompany}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base
                      bg-gradient-to-r from-[#2A5C8A] to-[#89A8B2] hover:opacity-95 shadow-xl transition-all
                      disabled:opacity-50"
                  >
                    {isSavingCompany ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Company Settings...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Company Profile & Branding
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
