"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface NetworkPerformanceData {
  month: string
  uptime: number
  latency: number
}

interface ServiceRequestData {
  type: string
  count: number
}

interface OperationalMetricsData {
  averageUptime: number
  averageLatency: number
  totalServiceRequests: number
  avgResolutionTime: number
}

interface OperationalData {
  networkPerformanceData: NetworkPerformanceData[]
  serviceRequestsData: ServiceRequestData[]
  metrics: OperationalMetricsData
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'uptime' | 'latency' | 'requests' | 'resolution'
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

// Chart colors for consistent theming
const CHART_COLORS = {
  uptime: COLORS.success,
  latency: COLORS.blue,
  serviceRequests: COLORS.purple,
  resolution: COLORS.warning
}

// Professional icon components
const IconUptime: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconLatency: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconRequests: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
)

const IconResolution: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading operational metrics">
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
const KPICard: React.FC<KPICardProps> = ({ title, value, trend, iconType, className = "", color }) => {
  const iconComponents = {
    uptime: IconUptime,
    latency: IconLatency,
    requests: IconRequests,
    resolution: IconResolution
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

// Production-grade custom tooltip for line chart
const NetworkTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
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
              {entry.name === 'Uptime %' 
                ? `${entry.value}%`
                : `${entry.value} ms`
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Production-grade custom tooltip for bar chart
const ServiceTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
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
              <span className="text-sm font-medium text-[#6B7280]">Requests</span>
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

// Mock data - replace with API call
const mockData: OperationalData = {
  networkPerformanceData: [
    { month: "Jan", uptime: 99.9, latency: 20 },
    { month: "Feb", uptime: 99.8, latency: 22 },
    { month: "Mar", uptime: 99.95, latency: 18 },
    { month: "Apr", uptime: 99.7, latency: 25 },
    { month: "May", uptime: 99.85, latency: 21 },
    { month: "Jun", uptime: 99.9, latency: 19 },
  ],
  serviceRequestsData: [
    { type: "Installation", count: 150 },
    { type: "Repair", count: 100 },
    { type: "Upgrade", count: 80 },
    { type: "Cancellation", count: 30 },
    { type: "Billing Inquiry", count: 120 },
  ],
  metrics: {
    averageUptime: 99.85,
    averageLatency: 20.8,
    totalServiceRequests: 480,
    avgResolutionTime: 4.5
  }
}

// Main component with production-grade practices
export const OperationalMetrics: React.FC = () => {
  const [data, setData] = useState<OperationalData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOperationalData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      setData(mockData)
      
      /* Uncomment when API is available
      const response = await axiosInstance.get<OperationalData>("/dashboard/operational-metrics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000,
      })
      setData(response.data)
      */
    } catch (err) {
      console.error("Operational metrics fetch error:", err)
      setError("Unable to load operational metrics data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOperationalData()
  }, [fetchOperationalData])

  const kpiData = useMemo(() => {
    if (!data?.metrics) return []
    
    return [
      {
        title: "Average Uptime",
        value: `${data.metrics.averageUptime}%`,
        trend: { value: 0.2, isPositive: true },
        iconType: 'uptime' as const,
        color: CHART_COLORS.uptime
      },
      {
        title: "Average Latency",
        value: `${data.metrics.averageLatency} ms`,
        trend: { value: 5.4, isPositive: false },
        iconType: 'latency' as const,
        color: CHART_COLORS.latency
      },
      {
        title: "Total Service Requests",
        value: data.metrics.totalServiceRequests.toLocaleString(),
        trend: { value: 12.3, isPositive: true },
        iconType: 'requests' as const,
        color: CHART_COLORS.serviceRequests
      },
      {
        title: "Avg. Resolution Time",
        value: `${data.metrics.avgResolutionTime} hours`,
        trend: { value: 8.1, isPositive: false },
        iconType: 'resolution' as const,
        color: CHART_COLORS.resolution
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
            onClick={fetchOperationalData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading operational metrics"
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
        {/* Network Performance Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Network Performance Trends</h3>
            <p className="text-sm text-[#6B7280]">Monthly uptime percentage and latency monitoring</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart 
              data={data.networkPerformanceData}
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
                yAxisId="left" 
                orientation="left" 
                stroke={CHART_COLORS.uptime}
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
                domain={[99.5, 100]}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke={CHART_COLORS.latency}
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
              />
              <Tooltip content={<NetworkTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="uptime"
                stroke={CHART_COLORS.uptime}
                name="Uptime %"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: CHART_COLORS.uptime }}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2, 
                  fill: CHART_COLORS.uptime,
                  stroke: COLORS.white
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="latency"
                stroke={CHART_COLORS.latency}
                name="Latency (ms)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: CHART_COLORS.latency }}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2, 
                  fill: CHART_COLORS.latency,
                  stroke: COLORS.white
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Requests Chart */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Service Request Distribution</h3>
            <p className="text-sm text-[#6B7280]">Breakdown of service request types and volumes</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={data.serviceRequestsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="serviceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.serviceRequests} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={CHART_COLORS.serviceRequests} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.tertiary} opacity={0.7} />
              <XAxis 
                dataKey="type" 
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
              />
              <Tooltip content={<ServiceTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="rect"
              />
              <Bar 
                dataKey="count" 
                fill="url(#serviceGradient)" 
                name="Service Requests"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Performance Insights</h3>
          <p className="text-sm text-[#6B7280]">Key operational metrics and trend analysis</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Network Health */}
          <div className="bg-gradient-to-br from-[#10B981]/5 to-[#10B981]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconUptime className="w-5 h-5 text-[#10B981] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Network Health</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Current Uptime</span>
                  <span className="font-semibold text-[#1F2937]">99.9%</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#10B981] rounded-full transition-all duration-700" style={{ width: "99.9%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Target SLA</span>
                  <span className="font-semibold text-[#1F2937]">99.5%</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#10B981] rounded-full transition-all duration-700" style={{ width: "95%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-gradient-to-br from-[#3A86FF]/5 to-[#3A86FF]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconLatency className="w-5 h-5 text-[#3A86FF] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Response Times</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Avg Latency</span>
                  <span className="font-semibold text-[#1F2937]">20.8ms</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#3A86FF] rounded-full transition-all duration-700" style={{ width: "70%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Target &lt; 30ms</span>
                  <span className="font-semibold text-[#10B981]">✓ Met</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#10B981] rounded-full transition-all duration-700" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Service Efficiency */}
          <div className="bg-gradient-to-br from-[#7C3AED]/5 to-[#7C3AED]/10 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <IconResolution className="w-5 h-5 text-[#7C3AED] mr-2" />
              <h4 className="font-semibold text-[#1F2937]">Service Efficiency</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Resolution Rate</span>
                  <span className="font-semibold text-[#1F2937]">94.2%</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#7C3AED] rounded-full transition-all duration-700" style={{ width: "94.2%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-[#6B7280]">Avg Resolution</span>
                  <span className="font-semibold text-[#1F2937]">4.5hrs</span>
                </div>
                <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                  <div className="h-2 bg-[#7C3AED] rounded-full transition-all duration-700" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Request Breakdown */}
        <div className="mt-6 pt-6 border-t border-[#E5E1DA]">
          <h4 className="font-semibold text-[#1F2937] mb-4">Service Request Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.serviceRequestsData.map((service, index) => {
              const percentage = (service.count / data.metrics.totalServiceRequests) * 100
              const colors = ['#89A8B2', '#10B981', '#7C3AED', '#F59E0B', '#EF4444']
              const color = colors[index % colors.length]
              
              return (
                <div key={service.type} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-[#6B7280]">{service.type}</span>
                  </div>
                  <div className="text-lg font-bold text-[#1F2937]">{service.count}</div>
                  <div className="text-xs text-[#6B7280]">({percentage.toFixed(1)}%)</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}