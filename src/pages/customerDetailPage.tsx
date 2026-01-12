"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { getToken } from "../utils/auth.ts"
import {
  User,
  AlertCircle,
  PhoneCall,
  Clock,
  TrendingUp,
  CreditCard,
  ImageIcon,
  Box,
  PenTool as Tool,
  Router,
  Cable,
  Disc,
  Tv,
  FileText,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Eye,
  Package,
  ClipboardList,
  Wrench,
  Wifi,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building,
  Shield,
  Download,
  Activity
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import { KPICard } from "../components/customer-detail/kpi-card.tsx"
import { StatusBadge } from "../components/customer-detail/status-badge.tsx"
import { BillingSummary } from "../components/customer-detail/billing-summary.tsx"
import { DataTable } from "../components/customer-detail/data-table.tsx"
import { InvoiceDetailModal, PaymentDetailModal, ComplaintDetailModal, TaskDetailModal } from "../components/customer-detail/modals/index.ts"

interface CustomerPackage {
  id: string
  service_plan_id: string
  service_plan_name: string
  price: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  notes: string | null
}

interface CustomerDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  internet_id: string
  phone_1: string
  phone_2: string | null
  area: string
  service_plan: string
  servicePlanPrice: number
  packages: CustomerPackage[]
  isp: string
  installation_address: string
  installation_date: string
  connection_type: string
  internet_connection_type: string | null
  wire_length: number | null
  wire_ownership: string | null
  router_ownership: string | null
  router_id: string | null
  router_serial_number: string | null
  patch_cord_ownership: string | null
  patch_cord_count: number | null
  patch_cord_ethernet_ownership: string | null
  patch_cord_ethernet_count: number | null
  splicing_box_ownership: string | null
  splicing_box_serial_number: string | null
  ethernet_cable_ownership: string | null
  ethernet_cable_length: number | null
  dish_ownership: string | null
  dish_id: string | null
  dish_mac_address: string | null
  tv_cable_connection_type: string | null
  node_count: number | null
  stb_serial_number: string | null
  discount_amount: number | null
  recharge_date: string | null
  miscellaneous_details: string | null
  miscellaneous_charges: number | null
  is_active: boolean
  cnic: string
  cnic_front_image: string
  cnic_back_image: string
  gps_coordinates: string | null
  agreement_document: string | null
  financialMetrics: {
    totalAmountPaid: number
    averageMonthlyPayment: number
    paymentReliabilityScore: number
    outstandingBalance: number
    averageBillAmount: number
    mostUsedPaymentMethod: string
    latePaymentFrequency: number
  }
  serviceStatistics: {
    serviceDuration: number
    servicePlanHistory: string[]
    upgradeDowngradeFrequency: number
    areaCoverageStatistics: { [key: string]: number }
  }
  supportAnalysis: {
    totalComplaints: number
    averageResolutionTime: number
    complaintCategoriesDistribution: { [key: string]: number }
    satisfactionRatingAverage: number
    resolutionAttemptsAverage: number
    supportResponseTime: number
    mostCommonComplaintTypes: string[]
  }
  billingPatterns: {
    paymentTimeline: { date: string; amount: number }[]
    invoicePaymentHistory: { invoiceId: string; daysToPay: number }[]
    discountUsage: number
    lateFeeOccurrences: number
    paymentMethodPreferences: { [key: string]: number }
  }
  recoveryMetrics: {
    recoveryTasksHistory: { date: string; status: string }[]
    recoverySuccessRate: number
    paymentAfterRecoveryRate: number
    averageRecoveryTime: number
  }
}

interface Invoice {
  id: string
  invoice_number: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  total_amount: number
  status: string
  invoice_type?: string
  discount_percentage?: number
  subtotal?: number
  notes?: string
}

interface Payment {
  id: string
  invoice_id: string
  invoice_number?: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  bank_account_id?: string
  transaction_id?: string
  bank_account?: {
    id: string
    bank_name: string
    account_title: string
    account_number: string
    iban: string
    branch_code: string
  }
  failure_reason?: string
  payment_proof?: string
}

interface Complaint {
  id: string
  ticket_number: string
  description: string
  status: string
  created_at: string
  updated_at: string | null
  resolved_at: string | null
  response_due_date: string | null
  assigned_user: {
    id: string
    name: string
    contact_number: string | null
  } | null
  satisfaction_rating: number | null
  resolution_attempts: number
  attachment_path: string | null
  resolution_proof: string | null
  remarks: string | null
  feedback_comments: string | null
}

