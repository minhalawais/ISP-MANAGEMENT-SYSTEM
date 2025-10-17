"use client"

import type React from "react"
import { motion } from "framer-motion"

const COLORS = {
  primary: "#89A8B2",
  secondary: "#B3C8CF",
  tertiary: "#E5E1DA",
  background: "#F1F0E8",
}

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

  const ispPaymentTypes = [
    { value: "all", label: "All Types" },
    { value: "monthly_subscription", label: "Monthly Subscription" },
    { value: "bandwidth_usage", label: "Bandwidth Usage" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "other", label: "Other" },
  ]

  return (
    <motion.div
      className="bg-white rounded-2xl border border-[#E5E1DA] p-4 md:p-6 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center mb-6 pb-4 border-b border-[#E5E1DA]">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-sm bg-[#89A8B2]/10">
          <IconFilter className="w-5 h-5" style={{ color: COLORS.primary }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1F2937]">Advanced Filters</h3>
          <p className="text-sm text-[#6B7280]">Refine your data view with custom filters</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-[#1F2937] mb-3 flex items-center">
          <IconCalendar className="w-4 h-4 mr-2" style={{ color: COLORS.primary }} />
          Quick Time Periods
        </label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <motion.button
              key={filter.key}
              onClick={() => onQuickFilter(filter.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg border transition-all duration-200 ${
                filters.timeRange === filter.key
                  ? "text-white shadow-md"
                  : "bg-white text-[#1F2937] border-[#E5E1DA] hover:border-[#89A8B2]"
              }`}
              style={
                filters.timeRange === filter.key ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary } : {}
              }
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Bank Account */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label className="text-xs md:text-sm font-semibold text-[#1F2937] mb-2 flex items-center">
            <IconBank className="w-4 h-4 mr-1.5" style={{ color: COLORS.primary }} />
            Bank Account
          </label>
          <select
            value={filters.bankAccount}
            onChange={(e) => onFilterChange("bankAccount", e.target.value)}
            className="w-full px-3 py-2 md:py-2.5 border border-[#E5E1DA] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white text-[#1F2937]"
          >
            <option value="all">All Accounts</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Start Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <label className="text-xs md:text-sm font-semibold text-[#1F2937] mb-2 block">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="w-full px-3 py-2 md:py-2.5 border border-[#E5E1DA] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white text-[#1F2937]"
          />
        </motion.div>

        {/* End Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <label className="text-xs md:text-sm font-semibold text-[#1F2937] mb-2 block">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="w-full px-3 py-2 md:py-2.5 border border-[#E5E1DA] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white text-[#1F2937]"
          />
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <label className="text-xs md:text-sm font-semibold text-[#1F2937] mb-2 block">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
            className="w-full px-3 py-2 md:py-2.5 border border-[#E5E1DA] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white text-[#1F2937]"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* ISP Payment Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <label className="text-xs md:text-sm font-semibold text-[#1F2937] mb-2 block">ISP Payment Type</label>
          <select
            value={filters.ispPaymentType}
            onChange={(e) => onFilterChange("ispPaymentType", e.target.value)}
            className="w-full px-3 py-2 md:py-2.5 border border-[#E5E1DA] rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200 bg-white text-[#1F2937]"
          >
            {ispPaymentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </motion.div>
      </div>
    </motion.div>
  )
}
