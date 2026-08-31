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
import {
  validatePortalComplaintDescription,
  validatePortalComplaintCategory,
  isAllowedComplaintAttachment,
  COMPLAINT_CATEGORIES,
  getComplaintCategoryLabel,
} from "../utils/customerPortalComplaint.ts"
import {
  CreditCard,
  FileText,
  AlertCircle,
  DollarSign,
  Package,
  Calendar,
  CheckCircle,
  ExternalLink,
  X,
  Image,
  Receipt,
  Building,
  Hash,
  Paperclip,
  Send,
  User,
  ChevronRight,
} from "lucide-react"
import { CustomerPortalProfileSection } from "../components/CustomerPortalProfileSection.tsx"
import { CustomerPortalShell } from "../components/customer-portal/CustomerPortalShell.tsx"
import { CustomerPortalAuthCard } from "../components/customer-portal/CustomerPortalAuthCard.tsx"
import { CustomerPortalComplaintDetailModal } from "../components/customer-portal/CustomerPortalComplaintDetailModal.tsx"
import { PortalStatStrip, type PortalStatItem } from "../components/employee-portal/shared/PortalStatStrip.tsx"
import { PortalStatusPill } from "../components/employee-portal/shared/PortalStatusPill.tsx"
import { CustomerPortalTabs } from "../components/customer-portal/CustomerPortalTabs.tsx"

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
    gps_coordinates?: string | null
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

type Payment = CustomerData["payments"][0]

