"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface PaymentTrend {
  month: string
  bank_account: string
  amount: number
  transaction_count?: number
}

interface AccountPerformance {
  bank_account: string
  collected: number
  outstanding: number
  collection_ratio?: number
}

interface PaymentMethodDistribution {
  method: string
  amount: number
  count: number
}

interface TopCustomer {
  customer_name: string
  bank_account: string
  total_paid: number
  transaction_count?: number
}

interface CollectionMetric {
  bank_account: string
  total_collected: number
  collection_ratio: number
  target_ratio?: number
}

interface TransactionMetric {
  bank_account: string
  avg_transaction_value: number
  transaction_count: number
  total_volume: number
}

interface BankAccount {
  id: string
  name: string
  account_number?: string
  bank_name?: string
}

interface AnalyticsData {
  payment_trends: PaymentTrend[]
  account_performance: AccountPerformance[]
  payment_method_distribution: PaymentMethodDistribution[]
  top_customers: TopCustomer[]
  collection_metrics: CollectionMetric[]
  transaction_metrics: TransactionMetric[]
  bank_accounts: BankAccount[]
  total_payments: number
  summary_stats?: {
    total_volume: number
    avg_daily_volume: number
    growth_rate: number
  }
}

interface BankAccountAnalysisProps {
  filters: {
    dateRange: {
      start: Date
      end: Date
    }
    company: string
    area: string
    servicePlan: string
    customerStatus: string
  }
}

interface FilterState {
  startDate: string
  endDate: string
  bankAccount: string
  paymentMethod: string
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'bank' | 'payments' | 'collections' | 'transaction'
  className?: string
  color: string
}

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

// Production-grade color system
const COLORS = {
  primary: '#89A8B2',
  secondary: '#B3C8CF',
  tertiary: '#E5E1DA',
  background: '#F1F0E8',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#7C3AED',
  blue: '#3A86FF'
} as const

// Chart color palette
const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary, 
  '#6B8E95',
  '#9DB4BC',
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  '#8B5CF6'
]

// Icon colors for each metric type
const ICON_COLORS = {
  bank: COLORS.primary,
  payments: COLORS.success,
  collections: COLORS.warning,
  transaction: COLORS.purple
}

// Professional icon components
const IconBank: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21v6H3V3h7.5z" />
  </svg>
)

const IconPayments: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const IconCollections: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

const IconTransaction: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const IconCalendar: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const IconFilter: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
)

const IconRefresh: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const IconTrendUp: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const IconTrendDown: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
)

