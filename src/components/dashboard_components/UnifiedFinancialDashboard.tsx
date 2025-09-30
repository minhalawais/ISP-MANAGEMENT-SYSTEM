"use client"

import React, { useState, useEffect, useCallback } from "react"
import { FinancialKPIs } from "./FinancialKPIs.tsx"
import { CashFlowAnalysis } from "./CashFlowAnalysis.tsx"
import { RevenueExpenseComparison } from "./RevenueExpenseComparison.tsx"
import { BankPerformance } from "./BankPerformance.tsx"
import { CollectionsAnalysis } from "./CollectionsAnalysis.tsx"
import { ISPPaymentAnalysis } from "./ISPPaymentAnalysis.tsx"
import { AdvancedFilters } from "./AdvancedFilters.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

// Types
interface FinancialData {
    kpis: any
    cash_flow: any
    revenue_expense: any
    bank_performance: any
    collections: any
    isp_payments: any
    filters: any
    bank_accounts: BankOption[] // NEW
  }
  
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
  
  export const UnifiedFinancialDashboard: React.FC = () => {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null)
    const [bankAccounts, setBankAccounts] = useState<BankOption[]>([]) // NEW
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<FilterState>({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      bankAccount: "all",
      paymentMethod: "all",
      invoiceStatus: "all",
      ispPaymentType: "all",
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
              <p className="text-gray-600">Comprehensive view of your ISP's financial performance</p>
            </div>
          </div>
        </div>
  
        {/* Filters */}
        <AdvancedFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onQuickFilter={handleQuickFilter}
          bankAccounts={bankAccounts} // NEW
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
  
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Bank Performance */}
          {financialData?.bank_performance && <BankPerformance data={financialData.bank_performance} />}
  
          {/* Collections Analysis */}
          {financialData?.collections && <CollectionsAnalysis data={financialData.collections} />}
        </div>
  
        {/* ISP Payment Analysis - Full Width */}
        {financialData?.isp_payments && <ISPPaymentAnalysis data={financialData.isp_payments} />}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
  
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      </div>
    )
  }
  