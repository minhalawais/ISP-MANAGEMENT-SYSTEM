"use client"

import type React from "react"
import { useMemo } from "react"
import { motion } from "framer-motion"

// Production-grade color system (matching AreaAnalysis)
const COLORS = {
  primary: "#89A8B2",
  secondary: "#B3C8CF",
  tertiary: "#E5E1DA",
  background: "#F1F0E8",
  white: "#FFFFFF",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  purple: "#7C3AED",
  blue: "#3A86FF",
  indigo: "#6366F1",
  emerald: "#059669",
} as const

// Professional Icon Components
const IconRevenue: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconCollection: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconPayment: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
)

const IconCashFlow: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const IconTarget: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconProfit: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const IconFilter: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
)

const IconCalendar: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const IconBank: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
    />
  </svg>
)

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

// ============ FINANCIAL KPIs COMPONENT ============

interface KPIData {
  total_revenue: number
  total_collections: number
  total_isp_payments: number
  total_expenses: number
  total_extra_income: number // NEW
  net_cash_flow: number
  collection_efficiency: number
  operating_profit?: number
  operating_profit_margin?: number
  total_initial_balance?: number
  adjusted_cash_flow?: number
}

interface FinancialKPIsProps {
  data: KPIData
}

export const FinancialKPIs: React.FC<FinancialKPIsProps> = ({ data }) => {
  const formatCurrency = (value: number) => `PKR ${Math.round(value).toLocaleString()}`
  const formatPercentage = (value: number) => `${(value ?? 0).toFixed(1)}%`

  const kpis = useMemo(() => {
    const operatingProfit =
      data.operating_profit ??
      data.total_collections + data.total_extra_income - data.total_isp_payments - data.total_expenses
    const totalInitialBalance = data.total_initial_balance || 0
    const adjustedCashFlow = data.adjusted_cash_flow || data.net_cash_flow + totalInitialBalance

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(data.total_revenue),
        icon: IconRevenue,
        color: COLORS.success,
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-100",
        description: "Total invoiced amount",
      },
      {
        title: "Collections",
        value: formatCurrency(data.total_collections),
        icon: IconCollection,
        color: COLORS.blue,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
        description: "Total payments received",
      },
      // NEW: Extra Income KPI
      {
        title: "Extra Income",
        value: formatCurrency(data.total_extra_income),
        icon: IconProfit,
        color: COLORS.indigo,
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-100",
        description: "Non-invoice income",
      },
      {
        title: "ISP Payments",
        value: formatCurrency(data.total_isp_payments),
        icon: IconPayment,
        color: COLORS.warning,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
        description: "Payments to ISPs",
      },
      {
        title: "Business Expenses",
        value: formatCurrency(data.total_expenses),
        icon: IconPayment,
        color: COLORS.error,
        bgColor: "bg-red-50",
        borderColor: "border-red-100",
        description: "Operational & other expenses",
      },
      {
        title: "Net Cash Flow",
        value: formatCurrency(data.net_cash_flow),
        icon: IconCashFlow,
        color: data.net_cash_flow >= 0 ? COLORS.emerald : COLORS.error,
        bgColor: data.net_cash_flow >= 0 ? "bg-emerald-50" : "bg-red-50",
        borderColor: data.net_cash_flow >= 0 ? "border-emerald-100" : "border-red-100",
        description: "Inflows minus outflows",
      },
      {
        title: "Initial Balance",
        value: formatCurrency(totalInitialBalance),
        icon: IconBank,
        color: COLORS.purple,
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100",
        description: "Total bank balances",
      },
      {
        title: "Adjusted Cash Flow",
        value: formatCurrency(adjustedCashFlow),
        icon: IconCashFlow,
        color: adjustedCashFlow >= 0 ? COLORS.emerald : COLORS.error,
        bgColor: adjustedCashFlow >= 0 ? "bg-emerald-50" : "bg-red-50",
        borderColor: adjustedCashFlow >= 0 ? "border-emerald-100" : "border-red-100",
        description: "Cash flow + initial balance",
      },
      {
        title: "Operating Profit",
        value: formatCurrency(operatingProfit),
        icon: IconProfit,
        color: COLORS.indigo,
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-100",
        description: "Collections+Extra income - all expenses",
      },
    ]
  }, [data])

  return (
    <motion.div 
      className="mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Responsive grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        {kpis.slice(0, 5).map((kpi, index) => {
          const IconComponent = kpi.icon
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`bg-white rounded-2xl border ${kpi.borderColor} p-6 hover:shadow-lg transition-all duration-300 ease-in-out group backdrop-blur-sm bg-white/90`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${kpi.bgColor}`}
                  style={{ backgroundColor: kpi.color }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 leading-tight">{kpi.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1 leading-none">{kpi.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{kpi.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Second row - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(5).map((kpi, index) => {
          const IconComponent = kpi.icon
          return (
            <motion.div
              key={index + 5}
              variants={itemVariants}
              className={`bg-white rounded-2xl border ${kpi.borderColor} p-6 hover:shadow-lg transition-all duration-300 ease-in-out group backdrop-blur-sm bg-white/90`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${kpi.bgColor}`}
                  style={{ backgroundColor: kpi.color }}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 leading-tight">{kpi.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1 leading-none">{kpi.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{kpi.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ============ ADVANCED FILTERS COMPONENT ============

interface FilterState {
  startDate: string
  endDate: string
  bankAccount: string
  paymentMethod: string
  invoiceStatus: string
  ispPaymentType: string
  timeRange: string
}

interface BankOption {
  id: string
  name: string
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFilterChange: (key: keyof FilterState, value: string) => void
  onQuickFilter: (timeRange: string) => void
  bankAccounts?: BankOption[]
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  onQuickFilter,
  bankAccounts = [],
}) => {
  const quickFilters = [
    { key: "today", label: "Today" },
    { key: "week", label: "Last 7 Days" },
    { key: "mtd", label: "Month to Date" },
    { key: "qtd", label: "Quarter to Date" },
    { key: "ytd", label: "Year to Date" },
    { key: "last_month", label: "Last Month" },
  ]

  const paymentMethods = [
    { value: "all", label: "All Methods" },
    { value: "cash", label: "Cash" },
    { value: "online", label: "Online Transfer" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "credit_card", label: "Credit Card" },
  ]

  const invoiceStatuses = [
    { value: "all", label: "All Statuses" },
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "overdue", label: "Overdue" },
  ]

  const ispPaymentTypes = [
    { value: "all", label: "All Types" },
    { value: "monthly_subscription", label: "Monthly Subscription" },
    { value: "bandwidth_usage", label: "Bandwidth Usage" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "other", label: "Other" },
  ]

  return (
    <motion.div 
      className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
          <IconFilter className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
          <p className="text-sm text-gray-600">Refine your data view with custom filters</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <IconCalendar className="w-4 h-4 mr-2 text-primary" />
          Quick Time Periods
        </label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickFilter(filter.key)}
              className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 ${
                filters.timeRange === filter.key
                  ? "bg-primary text-white border-primary shadow-lg"
                  : "bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Bank Account */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 flex items-center">
            <IconBank className="w-4 h-4 mr-1.5 text-primary" />
            Bank Account
          </label>
          <select
            value={filters.bankAccount}
            onChange={(e) => onFilterChange("bankAccount", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-400"
          >
            <option value="all">All Accounts</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:border-gray-400"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:border-gray-400"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-400"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* ISP Payment Type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">ISP Payment Type</label>
          <select
            value={filters.ispPaymentType}
            onChange={(e) => onFilterChange("ispPaymentType", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white hover:border-gray-400"
          >
            {ispPaymentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  )
}