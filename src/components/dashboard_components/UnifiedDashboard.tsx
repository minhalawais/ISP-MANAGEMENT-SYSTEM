"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { FinancialKPIs } from "./FinancialComponent/FinancialKPIs.tsx"
import { CashFlowAnalysis } from "./FinancialComponent/CashFlowAnalysis.tsx"
import { RevenueExpenseComparison } from "./FinancialComponent/RevenueExpenseComparison.tsx"
import { BankPerformance } from "./FinancialComponent/BankPerformance.tsx"
import { ISPPaymentAnalysis } from "./FinancialComponent/ISPPaymentAnalysis.tsx"
import { AdvancedFilters } from "./FinancialComponent/AdvancedFilters.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

// Types
interface FinancialData {
  kpis: {
    total_revenue: number
    total_collections: number
    total_isp_payments: number
    total_expenses: number
    total_extra_income: number // NEW
    net_cash_flow: number
    collection_efficiency: number
    operating_profit?: number
    total_initial_balance?: number
    adjusted_cash_flow?: number
  }
  cash_flow: {
    monthly_trends: Array<{
      month: string
      inflow: number
      outflow: number
      isp_outflow: number
      expense_outflow: number
      net_flow: number
      adjusted_flow: number
    }>
    inflow_breakdown: Array<{ method: string; amount: number }>
    outflow_breakdown: Array<{ type: string; amount: number }>
    initial_balance?: number
    total_adjusted_flow?: number
  }
  revenue_expense: {
    monthly_comparison: Array<{
      month: string
      revenue: number
      extra_income: number // NEW
      expenses: number
      isp_expenses: number
      business_expenses: number
      ratio: number
    }>
    total_revenue: number
    total_extra_income: number // NEW
    total_expenses: number
    total_isp_expenses: number
    total_business_expenses: number
    average_ratio: number
  }
  bank_performance: Array<{
    bank_name: string
    account_number: string
    collections: number
    extra_income?: number // NEW
    payments: number
    isp_payments: number
    expenses: number
    net_flow: number
    initial_balance?: number
    adjusted_balance?: number
    utilization_rate: number
  }>
  collections: any
  isp_payments: any
  cash_payments?: {
    collections: number
    payments: number
    isp_payments?: number
    expenses?: number
    extra_income?: number // NEW
    net_flow: number
  }
  filters: any
  bank_accounts: BankOption[]
  initial_balance_summary?: {
    total_initial_balance: number
    accounts_with_balance: number
    average_balance: number
  }
}

interface FilterState {
  startDate: string
  endDate: string
  bankAccount: string
  paymentMethod: string
  invoiceStatus: string
  ispPaymentType: string
  expenseType: string
  timeRange: string
}

interface BankOption {
  id: string
  name: string
}

export const UnifiedFinancialDashboard: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    bankAccount: "all",
    paymentMethod: "all",
    invoiceStatus: "all",
    ispPaymentType: "all",
    expenseType: "all",
    timeRange: "mtd",
  })

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.startDate) params.append("start_date", filters.startDate)
      if (filters.endDate) params.append("end_date", filters.endDate)
      if (filters.bankAccount !== "all") params.append("bank_account_id", filters.bankAccount)
      if (filters.paymentMethod !== "all") params.append("payment_method", filters.paymentMethod)
      if (filters.invoiceStatus !== "all") params.append("invoice_status", filters.invoiceStatus)
      if (filters.ispPaymentType !== "all") params.append("isp_payment_type", filters.ispPaymentType)
      if (filters.expenseType !== "all") params.append("expense_type", filters.expenseType)

      const response = await axiosInstance.get<FinancialData>(`/dashboard/unified-financial?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000,
      })

      setFinancialData(response.data)
      if (Array.isArray(response.data?.bank_accounts)) {
        setBankAccounts(response.data.bank_accounts)
      }
    } catch (err) {
      console.error("Financial dashboard fetch error:", err)
      setError("Unable to load financial dashboard data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchFinancialData()
  }, [fetchFinancialData])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleQuickFilter = (timeRange: string) => {
    const today = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case "today":
        startDate = today
        break
      case "week":
        startDate = new Date(today.setDate(today.getDate() - 7))
        break
      case "mtd":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case "qtd":
        const quarter = Math.floor(today.getMonth() / 3)
        startDate = new Date(today.getFullYear(), quarter * 3, 1)
        break
      case "ytd":
        startDate = new Date(today.getFullYear(), 0, 1)
        break
      case "last_month":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        setFilters((prev) => ({
          ...prev,
          timeRange,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }))
        return
    }

    setFilters((prev) => ({
      ...prev,
      timeRange,
      startDate: startDate.toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    }))
  }

  if (loading) {
    return <DashboardLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-1">Failed to Load Data</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchFinancialData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
            <p className="text-gray-600">Comprehensive view of your ISP's financial performance including expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
              <span className="text-blue-700 text-sm font-medium">Expenses Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AdvancedFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onQuickFilter={handleQuickFilter}
        bankAccounts={bankAccounts}
      />

      {/* KPI Section */}
      {financialData?.kpis && <FinancialKPIs data={financialData.kpis} />}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Cash Flow Analysis */}
        {financialData?.cash_flow && <CashFlowAnalysis data={financialData.cash_flow} />}

        {/* Revenue vs Expenses */}
        {financialData?.revenue_expense && <RevenueExpenseComparison data={financialData.revenue_expense} />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 mb-6">
        {/* Bank Performance */}
        {financialData?.bank_performance && (
          <BankPerformance data={financialData.bank_performance} cashPayments={financialData.cash_payments} />
        )}
        {/* Collections Analysis */}
      </div>

      {/* ISP Payment Analysis - Full Width */}
      {financialData?.isp_payments && <ISPPaymentAnalysis data={financialData.isp_payments} />}

      {/* Expense Summary Section */}
      {financialData?.kpis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Expense Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">Total Business Expenses</p>
              <p className="text-2xl font-bold text-red-800">
                PKR {financialData.kpis.total_expenses?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">Total ISP Expenses</p>
              <p className="text-2xl font-bold text-orange-800">
                PKR {financialData.kpis.total_isp_payments?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-purple-800">
                PKR{" "}
                {(financialData.kpis.total_expenses + financialData.kpis.total_isp_payments)?.toLocaleString() || "0"}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">Expense to Revenue Ratio</p>
              <p className="text-2xl font-bold text-green-800">
                {financialData.revenue_expense?.average_ratio?.toFixed(1) || "0"}%
              </p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-700 font-medium">Total Extra Income</p>
              <p className="text-2xl font-bold text-teal-800">
                PKR {financialData.kpis.total_extra_income?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Loading Skeleton Component
const DashboardLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-300 rounded"></div>
          <div className="h-4 w-96 bg-gray-300 rounded"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-gray-300 rounded-lg"></div>
          <div className="h-10 w-40 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
              <div className="h-8 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6">
            <div className="space-y-2 mb-6">
              <div className="h-6 w-48 bg-gray-300 rounded"></div>
              <div className="h-4 w-64 bg-gray-300 rounded"></div>
            </div>
            <div className="h-80 bg-gray-300 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Expense Summary Skeleton */}
      <div className="bg-white rounded-xl p-6">
        <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}