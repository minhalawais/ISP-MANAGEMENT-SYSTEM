"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import {
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Box,
  ArrowLeft,
  Wallet,
  Target,
  Award,
  UserCheck,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react"

// Interfaces
interface EmployeeProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  contact_number: string
  cnic: string
  role: string
  is_active: boolean
  emergency_contact: string
  house_address: string
  cnic_image: string
  picture: string
  utility_bill_image: string
  joining_date: string
  salary: number
  reference_name: string
  reference_contact: string
  reference_cnic_image: string
  current_balance: number
  paid_amount: number
  pending_amount: number
  commission_amount_per_complaint: number
  created_at: string
  serviceDuration: number
  financialMetrics: {
    totalCommissionEarned: number
    totalPayouts: number
    totalSalaryAccrued: number
    totalPaymentsCollected: number
    paymentsCount: number
    avgPaymentAmount: number
    monthlyEarnings: { month: string; amount: number }[]
  }
  performanceMetrics: {
    totalComplaints: number
    resolvedComplaints: number
    complaintResolutionRate: number
    avgResolutionTime: number
    totalTasks: number
    completedTasks: number
    taskCompletionRate: number
    totalRecoveryTasks: number
    completedRecoveryTasks: number
    pendingRecoveryTasks: number
    inProgressRecoveryTasks: number
    cancelledRecoveryTasks: number
    recoverySuccessRate: number
    totalRecoveryAmount: number
    completedRecoveryAmount: number
    pendingRecoveryAmount: number
    inProgressRecoveryAmount: number
  }
  customerMetrics: {
    totalManagedCustomers: number
    activeCustomers: number
    inactiveCustomers: number
    customerRetentionRate: number
  }
}

interface CustomerData {
  id: string
  internet_id: string
  first_name: string
  last_name: string
  email: string
  phone_1: string
  area: string
  is_active: boolean
  installation_date: string
}

interface PaymentData {
  id: string
  invoice_number: string
  customer_name: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
}

interface ComplaintData {
  id: string
  ticket_number: string
  customer_name: string
  description: string
  status: string
  created_at: string
  resolved_at: string
  satisfaction_rating: number
}

interface TaskData {
  id: string
  task_type: string
  customer_name: string
  priority: string
  status: string
  due_date: string
  notes: string
  created_at: string
}

interface RecoveryTaskData {
  id: string
  invoice_number: string
  customer_name: string
  amount: number
  status: string
  notes: string
  created_at: string
}

interface LedgerEntry {
  id: string
  transaction_type: string
  amount: number
  description: string
  created_at: string
}

interface InventoryData {
  id: string
  item_type: string
  serial_number: string
  assigned_at: string
  status: string
}

// Tab configuration
const tabs = [
  { id: "overview", name: "Overview", icon: User },
  { id: "performance", name: "Performance", icon: Target },
  { id: "financial", name: "Financial", icon: Wallet },
  { id: "customers", name: "Customers", icon: Users },
  { id: "tasks", name: "Tasks & Complaints", icon: ClipboardList },
  { id: "recoveries", name: "Recoveries", icon: RefreshCw },
  { id: "inventory", name: "Inventory", icon: Box },
  { id: "documents", name: "Documents", icon: FileText },
]

