"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface PerformanceData {
  employee: string
  tasks: number
  satisfaction: number
}

interface ProductivityTrendData {
  month: string
  productivity: number
}

interface EmployeeMetrics {
  avgTasksCompleted: number
  avgSatisfactionScore: number
  topPerformer: string
  trainingCompletionRate: number
}

interface EmployeeAnalyticsData {
  performanceData: PerformanceData[]
  productivityTrendData: ProductivityTrendData[]
  metrics: EmployeeMetrics
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'tasks' | 'satisfaction' | 'trophy' | 'training'
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
  tasks: COLORS.primary,
  satisfaction: COLORS.success,
  trophy: COLORS.warning,
  training: COLORS.purple
}

// Professional icon components
const IconTasks: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const IconSatisfaction: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconTrophy: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const IconTraining: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const IconUsers: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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

const IconFilter: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

// Production-grade loading skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading employee performance data">
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

    {/* Performance Table Skeleton */}
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="space-y-2 mb-6">
        <div className="h-6 w-48 bg-[#E5E1DA] rounded"></div>
        <div className="h-4 w-64 bg-[#E5E1DA] rounded"></div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-3">
            <div className="w-10 h-10 bg-[#E5E1DA] rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-[#E5E1DA] rounded"></div>
              <div className="flex space-x-2">
                <div className="h-2 w-20 bg-[#E5E1DA] rounded-full"></div>
                <div className="h-2 w-16 bg-[#E5E1DA] rounded-full"></div>
              </div>
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
    tasks: IconTasks,
    satisfaction: IconSatisfaction,
    trophy: IconTrophy,
    training: IconTraining
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
              {entry.name === 'Satisfaction Score' ? '/5' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced employee performance table
const EmployeePerformanceTable: React.FC<{ data: PerformanceData[] }> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'tasks' | 'satisfaction' | 'employee'>('tasks')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }, [data, sortBy, sortOrder])

  const handleSort = (field: 'tasks' | 'satisfaction' | 'employee') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Employee Performance Ranking</h3>
          <p className="text-sm text-[#6B7280]">Individual performance metrics and rankings</p>
        </div>
        <div className="flex items-center space-x-2">
          <IconFilter className="w-4 h-4 text-[#6B7280]" />
          <span className="text-sm text-[#6B7280]">Sort by: {sortBy}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F1F0E8] rounded-lg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider rounded-l-lg">
                Rank
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#E5E1DA] transition-colors"
                onClick={() => handleSort('employee')}
              >
                Employee
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#E5E1DA] transition-colors"
                onClick={() => handleSort('tasks')}
              >
                Tasks Completed
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#E5E1DA] transition-colors rounded-r-lg"
                onClick={() => handleSort('satisfaction')}
              >
                Satisfaction Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E1DA]">
            {sortedData.map((employee, index) => (
              <tr key={employee.employee} className="hover:bg-[#F1F0E8] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-[#89A8B2]'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#89A8B2]/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-[#89A8B2]">
                        {employee.employee.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-[#1F2937]">{employee.employee}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#1F2937] font-semibold">{employee.tasks}</div>
                  <div className="w-full bg-[#E5E1DA] rounded-full h-2 mt-1">
                    <div 
                      className="bg-[#89A8B2] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(employee.tasks / Math.max(...data.map(d => d.tasks))) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-[#1F2937] mr-2">{employee.satisfaction}/5</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < employee.satisfaction ? 'text-yellow-400' : 'text-[#E5E1DA]'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Main component with production-grade practices
export const EmployeePerformance: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<EmployeeAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<EmployeeAnalyticsData>("/dashboard/employee-analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })
      
      setAnalyticsData(response.data)
    } catch (err) {
      console.error("Employee analytics fetch error:", err)
      setError("Unable to load employee performance data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const kpiData = useMemo(() => {
    if (!analyticsData?.metrics) return []
    
    return [
      {
        title: "Average Tasks Completed",
        value: analyticsData.metrics.avgTasksCompleted,
        trend: { value: 8.5, isPositive: true },
        iconType: 'tasks' as const,
        color: ICON_COLORS.tasks
      },
      {
        title: "Average Satisfaction Score",
        value: `${analyticsData.metrics.avgSatisfactionScore}/5`,
        trend: { value: 12.3, isPositive: true },
        iconType: 'satisfaction' as const,
        color: ICON_COLORS.satisfaction
      },
      {
        title: "Top Performer",
        value: analyticsData.metrics.topPerformer,
        iconType: 'trophy' as const,
        color: ICON_COLORS.trophy
      },
      {
        title: "Training Completion Rate",
        value: `${analyticsData.metrics.trainingCompletionRate}%`,
        trend: { value: 15.2, isPositive: analyticsData.metrics.trainingCompletionRate > 80 },
        iconType: 'training' as const,
        color: ICON_COLORS.training
      }
    ]
  }, [analyticsData])

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
            aria-label="Retry loading employee performance data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[#1F2937] mb-2">Employee Performance Analytics</h2>
        <p className="text-[#6B7280]">Comprehensive analysis of employee productivity, satisfaction, and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Performance Overview */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Performance Overview</h3>
            <p className="text-sm text-[#6B7280]">Tasks completed vs satisfaction scores by employee</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={analyticsData.performanceData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.9}/>
                  <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.tertiary} opacity={0.7} />
              <XAxis 
                dataKey="employee" 
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke={COLORS.primary}
                tick={{ fill: COLORS.gray[600], fontSize: 12 }}
                tickLine={{ stroke: COLORS.tertiary }}
                axisLine={{ stroke: COLORS.tertiary }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke={COLORS.success}
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
                dataKey="tasks" 
                fill="url(#tasksGradient)" 
                name="Tasks Completed"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="satisfaction" 
                fill="url(#satisfactionGradient)" 
                name="Satisfaction Score"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Trend */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Productivity Trend</h3>
            <p className="text-sm text-[#6B7280]">Monthly productivity tracking and performance trends</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart 
              data={analyticsData.productivityTrendData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.1}/>
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
                dataKey="productivity"
                stroke={COLORS.purple}
                strokeWidth={3}
                fill="url(#productivityGradient)"
                dot={{ fill: COLORS.purple, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.purple, strokeWidth: 2 }}
                name="Productivity"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Performance Table */}
      <EmployeePerformanceTable data={analyticsData.performanceData} />
    </div>
  )
}