"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import customerPortalAxios from "../utils/customerPortalAxios.ts"
import {
  getCustomerPortalToken,
  setCustomerPortalToken,
  removeCustomerPortalToken,
  getCustomerPortalMustChangePassword,
  setCustomerPortalPendingPassword,
  getCustomerPortalPendingPassword,
  clearCustomerPortalPendingPassword,
} from "../utils/customerPortalAuth.ts"
import { DomainLoginLogo } from "../components/DomainLoginLogo.tsx"
import {
  validatePortalComplaintDescription,
  validatePortalComplaintCategory,
  isAllowedComplaintAttachment,
  COMPLAINT_CATEGORIES,
  getComplaintCategoryLabel,
} from "../utils/customerPortalComplaint.ts"
import {
  User,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  Wifi,
  Calendar,
  AlertCircle,
  DollarSign,
  Package,
  Shield,
  Globe,
  IdCard,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  X,
  Image,
  Receipt,
  Building,
  Hash,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Plus,
  Paperclip,
  Send,
} from "lucide-react"

interface CustomerData {
  customer: {
    id: string
    name: string
    email: string
    internet_id: string
    phone_1: string
    phone_2: string | null
    cnic: string
    installation_address: string
    area: string | null
    sub_zone: string | null
    isp: string | null
    connection_type: string | null
    installation_date: string | null
    is_active: boolean
    recharge_date: string | null
  }
  packages: Array<{
    name: string
    price: number
    speed_mbps: number | null
    start_date: string | null
  }>
  invoices: Array<{
    id: string
    invoice_number: string
    billing_start_date: string | null
    billing_end_date: string | null
    due_date: string | null
    total_amount: number
    status: string
    paid_amount: number
    remaining: number
    invoice_type?: string | null
    charge_types?: string[]
  }>
  payments: Array<{
    id: string
    amount: number
    payment_date: string | null
    payment_method: string
    status: string
    invoice_id: string | null
    invoice_number: string | null
    transaction_id: string | null
    payment_proof: string | null
    failure_reason: string | null
    bank_account: string | null
    created_at: string | null
  }>
  complaints: Array<{
    id: string
    ticket_number: string
    description: string
    category?: string
    category_label?: string
    status: string
    created_at: string | null
    resolved_at: string | null
  }>
  summary: {
    total_due: number
    total_paid: number
    invoice_count: number
    payment_count: number
    open_complaints: number
  }
}

type Payment = CustomerData['payments'][0]

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  overdue: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
  draft: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock },
  verified: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  open: { bg: "bg-red-50", text: "text-red-700", icon: AlertCircle },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", icon: Clock },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  closed: { bg: "bg-gray-100", text: "text-gray-600", icon: CheckCircle },
  failed: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
}

