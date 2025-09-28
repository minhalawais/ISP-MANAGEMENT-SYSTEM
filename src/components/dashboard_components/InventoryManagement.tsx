"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

// Production-grade type definitions
interface StockLevelData {
  name: string
  quantity: number
  minStock?: number
  maxStock?: number
}

interface MovementData {
  month: string
  assignments: number
  returns: number
}

interface InventoryMetrics {
  total_inventory_value: number
  inventory_turnover_rate: number
  low_stock_items: number
  avg_assignment_duration: number
}

interface InventoryData {
  stock_level_data: {
    stock_levels: StockLevelData[]
  }
  inventory_movement_data: {
    movement_data: MovementData[]
  }
  inventory_metrics: InventoryMetrics
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  iconType: 'value' | 'turnover' | 'stock' | 'duration'
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
  value: COLORS.success,
  turnover: COLORS.primary,
  stock: COLORS.error,
  duration: COLORS.purple
}

// Professional icon components
const IconInventoryValue: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const IconTurnover: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const IconLowStock: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const IconDuration: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconInventory: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

const IconFilter: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

// Production-grade loading skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Loading inventory management data">
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

    {/* Stock Analysis Skeleton */}
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
        {Array.from({ length: 5 }).map((_, index) => (
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
    value: IconInventoryValue,
    turnover: IconTurnover,
    stock: IconLowStock,
    duration: IconDuration
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

// Enhanced stock analysis component
const StockAnalysisChart: React.FC<{ data: StockLevelData[] }> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('quantity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
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
  }, [data, searchTerm, sortBy, sortOrder])

  const handleSort = (field: 'name' | 'quantity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getStockStatus = (quantity: number, minStock?: number, maxStock?: number) => {
    if (minStock && quantity <= minStock) return { status: 'low', color: COLORS.error }
    if (maxStock && quantity >= maxStock) return { status: 'high', color: COLORS.warning }
    return { status: 'normal', color: COLORS.success }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold text-[#1F2937] mb-2">Stock Level Analysis</h3>
          <p className="text-sm text-[#6B7280]">Current inventory levels and stock status ({data.length} items)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-48 border border-[#E5E1DA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/20 focus:border-[#89A8B2] transition-colors duration-200"
              aria-label="Search inventory items"
            />
          </div>
          <div className="flex items-center space-x-2">
            <IconFilter className="w-4 h-4 text-[#6B7280]" />
            <span className="text-sm text-[#6B7280]">Sort: {sortBy} ({sortOrder})</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F1F0E8] rounded-lg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider rounded-l-lg">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#E5E1DA] transition-colors"
                onClick={() => handleSort('name')}
              >
                Item Name
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider cursor-pointer hover:bg-[#E5E1DA] transition-colors"
                onClick={() => handleSort('quantity')}
              >
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider rounded-r-lg">
                Stock Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E1DA]">
            {filteredAndSortedData.map((item, index) => {
              const stockStatus = getStockStatus(item.quantity, item.minStock, item.maxStock)
              const maxStock = item.maxStock || Math.max(...data.map(d => d.quantity))
              const stockPercentage = (item.quantity / maxStock) * 100
              
              return (
                <tr key={item.name} className="hover:bg-[#F1F0E8] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: stockStatus.color }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#1F2937]">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-[#1F2937]">{item.quantity.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-[#E5E1DA] rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(stockPercentage, 100)}%`,
                          backgroundColor: stockStatus.color
                        }}
                      />
                    </div>
                    <div className="text-xs text-[#6B7280] mt-1">
                      {stockPercentage.toFixed(1)}% of max capacity
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#6B7280]">No inventory items found matching your search.</p>
        </div>
      )}
    </div>
  )
}

// Main component with production-grade practices
export const InventoryManagement: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axiosInstance.get<InventoryData>("/dashboard/inventory-management", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 second timeout
      })
      
      setInventoryData(response.data)
    } catch (err) {
      console.error("Inventory management fetch error:", err)
      setError("Unable to load inventory management data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  const kpiData = useMemo(() => {
    if (!inventoryData?.inventory_metrics) return []
    
    return [
      {
        title: "Total Inventory Value",
        value: `PKR ${inventoryData.inventory_metrics.total_inventory_value.toLocaleString()}`,
        trend: { value: 7.2, isPositive: true },
        iconType: 'value' as const,
        color: ICON_COLORS.value
      },
      {
        title: "Inventory Turnover Rate",
        value: inventoryData.inventory_metrics.inventory_turnover_rate.toString(),
        trend: { value: 12.8, isPositive: true },
        iconType: 'turnover' as const,
        color: ICON_COLORS.turnover
      },
      {
        title: "Low Stock Items",
        value: inventoryData.inventory_metrics.low_stock_items.toString(),
        trend: { value: 15.3, isPositive: false },
        iconType: 'stock' as const,
        color: ICON_COLORS.stock
      },
      {
        title: "Avg Assignment Duration",
        value: `${inventoryData.inventory_metrics.avg_assignment_duration} days`,
        trend: { value: 5.1, isPositive: false },
        iconType: 'duration' as const,
        color: ICON_COLORS.duration
      }
    ]
  }, [inventoryData])

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
            onClick={fetchInventoryData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
            aria-label="Retry loading inventory management data"
          >
            <IconRefresh className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!inventoryData) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <IconInventory className="w-8 h-8 mr-3" style={{ color: COLORS.primary }} />
        <h2 className="text-3xl font-bold" style={{ color: COLORS.gray[800] }}>
          Inventory Management
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
        {/* Stock Level Overview */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Inventory Movement Trends</h3>
            <p className="text-sm text-[#6B7280]">Monthly assignments and returns tracking</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart 
              data={inventoryData.inventory_movement_data?.movement_data || []} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="assignmentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.8}/>
                  <stop offset="100%" stopColor={COLORS.success} stopOpacity={0.1}/>
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
                dataKey="assignments"
                stackId="1"
                stroke={COLORS.primary}
                strokeWidth={2}
                fill="url(#assignmentsGradient)"
                name="Assignments"
              />
              <Area
                type="monotone"
                dataKey="returns"
                stackId="2"
                stroke={COLORS.success}
                strokeWidth={2}
                fill="url(#returnsGradient)"
                name="Returns"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Health Overview Placeholder */}
        <div className="bg-white rounded-xl border border-[#E5E1DA] p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Inventory Health Overview</h3>
            <p className="text-sm text-[#6B7280]">Comprehensive inventory status and optimization insights</p>
          </div>
          <div className="h-[350px] flex items-center justify-center bg-[#F1F0E8] rounded-xl border-2 border-dashed border-[#B3C8CF]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#89A8B2]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#89A8B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-[#1F2937] mb-2">Advanced Inventory Analytics</h4>
              <p className="text-sm text-[#6B7280] mb-4">Detailed inventory optimization and forecasting coming soon</p>
              <button className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#6B8E95] transition-colors duration-200 text-sm font-medium">
                View Inventory Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Analysis */}
      <StockAnalysisChart data={inventoryData.stock_level_data?.stock_levels || []} />
    </div>
  )
}