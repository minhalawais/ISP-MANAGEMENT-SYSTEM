"use client"

import type React from "react"

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
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-3 block">Quick Periods</label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onQuickFilter(filter.key)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                filters.timeRange === filter.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Bank Account - NEW */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Bank Account</label>
          <select
            value={filters.bankAccount}
            onChange={(e) => onFilterChange("bankAccount", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Accounts</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* ISP Payment Type */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">ISP Payment Type</label>
          <select
            value={filters.ispPaymentType}
            onChange={(e) => onFilterChange("ispPaymentType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {ispPaymentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