export default function CustomerPortalPage() {
  const [cnic, setCnic] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CustomerData | null>(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintDescription, setComplaintDescription] = useState("")
  const [complaintCategory, setComplaintCategory] = useState("")
  const [complaintFile, setComplaintFile] = useState<File | null>(null)
  const [complaintSubmitting, setComplaintSubmitting] = useState(false)
  const [complaintError, setComplaintError] = useState<string | null>(null)
  const [complaintSuccess, setComplaintSuccess] = useState<string | null>(null)

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 13)
  }

  const applyProfileData = (payload: CustomerData) => {
    setData(payload)
    setMustChangePassword(false)
  }

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await customerPortalAxios.get("/public/customer/profile")
      applyProfileData(response.data)
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.must_change_password) {
        setMustChangePassword(true)
        setData(null)
      } else {
        removeCustomerPortalToken()
        setError(err.response?.data?.error || "Session expired. Please sign in again.")
        setData(null)
      }
    } finally {
      setLoading(false)
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    const token = getCustomerPortalToken()
    if (!token) {
      setInitializing(false)
      return
    }
    if (getCustomerPortalMustChangePassword()) {
      setMustChangePassword(true)
      setInitializing(false)
      return
    }
    fetchProfile()
  }, [fetchProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (cnic.length !== 13) {
      setError("CNIC must be exactly 13 digits")
      return
    }
    if (!password) {
      setError("Password is required")
      return
    }

    setLoading(true)
    try {
      const response = await customerPortalAxios.post("/public/customer/login", { cnic, password })
      setCustomerPortalToken(response.data.token)

      if (response.data.must_change_password) {
        setCustomerPortalPendingPassword(password)
        setMustChangePassword(true)
        setData(null)
      } else {
        await fetchProfile()
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.response?.data?.error || "Failed to sign in. Please try again.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const currentPassword = password || getCustomerPortalPendingPassword() || ""
      const response = await customerPortalAxios.post("/public/customer/set-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setCustomerPortalToken(response.data.token)
      clearCustomerPortalPendingPassword()
      const { token: _token, message: _message, must_change_password: _flag, ...profile } = response.data
      applyProfileData(profile as CustomerData)
      setPassword(newPassword)
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update password.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeCustomerPortalToken()
    setData(null)
    setCnic("")
    setPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setMustChangePassword(false)
    setActiveTab("overview")
  }

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/public/invoice/${invoiceId}`, '_blank')
  }

  const openComplaintModal = () => {
    setComplaintDescription("")
    setComplaintCategory("")
    setComplaintFile(null)
    setComplaintError(null)
    setComplaintSuccess(null)
    setShowComplaintModal(true)
  }

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    setComplaintError(null)
    setComplaintSuccess(null)

    const categoryError = validatePortalComplaintCategory(complaintCategory)
    if (categoryError) {
      setComplaintError(categoryError)
      return
    }
    const description = complaintDescription.trim()
    const validationError = validatePortalComplaintDescription(description)
    if (validationError) {
      setComplaintError(validationError)
      return
    }
    if (complaintFile && !isAllowedComplaintAttachment(complaintFile.name)) {
      setComplaintError("Attachment must be pdf, png, jpg, jpeg, or gif")
      return
    }

    setComplaintSubmitting(true)
    try {
      let response
      if (complaintFile) {
        const formData = new FormData()
        formData.append("description", description)
        formData.append("category", complaintCategory)
        formData.append("attachment", complaintFile)
        response = await customerPortalAxios.post("/public/customer/complaints", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      } else {
        response = await customerPortalAxios.post("/public/customer/complaints", {
          description,
          category: complaintCategory,
        })
      }

      const ticket = response.data?.complaint?.ticket_number
      setComplaintSuccess(ticket ? `Complaint lodged. Ticket #${ticket}` : "Complaint lodged successfully.")
      setComplaintDescription("")
      setComplaintCategory("")
      setComplaintFile(null)
      await fetchProfile()
      setActiveTab("complaints")
    } catch (err: any) {
      setComplaintError(err.response?.data?.error || "Failed to lodge complaint. Please try again.")
    } finally {
      setComplaintSubmitting(false)
    }
  }

  // Auth screens (login or forced password change)
  if (!data) {
    if (initializing) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F0E8' }}>
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )
    }

    const isChangePassword = mustChangePassword

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F0E8' }}>
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-center" style={{ backgroundColor: '#89A8B2' }}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                {isChangePassword ? <Lock className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
              </div>
              <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
              <p className="text-white/80 text-sm mt-1">
                {isChangePassword ? "Set a new password to continue" : "Sign in to view your account"}
              </p>
            </div>

            <div className="p-8">
              <form onSubmit={isChangePassword ? handleSetPassword : handleSubmit} className="space-y-5">
                {!isChangePassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNIC Number</label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={cnic}
                        onChange={(e) => setCnic(formatCnic(e.target.value))}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': '#89A8B2' } as React.CSSProperties}
                        placeholder="0000000000000"
                        maxLength={13}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">{cnic.length}/13 digits</p>
                  </div>
                )}

                {!isChangePassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': '#89A8B2' } as React.CSSProperties}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {isChangePassword && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ '--tw-ring-color': '#89A8B2' } as React.CSSProperties}
                          placeholder="At least 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ '--tw-ring-color': '#89A8B2' } as React.CSSProperties}
                          placeholder="Re-enter new password"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Use at least 8 characters.</p>
                    </div>
                  </>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!isChangePassword && cnic.length !== 13)}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: '#89A8B2' }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isChangePassword ? "Saving..." : "Signing In..."}
                    </>
                  ) : (
                    <>
                      {isChangePassword ? <Lock className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                      {isChangePassword ? "Save Password" : "Sign In"}
                    </>
                  )}
                </button>

                {isChangePassword && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sign out
                  </button>
                )}
              </form>

              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#E5E1DA' }}>
                <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#89A8B2' }} />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Secure Access</p>
                  <p>
                    {isChangePassword
                      ? "Choose a personal password. You will use it with your CNIC to sign in."
                      : "CNIC and password are required. Change your password on first login."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <div className="mx-auto max-w-xs opacity-70">
              <DomainLoginLogo connectxClassName="mx-auto max-h-16 w-auto max-w-full object-contain" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Customer Profile Screen
  const customer = data.customer
  const tabs = [
    { id: "overview", name: "Overview", icon: User },
    { id: "invoices", name: "Invoices", icon: FileText },
    { id: "payments", name: "Payments", icon: CreditCard },
    { id: "complaints", name: "Complaints", icon: AlertCircle },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F0E8' }}>
      {/* White Top Navbar with Logo */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-40 flex items-center">
              <DomainLoginLogo
                className="w-full"
                connectxClassName="h-8 w-auto max-w-full object-contain"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium">Customer Portal</span>
          </div>
        </div>
      </nav>

      {/* Customer Info Bar */}
      <div className="text-white shadow-sm" style={{ backgroundColor: '#89A8B2' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{customer.name}</h1>
              <p className="text-sm text-white/80">{customer.internet_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <button
              type="button"
              onClick={openComplaintModal}
              className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium rounded-lg bg-white text-[#89A8B2] hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Lodge Complaint
            </button>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${customer.is_active ? "bg-emerald-400/20 text-white" : "bg-red-400/20 text-white"}`}>
              {customer.is_active ? "● Active" : "● Inactive"}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Due</p>
                <p className={`text-2xl font-bold ${data.summary.total_due > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  PKR {data.summary.total_due.toLocaleString()}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${data.summary.total_due > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                <DollarSign className={`w-5 h-5 ${data.summary.total_due > 0 ? "text-red-500" : "text-emerald-500"}`} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.invoice_count}</p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#E5E1DA' }}>
                <FileText className="w-5 h-5" style={{ color: '#89A8B2' }} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">PKR {data.summary.total_paid.toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Open Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.open_complaints}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${data.summary.open_complaints > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <AlertCircle className={`w-5 h-5 ${data.summary.open_complaints > 0 ? "text-amber-500" : "text-gray-400"}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: '#89A8B2' } : {}}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: '#89A8B2' }} />
                    Personal Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Internet ID
                    </span>
                    <span className="font-semibold" style={{ color: '#89A8B2' }}>{customer.internet_id}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </span>
                    <span className="font-medium text-gray-900">{customer.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </span>
                    <span className="font-medium text-gray-900">{customer.phone_1}</span>
                  </div>
                  {customer.phone_2 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone 2
                      </span>
                      <span className="font-medium text-gray-900">{customer.phone_2}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      CNIC
                    </span>
                    <span className="font-medium font-mono text-gray-900">{customer.cnic}</span>
                  </div>
                </div>
              </div>

              {/* Connection Info */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wifi className="w-4 h-4" style={{ color: '#89A8B2' }} />
                    Connection Details
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4" />
                      Address
                    </span>
                    <p className="font-medium text-gray-900">{customer.installation_address}</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Area</span>
                    <span className="font-medium text-gray-900">{customer.area}{customer.sub_zone ? ` / ${customer.sub_zone}` : ""}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">ISP</span>
                    <span className="font-medium text-gray-900">{customer.isp || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Connection Type</span>
                    <span className="font-medium text-gray-900 capitalize">{customer.connection_type || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Installation Date
                    </span>
                    <span className="font-medium text-gray-900">{customer.installation_date ? new Date(customer.installation_date).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>

              {/* Active Packages */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" style={{ color: '#89A8B2' }} />
                    Active Packages
                  </h3>
                </div>
                <div className="p-6">
                  {data.packages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No active packages</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.packages.map((pkg, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-xl border"
                          style={{ backgroundColor: '#E5E1DA30', borderColor: '#B3C8CF50' }}
                        >
                          <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                          <p className="text-2xl font-bold mt-2" style={{ color: '#89A8B2' }}>
                            PKR {pkg.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500">/mo</span>
                          </p>
                          {pkg.speed_mbps && <p className="text-sm text-gray-600 mt-1">{pkg.speed_mbps} Mbps</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: '#89A8B2' }} />
                  Recent Invoices
                </h3>
              </div>
              {data.invoices.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No invoices found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.invoices.map((invoice) => {
                    const status = statusConfig[invoice.status] || statusConfig.pending
                    const StatusIcon = status.icon
                    return (
                      <div key={invoice.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.bg}`}>
                              <StatusIcon className={`w-4 h-4 ${status.text}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                              <p className="text-sm text-gray-500">
                                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                                {invoice.invoice_type && (
                                  <span className="ml-2 capitalize text-gray-400">
                                    · {(invoice.invoice_type === "mixed" && invoice.charge_types?.length
                                      ? invoice.charge_types.join(" + ")
                                      : invoice.invoice_type
                                    ).replace(/_/g, " ")}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">PKR {invoice.total_amount.toLocaleString()}</p>
                              {invoice.remaining > 0 && (
                                <p className="text-sm text-red-600">Due: PKR {invoice.remaining.toLocaleString()}</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                              {invoice.status}
                            </span>
                            <button
                              onClick={() => handleViewInvoice(invoice.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:opacity-80"
                              style={{ backgroundColor: '#89A8B2', color: 'white' }}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: '#89A8B2' }} />
                  Recent Payments
                </h3>
              </div>
              {data.payments.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No payments found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.payments.map((payment) => {
                    const status = statusConfig[payment.status] || statusConfig.pending
                    const StatusIcon = status.icon
                    return (
                      <div 
                        key={payment.id} 
                        className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.bg}`}>
                              <StatusIcon className={`w-4 h-4 ${status.text}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">PKR {payment.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "—"}
                                {payment.invoice_number && <span> • {payment.invoice_number}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 capitalize bg-gray-100 px-3 py-1 rounded-lg">{payment.payment_method}</span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.text}`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "complaints" && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ backgroundColor: '#B3C8CF20' }}>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" style={{ color: '#89A8B2' }} />
                  Complaint History
                </h3>
                <button
                  type="button"
                  onClick={openComplaintModal}
                  className="h-9 inline-flex items-center justify-center gap-1.5 px-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#89A8B2' }}
                >
                  <Plus className="w-4 h-4" />
                  Lodge Complaint
                </button>
              </div>
              {data.complaints.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <p className="mb-4">No complaints found</p>
                  <button
                    type="button"
                    onClick={openComplaintModal}
                    className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-white rounded-lg"
                    style={{ backgroundColor: '#89A8B2' }}
                  >
                    <Plus className="w-4 h-4" />
                    Lodge your first complaint
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.complaints.map((complaint) => {
                    const status = statusConfig[complaint.status] || statusConfig.pending
                    const StatusIcon = status.icon
                    return (
                      <div key={complaint.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg ${status.bg} h-fit`}>
                              <StatusIcon className={`w-4 h-4 ${status.text}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">#{complaint.ticket_number}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {complaint.category_label || getComplaintCategoryLabel(complaint.category)}
                              </p>
                              <p className="text-sm text-gray-700 mt-1 max-w-md">{complaint.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Opened: {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : "—"}
                                {complaint.resolved_at && ` • Closed: ${new Date(complaint.resolved_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${status.bg} ${status.text}`}>
                            {complaint.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lodge Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100" style={{ backgroundColor: '#89A8B2' }}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Lodge Complaint</h3>
                  <p className="text-xs text-white/80">{customer.name} · {customer.internet_id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleLodgeComplaint} className="p-5 space-y-4">
              <p className="text-xs text-gray-500">
                Your account is already identified from your login. You do not need to enter a customer ID.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent bg-white"
                  required
                >
                  <option value="">Select a category</option>
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Describe the issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="What problem are you facing? Include any useful details."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent resize-y min-h-[120px]"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">{complaintDescription.trim().length}/2000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Attachment <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <label className="flex items-center gap-2 h-10 px-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-600">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{complaintFile ? complaintFile.name : "PDF or image"}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setComplaintFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {complaintError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{complaintError}</span>
                </div>
              )}
              {complaintSuccess && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{complaintSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="h-9 px-3 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  disabled={complaintSubmitting}
                >
                  {complaintSuccess ? "Close" : "Cancel"}
                </button>
                {!complaintSuccess && (
                  <button
                    type="submit"
                    disabled={complaintSubmitting}
                    className="h-9 px-3 text-sm rounded-lg text-white inline-flex items-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: '#89A8B2' }}
                  >
                    {complaintSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100" style={{ backgroundColor: '#89A8B2' }}>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Payment Details</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Amount & Status */}
              <div className="text-center pb-4 border-b border-gray-100">
                <p className="text-3xl font-bold text-gray-900">PKR {selectedPayment.amount.toLocaleString()}</p>
                <div className="mt-2">
                  {(() => {
                    const status = statusConfig[selectedPayment.status] || statusConfig.pending
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${status.bg} ${status.text}`}>
                        <status.icon className="w-4 h-4" />
                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Payment Date
                  </span>
                  <span className="font-medium text-gray-900">
                    {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleString() : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Method
                  </span>
                  <span className="font-medium text-gray-900 capitalize">{selectedPayment.payment_method}</span>
                </div>

                {selectedPayment.invoice_number && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Invoice
                    </span>
                    <span className="font-medium text-gray-900">{selectedPayment.invoice_number}</span>
                  </div>
                )}

                {selectedPayment.bank_account && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Bank
                    </span>
                    <span className="font-medium text-gray-900">{selectedPayment.bank_account}</span>
                  </div>
                )}

                {selectedPayment.transaction_id && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Transaction ID
                    </span>
                    <span className="font-medium font-mono text-sm text-gray-900">{selectedPayment.transaction_id}</span>
                  </div>
                )}

                {selectedPayment.failure_reason && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm font-medium text-red-700 mb-1">Failure Reason</p>
                    <p className="text-sm text-red-600">{selectedPayment.failure_reason}</p>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              {selectedPayment.payment_proof && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4" style={{ color: '#89A8B2' }} />
                    Payment Proof
                  </p>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={selectedPayment.payment_proof} 
                      alt="Payment Proof" 
                      className="w-full max-h-64 object-contain bg-gray-50"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<p class="p-4 text-center text-gray-500 text-sm">Unable to load image</p>'
                      }}
                    />
                  </div>
                  <a
                    href={selectedPayment.payment_proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition-colors"
                    style={{ color: '#89A8B2' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full py-2.5 font-medium rounded-xl transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: '#89A8B2' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