// KPI Card Component
const KPICard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  subtext?: string
}> = ({ icon, label, value, color, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] p-5 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl shadow-lg`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-[#89A8B2] font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#2A5C8A]">{value}</p>
        {subtext && <p className="text-xs text-[#B3C8CF]">{subtext}</p>}
      </div>
    </div>
  </div>
)

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "active":
      case "completed":
      case "resolved":
      case "paid":
        return "bg-[#10B981] text-white"
      case "pending":
      case "open":
        return "bg-[#F59E0B] text-white"
      case "in_progress":
        return "bg-[#3A86FF] text-white"
      case "cancelled":
      case "inactive":
      case "failed":
        return "bg-[#EF4444] text-white"
      default:
        return "bg-[#89A8B2] text-white"
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
      {status?.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "N/A"}
    </span>
  )
}

// Data Table Component
const DataTable: React.FC<{
  title: string
  icon: React.ReactNode
  columns: { key: string; label: string; render?: (value: any, row: any) => React.ReactNode }[]
  data: any[]
  emptyMessage?: string
}> = ({ title, icon, columns, data, emptyMessage = "No data available" }) => (
  <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
    <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-6 py-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        {icon}
        {title}
      </h3>
    </div>
    <div className="overflow-x-auto">
      {data.length > 0 ? (
        <table className="w-full">
          <thead className="bg-[#F1F0E8]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-[#89A8B2] uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E1DA]">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-[#F1F0E8]/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-[#2A5C8A]">
                    {col.render ? col.render(row[col.key], row) : row[col.key] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-[#89A8B2]">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
)

// Info Card Component
const InfoCard: React.FC<{
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
    <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-6 py-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        {icon}
        {title}
      </h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
)

// Info Row Component
const InfoRow: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-[#E5E1DA] last:border-0">
    <span className="text-[#89A8B2] text-sm">{label}</span>
    <span className="font-semibold text-[#2A5C8A]">{value || "N/A"}</span>
  </div>
)

// Main Component
const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [complaints, setComplaints] = useState<ComplaintData[]>([])
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTaskData[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [inventory, setInventory] = useState<InventoryData[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "MBA NET - Employee Profile"
    fetchEmployeeData()
  }, [id])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      const token = getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [profileRes, customersRes, paymentsRes, complaintsRes, tasksRes, recoveryRes, ledgerRes, inventoryRes] = await Promise.all([
        axiosInstance.get(`/employees/${id}/profile`, { headers }),
        axiosInstance.get(`/employees/${id}/customers`, { headers }),
        axiosInstance.get(`/employees/${id}/payments`, { headers }),
        axiosInstance.get(`/employees/${id}/complaints`, { headers }),
        axiosInstance.get(`/employees/${id}/tasks`, { headers }),
        axiosInstance.get(`/employees/${id}/recovery-tasks`, { headers }),
        axiosInstance.get(`/employees/${id}/profile-ledger`, { headers }),
        axiosInstance.get(`/employees/${id}/inventory`, { headers }),
      ])

      setEmployee(profileRes.data)
      setCustomers(customersRes.data)
      setPayments(paymentsRes.data)
      setComplaints(complaintsRes.data)
      setTasks(tasksRes.data)
      setRecoveryTasks(recoveryRes.data)
      setLedger(ledgerRes.data)
      setInventory(inventoryRes.data)
    } catch (error) {
      console.error("Failed to fetch employee data", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F0E8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#89A8B2] mx-auto mb-4"></div>
          <p className="text-[#89A8B2] text-xl font-semibold">Loading employee profile...</p>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F0E8]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <p className="text-[#89A8B2] text-xl font-semibold">Employee not found</p>
        </div>
      </div>
    )
  }

  // Tab Content Renderers
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Managed Customers"
          value={employee.customerMetrics.totalManagedCustomers}
          color="bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A]"
          subtext={`${employee.customerMetrics.activeCustomers} active`}
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          label="Payments Collected"
          value={`PKR ${employee.financialMetrics.totalPaymentsCollected.toLocaleString()}`}
          color="bg-gradient-to-br from-[#10B981] to-[#059669]"
          subtext={`${employee.financialMetrics.paymentsCount} transactions`}
        />
        <KPICard
          icon={<Wallet className="w-5 h-5 text-white" />}
          label="Current Balance"
          value={`PKR ${employee.current_balance.toLocaleString()}`}
          color="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Service Duration"
          value={`${employee.serviceDuration} days`}
          color="bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
        />
      </div>

      {/* Personal & Employment Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Personal Information" icon={<User className="w-5 h-5" />}>
          <div className="space-y-1">
            <InfoRow label="Full Name" value={`${employee.first_name} ${employee.last_name}`} />
            <InfoRow label="Username" value={employee.username} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Contact Number" value={employee.contact_number} />
            <InfoRow label="Emergency Contact" value={employee.emergency_contact} />
            <InfoRow label="CNIC" value={employee.cnic} />
            <InfoRow label="Address" value={employee.house_address} />
          </div>
        </InfoCard>

        <InfoCard title="Employment Details" icon={<Briefcase className="w-5 h-5" />}>
          <div className="space-y-1">
            <InfoRow label="Role" value={employee.role?.replace("_", " ").toUpperCase()} />
            <InfoRow label="Joining Date" value={employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : null} />
            <InfoRow label="Salary" value={employee.salary ? `PKR ${employee.salary.toLocaleString()}` : null} />
            <InfoRow label="Status" value={employee.is_active ? "Active" : "Inactive"} />
            <InfoRow label="Reference Name" value={employee.reference_name} />
            <InfoRow label="Reference Contact" value={employee.reference_contact} />
          </div>
        </InfoCard>
      </div>

      {/* Payment Balances */}
      <InfoCard title="Payment Balances" icon={<DollarSign className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-amber-700 font-medium">Pending Balance</p>
            <p className="text-2xl font-bold text-amber-600">PKR {(employee.pending_amount || 0).toLocaleString()}</p>
            <p className="text-xs text-amber-600/70 mt-1">Salary + Commissions owed</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-sm text-emerald-700 font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600">PKR {(employee.paid_amount || 0).toLocaleString()}</p>
            <p className="text-xs text-emerald-600/70 mt-1">Via expense module</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-700 font-medium">Total Earned</p>
            <p className="text-2xl font-bold text-blue-600">
              PKR {((employee.pending_amount || 0) + (employee.paid_amount || 0)).toLocaleString()}
            </p>
            <p className="text-xs text-blue-600/70 mt-1">Pending + Paid</p>
          </div>
        </div>
      </InfoCard>

      {/* Commission Settings */}
      <InfoCard title="Commission Settings" icon={<Award className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F1F0E8] rounded-lg p-4 text-center">
            <p className="text-sm text-[#89A8B2]">Per Complaint</p>
            <p className="text-2xl font-bold text-[#3A86FF]">PKR {employee.commission_amount_per_complaint}</p>
          </div>
          <div className="bg-[#F1F0E8] rounded-lg p-4 text-center">
            <p className="text-sm text-[#89A8B2]">Total Earned</p>
            <p className="text-2xl font-bold text-[#8B5CF6]">PKR {employee.financialMetrics.totalCommissionEarned.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-4">Note: Connection commissions are set per customer in Customer Management.</p>
      </InfoCard>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          label="Complaints Resolved"
          value={employee.performanceMetrics.resolvedComplaints}
          color="bg-gradient-to-br from-[#10B981] to-[#059669]"
          subtext={`${employee.performanceMetrics.complaintResolutionRate.toFixed(0)}% rate`}
        />
        <KPICard
          icon={<Clock className="w-5 h-5 text-white" />}
          label="Avg Resolution Time"
          value={`${employee.performanceMetrics.avgResolutionTime}h`}
          color="bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A]"
        />
        <KPICard
          icon={<ClipboardList className="w-5 h-5 text-white" />}
          label="Tasks Completed"
          value={employee.performanceMetrics.completedTasks}
          color="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
          subtext={`${employee.performanceMetrics.taskCompletionRate.toFixed(0)}% rate`}
        />
        <KPICard
          icon={<RefreshCw className="w-5 h-5 text-white" />}
          label="Recovery Success"
          value={`${employee.performanceMetrics.recoverySuccessRate}%`}
          color="bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
          subtext={`${employee.performanceMetrics.completedRecoveryTasks}/${employee.performanceMetrics.totalRecoveryTasks}`}
        />
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Complaint Performance" icon={<AlertCircle className="w-5 h-5" />}>
          <div className="space-y-1">
            <InfoRow label="Total Assigned" value={employee.performanceMetrics.totalComplaints} />
            <InfoRow label="Resolved" value={employee.performanceMetrics.resolvedComplaints} />
            <InfoRow label="Resolution Rate" value={`${employee.performanceMetrics.complaintResolutionRate.toFixed(1)}%`} />
            <InfoRow label="Avg Resolution Time" value={`${employee.performanceMetrics.avgResolutionTime} hours`} />
          </div>
        </InfoCard>

        <InfoCard title="Task Performance" icon={<ClipboardList className="w-5 h-5" />}>
          <div className="space-y-1">
            <InfoRow label="Total Tasks" value={employee.performanceMetrics.totalTasks} />
            <InfoRow label="Completed" value={employee.performanceMetrics.completedTasks} />
            <InfoRow label="Completion Rate" value={`${employee.performanceMetrics.taskCompletionRate.toFixed(1)}%`} />
            <InfoRow label="Recovery Tasks" value={employee.performanceMetrics.totalRecoveryTasks} />
          </div>
        </InfoCard>
      </div>
    </div>
  )

  const renderFinancialTab = () => (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Total Earned"
          value={`PKR ${(employee.financialMetrics.totalCommissionEarned + employee.financialMetrics.totalSalaryAccrued).toLocaleString()}`}
          color="bg-gradient-to-br from-[#10B981] to-[#059669]"
        />
        <KPICard
          icon={<DollarSign className="w-5 h-5 text-white" />}
          label="Commission Earned"
          value={`PKR ${employee.financialMetrics.totalCommissionEarned.toLocaleString()}`}
          color="bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A]"
        />
        <KPICard
          icon={<CreditCard className="w-5 h-5 text-white" />}
          label="Total Payouts"
          value={`PKR ${employee.financialMetrics.totalPayouts.toLocaleString()}`}
          color="bg-gradient-to-br from-[#EF4444] to-[#DC2626]"
        />
        <KPICard
          icon={<Wallet className="w-5 h-5 text-white" />}
          label="Current Balance"
          value={`PKR ${employee.current_balance.toLocaleString()}`}
          color="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
        />
      </div>

      {/* Ledger Table */}
      <DataTable
        title="Ledger Transactions"
        icon={<FileText className="w-5 h-5" />}
        columns={[
          { key: "created_at", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
          {
            key: "transaction_type",
            label: "Type",
            render: (v) => (
              <span className="px-2 py-1 bg-[#E5E1DA] rounded text-xs font-medium capitalize">
                {v?.replace("_", " ")}
              </span>
            )
          },
          {
            key: "amount",
            label: "Amount",
            render: (v) => (
              <span className={v >= 0 ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}>
                {v >= 0 ? "+" : ""}PKR {v?.toLocaleString()}
              </span>
            )
          },
          { key: "description", label: "Description" },
        ]}
        data={ledger}
        emptyMessage="No ledger entries found"
      />
    </div>
  )

  const renderCustomersTab = () => (
    <div className="space-y-6">
      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Total Customers"
          value={employee.customerMetrics.totalManagedCustomers}
          color="bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A]"
        />
        <KPICard
          icon={<UserCheck className="w-5 h-5 text-white" />}
          label="Active Customers"
          value={employee.customerMetrics.activeCustomers}
          color="bg-gradient-to-br from-[#10B981] to-[#059669]"
        />
        <KPICard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Retention Rate"
          value={`${employee.customerMetrics.customerRetentionRate.toFixed(1)}%`}
          color="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
        />
      </div>

      {/* Customers Table */}
      <DataTable
        title="Managed Customers"
        icon={<Users className="w-5 h-5" />}
        columns={[
          { key: "internet_id", label: "Internet ID" },
          { key: "name", label: "Name", render: (_, row) => `${row.first_name} ${row.last_name}` },
          { key: "phone_1", label: "Phone" },
          { key: "area", label: "Area" },
          { key: "installation_date", label: "Installed", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
          { key: "is_active", label: "Status", render: (v) => <StatusBadge status={v ? "active" : "inactive"} /> },
        ]}
        data={customers}
        emptyMessage="No customers assigned"
      />
    </div>
  )

  const renderTasksTab = () => (
    <div className="space-y-6">
      {/* Tasks Table */}
      <DataTable
        title="Assigned Tasks"
        icon={<ClipboardList className="w-5 h-5" />}
        columns={[
          { key: "task_type", label: "Type", render: (v) => <span className="capitalize">{v}</span> },
          { key: "customer_name", label: "Customer" },
          {
            key: "priority",
            label: "Priority",
            render: (v) => {
              const colors: Record<string, string> = {
                low: "bg-green-100 text-green-800",
                medium: "bg-yellow-100 text-yellow-800",
                high: "bg-orange-100 text-orange-800",
                critical: "bg-red-100 text-red-800"
              }
              return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[v] || "bg-gray-100"}`}>{v}</span>
            }
          },
          { key: "due_date", label: "Due Date", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
        ]}
        data={tasks}
        emptyMessage="No tasks assigned"
      />

      {/* Complaints Table */}
      <DataTable
        title="Assigned Complaints"
        icon={<AlertCircle className="w-5 h-5" />}
        columns={[
          { key: "ticket_number", label: "Ticket #" },
          { key: "customer_name", label: "Customer" },
          { key: "description", label: "Description", render: (v) => <span className="truncate max-w-[200px] block">{v}</span> },
          { key: "created_at", label: "Created", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
          { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
        ]}
        data={complaints}
        emptyMessage="No complaints assigned"
      />
    </div>
  )

  const renderRecoveriesTab = () => {
    // Calculate recovery stats
    const pendingRecoveries = recoveryTasks.filter(r => r.status === 'pending')
    const inProgressRecoveries = recoveryTasks.filter(r => r.status === 'in_progress')
    const completedRecoveries = recoveryTasks.filter(r => r.status === 'completed')
    const cancelledRecoveries = recoveryTasks.filter(r => r.status === 'cancelled')

    const totalAmount = recoveryTasks.reduce((sum, r) => sum + (r.amount || 0), 0)
    const completedAmount = completedRecoveries.reduce((sum, r) => sum + (r.amount || 0), 0)
    const pendingAmount = pendingRecoveries.reduce((sum, r) => sum + (r.amount || 0), 0)
    const inProgressAmount = inProgressRecoveries.reduce((sum, r) => sum + (r.amount || 0), 0)

    return (
      <div className="space-y-6">
        {/* Recovery KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<RefreshCw className="w-5 h-5 text-white" />}
            label="Total Recovery Tasks"
            value={recoveryTasks.length}
            color="bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A]"
            subtext={`PKR ${totalAmount.toLocaleString()} total`}
          />
          <KPICard
            icon={<Clock className="w-5 h-5 text-white" />}
            label="Pending"
            value={pendingRecoveries.length}
            color="bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
            subtext={`PKR ${pendingAmount.toLocaleString()}`}
          />
          <KPICard
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            label="In Progress"
            value={inProgressRecoveries.length}
            color="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"
            subtext={`PKR ${inProgressAmount.toLocaleString()}`}
          />
          <KPICard
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            label="Completed"
            value={completedRecoveries.length}
            color="bg-gradient-to-br from-[#10B981] to-[#059669]"
            subtext={`PKR ${completedAmount.toLocaleString()} recovered`}
          />
        </div>

        {/* Recovery Performance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InfoCard title="Recovery Performance" icon={<Target className="w-5 h-5" />}>
            <div className="space-y-1">
              <InfoRow label="Total Assigned" value={employee.performanceMetrics.totalRecoveryTasks} />
              <InfoRow label="Completed" value={employee.performanceMetrics.completedRecoveryTasks} />
              <InfoRow label="Success Rate" value={`${employee.performanceMetrics.recoverySuccessRate}%`} />
              <InfoRow label="Cancelled" value={cancelledRecoveries.length} />
            </div>
          </InfoCard>

          <InfoCard title="Amount Summary" icon={<DollarSign className="w-5 h-5" />}>
            <div className="space-y-1">
              <InfoRow label="Total Assigned" value={`PKR ${totalAmount.toLocaleString()}`} />
              <InfoRow label="Recovered" value={`PKR ${completedAmount.toLocaleString()}`} />
              <InfoRow label="Pending" value={`PKR ${pendingAmount.toLocaleString()}`} />
              <InfoRow label="In Progress" value={`PKR ${inProgressAmount.toLocaleString()}`} />
            </div>
          </InfoCard>

          <InfoCard title="Recovery Rate" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-4xl font-bold text-[#10B981]">
                {employee.performanceMetrics.recoverySuccessRate}%
              </div>
              <p className="text-sm text-[#89A8B2] mt-2">Recovery Success Rate</p>
              <div className="w-full bg-[#E5E1DA] rounded-full h-3 mt-4">
                <div
                  className="bg-gradient-to-r from-[#10B981] to-[#059669] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${employee.performanceMetrics.recoverySuccessRate}%` }}
                />
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Recovery Tasks Table */}
        <DataTable
          title="Recovery Tasks"
          icon={<RefreshCw className="w-5 h-5" />}
          columns={[
            { key: "invoice_number", label: "Invoice #" },
            { key: "customer_name", label: "Customer" },
            {
              key: "amount", label: "Amount", render: (v) => (
                <span className="font-semibold text-[#2A5C8A]">PKR {v?.toLocaleString() || 0}</span>
              )
            },
            { key: "created_at", label: "Assigned", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
            {
              key: "notes", label: "Notes", render: (v) => (
                <span className="truncate max-w-[200px] block text-sm text-gray-600">{v || "-"}</span>
              )
            },
            { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
          ]}
          data={recoveryTasks}
          emptyMessage="No recovery tasks assigned"
        />
      </div>
    )
  }

  const renderInventoryTab = () => (
    <DataTable
      title="Assigned Equipment"
      icon={<Box className="w-5 h-5" />}
      columns={[
        { key: "item_type", label: "Item Type" },
        { key: "serial_number", label: "Serial Number" },
        { key: "assigned_at", label: "Assigned Date", render: (v) => v ? new Date(v).toLocaleDateString() : "-" },
        { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
      ]}
      data={inventory}
      emptyMessage="No equipment assigned"
    />
  )

  // Helper helper to get file URL
  const getFileUrl = (path: string | null) => {
    if (!path) return ""
    const baseURL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"
    const cleanPath = path.startsWith("/") ? path.slice(1) : path
    return `${baseURL}/${cleanPath}`
  }

  const renderDocumentsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Employee Photo */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-4 py-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Employee Photo
          </h4>
        </div>
        <div className="p-4">
          {employee.picture ? (
            <a href={getFileUrl(employee.picture)} target="_blank" rel="noopener noreferrer">
              <img
                src={getFileUrl(employee.picture)}
                alt="Employee"
                className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <div className="w-full h-48 bg-[#F1F0E8] rounded-lg flex items-center justify-center">
              <User className="w-16 h-16 text-[#89A8B2]/50" />
            </div>
          )}
        </div>
      </div>

      {/* CNIC Image */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-4 py-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> CNIC Document
          </h4>
        </div>
        <div className="p-4">
          {employee.cnic_image ? (
            <a href={getFileUrl(employee.cnic_image)} target="_blank" rel="noopener noreferrer">
              <img
                src={getFileUrl(employee.cnic_image)}
                alt="CNIC"
                className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <div className="w-full h-48 bg-[#F1F0E8] rounded-lg flex items-center justify-center">
              <CreditCard className="w-16 h-16 text-[#89A8B2]/50" />
            </div>
          )}
        </div>
      </div>

      {/* Utility Bill */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-4 py-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" /> Utility Bill
          </h4>
        </div>
        <div className="p-4">
          {employee.utility_bill_image ? (
            <a href={getFileUrl(employee.utility_bill_image)} target="_blank" rel="noopener noreferrer">
              <img
                src={getFileUrl(employee.utility_bill_image)}
                alt="Utility Bill"
                className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <div className="w-full h-48 bg-[#F1F0E8] rounded-lg flex items-center justify-center">
              <FileText className="w-16 h-16 text-[#89A8B2]/50" />
            </div>
          )}
        </div>
      </div>

      {/* Reference CNIC */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] overflow-hidden">
        <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-4 py-3">
          <h4 className="text-white font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Reference CNIC
          </h4>
        </div>
        <div className="p-4">
          {employee.reference_cnic_image ? (
            <a href={getFileUrl(employee.reference_cnic_image)} target="_blank" rel="noopener noreferrer">
              <img
                src={getFileUrl(employee.reference_cnic_image)}
                alt="Reference CNIC"
                className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </a>
          ) : (
            <div className="w-full h-48 bg-[#F1F0E8] rounded-lg flex items-center justify-center">
              <CreditCard className="w-16 h-16 text-[#89A8B2]/50" />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview": return renderOverviewTab()
      case "performance": return renderPerformanceTab()
      case "financial": return renderFinancialTab()
      case "customers": return renderCustomersTab()
      case "tasks": return renderTasksTab()
      case "recoveries": return renderRecoveriesTab()
      case "inventory": return renderInventoryTab()
      case "documents": return renderDocumentsTab()
      default: return renderOverviewTab()
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
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#89A8B2] hover:text-[#2A5C8A] transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#89A8B2] to-[#B3C8CF] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#2A5C8A]">
                      {employee.first_name} {employee.last_name}
                    </h1>
                    <p className="text-[#89A8B2] flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {employee.email}
                    </p>
                  </div>
                </div>
                <StatusBadge status={employee.is_active ? "active" : "inactive"} />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] mb-6 overflow-hidden">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeTab === tab.id
                        ? "bg-[#2A5C8A] text-white"
                        : "text-[#4A5568] hover:bg-[#F8F7F2]"
                      }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default EmployeeDetailPage
