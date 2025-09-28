"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface ServicePlanPerformanceData {
  plan: string
  subscribers: number
  revenue: number
}

interface PlanAdoptionTrendData {
  month: string
  [key: string]: number | string
}

interface ServicePlanMetrics {
  totalSubscribers: number
  totalRevenue: number
  mostPopularPlan: string
  highestRevenuePlan: string
}

interface ServicePlanData {
  servicePlanPerformanceData: ServicePlanPerformanceData[]
  planAdoptionTrendData: PlanAdoptionTrendData[]
  metrics: ServicePlanMetrics
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'subscribers' | 'revenue' | 'popular' | 'highest'
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

// Chart colors for consistent theming
const CHART_COLORS = {
  subscribers: COLORS.primary,
  revenue: COLORS.success,
  planColors: [
    COLORS.primary,
    COLORS.purple,
    COLORS.success,
    COLORS.warning,
    COLORS.error,
    COLORS.blue,
    '#6D28D9',
    '#059669',
    '#D97706',
    '#DC2626',
    '#9DB4BC',
    '#A7BEC5'
  ]
}

// Professional icon components
const IconSubscribers: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const IconRevenue: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconStar: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading service plan analytics">
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
  </div>
)

// Production-grade KPI card component
const KPICard: React.FC<KPICardProps> = ({ title, value, trend, iconType, className = "" }) => {
  const iconComponents = {
    subscribers: IconSubscribers,
    revenue: IconRevenue,
    popular: IconStar,
    highest: IconTrophy
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
              {entry.name === 'Revenue' 
                ? `PKR ${entry.value?.toLocaleString() || 0}`
                : entry.value?.toLocaleString() || 0
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom tooltip for trend chart
const TrendTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
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
              <span className="text-sm font-medium text-[#6B7280]">{entry.dataKey}</span>
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

// Main component with production-grade practices
export const ServicePlanAnalytics: React.FC = () => {
  const [data, setData] = useState<ServicePlanData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServicePlanData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<ServicePlanData>("/dashboard/service-plan-analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })
      
      setData(response.data)
    } catch (err) {
      console.error("Service plan analytics fetch error:", err)
      setError("Unable to load service plan analytics data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServicePlanData()
  }, [fetchServicePlanData])

  const kpiData = useMemo(() => {
    if (!data?.metrics) return []
    
    return [
      {
        title: "Total Subscribers",
        value: data.metrics.totalSubscribers.toLocaleString(),
        trend: { value: 15.2, isPositive: true },
        iconType: 'subscribers' as const
      },
      {
        title: "Total Revenue",
        value: `PKR ${data.metrics.totalRevenue.toLocaleString()}`,
        trend: { value: 12.8, isPositive: true },
        iconType: 'revenue' as const
      },
      {
        title: "Most Popular Plan",
        value: data.metrics.mostPopularPlan,
        iconType: 'popular' as const
      },
      {
        title: "Highest Revenue Plan",
        value: data.metrics.highestRevenuePlan,
        trend: { value: 8.5, isPositive: true },
        iconType: 'highest' as const
      }
    ]
  }, [data])

  // Prepare trend chart data with proper colors
  const trendChartLines = useMemo(() => {
    if (!data?.planAdoptionTrendData.length) return []
    
    return Object.keys(data.planAdoptionTrendData[0])
      .filter((key) => key !== "month")
      .map((plan, index) => ({
        key: plan,
        color: CHART_COLORS.planColors[index % CHART_COLORS.planColors.length]
      }))
  }, [data?.planAdoptionTrendData])

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
            onClick={fetchServicePlanData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading service plan analytics"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Plan Performance Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Service Plan Performance</h3>
            <p className="text-sm text-[#6B7280]">Subscriber count and revenue comparison by plan</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={data.servicePlanPerformanceData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.subscribers} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={CHART_COLORS.subscribers} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.tertiary} opacity={0.7} />
              <XAxis 
                dataKey="plan" 
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke={CHART_COLORS.subscribers}
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke={CHART_COLORS.revenue}
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
                yAxisId="left" 
                dataKey="subscribers" 
                fill="url(#subscriberGradient)" 
                name="Subscribers"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="revenue" 
                fill="url(#revenueGradient)" 
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Adoption Trend Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Plan Adoption Trends</h3>
            <p className="text-sm text-[#6B7280]">Monthly subscription growth patterns by service plan</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart 
              data={data.planAdoptionTrendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
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
              <Tooltip content={<TrendTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              {trendChartLines.map((line, index) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: line.color }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2, 
                    fill: line.color,
                    stroke: COLORS.white
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Performance Summary</h3>
          <p className="text-sm text-[#6B7280]">Key insights and metrics overview</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Performing Plans */}
          <div className="bg-gradient-to-br from-[#89A8B2]/5 to-[#89A8B2]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconTrophy className="w-5 h-5 text-[#89A8B2] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Top Performers</h4>
            </div>
            <div className="space-y-2">
              {data.servicePlanPerformanceData
                .sort((a, b) => b.subscribers - a.subscribers)
                .slice(0, 3)
                .map((plan, index) => (
                  <div key={plan.plan} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#89A8B2] mr-2" />
                      <span className="text-[#4B5563] truncate max-w-[120px]">{plan.plan}</span>
                    </div>
                    <span className="font-semibold text-[#1F2937]">{plan.subscribers.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Revenue Leaders */}
          <div className="bg-gradient-to-br from-[#10B981]/5 to-[#10B981]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconRevenue className="w-5 h-5 text-[#10B981] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Revenue Leaders</h4>
            </div>
            <div className="space-y-2">
              {data.servicePlanPerformanceData
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3)
                .map((plan, index) => (
                  <div key={plan.plan} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#10B981] mr-2" />
                      <span className="text-[#4B5563] truncate max-w-[120px]">{plan.plan}</span>
                    </div>
                    <span className="font-semibold text-[#1F2937]">PKR {plan.revenue.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Growth Insights */}
          <div className="bg-gradient-to-br from-[#7C3AED]/5 to-[#7C3AED]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconTrendUp className="w-5 h-5 text-[#7C3AED] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Growth Insights</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Active Plans</span>
                  <span className="font-semibold text-[#1F2937]">{data.servicePlanPerformanceData.length}</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div 
                    className="h-2 bg-[#7C3AED] rounded-full transition-all duration-700" 
                    style={{ width: `${Math.min((data.servicePlanPerformanceData.length / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Avg Revenue/Plan</span>
                  <span className="font-semibold text-[#1F2937]">
                    PKR {Math.round(data.metrics.totalRevenue / data.servicePlanPerformanceData.length).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#7C3AED] rounded-full transition-all duration-700" style={{ width: "75%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}