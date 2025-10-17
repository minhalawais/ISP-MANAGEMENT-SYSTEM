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
} from "lucide-react"
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import { KPICard } from "../components/customer-detail/kpi-card.tsx"
import { StatusBadge } from "../components/customer-detail/status-badge.tsx"
import { BillingSummary } from "../components/customer-detail/billing-summary.tsx"
import { DataTable } from "../components/customer-detail/data-table.tsx"

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
}

const sections = [
  { id: "overview", name: "Overview", icon: User, category: "Customer" },
  { id: "financial", name: "Financial", icon: DollarSign, category: "Financial" },
  { id: "billing", name: "Billing", icon: CreditCard, category: "Financial" },
  { id: "support", name: "Support", icon: PhoneCall, category: "Support" },
  { id: "equipment", name: "Equipment", icon: Tool, category: "Technical" },
  { id: "documents", name: "Documents", icon: FileText, category: "Documents" },
]

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [cnicImageUrls, setCnicImageUrls] = useState<{ front: string | null; back: string | null }>({
    front: null,
    back: null,
  })
  const [loading, setLoading] = useState(true)
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null)

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    document.title = "MBA NET - Customer Profile"
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        const token = getToken()
        const [customerRes, invoicesRes, paymentsRes, complaintsRes] = await Promise.all([
          axiosInstance.get(`/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/invoices/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/payments/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axiosInstance.get(`/complaints/customer/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        setCustomer(customerRes.data)
        setInvoices(invoicesRes.data)
        setPayments(paymentsRes.data)
        setComplaints(complaintsRes.data)
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
      // Verify the invoice exists and is accessible
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
        <div className="animate-pulse text-[#89A8B2] text-xl font-semibold">Loading customer details...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F0E8]">
        <div className="text-[#89A8B2] text-xl font-semibold">Customer not found</div>
      </div>
    )
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          label="Total Paid"
          value={`PKR ${customer.financialMetrics.totalAmountPaid.toFixed(0)}`}
          color="bg-[#10B981]"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Payment Reliability"
          value={`${customer.financialMetrics.paymentReliabilityScore.toFixed(0)}%`}
          color="bg-[#3A86FF]"
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          label="Outstanding Balance"
          value={`PKR ${customer.financialMetrics.outstandingBalance.toFixed(0)}`}
          color="bg-[#F59E0B]"
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Service Duration"
          value={`${customer.serviceStatistics.serviceDuration} days`}
          color="bg-[#8B5CF6]"
        />
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Full Name</p>
            <p className="text-[#2A5C8A] font-semibold">{`${customer.first_name} ${customer.last_name}`}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Internet ID</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.internet_id}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Email</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Phone Numbers</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.phone_1}</p>
            {customer.phone_2 && <p className="text-[#2A5C8A] text-sm">{customer.phone_2}</p>}
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Area</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.area}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Service Plan</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.service_plan}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">ISP</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.isp}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">Installation Date</p>
            <p className="text-[#2A5C8A] font-semibold">{new Date(customer.installation_date).toLocaleDateString()}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-[#4A5568] font-medium mb-1">Installation Address</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.installation_address}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">CNIC</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.cnic}</p>
          </div>
          <div>
            <p className="text-sm text-[#4A5568] font-medium mb-1">GPS Coordinates</p>
            <p className="text-[#2A5C8A] font-semibold">{customer.gps_coordinates || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFinancialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] p-6">
          <h4 className="text-lg font-semibold text-[#2A5C8A] mb-4">Financial Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Total Amount Paid</span>
              <span className="font-semibold text-[#2A5C8A]">
                PKR {customer.financialMetrics.totalAmountPaid.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Average Monthly Payment</span>
              <span className="font-semibold text-[#2A5C8A]">
                PKR {customer.financialMetrics.averageMonthlyPayment.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Average Bill Amount</span>
              <span className="font-semibold text-[#2A5C8A]">
                PKR {customer.financialMetrics.averageBillAmount.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Outstanding Balance</span>
              <span className="font-semibold text-[#EF4444]">
                PKR {customer.financialMetrics.outstandingBalance.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4A5568]">Payment Reliability Score</span>
              <span className="font-semibold text-[#10B981]">
                {customer.financialMetrics.paymentReliabilityScore.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] p-6">
          <h4 className="text-lg font-semibold text-[#2A5C8A] mb-4">Payment Behavior</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Most Used Payment Method</span>
              <span className="font-semibold text-[#2A5C8A]">{customer.financialMetrics.mostUsedPaymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Late Payment Frequency</span>
              <span className="font-semibold text-[#F59E0B]">
                {customer.financialMetrics.latePaymentFrequency} times
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1DA]">
              <span className="text-[#4A5568]">Discount Usage</span>
              <span className="font-semibold text-[#2A5C8A]">{customer.billingPatterns.discountUsage} times</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4A5568]">Service Duration</span>
              <span className="font-semibold text-[#2A5C8A]">{customer.serviceStatistics.serviceDuration} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBillingTab = () => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)
    const outstanding = totalInvoiced - totalPaid

    return (
      <div className="space-y-6">
        <BillingSummary
          totalPaid={totalPaid}
          outstandingBalance={outstanding}
          averageMonthly={customer.financialMetrics.averageMonthlyPayment}
          paymentReliability={customer.financialMetrics.paymentReliabilityScore}
        />

        {/* Invoices Table with View Button */}
        <DataTable
          title="Invoices"
          icon={<CreditCard className="w-5 h-5" />}
          columns={[
            { key: "invoice_number", label: "Invoice #" },
            {
              key: "invoice_type",
              label: "Type",
              render: (value) => (
                <span className="px-2 py-1 bg-[#E5E1DA] rounded text-xs font-medium">{value || "Standard"}</span>
              ),
            },
            {
              key: "billing_period",
              label: "Billing Period",
              render: (_, row) =>
                `${new Date(row.billing_start_date).toLocaleDateString()} - ${new Date(row.billing_end_date).toLocaleDateString()}`,
            },
            {
              key: "subtotal",
              label: "Subtotal",
              render: (value) => `PKR ${(value || 0).toFixed(0)}`,
            },
            {
              key: "discount_percentage",
              label: "Discount",
              render: (value) => (value ? `${value}%` : "0%"),
            },
            {
              key: "total_amount",
              label: "Total",
              render: (value) => `PKR ${value.toFixed(0)}`,
            },
            {
              key: "due_date",
              label: "Due Date",
              render: (value) => new Date(value).toLocaleDateString(),
            },
            {
              key: "status",
              label: "Status",
              render: (value) => (
                <StatusBadge
                  status={
                    value === "paid"
                      ? "paid"
                      : value === "pending"
                        ? "pending"
                        : ("failed" as "active" | "inactive" | "pending" | "completed" | "failed" | "resolved" | "open" | "paid")
                  }
                />
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleViewInvoice(row.id)}
                    disabled={loadingViewId === row.id}
                    className={`flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors duration-200 text-sm shadow-sm ${
                      loadingViewId === row.id ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title="View Invoice"
                  >
                    {loadingViewId === row.id ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
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
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        View Invoice
                      </>
                    )}
                  </button>
                </div>
              ),
            },
          ]}
          data={invoices}
        />

        {/* Payments Table with Correct Status and Bank Account Info */}
        <DataTable
          title="Payments & Bank Details"
          icon={<DollarSign className="w-5 h-5" />}
          columns={[
            {
              key: "payment_date",
              label: "Payment Date",
              render: (value) => new Date(value).toLocaleDateString(),
            },
            {
              key: "invoice_number",
              label: "Invoice #",
              render: (value) => value || "N/A",
            },
            {
              key: "amount",
              label: "Amount",
              render: (value) => `PKR ${value.toFixed(0)}`,
            },
            {
              key: "payment_method",
              label: "Payment Method",
              render: (value) => (
                <span className="px-2 py-1 bg-[#E5E1DA] rounded text-xs font-medium capitalize">{value}</span>
              ),
            },
            {
              key: "transaction_id",
              label: "Transaction ID",
              render: (value) => <span className="font-mono">{value || "N/A"}</span>,
            },
            {
              key: "bank_account",
              label: "Bank Account",
              render: (_, row) => {
                if (row.bank_account) {
                  return (
                    <div className="text-sm">
                      <div className="font-semibold text-[#2A5C8A]">{row.bank_account.bank_name}</div>
                      <div className="text-[#4A5568]">
                        {row.bank_account.account_number ? `****${row.bank_account.account_number.slice(-4)}` : "N/A"}
                      </div>
                    </div>
                  )
                }
                return "N/A"
              },
            },
            {
              key: "status",
              label: "Status",
              render: (value) => {
                let statusConfig = {
                  bg: "bg-[#6B7280]",
                  text: "Unknown"
                }

                switch (value?.toLowerCase()) {
                  case "completed":
                    statusConfig = { bg: "bg-[#10B981]", text: "Completed" }
                    break
                  case "pending":
                    statusConfig = { bg: "bg-[#F59E0B]", text: "Pending" }
                    break
                  case "failed":
                    statusConfig = { bg: "bg-[#EF4444]", text: "Failed" }
                    break
                  case "refunded":
                    statusConfig = { bg: "bg-[#8B5CF6]", text: "Refunded" }
                    break
                  default:
                    statusConfig = { bg: "bg-[#6B7280]", text: value || "Unknown" }
                }

                return (
                  <span className={`${statusConfig.bg} text-white font-semibold rounded-full px-3 py-1 text-sm inline-block`}>
                    {statusConfig.text}
                  </span>
                )
              },
            },
          ]}
          data={payments}
        />

        {/* Bank Account Details Summary */}
        {payments.some((p) => p.bank_account) && (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
            <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Bank Account Information
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from(
                new Map(
                  payments.filter((p) => p.bank_account).map((p) => [p.bank_account?.id, p.bank_account]),
                ).values(),
              ).map((account) => (
                <div key={account?.id} className="border border-[#E5E1DA] rounded-lg p-4">
                  <h4 className="font-semibold text-[#2A5C8A] mb-3">{account?.bank_name}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#4A5568]">Account Title:</span>
                      <span className="ml-2 font-semibold text-[#2A5C8A]">{account?.account_title}</span>
                    </div>
                    <div>
                      <span className="text-[#4A5568]">Account Number:</span>
                      <span className="ml-2 font-mono text-[#2A5C8A]">{account?.account_number}</span>
                    </div>
                    {account?.iban && (
                      <div>
                        <span className="text-[#4A5568]">IBAN:</span>
                        <span className="ml-2 font-mono text-[#2A5C8A]">{account.iban}</span>
                      </div>
                    )}
                    {account?.branch_code && (
                      <div>
                        <span className="text-[#4A5568]">Branch Code:</span>
                        <span className="ml-2 font-mono text-[#2A5C8A]">{account.branch_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={<AlertCircle className="w-5 h-5 text-white" />}
          label="Total Complaints"
          value={customer.supportAnalysis.totalComplaints}
          color="bg-[#F59E0B]"
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Avg Resolution Time"
          value={`${customer.supportAnalysis.averageResolutionTime.toFixed(1)}h`}
          color="bg-[#3A86FF]"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          label="Satisfaction Rating"
          value={`${customer.supportAnalysis.satisfactionRatingAverage.toFixed(1)}/5`}
          color="bg-[#10B981]"
        />
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5" />
            Support Tickets
          </h3>
        </div>
        <div className="p-6">
          {complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border border-[#E5E1DA] rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-[#2A5C8A]">Ticket #{complaint.ticket_number}</h4>
                    <StatusBadge
                      status={
                        complaint.status === "Resolved"
                          ? "resolved"
                          : complaint.status === "In Progress"
                            ? "open"
                            : ("pending" as
                                | "active"
                                | "inactive"
                                | "pending"
                                | "completed"
                                | "failed"
                                | "resolved"
                                | "open")
                      }
                    />
                  </div>
                  <p className="text-sm text-[#4A5568] mb-2">{new Date(complaint.created_at).toLocaleDateString()}</p>
                  <p className="text-[#4A5568]">{complaint.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#4A5568]">
              <AlertCircle className="w-12 h-12 text-[#89A8B2] mx-auto mb-3" />
              <p>No support tickets found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderEquipmentTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
      <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Tool className="w-5 h-5" />
          Equipment Details
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[#E5E1DA] rounded-lg p-4">
          <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
            <Router className="w-4 h-4" />
            Router
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[#4A5568]">Ownership:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.router_ownership || "N/A"}</span>
            </div>
            <div>
              <span className="text-[#4A5568]">Serial Number:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.router_serial_number || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="border border-[#E5E1DA] rounded-lg p-4">
          <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
            <Cable className="w-4 h-4" />
            Patch Cord
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[#4A5568]">Ownership:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.patch_cord_ownership || "N/A"}</span>
            </div>
            <div>
              <span className="text-[#4A5568]">Count:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.patch_cord_count || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="border border-[#E5E1DA] rounded-lg p-4">
          <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
            <Box className="w-4 h-4" />
            Splicing Box
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[#4A5568]">Ownership:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.splicing_box_ownership || "N/A"}</span>
            </div>
            <div>
              <span className="text-[#4A5568]">Serial Number:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.splicing_box_serial_number || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="border border-[#E5E1DA] rounded-lg p-4">
          <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
            <Cable className="w-4 h-4" />
            Ethernet Cable
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-[#4A5568]">Ownership:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.ethernet_cable_ownership || "N/A"}</span>
            </div>
            <div>
              <span className="text-[#4A5568]">Length:</span>
              <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.ethernet_cable_length || "N/A"} meters</span>
            </div>
          </div>
        </div>

        {customer.dish_ownership && (
          <div className="border border-[#E5E1DA] rounded-lg p-4">
            <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
              <Disc className="w-4 h-4" />
              Dish
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[#4A5568]">Ownership:</span>
                <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.dish_ownership}</span>
              </div>
              <div>
                <span className="text-[#4A5568]">MAC Address:</span>
                <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.dish_mac_address || "N/A"}</span>
              </div>
            </div>
          </div>
        )}

        {customer.stb_serial_number && (
          <div className="border border-[#E5E1DA] rounded-lg p-4">
            <h4 className="font-semibold text-[#2A5C8A] mb-3 flex items-center gap-2">
              <Tv className="w-4 h-4" />
              Set Top Box
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[#4A5568]">Serial Number:</span>
                <span className="ml-2 font-semibold text-[#2A5C8A]">{customer.stb_serial_number}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CNIC Images
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[#2A5C8A] mb-3">Front Side</h4>
              {cnicImageUrls.front ? (
                <img
                  src={cnicImageUrls.front}
                  alt="CNIC Front"
                  className="w-full max-w-md h-auto border border-[#E5E1DA] rounded-lg shadow-sm"
                />
              ) : (
                <div className="border border-[#E5E1DA] rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-[#89A8B2] mx-auto mb-3" />
                  <p className="text-[#4A5568]">CNIC front image not available</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-[#2A5C8A] mb-3">Back Side</h4>
              {cnicImageUrls.back ? (
                <img
                  src={cnicImageUrls.back}
                  alt="CNIC Back"
                  className="w-full max-w-md h-auto border border-[#E5E1DA] rounded-lg shadow-sm"
                />
              ) : (
                <div className="border border-[#E5E1DA] rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-[#89A8B2] mx-auto mb-3" />
                  <p className="text-[#4A5568]">CNIC back image not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {customer.agreement_document && (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] overflow-hidden">
          <div className="bg-gradient-to-r from-[#89A8B2] to-[#7a9aa4] px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Agreement Document
            </h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#2A5C8A]">Customer Agreement</h4>
                <p className="text-sm text-[#4A5568] mt-1">Signed on {new Date(customer.installation_date).toLocaleDateString()}</p>
              </div>
              <button className="px-4 py-2 bg-[#2A5C8A] text-white rounded-lg hover:bg-[#1e4568] transition-colors duration-200">
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab()
      case "financial":
        return renderFinancialTab()
      case "billing":
        return renderBillingTab()
      case "support":
        return renderSupportTab()
      case "equipment":
        return renderEquipmentTab()
      case "documents":
        return renderDocumentsTab()
      default:
        return renderOverviewTab()
    }
  }

  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 mt-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#2A5C8A]">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-[#4A5568] mt-1">
                {customer.internet_id} • {customer.area} • {customer.service_plan}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={customer.is_active ? "active" : "inactive"} />
                <span className="text-sm text-[#4A5568]">
                  Member since {new Date(customer.installation_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] mb-6 overflow-hidden">
              <div className="flex overflow-x-auto">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                        activeTab === section.id
                          ? "bg-[#2A5C8A] text-white"
                          : "text-[#4A5568] hover:bg-[#F8F7F2]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default CustomerDetail