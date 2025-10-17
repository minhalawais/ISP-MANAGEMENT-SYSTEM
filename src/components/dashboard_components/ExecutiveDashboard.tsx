"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Ledger } from "./ledger/Ledger.tsx"

// Production-grade type definitions
interface CustomerGrowthData {
  month: string
  customers: number
}

interface ServicePlanData {
  name: string
  value: number
}

interface DashboardMetrics {
  total_active_customers: number
  monthly_recurring_revenue: number
  outstanding_payments: number
  active_complaints: number
}

interface ExecutiveDashboardData {
  customer_growth_data: CustomerGrowthData[]
  service_plan_data: ServicePlanData[]
  total_active_customers: number
  monthly_recurring_revenue: number
  outstanding_payments: number
  active_complaints: number
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'customers' | 'revenue' | 'payments' | 'complaints'
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
  purple: '#7C3AED',
  blue: '#3A86FF'
} as const

// Icon colors for each metric type
const ICON_COLORS = {
  customers: COLORS.primary,
  revenue: COLORS.success,
  payments: COLORS.warning,
  complaints: COLORS.error
}

// Professional icon components
const IconCustomers: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const IconRevenue: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconPayments: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
)

const IconComplaints: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const IconDashboard: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

const IconRefresh: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const IconSearch: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

