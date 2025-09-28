"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface RecoveryPerformanceData {
  month: string
  recovered: number
  outstanding: number
}

interface OutstandingByAgeData {
  name: string
  value: number
}

interface RecoveryMetrics {
  totalRecovered: number
  totalOutstanding: number
  recoveryRate: number
  avgCollectionTime: number
}

interface RecoveryCollectionsData {
  recoveryPerformanceData: RecoveryPerformanceData[]
  outstandingByAgeData: OutstandingByAgeData[]
  metrics: RecoveryMetrics
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'recovered' | 'outstanding' | 'rate' | 'time'
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
  recovered: COLORS.success,
  outstanding: COLORS.warning,
  rate: COLORS.primary,
  time: COLORS.purple
}

// Professional icon components
const IconRecovered: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const IconOutstanding: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const IconRate: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const IconTime: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconCollections: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading recovery and collections data">
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

    {/* Outstanding Analysis Skeleton */}
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
        {Array.from({ length: 4 }).map((_, index) => (
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
    recovered: IconRecovered,
    outstanding: IconOutstanding,
    rate: IconRate,
    time: IconTime
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
              PKR {entry.value?.toLocaleString() || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced outstanding analysis component
const OutstandingAnalysisChart: React.FC<{ data: OutstandingByAgeData[] }> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.value - a.value)
  }, [data, searchTerm])

  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const chartColors = useMemo(() => {
    const baseColors = [COLORS.error, COLORS.warning, COLORS.primary, COLORS.success]
    return Array.from({ length: 10 }, (_, i) => {
      const baseIndex = i % baseColors.length
      const opacity = 1 - (Math.floor(i / baseColors.length) * 0.15)
      return `${baseColors[baseIndex]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
    })
  }, [])

  const getAgeColor = (name: string) => {
    if (name.includes('90+') || name.includes('Over')) return COLORS.error
    if (name.includes('60-89') || name.includes('60+')) return COLORS.warning
    if (name.includes('30-59')) return COLORS.primary
    return COLORS.success
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Outstanding by Age Analysis</h3>
          <p className="text-sm text-[#6B7280]">Outstanding amounts categorized by aging periods ({data.length} categories)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            
            <input
              type="text"
              placeholder="Search age groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-48 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
              aria-label="Search age groups"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAndSortedData.map((item, index) => {
          const percentage = (item.value / totalValue) * 100
          const color = getAgeColor(item.name)
          
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
                    <span>PKR {item.value.toLocaleString()}</span>
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

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#6B7280]">No age groups found matching your search.</p>
        </div>
      )}
    </div>
  )
}

// Main component with production-grade practices
export const RecoveryCollections: React.FC = () => {
  const [recoveryData, setRecoveryData] = useState<RecoveryCollectionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecoveryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<RecoveryCollectionsData>("/dashboard/recovery-collections", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })
      
      setRecoveryData(response.data)
    } catch (err) {
      console.error("Recovery collections fetch error:", err)
      setError("Unable to load recovery and collections data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecoveryData()
  }, [fetchRecoveryData])

  const kpiData = useMemo(() => {
    if (!recoveryData?.metrics) return []
    
    return [
      {
        title: "Total Recovered",
        value: `PKR ${recoveryData.metrics.totalRecovered.toLocaleString()}`,
        trend: { value: 18.5, isPositive: true },
        iconType: 'recovered' as const,
        color: ICON_COLORS.recovered
      },
      {
        title: "Total Outstanding",
        value: `PKR ${recoveryData.metrics.totalOutstanding.toLocaleString()}`,
        trend: { value: 7.2, isPositive: false },
        iconType: 'outstanding' as const,
        color: ICON_COLORS.outstanding
      },
      {
        title: "Recovery Rate",
        value: `${recoveryData.metrics.recoveryRate.toFixed(2)}%`,
        trend: { value: 12.3, isPositive: recoveryData.metrics.recoveryRate > 75 },
        iconType: 'rate' as const,
        color: ICON_COLORS.rate
      },
      {
        title: "Avg Collection Time",
        value: `${recoveryData.metrics.avgCollectionTime} days`,
        trend: { value: 8.7, isPositive: recoveryData.metrics.avgCollectionTime < 30 },
        iconType: 'time' as const,
        color: ICON_COLORS.time
      }
    ]
  }, [recoveryData])

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
            onClick={fetchRecoveryData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading recovery and collections data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!recoveryData) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <IconCollections className="w-8 h-8 mr-3" style={{ color: COLORS.primary }} />
        <h2 className="text-3xl font-bold" style={{ color: COLORS.gray[800] }}>
          Recovery & Collections
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
        {/* Recovery Performance */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Recovery Performance</h3>
            <p className="text-sm text-[#6B7280]">Monthly comparison of recovered vs outstanding amounts</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart 
              data={recoveryData.recoveryPerformanceData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={COLORS.warning} stopOpacity={0.1}/>
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
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="rect"
              />
              <Area
                type="monotone"
                dataKey="recovered"
                stackId="1"
                stroke={COLORS.success}
                strokeWidth={2}
                fill="url(#recoveredGradient)"
                name="Recovered Amount"
              />
              <Area
                type="monotone"
                dataKey="outstanding"
                stackId="2"
                stroke={COLORS.warning}
                strokeWidth={2}
                fill="url(#outstandingGradient)"
                name="Outstanding Amount"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Strategy Overview Placeholder */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Collection Strategy Overview</h3>
            <p className="text-sm text-[#6B7280]">Strategic insights and collection effectiveness metrics</p>
          </div>
          <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-xl border-2 border-dashed border-[#B3C8CF]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#1F2937] mb-2">Advanced Collection Analytics</h4>
              <p className="text-sm text-[#6B7280] mb-4">Detailed collection strategies and performance insights coming soon</p>
              <button className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] transition-colors duration-200 text-sm font-medium">
                View Collection Strategy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Analysis */}
      <OutstandingAnalysisChart data={recoveryData.outstandingByAgeData} />
    </div>
  )
}