const TAB_OPTIONS = [
  { value: "overview", label: "Overview", icon: User },
  { value: "invoices", label: "Invoices", icon: FileText },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "complaints", label: "Complaints", icon: AlertCircle },
]

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
  const [viewComplaintId, setViewComplaintId] = useState<string | null>(null)
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
    window.open(`/public/invoice/${invoiceId}`, "_blank")
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

  if (!data) {
    if (initializing) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-portal-primary" />
        </div>
      )
    }

    return (
      <CustomerPortalAuthCard
        mode={mustChangePassword ? "set-password" : "login"}
        cnic={cnic}
        password={password}
        showPassword={showPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showNewPassword={showNewPassword}
        loading={loading}
        error={error}
        onCnicChange={(v) => setCnic(formatCnic(v))}
        onPasswordChange={setPassword}
        onToggleShowPassword={() => setShowPassword((s) => !s)}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleShowNewPassword={() => setShowNewPassword((s) => !s)}
        onSubmit={mustChangePassword ? handleSetPassword : handleSubmit}
        onSignOut={mustChangePassword ? handleLogout : undefined}
      />
    )
  }

  const customer = data.customer

  const statItems: PortalStatItem[] = [
    {
      key: "due",
      label: "Total due",
      value: `PKR ${data.summary.total_due.toLocaleString()}`,
      icon: DollarSign,
      tone: data.summary.total_due > 0 ? "warning" : "default",
    },
    {
      key: "invoices",
      label: "Invoices",
      value: data.summary.invoice_count,
      icon: FileText,
      tone: "accent",
    },
    {
      key: "paid",
      label: "Total paid",
      value: `PKR ${data.summary.total_paid.toLocaleString()}`,
      icon: CreditCard,
      tone: "success",
    },
    {
      key: "complaints",
      label: "Open complaints",
      value: data.summary.open_complaints,
      icon: AlertCircle,
      tone: data.summary.open_complaints > 0 ? "danger" : "default",
    },
  ]

  return (
    <CustomerPortalShell
      customerName={customer.name}
      internetId={customer.internet_id}
      isActive={customer.is_active}
      onLodgeComplaint={openComplaintModal}
      onLogout={handleLogout}
    >
      <div className="space-y-4 pb-8">
        <PortalStatStrip items={statItems} columnsMobile={2} columnsDesktop={4} />

        <CustomerPortalTabs
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <div className="space-y-4">
            <CustomerPortalProfileSection
              customer={customer}
              onSaved={(payload) => applyProfileData(payload as CustomerData)}
            />

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-portal-tint px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
                  <Package className="h-4 w-4 text-portal-primary" />
                  Active packages
                </h3>
              </div>
              <div className="p-4">
                {data.packages.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-gray">No active packages</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.packages.map((pkg, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-electric-blue/15 bg-portal-tint/60 p-4"
                      >
                        <h4 className="text-sm font-semibold text-gray-900">{pkg.name}</h4>
                        <p className="mt-1 text-lg font-bold tabular-nums text-portal-primary">
                          PKR {pkg.price.toLocaleString()}
                          <span className="text-xs font-normal text-slate-gray">/mo</span>
                        </p>
                        {pkg.speed_mbps != null && (
                          <p className="mt-1 text-xs text-slate-gray">{pkg.speed_mbps} Mbps</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-portal-tint px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
                <FileText className="h-4 w-4 text-portal-primary" />
                Recent invoices
              </h3>
            </div>
            {data.invoices.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-gray">No invoices found</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {invoice.invoice_number}
                        </p>
                        <PortalStatusPill status={invoice.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-gray">
                        Due:{" "}
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                        {invoice.invoice_type && (
                          <span className="capitalize text-gray-400">
                            {" "}
                            ·{" "}
                            {(invoice.invoice_type === "mixed" && invoice.charge_types?.length
                              ? invoice.charge_types.join(" + ")
                              : invoice.invoice_type
                            ).replace(/_/g, " ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-gray-900">
                        PKR {invoice.total_amount.toLocaleString()}
                      </p>
                      {invoice.remaining > 0 && (
                        <p className="text-xs tabular-nums text-coral-red">
                          Due: PKR {invoice.remaining.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-portal-primary px-2.5 text-xs font-medium text-white hover:bg-portal-primary-dark"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-portal-tint px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
                <CreditCard className="h-4 w-4 text-portal-primary" />
                Recent payments
              </h3>
            </div>
            {data.payments.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-gray">No payments found</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.payments.map((payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => setSelectedPayment(payment)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold tabular-nums text-gray-900">
                          PKR {payment.amount.toLocaleString()}
                        </p>
                        <PortalStatusPill status={payment.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-gray">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString()
                          : "—"}
                        {payment.invoice_number && <span> · {payment.invoice_number}</span>}
                        <span className="capitalize"> · {payment.payment_method}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-portal-tint px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
                <AlertCircle className="h-4 w-4 text-portal-primary" />
                Complaint history
              </h3>
            </div>
            {data.complaints.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-gray">
                <p>No complaints found</p>
                <button
                  type="button"
                  onClick={openComplaintModal}
                  className="mt-2 text-sm font-medium text-electric-blue hover:underline"
                >
                  Lodge a complaint
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.complaints.map((complaint) => (
                  <button
                    key={complaint.id}
                    type="button"
                    onClick={() => setViewComplaintId(complaint.id)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-portal-tint/70"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900">
                          #{complaint.ticket_number}
                        </p>
                        <PortalStatusPill status={complaint.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-gray">
                        {complaint.category_label || getComplaintCategoryLabel(complaint.category)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-700">
                        {complaint.description}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Opened:{" "}
                        {complaint.created_at
                          ? new Date(complaint.created_at).toLocaleDateString()
                          : "—"}
                        {complaint.resolved_at &&
                          ` · Closed: ${new Date(complaint.resolved_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-gray" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 bg-portal-primary px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Lodge complaint</h3>
                <p className="text-[11px] text-white/80">
                  {customer.name} · {customer.internet_id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintModal(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLodgeComplaint} className="space-y-3 p-4">
              <p className="text-xs text-slate-gray">
                Your account is identified from your login. No customer ID needed.
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-gray">
                  Category <span className="text-coral-red">*</span>
                </label>
                <select
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40"
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
                <label className="mb-1 block text-xs font-medium text-slate-gray">
                  Describe the issue <span className="text-coral-red">*</span>
                </label>
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="What problem are you facing?"
                  className="min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40"
                  required
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  {complaintDescription.trim().length}/2000
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-gray">
                  Attachment <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 text-sm text-slate-gray hover:bg-gray-50">
                  <Paperclip className="h-4 w-4 text-gray-400" />
                  <span className="truncate">
                    {complaintFile ? complaintFile.name : "PDF or image"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setComplaintFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {complaintError && (
                <div className="flex items-start gap-2 rounded-lg bg-coral-red/5 px-3 py-2 text-sm text-coral-red">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{complaintError}</span>
                </div>
              )}
              {complaintSuccess && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-green/5 px-3 py-2 text-sm text-emerald-green">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{complaintSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-slate-gray hover:bg-gray-50"
                  disabled={complaintSubmitting}
                >
                  {complaintSuccess ? "Close" : "Cancel"}
                </button>
                {!complaintSuccess && (
                  <button
                    type="submit"
                    disabled={complaintSubmitting}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-portal-primary px-3 text-sm font-medium text-white hover:bg-portal-primary-dark disabled:opacity-50"
                  >
                    {complaintSubmitting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerPortalComplaintDetailModal
        complaintId={viewComplaintId}
        onClose={() => setViewComplaintId(null)}
      />

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 bg-portal-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-white" />
                <h3 className="text-sm font-semibold text-white">Payment details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="border-b border-gray-100 pb-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-gray-900">
                  PKR {selectedPayment.amount.toLocaleString()}
                </p>
                <div className="mt-2 flex justify-center">
                  <PortalStatusPill status={selectedPayment.status} />
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
                  <span className="flex items-center gap-1.5 text-slate-gray">
                    <Calendar className="h-3.5 w-3.5" /> Payment date
                  </span>
                  <span className="font-medium text-gray-900">
                    {selectedPayment.payment_date
                      ? new Date(selectedPayment.payment_date).toLocaleString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
                  <span className="flex items-center gap-1.5 text-slate-gray">
                    <CreditCard className="h-3.5 w-3.5" /> Method
                  </span>
                  <span className="font-medium capitalize text-gray-900">
                    {selectedPayment.payment_method}
                  </span>
                </div>
                {selectedPayment.invoice_number && (
                  <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-gray">
                      <Receipt className="h-3.5 w-3.5" /> Invoice
                    </span>
                    <span className="font-medium text-gray-900">
                      {selectedPayment.invoice_number}
                    </span>
                  </div>
                )}
                {selectedPayment.bank_account && (
                  <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-gray">
                      <Building className="h-3.5 w-3.5" /> Bank
                    </span>
                    <span className="font-medium text-gray-900">
                      {selectedPayment.bank_account}
                    </span>
                  </div>
                )}
                {selectedPayment.transaction_id && (
                  <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
                    <span className="flex items-center gap-1.5 text-slate-gray">
                      <Hash className="h-3.5 w-3.5" /> Transaction ID
                    </span>
                    <span className="font-mono text-xs font-medium text-gray-900">
                      {selectedPayment.transaction_id}
                    </span>
                  </div>
                )}
                {selectedPayment.failure_reason && (
                  <div className="rounded-lg border border-coral-red/20 bg-coral-red/5 p-3">
                    <p className="text-xs font-medium text-coral-red">Failure reason</p>
                    <p className="mt-0.5 text-sm text-coral-red">{selectedPayment.failure_reason}</p>
                  </div>
                )}
              </div>

              {selectedPayment.payment_proof && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-gray">
                    <Image className="h-3.5 w-3.5 text-portal-primary" />
                    Payment proof
                  </p>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={selectedPayment.payment_proof}
                      alt="Payment proof"
                      className="max-h-56 w-full bg-gray-50 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        target.parentElement!.innerHTML =
                          '<p class="p-4 text-center text-sm text-slate-gray">Unable to load image</p>'
                      }}
                    />
                  </div>
                  <a
                    href={selectedPayment.payment_proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-electric-blue hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in new tab
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="h-9 w-full rounded-lg bg-portal-primary text-sm font-medium text-white hover:bg-portal-primary-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerPortalShell>
  )
}