// Professional loading skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse" role="status" aria-label="Loading analytics data">
    {/* Header skeleton */}
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-[#E5E1DA] rounded"></div>
        <div className="h-4 w-96 bg-[#E5E1DA] rounded"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-20 w-48 bg-[#E5E1DA] rounded-lg"></div>
        <div className="h-20 w-32 bg-[#E5E1DA] rounded-lg"></div>
        <div className="h-20 w-32 bg-[#E5E1DA] rounded-lg"></div>
      </div>
    </div>

    {/* KPI cards skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-[#E5E1DA] rounded-lg"></div>
            <div className="w-16 h-4 bg-[#E5E1DA] rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-[#E5E1DA] rounded"></div>
            <div className="h-8 w-20 bg-[#E5E1DA] rounded"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="space-y-2 mb-6">
            <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
            <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
          </div>
          <div className="h-[300px] bg-[#F1F0E8] rounded-lg"></div>
        </div>
      ))}
    </div>
  </div>
)

// Production-grade KPI card component with colored icons
const KPICard: React.FC<KPICardProps> = ({ title, value, trend, iconType, className = "", color }) => {
  const iconComponents = {
    bank: IconBank,
    payments: IconPayments,
    collections: IconCollections,
    transaction: IconTransaction
  }

  const IconComponent = iconComponents[iconType]

  return (
    <div className={`bg-white rounded-xl border border-[#E5E1DA] p-6 hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300"
          style={{ backgroundColor: color }}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-semibold ${trend.isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {trend.isPositive ? (
              <IconTrendUp className="w-4 h-4 mr-1" />
            ) : (
              <IconTrendDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#6B7280] mb-2 leading-tight">{title}</h3>
        <p className="text-2xl font-bold text-[#1F2937] leading-none">{value}</p>
      </div>
    </div>
  )
}

// Production-grade custom tooltip
const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-xl shadow-lg p-4 min-w-[200px]">
      <p className="font-semibold text-[#1F2937] mb-3 border-b border-[#E5E1DA] pb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-3" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-[#6B7280]">{entry.name}</span>
            </div>
            <span className="text-sm font-bold text-[#1F2937]">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString()
                : entry.value
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Professional filter component
interface FilterPanelProps {
  filters: FilterState
  bankAccounts: BankAccount[]
  onFilterChange: (key: keyof FilterState, value: string) => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, bankAccounts, onFilterChange }) => (
  <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
    <div className="flex items-center mb-4">
      <IconFilter className="w-5 h-5 text-[#89A8B2] mr-2" />
      <h3 className="text-lg font-semibold text-[#1F2937]">Filters</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#374151] flex items-center">
          <IconCalendar className="w-4 h-4 mr-2 text-[#6B7280]" />
          Start Date
        </label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
          className="w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#374151] flex items-center">
          <IconCalendar className="w-4 h-4 mr-2 text-[#6B7280]" />
          End Date
        </label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
          className="w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#374151] flex items-center">
          <IconBank className="w-4 h-4 mr-2 text-[#6B7280]" />
          Bank Account
        </label>
        <select
          value={filters.bankAccount}
          onChange={(e) => onFilterChange('bankAccount', e.target.value)}
          className="w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
        >
          <option value="all">All Bank Accounts</option>
          {bankAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#374151] flex items-center">
          <IconPayments className="w-4 h-4 mr-2 text-[#6B7280]" />
          Payment Method
        </label>
        <select
          value={filters.paymentMethod}
          onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
          className="w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="online">Online Transfer</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="credit_card">Credit Card</option>
          <option value="mobile_payment">Mobile Payment</option>
        </select>
      </div>
    </div>
  </div>
)

// Main component
export const BankAccountAnalysis: React.FC<BankAccountAnalysisProps> = ({ filters }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<FilterState>({
    startDate: filters.dateRange.start.toISOString().split('T')[0],
    endDate: filters.dateRange.end.toISOString().split('T')[0],
    bankAccount: 'all',
    paymentMethod: 'all'
  })

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: localFilters.startDate,
        end_date: localFilters.endDate,
        bank_account_id: localFilters.bankAccount,
        payment_method: localFilters.paymentMethod
      })

      const response = await axiosInstance.get<AnalyticsData>(
        `/dashboard/bank-account-analytics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 30000,
        }
      )
      
      setAnalyticsData(response.data)
    } catch (err) {
      console.error("Bank account analytics fetch error:", err)
      setError("Unable to load bank account analytics. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [localFilters])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Safe data accessors with proper type checking
  const safeData = useMemo(() => {
    if (!analyticsData) return null
    
    return {
      paymentTrends: Array.isArray(analyticsData.payment_trends) ? analyticsData.payment_trends : [],
      accountPerformance: Array.isArray(analyticsData.account_performance) ? analyticsData.account_performance : [],
      paymentMethodDistribution: Array.isArray(analyticsData.payment_method_distribution) ? analyticsData.payment_method_distribution : [],
      topCustomers: Array.isArray(analyticsData.top_customers) ? analyticsData.top_customers : [],
      collectionMetrics: Array.isArray(analyticsData.collection_metrics) ? analyticsData.collection_metrics : [],
      transactionMetrics: Array.isArray(analyticsData.transaction_metrics) ? analyticsData.transaction_metrics : [],
      bankAccounts: Array.isArray(analyticsData.bank_accounts) ? analyticsData.bank_accounts : [],
      totalPayments: analyticsData.total_payments || 0
    }
  }, [analyticsData])

  // Calculated metrics with safe number handling
  const calculatedMetrics = useMemo(() => {
    if (!safeData) return {
      totalCollected: 0,
      avgTransactionValue: 0,
      avgCollectionRatio: 0
    }
    
    const totalCollected = safeData.collectionMetrics.reduce((sum, item) => {
      const value = typeof item?.total_collected === 'number' ? item.total_collected : 0
      return sum + value
    }, 0)
    
    const avgTransactionValue = safeData.transactionMetrics.length > 0 
      ? safeData.transactionMetrics.reduce((sum, item) => {
          const value = typeof item?.avg_transaction_value === 'number' ? item.avg_transaction_value : 0
          return sum + value
        }, 0) / safeData.transactionMetrics.length 
      : 0
      
    const avgCollectionRatio = safeData.collectionMetrics.length > 0
      ? safeData.collectionMetrics.reduce((sum, item) => {
          const value = typeof item?.collection_ratio === 'number' ? item.collection_ratio : 0
          return sum + value
        }, 0) / safeData.collectionMetrics.length
      : 0

    return {
      totalCollected: isNaN(totalCollected) ? 0 : totalCollected,
      avgTransactionValue: isNaN(avgTransactionValue) ? 0 : avgTransactionValue,
      avgCollectionRatio: isNaN(avgCollectionRatio) ? 0 : avgCollectionRatio
    }
  }, [safeData])

  const kpiData = useMemo(() => {
    if (!safeData || !calculatedMetrics) return []
    
    const safeNumber = (num: number | undefined | null) => {
      return typeof num === 'number' && !isNaN(num) ? num : 0
    }
    
    return [
      {
        title: "Total Payments",
        value: safeNumber(safeData.totalPayments).toLocaleString(),
        trend: { value: 15.2, isPositive: true },
        iconType: 'payments' as const,
        color: ICON_COLORS.payments
      },
      {
        title: "Active Bank Accounts",
        value: (safeData.bankAccounts?.length || 0).toString(),
        iconType: 'bank' as const,
        color: ICON_COLORS.bank
      },
      {
        title: "Total Collected",
        value: `PKR ${safeNumber(calculatedMetrics.totalCollected).toLocaleString()}`,
        trend: { value: 8.7, isPositive: true },
        iconType: 'collections' as const,
        color: ICON_COLORS.collections
      },
      {
        title: "Avg. Transaction Value",
        value: `PKR ${safeNumber(calculatedMetrics.avgTransactionValue).toLocaleString()}`,
        trend: { value: 2.3, isPositive: false },
        iconType: 'transaction' as const,
        color: ICON_COLORS.transaction
      }
    ]
  }, [safeData, calculatedMetrics])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#EF4444]/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-[#EF4444]/10 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#EF4444] mb-1">Failed to Load Data</h3>
              <p className="text-sm text-[#6B7280]">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading analytics data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!safeData || !calculatedMetrics) return null

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] mb-2">Bank Account Analysis</h2>
          <p className="text-[#6B7280]">Comprehensive analysis of payment flows, collections, and account performance</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-[#10B981]/10 px-3 py-2 rounded-lg border border-[#10B981]/20">
            <span className="text-[#10B981] font-medium">
              Collection Rate: {(calculatedMetrics?.avgCollectionRatio || 0).toFixed(1)}%
            </span>
          </div>
          <div className="bg-[#89A8B2]/10 px-3 py-2 rounded-lg border border-[#89A8B2]/20">
            <span className="text-[#89A8B2] font-medium">
              {localFilters.startDate} to {localFilters.endDate}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel 
        filters={localFilters}
        bankAccounts={safeData.bankAccounts}
        onFilterChange={handleFilterChange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Trends Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Payment Trends Over Time</h3>
            <p className="text-sm text-[#6B7280]">Monthly payment volume and transaction patterns</p>
          </div>
          {safeData.paymentTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={safeData.paymentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" opacity={0.7} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                />
                <YAxis 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#paymentGradient)"
                  name="Payment Amount"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Payment Trends</h4>
                <p className="text-sm text-[#6B7280]">No payment data available for the selected period</p>
              </div>
            </div>
          )}
        </div>

        {/* Account Performance Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Collections vs Outstanding</h3>
            <p className="text-sm text-[#6B7280]">Account-wise collection performance comparison</p>
          </div>
          {safeData.accountPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={safeData.accountPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={COLORS.warning} stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" opacity={0.7} />
                <XAxis 
                  dataKey="bank_account" 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                />
                <YAxis 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="collected" 
                  fill="url(#collectedGradient)" 
                  name="Collected"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="outstanding" 
                  fill="url(#outstandingGradient)" 
                  name="Outstanding"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                  <IconCollections className="w-8 h-8 text-[#89A8B2]" />
                </div>
                <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Performance Data</h4>
                <p className="text-sm text-[#6B7280]">No account performance data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Payment Method Breakdown</h3>
            <p className="text-sm text-[#6B7280]">Distribution of payments by method type</p>
          </div>
          {safeData.paymentMethodDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={safeData.paymentMethodDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, percent }) => `${method}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {safeData.paymentMethodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0]?.payload
                      if (!data) return null
                      return (
                        <div className="bg-white border border-[#E5E1DA] rounded-lg shadow-lg p-3">
                          <p className="font-semibold text-[#1F2937]">{data.method || 'Unknown'}</p>
                          <p className="text-sm text-[#6B7280]">Amount: PKR {(data.amount || 0).toLocaleString()}</p>
                          <p className="text-sm text-[#6B7280]">Count: {(data.count || 0).toLocaleString()}</p>
                        </div>
                      )
                    }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                  <IconPayments className="w-8 h-8 text-[#89A8B2]" />
                </div>
                <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Payment Methods</h4>
                <p className="text-sm text-[#6B7280]">No payment method data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Collection Ratios */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Collection Performance</h3>
            <p className="text-sm text-[#6B7280]">Collection ratios by bank account</p>
          </div>
          {safeData.collectionMetrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={safeData.collectionMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="ratioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" opacity={0.7} />
                <XAxis 
                  dataKey="bank_account" 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                />
                <YAxis 
                  tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                  tickLine={{ stroke: COLORS.tertiary }}
                  axisLine={{ stroke: COLORS.tertiary }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="collection_ratio" 
                  fill="url(#ratioGradient)" 
                  name="Collection Ratio (%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                  <IconTransaction className="w-8 h-8 text-[#89A8B2]" />
                </div>
                <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Collection Data</h4>
                <p className="text-sm text-[#6B7280]">No collection metrics available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Top Paying Customers</h3>
          <p className="text-sm text-[#6B7280]">Customers with highest payment volumes in the selected period</p>
        </div>
        {safeData.topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F0E8] border-b border-[#E5E1DA]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#374151]">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Name
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#374151]">
                    <div className="flex items-center">
                      <IconBank className="w-4 h-4 mr-2 text-[#6B7280]" />
                      Bank Account
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#374151]">
                    <div className="flex items-center">
                      <IconPayments className="w-4 h-4 mr-2 text-[#6B7280]" />
                      Total Paid
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#374151]">
                    <div className="flex items-center">
                      <IconTransaction className="w-4 h-4 mr-2 text-[#6B7280]" />
                      Transactions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1DA]">
                {safeData.topCustomers.slice(0, 10).map((customer, index) => (
                  <tr key={index} className="hover:bg-[#F1F0E8] transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#89A8B2] rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-[#1F2937]">{customer?.customer_name || 'Unknown Customer'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">{customer?.bank_account || 'Unknown Account'}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#10B981]">
                        PKR {(customer?.total_paid || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B7280]">
                      {(customer?.transaction_count || 0).toLocaleString() || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Customer Data</h4>
              <p className="text-sm text-[#6B7280]">No customer payment data available for the selected filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Metrics */}
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Transaction Metrics by Account</h3>
          <p className="text-sm text-[#6B7280]">Detailed transaction statistics for each bank account</p>
        </div>
        {safeData.transactionMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeData.transactionMetrics.map((metric, index) => (
              <div key={index} className="bg-[#F1F0E8] p-6 rounded-xl border border-[#E5E1DA] hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-[#1F2937] truncate">{metric?.bank_account || 'Unknown Account'}</h4>
                  <div className="w-10 h-10 bg-[#89A8B2] rounded-lg flex items-center justify-center">
                    <IconBank className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Avg Transaction</span>
                    <span className="text-lg font-bold text-[#1F2937]">
                      PKR {(metric?.avg_transaction_value || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Total Transactions</span>
                    <span className="text-lg font-bold text-[#89A8B2]">
                      {(metric?.transaction_count || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">Total Volume</span>
                    <span className="text-lg font-bold text-[#10B981]">
                      PKR {(metric?.total_volume || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-[#F1F0E8] rounded-lg border-2 border-dashed border-[#B3C8CF]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                <IconTransaction className="w-8 h-8 text-[#89A8B2]" />
              </div>
              <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Transaction Metrics</h4>
              <p className="text-sm text-[#6B7280]">No transaction data available for the selected filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}