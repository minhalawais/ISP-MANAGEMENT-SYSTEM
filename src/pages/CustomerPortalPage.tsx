"use client"

import type React from "react"
import { useState } from "react"
import axiosInstance from "../utils/axiosConfig.ts"
import MBALogo from "../assets/mba_logo.tsx"
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
  Search,
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CustomerData | null>(null)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const formatCnic = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 13)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (cnic.length !== 13) {
      setError("CNIC must be exactly 13 digits")
      return
    }

    setLoading(true)
    try {
      const response = await axiosInstance.post("/public/customer/lookup", { cnic })
      setData(response.data)
    } catch (err: any) {
      console.error("Lookup error:", err)
      setError(err.response?.data?.error || "Failed to look up customer. Please try again.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setData(null)
    setCnic("")
    setActiveTab("overview")
  }

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/public/invoice/${invoiceId}`, '_blank')
  }

  // Lookup Form Screen
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F0E8' }}>
        <div className="max-w-md w-full mx-4">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 text-center" style={{ backgroundColor: '#89A8B2' }}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
              <p className="text-white/80 text-sm mt-1">View your account details</p>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNIC Number
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={cnic}
                      onChange={(e) => setCnic(formatCnic(e.target.value))}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': '#89A8B2' } as React.CSSProperties}
                      placeholder="0000000000000"
                      maxLength={13}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">{cnic.length}/13 digits</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cnic.length !== 13}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: '#89A8B2' }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Looking Up...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      View My Account
                    </>
                  )}
                </button>
              </form>

              {/* Security Note */}
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#E5E1DA' }}>
                <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#89A8B2' }} />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Secure Access</p>
                  <p>Your CNIC is used only for verification purposes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <div className="inline-block scale-75 opacity-60">
              <MBALogo variant="landscape" />
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
          <div className="scale-75 origin-left">
            <MBALogo variant="landscape" />
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
          <div className="flex items-center gap-3">
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
              <div className="px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#B3C8CF20' }}>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" style={{ color: '#89A8B2' }} />
                  Complaint History
                </h3>
              </div>
              {data.complaints.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No complaints found</div>
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
