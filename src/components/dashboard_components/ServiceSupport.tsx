"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface StatusDistribution {
  [key: string]: number
}

interface ServiceSupportData {
  status_distribution: StatusDistribution
  average_resolution_time: number
  customer_satisfaction_rate: number
  first_contact_resolution_rate: number
  support_ticket_volume: number
  remarks_summary: string[]
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'resolution' | 'satisfaction' | 'contact' | 'volume'
  className?: string
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

// Professional icon components
const IconResolution: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconSatisfaction: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconContact: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const IconVolume: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const IconSupport: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
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

// Production-grade loading skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading service support data">
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
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="space-y-2 mb-6">
          <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
          <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
        </div>
        <div className="h-[350px] bg-[#F1F0E8] rounded-lg"></div>
      </div>
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="space-y-2 mb-6">
          <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
          <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
        </div>
        <div className="h-[350px] bg-[#F1F0E8] rounded-lg"></div>
      </div>
    </div>

    {/* Remarks Skeleton */}
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="space-y-2 mb-6">
        <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
        <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-[#E5E1DA] rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 w-full bg-[#E5E1DA] rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-[#E5E1DA] rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Production-grade KPI card component
const KPICard: React.FC<KPICardProps> = ({ title, value, trend, iconType, className = "" }) => {
  const iconComponents = {
    resolution: IconResolution,
    satisfaction: IconSatisfaction,
    contact: IconContact,
    volume: IconVolume
  }

  const IconComponent = iconComponents[iconType]

  return (
    <div className={`bg-white rounded-xl border border-[#E5E1DA] p-6 hover:shadow-lg transition-all duration-300 group ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#89A8B2]/10 to-[#89A8B2]/20 flex items-center justify-center text-[#89A8B2] group-hover:scale-110 transition-transform duration-300">
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

// Production-grade custom tooltip for pie chart
const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null

  const data = payload[0]
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-xl shadow-lg p-4 min-w-[150px]">
      <div className="flex items-center">
        <div 
          className="w-3 h-3 rounded-full mr-3" 
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="text-sm font-medium text-[#6B7280]">{data.name}</p>
          <p className="text-lg font-bold text-[#1F2937]">{data.value}</p>
        </div>
      </div>
    </div>
  )
}

// Main component with production-grade practices
export const ServiceSupport: React.FC = () => {
  const [data, setData] = useState<ServiceSupportData>({
    status_distribution: {},
    average_resolution_time: 0,
    customer_satisfaction_rate: 0,
    first_contact_resolution_rate: 0,
    support_ticket_volume: 0,
    remarks_summary: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<ServiceSupportData>("/dashboard/service-support", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })

      if (response.data && !('error' in response.data)) {
        setData(response.data)
      } else {
        setError('error' in response.data ? response.data.error as string : "Unknown error")
      }
    } catch (error) {
      console.error("Service support fetch error:", error)
      setError("Unable to load service support data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchData])

  // Custom status colors (keeping original logic)
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "#F59E0B" // Golden Amber
      case "in progress":
        return "#3A86FF" // Electric Blue
      case "resolved":
        return "#10B981" // Emerald Green
      case "closed":
        return "#4A5568" // Slate Gray
      default:
        return "#7C3AED" // Violet
    }
  }

  const statusDistributionData = useMemo(() => {
    return Object.entries(data.status_distribution || {}).map(([name, value]) => ({
      name,
      value,
    }))
  }, [data.status_distribution])

  const kpiData = useMemo(() => {
    return [
      {
        title: "Average Resolution Time",
        value: `${data.average_resolution_time} hours`,
        trend: { value: 8.3, isPositive: false },
        iconType: 'resolution' as const
      },
      {
        title: "Customer Satisfaction",
        value: `${data.customer_satisfaction_rate}%`,
        trend: { value: 12.7, isPositive: true },
        iconType: 'satisfaction' as const
      },
      {
        title: "First Contact Resolution",
        value: `${data.first_contact_resolution_rate}%`,
        trend: { value: 15.2, isPositive: true },
        iconType: 'contact' as const
      },
      {
        title: "Support Ticket Volume",
        value: data.support_ticket_volume.toString(),
        trend: { value: 5.8, isPositive: false },
        iconType: 'volume' as const
      }
    ]
  }, [data])

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
            onClick={fetchData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading service support data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <IconSupport className="w-8 h-8 mr-3" style={{ color: COLORS.primary }} />
        <h2 className="text-3xl font-bold" style={{ color: COLORS.gray[800] }}>
          Service & Support
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Status Distribution */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Complaint Status Distribution</h3>
            <p className="text-sm text-[#6B7280]">Current status breakdown of support tickets and complaints</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusDistributionData.map((entry, index) => {
                  const statusName = entry.name.toString().toLowerCase()
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getStatusColor(statusName)} 
                      stroke="#FFFFFF" 
                      strokeWidth={2} 
                    />
                  )
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center" 
                wrapperStyle={{ paddingTop: "20px" }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Support Performance Overview Placeholder */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Support Performance Overview</h3>
            <p className="text-sm text-[#6B7280]">Comprehensive support metrics and performance trends</p>
          </div>
          <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-xl border-2 border-dashed border-[#B3C8CF]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#1F2937] mb-2">Advanced Support Analytics</h4>
              <p className="text-sm text-[#6B7280] mb-4">Detailed performance insights and trends coming soon</p>
              <button className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] transition-colors duration-200 text-sm font-medium">
                View Performance Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Remarks Summary */}
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Recent Remarks Summary</h3>
          <p className="text-sm text-[#6B7280]">Latest feedback and remarks from support interactions</p>
        </div>
        
        {data.remarks_summary.length > 0 ? (
          <div className="space-y-4">
            {data.remarks_summary.map((remark: string, index: number) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-[#F1F0E8] transition-colors duration-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#89A8B2]/10 to-[#89A8B2]/20 flex items-center justify-center text-[#89A8B2] font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[#1F2937] leading-relaxed">{remark}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-[#1F2937] mb-2">No Remarks Available</h4>
            <p className="text-sm text-[#6B7280]">Recent support remarks will appear here when available</p>
          </div>
        )}
      </div>
    </div>
  )
}