// Production-grade loading skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading executive summary data">
    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-[#E5E1DA] rounded-lg"></div>
            <div className="w-12 h-4 bg-[#E5E1DA] rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-[#E5E1DA] rounded"></div>
            <div className="h-8 w-20 bg-[#E5E1DA] rounded"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="space-y-2 mb-6">
            <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
            <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
          </div>
          <div className="h-[350px] bg-[#F1F0E8] rounded-lg"></div>
        </div>
      ))}
    </div>

    {/* Service Plans Chart Skeleton */}
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
          <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-[#E5E1DA] rounded-lg"></div>
          <div className="h-10 w-24 bg-[#E5E1DA] rounded-lg"></div>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-3">
            <div className="w-8 h-8 bg-[#E5E1DA] rounded-lg"></div>
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-32 bg-[#E5E1DA] rounded"></div>
                <div className="h-4 w-16 bg-[#E5E1DA] rounded"></div>
              </div>
              <div className="h-2 bg-[#E5E1DA] rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Production-grade KPI card component with colored icons
const KPICard: React.FC<KPICardProps> = ({ title, value, trend, iconType, className = "", color }) => {
  const iconComponents = {
    customers: IconCustomers,
    revenue: IconRevenue,
    payments: IconPayments,
    complaints: IconComplaints
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
              <span className="text-sm font-medium text-[#6B7280]">{entry.name || entry.dataKey}</span>
            </div>
            <span className="text-sm font-bold text-[#1F2937]">
              {entry.value?.toLocaleString() || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced service plan chart component
const ServicePlanChart: React.FC<{ data: ServicePlanData[] }> = ({ data }) => {
  const [showAll, setShowAll] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.value - a.value)
  }, [data, searchTerm])

  const displayData = useMemo(() => {
    return showAll ? filteredAndSortedData : filteredAndSortedData.slice(0, 8)
  }, [filteredAndSortedData, showAll])

  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const chartColors = useMemo(() => {
    const baseColors = [COLORS.primary, COLORS.secondary, '#9DB4BC', '#A7BEC5', '#B8C9CE', COLORS.success, COLORS.warning, COLORS.purple]
    return Array.from({ length: 20 }, (_, i) => {
      const baseIndex = i % baseColors.length
      const opacity = 1 - (Math.floor(i / baseColors.length) * 0.15)
      return `${baseColors[baseIndex]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
    })
  }, [])

  return (
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Active Service Plans Distribution</h3>
          <p className="text-sm text-[#6B7280]">Current service plan subscriptions ({data.length} total plans)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            
            <input
              type="text"
              placeholder="Search service plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-48 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
              aria-label="Search service plans"
            />
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-medium text-[#89A8B2] hover:text-white hover:bg-[#89A8B2] border border-[#89A8B2] rounded-lg transition-all duration-200"
            aria-label={showAll ? 'Show only top 8 plans' : 'Show all plans'}
          >
            {showAll ? 'Show Top 8' : `Show All (${filteredAndSortedData.length})`}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayData.map((item, index) => {
          const percentage = (item.value / totalValue) * 100
          const color = chartColors[index] || COLORS.primary
          
          return (
            <div 
              key={item.name} 
              className="flex items-center space-x-4 p-4 rounded-lg hover:bg-[#F1F0E8] transition-colors duration-200 group"
            >
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm group-hover:scale-105 transition-transform duration-200" 
                style={{ backgroundColor: color }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[#1F2937] truncate pr-2">{item.name}</h4>
                  <div className="flex items-center space-x-3 text-sm font-bold text-[#1F2937]">
                    <span>{item.value.toLocaleString()}</span>
                    <span className="text-xs text-[#6B7280]">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`, 
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAndSortedData.length > 8 && (
        <div className="mt-6 pt-4 border-t border-[#E5E1DA] text-center">
          <p className="text-sm text-[#6B7280]">
            Showing {displayData.length} of {filteredAndSortedData.length} service plans
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  )
}

// Main Executive Dashboard component
export const ExecutiveDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"executive" | "ledger">("executive")

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<ExecutiveDashboardData>("/dashboard/executive-summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })
      
      setDashboardData(response.data)
    } catch (err) {
      console.error("Executive summary fetch error:", err)
      setError("Unable to load executive summary data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const kpiData = useMemo(() => {
    if (!dashboardData) return []
    
    return [
      {
        title: "Total Active Customers",
        value: dashboardData.total_active_customers.toLocaleString(),
        trend: { value: 8.2, isPositive: true },
        iconType: 'customers' as const,
        color: ICON_COLORS.customers
      },
      {
        title: "Monthly Recurring Revenue",
        value: `PKR ${dashboardData.monthly_recurring_revenue.toLocaleString()}`,
        trend: { value: 12.5, isPositive: true },
        iconType: 'revenue' as const,
        color: ICON_COLORS.revenue
      },
      {
        title: "Outstanding Payments",
        value: `PKR ${dashboardData.outstanding_payments.toLocaleString()}`,
        trend: { value: 5.3, isPositive: false },
        iconType: 'payments' as const,
        color: ICON_COLORS.payments
      },
      {
        title: "Active Complaints",
        value: dashboardData.active_complaints.toLocaleString(),
        trend: { value: 15.7, isPositive: dashboardData.active_complaints < 50 },
        iconType: 'complaints' as const,
        color: ICON_COLORS.complaints
      }
    ]
  }, [dashboardData])

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
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading executive summary data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  return (
    <div className="space-y-8">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <IconDashboard className="w-8 h-8 mr-3" style={{ color: COLORS.primary }} />
          <h2 className="text-3xl font-bold" style={{ color: COLORS.gray[800] }}>
            Executive Dashboard
          </h2>
        </div>
        
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 w-full sm:w-auto bg-[#F1F0E8] border border-[#E5E1DA] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("executive")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "executive"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "ledger"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            Ledger
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "executive" && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiData.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Customer Growth Trend */}
              <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#1F2937] mb-2">Customer Growth Trend</h3>
                  <p className="text-sm text-[#6B7280]">Monthly customer acquisition and growth patterns</p>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart 
                    data={dashboardData.customer_growth_data} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="customerGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.tertiary} opacity={0.7} />
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
                    <Area
                      type="monotone"
                      dataKey="customers"
                      stroke={COLORS.primary}
                      strokeWidth={3}
                      fill="url(#customerGrowthGradient)"
                      dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                      name="Customers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Business Health Overview Placeholder */}
              <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#1F2937] mb-2">Business Health Overview</h3>
                  <p className="text-sm text-[#6B7280]">Key performance indicators and health metrics</p>
                </div>
                <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-xl border-2 border-dashed border-[#B3C8CF]">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-[#1F2937] mb-2">Advanced Analytics</h4>
                    <p className="text-sm text-[#6B7280] mb-4">Comprehensive business insights coming soon</p>
                    <button className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] transition-colors duration-200 text-sm font-medium">
                      View Detailed Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Plan Distribution */}
            <div className="mt-8">
              <ServicePlanChart data={dashboardData.service_plan_data} />
            </div>
          </>
        )}

        {activeTab === "ledger" && (
          <div className="mt-4">
            <Ledger />
          </div>
        )}
      </div>
    </div>
  )
}