interface Task {
  id: string
  task_type: string
  priority: string
  status: string
  due_date: string | null
  assignees: any[]
  notes: string | null
  completion_notes: string | null
  completion_proof: string | null
  created_at: string | null
  completed_at: string | null
}

interface InventoryItem {
  id: string
  item_type: string
  unit_price: number
  status: string
  vendor: string | null
  assigned_at: string
}

const sections = [
  { id: "overview", name: "Overview", icon: User },
  { id: "financial", name: "Billing & Finance", icon: DollarSign },
  { id: "support", name: "Support & Tasks", icon: Wrench },
  { id: "equipment", name: "Equipment", icon: Tool },
  { id: "documents", name: "Documents", icon: FileText },
]

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  
  const [activeTab, setActiveTab] = useState("overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [cnicImageUrls, setCnicImageUrls] = useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  })
  const [loading, setLoading] = useState(true)
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null)

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    document.title = "MBA NET - Customer Profile"
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        const token = getToken()
        const [customerRes, invoicesRes, paymentsRes, complaintsRes, tasksRes, inventoryRes] = await Promise.all([
          axiosInstance.get(`/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/invoices/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/payments/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/complaints/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/tasks/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/inventory/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        setCustomer(customerRes.data)
        setInvoices(invoicesRes.data)
        setPayments(paymentsRes.data)
        setComplaints(complaintsRes.data)
        setTasks(tasksRes.data)
        setInventory(inventoryRes.data)
      } catch (error) {
        console.error("Failed to fetch customer data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [id])

  useEffect(() => {
    const fetchCnicImage = async () => {
      if (customer && customer.cnic_front_image && customer.cnic_back_image) {
        try {
          const token = getToken()
          const [responseFront, responseBack] = await Promise.all([
            axiosInstance.get(`/customers/cnic-front-image/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob",
            }),
            axiosInstance.get(`/customers/cnic-back-image/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
              responseType: "blob",
            }),
          ])
          const imageUrlFront = URL.createObjectURL(responseFront.data)
          const imageUrlBack = URL.createObjectURL(responseBack.data)
          setCnicImageUrls({ front: imageUrlFront, back: imageUrlBack })
        } catch (error) {
          console.error("Failed to fetch CNIC images", error)
        }
      }
    }

    fetchCnicImage()
    return () => {
      if (cnicImageUrls.front) URL.revokeObjectURL(cnicImageUrls.front)
      if (cnicImageUrls.back) URL.revokeObjectURL(cnicImageUrls.back)
    }
  }, [customer, id])

  const handleViewInvoice = async (invoiceId: string) => {
    setLoadingViewId(invoiceId)
    try {
      const token = getToken()
      await axiosInstance.get(`/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      window.open(`/invoices/${invoiceId}`, "_blank")
    } catch (error) {
      console.error("Failed to view invoice", error)
    } finally {
      setLoadingViewId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F0E8]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#89A8B2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5a7a84] font-medium">Loading customer profile...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F0E8]">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-[#E5E1DA]">
          <AlertCircle className="w-16 h-16 text-[#89A8B2] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#2A5C8A] mb-2">Customer Not Found</h2>
          <p className="text-[#5a7a84]">The requested customer profile could not be loaded.</p>
        </div>
      </div>
    )
  }

  // ============================================
  // ENHANCED OVERVIEW TAB
  // ============================================
  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#B3C8CF] rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium bg-[#E5E1DA] text-[#5a7a84] px-2 py-1 rounded-full">Lifetime</span>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">PKR {customer.financialMetrics.totalAmountPaid.toLocaleString()}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Total Paid</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#89A8B2] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium bg-[#E5E1DA] text-[#5a7a84] px-2 py-1 rounded-full">Score</span>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">{customer.financialMetrics.paymentReliabilityScore.toFixed(0)}%</p>
          <p className="text-[#89A8B2] text-sm mt-1">Payment Reliability</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium bg-[#E5E1DA] text-[#5a7a84] px-2 py-1 rounded-full">Due</span>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">PKR {customer.financialMetrics.outstandingBalance.toLocaleString()}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Outstanding</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#89A8B2] rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium bg-[#E5E1DA] text-[#5a7a84] px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">{customer.serviceStatistics.serviceDuration}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Days as Customer</p>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E5E1DA] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E1DA] bg-[#F1F0E8]">
            <h3 className="text-lg font-semibold text-[#2A5C8A] flex items-center gap-2">
              <User className="w-5 h-5 text-[#89A8B2]" />
              Personal Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="text-slate-800 font-semibold text-lg">{`${customer.first_name} ${customer.last_name}`}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Internet ID</p>
                <p className="text-slate-800 font-mono font-semibold text-lg bg-slate-50 px-3 py-1 rounded-lg inline-block">{customer.internet_id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                <p className="text-slate-700">{customer.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                <p className="text-slate-700">{customer.phone_1}</p>
                {customer.phone_2 && <p className="text-slate-500 text-sm">{customer.phone_2}</p>}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Area</p>
                <p className="text-slate-700">{customer.area}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><Shield className="w-3 h-3" /> CNIC</p>
                <p className="text-slate-700 font-mono">{customer.cnic}</p>
              </div>
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><Building className="w-3 h-3" /> Installation Address</p>
                <p className="text-slate-700">{customer.installation_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E1DA] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E1DA] bg-[#F1F0E8]">
            <h3 className="text-lg font-semibold text-[#2A5C8A] flex items-center gap-2">
              <Wifi className="w-5 h-5 text-[#89A8B2]" />
              Service Details
            </h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">ISP Provider</p>
              <p className="text-slate-800 font-semibold">{customer.isp}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Installation Date</p>
              <p className="text-slate-700">{new Date(customer.installation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Packages</p>
              <div className="space-y-2">
                {customer.packages && customer.packages.length > 0 ? (
                  customer.packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-700 font-medium text-sm">{pkg.service_plan_name}</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-sm">PKR {pkg.price.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">No packages assigned</p>
                )}
              </div>
              {customer.servicePlanPrice > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm text-slate-500">Monthly Total</span>
                  <span className="text-lg font-bold text-emerald-600">PKR {customer.servicePlanPrice.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ============================================
  // ENHANCED FINANCIAL TAB
  // ============================================
  const renderFinancialTab = () => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)
    const outstanding = totalInvoiced - totalPaid

    return (
      <div className="space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#B3C8CF] rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2A5C8A]">PKR {totalInvoiced.toLocaleString()}</p>
            <p className="text-[#89A8B2] text-sm mt-1">Total Invoiced</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2A5C8A]">PKR {totalPaid.toLocaleString()}</p>
            <p className="text-[#89A8B2] text-sm mt-1">Total Paid</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2A5C8A]">PKR {outstanding.toLocaleString()}</p>
            <p className="text-[#89A8B2] text-sm mt-1">Outstanding</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#89A8B2] rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#2A5C8A]">{customer.financialMetrics.paymentReliabilityScore.toFixed(0)}%</p>
            <p className="text-[#89A8B2] text-sm mt-1">Reliability Score</p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#89A8B2]" />
              Invoice History
            </h3>
            <span className="text-sm text-slate-500">{invoices.length} invoices</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-slate-800">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(invoice.billing_start_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">PKR {invoice.total_amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2A5C8A] hover:bg-[#1e4568] text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#89A8B2]" />
              Payment History
            </h3>
            <span className="text-sm text-slate-500">{payments.length} payments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap" style={{width: "120px", maxWidth: "120px"}}>Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedPayment(payment)}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-emerald-600">PKR {payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full capitalize">{payment.payment_method}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedPayment(payment); }}
                        className="inline-flex items-center gap-1.5 text-[#2A5C8A] hover:text-[#1e4568] text-sm font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderBillingTab = () => renderFinancialTab()

  // ============================================
  // ENHANCED SUPPORT TAB
  // ============================================
  const renderSupportTab = () => (
    <div className="space-y-6">
      {/* Support Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">{customer.supportAnalysis.totalComplaints}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Total Complaints</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">{complaints.filter(c => c.status === 'resolved').length}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Resolved</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E1DA]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#89A8B2] rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#2A5C8A]">{tasks.filter(t => t.status !== 'completed').length}</p>
          <p className="text-[#89A8B2] text-sm mt-1">Pending Tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#89A8B2]" />
              Support Tickets
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {complaints.length > 0 ? complaints.map((complaint) => (
              <div 
                key={complaint.id} 
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-semibold text-slate-800">#{complaint.ticket_number}</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{complaint.description}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(complaint.created_at).toLocaleDateString()}</p>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                <p>No support tickets</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#89A8B2]" />
              Technical Tasks
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {tasks.length > 0 ? tasks.map((task) => (
              <div 
                key={task.id} 
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-slate-800 capitalize">{task.task_type.replace('_', ' ')}</span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'critical' ? 'bg-red-200 text-red-800' :
                      'bg-blue-100 text-blue-700'
                    }`}>{task.priority}</span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                <p>No tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // ============================================
  // ENHANCED EQUIPMENT TAB
  // ============================================
  const renderEquipmentTab = () => (
    <div className="space-y-6">
      {/* Inventory Table */}
      {inventory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Box className="w-5 h-5 text-[#89A8B2]" />
              Assigned Inventory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-800">{item.item_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.vendor || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status === 'assigned' ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(item.assigned_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment Details Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Tool className="w-5 h-5 text-[#89A8B2]" />
            Equipment Details
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Router */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Router className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Router</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Ownership</span>
                <span className="font-medium text-slate-700">{customer.router_ownership || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Serial #</span>
                <span className="font-mono text-slate-700">{customer.router_serial_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Dish */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Disc className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Dish / Antenna</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Ownership</span>
                <span className="font-medium text-slate-700">{customer.dish_ownership || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MAC Address</span>
                <span className="font-mono text-slate-700 text-xs">{customer.dish_mac_address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Cables */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Cable className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-slate-800">Cabling</h4>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Ethernet Length</span>
                <span className="font-medium text-slate-700">{customer.ethernet_cable_length || 0}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wire Length</span>
                <span className="font-medium text-slate-700">{customer.wire_length || 0}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ============================================
  // ENHANCED DOCUMENTS TAB
  // ============================================
  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#89A8B2]" />
            Identity Documents
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-3">CNIC Front</p>
              {cnicImageUrls.front ? (
                <div className="relative group">
                  <img
                    src={cnicImageUrls.front}
                    alt="CNIC Front"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-4 py-2 bg-white text-slate-800 rounded-lg font-medium text-sm">View Full</button>
                  </div>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">Not available</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-3">CNIC Back</p>
              {cnicImageUrls.back ? (
                <div className="relative group">
                  <img
                    src={cnicImageUrls.back}
                    alt="CNIC Back"
                    className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-4 py-2 bg-white text-slate-800 rounded-lg font-medium text-sm">View Full</button>
                  </div>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">Not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Document Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#89A8B2]" />
            Customer Agreement Document
          </h3>
        </div>
        <div className="p-6">
          {customer.agreement_document ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Customer Service Agreement</p>
                  <p className="text-sm text-slate-500 mt-1">Signed on {new Date(customer.installation_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${customer.agreement_document}`, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-[#89A8B2] text-slate-700 hover:text-[#2A5C8A] rounded-xl font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <a 
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${customer.agreement_document}`}
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2A5C8A] hover:bg-[#1e4568] text-white rounded-xl font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No agreement document uploaded</p>
              <p className="text-xs mt-1">Document will appear here once uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverviewTab()
      case "financial": return renderFinancialTab()
      case "billing": return renderBillingTab()
      case "support": return renderSupportTab()
      case "equipment": return renderEquipmentTab()
      case "documents": return renderDocumentsTab()
      default: return renderOverviewTab()
    }
  }

  // ============================================
  // MAIN RETURN - ENHANCED LAYOUT
  // ============================================
  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto mt-12">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-[#2A5C8A] via-[#3a6d9a] to-[#89A8B2] px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg border border-white/30">
                    {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                      {customer.first_name} {customer.last_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                        <Wifi className="w-3.5 h-3.5" /> {customer.internet_id}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                        <MapPin className="w-3.5 h-3.5" /> {customer.area}
                      </span>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                        customer.is_active 
                          ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-400/50' 
                          : 'bg-red-400/30 text-red-100 border border-red-400/50'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${customer.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-white/80 text-sm">
                  Customer since {new Date(customer.installation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="sticky top-0 z-10 bg-white border-b border-[#E5E1DA] shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeTab === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? "border-[#89A8B2] text-[#2A5C8A] bg-[#F1F0E8]"
                          : "border-transparent text-[#5a7a84] hover:text-[#2A5C8A] hover:border-[#B3C8CF]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-6 py-8 pb-16">
            {renderContent()}
          </div>
        </main>

        {/* Modals */}
        {selectedInvoice && (
          <InvoiceDetailModal invoice={selectedInvoice as any} onClose={() => setSelectedInvoice(null)} />
        )}
        {selectedPayment && (
          <PaymentDetailModal payment={selectedPayment as any} onClose={() => setSelectedPayment(null)} />
        )}
        {selectedComplaint && (
          <ComplaintDetailModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
        )}
        {selectedTask && (
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </div>
    </div>
  )
}

export default CustomerDetail