"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  ComposedChart, BarChart, Bar, Area as ReArea, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  MapPin, DollarSign, Wallet, Percent, Users, UserPlus,
  AlertOctagon, UserMinus, Filter, RefreshCw, Download, 
  TrendingUp, TrendingDown, LayoutGrid
} from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"

// Types
interface KPIData {
  value: number
  previous: number
  trend: number
  is_positive: boolean
}

interface FilterState {
  startDate: string
  endDate: string
  areaIds: string[] // Changed to comma-separated string for API
  planId: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_revenue: KPIData
    outstanding_dues: KPIData
    collection_rate: KPIData
    arpu: KPIData
    active_users: KPIData
    new_connections: KPIData
    complaint_rate: KPIData
    churn_rate: KPIData
  }
  charts: {
    revenue_by_area: any[]
    growth_trends: any[]
    service_distribution: any[]
    complaint_hotspots: any[]
  }
  tables: {
    area_performance: any[]
    critical_zones: any[]
  }
  filters: {
    areas: { id: string; name: string }[]
    plans: { id: string; name: string }[]
  }
}

// Colors
const COLORS = {
  primary: '#89A8B2',
  secondary: '#B3C8CF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6'
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#89A8B2']

// Helpers
const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getPakistaniDate = () => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (3600000 * 5))
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value)
}

// KPI Card
interface KPICardProps {
  title: string
  value: string | number
  trend?: number
  isPositive?: boolean
  icon: React.ReactNode
  color: string
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, isPositive, icon, color }) => (
  <div className="bg-white rounded-xl border border-[#E5E1DA] p-4 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-start justify-between mb-2">
      <div 
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{title}</p>
    <p className="text-lg font-bold text-slate-800 truncate" title={value.toString()}>{value}</p>
  </div>
)

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-14 bg-slate-200 rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-72 bg-slate-200 rounded-xl" />
      <div className="h-72 bg-slate-200 rounded-xl" />
    </div>
  </div>
)

// Main Component
export const AreaAnalysis: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    areaIds: [], // Empty array means 'all'
    planId: 'all',
    compare: 'last_month',
    timeRange: 'mtd'
  })

  // Helper for multi-select areas (simplified for now but expandable)
  const handleAreaToggle = (areaId: string) => {
    setFilters(prev => {
      const exists = prev.areaIds.includes(areaId)
      if (exists) {
        return { ...prev, areaIds: prev.areaIds.filter(id => id !== areaId) }
      } else {
        return { ...prev, areaIds: [...prev.areaIds, areaId] }
      }
    })
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        area_ids: filters.areaIds.length > 0 ? filters.areaIds.join(',') : 'all',
        plan_id: filters.planId,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/regional-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load regional data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleTimeRangeChange = (range: string) => {
    const today = getPakistaniDate()
    let startDate: Date
    
    switch (range) {
      case 'today':
        startDate = today
        break
      case 'week':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        break
      case 'mtd':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'qtd':
        const quarter = Math.floor(today.getMonth() / 3)
        startDate = new Date(today.getFullYear(), quarter * 3, 1)
        break
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }
    
    setFilters(prev => ({
      ...prev,
      timeRange: range,
      startDate: formatDate(startDate),
      endDate: formatDate(today)
    }))
  }

  if (loading && !data) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertOctagon className="w-8 h-8 text-red-500 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-600">Failed to Load Dashboard</h3>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { kpis, charts, tables, filters: filterOptions } = data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Regional Analysis</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Time Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="mtd">Month to Date</option>
                <option value="qtd">Quarter to Date</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
            
            {/* Areas (Multi-select simulation) */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-slate-500">Areas</label>
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-24 overflow-y-auto">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, areaIds: [] }))}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    filters.areaIds.length === 0 
                      ? 'bg-blue-100 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  All Areas
                </button>
                {filterOptions?.areas?.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => handleAreaToggle(area.id)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      filters.areaIds.includes(area.id)
                        ? 'bg-blue-100 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Plan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Service Plan</label>
              <select
                value={filters.planId}
                onChange={(e) => setFilters(prev => ({ ...prev, planId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                {filterOptions?.plans?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            {/* Compare */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Compare</label>
              <select
                value={filters.compare}
                onChange={(e) => setFilters(prev => ({ ...prev, compare: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_month">vs Last Month</option>
                <option value="last_year">vs Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Row 1: Financial Health */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Financial Performance</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Revenue (Paid)"
          value={formatCurrency(kpis.total_revenue.value)}
          trend={kpis.total_revenue.trend}
          isPositive={kpis.total_revenue.is_positive}
          icon={<DollarSign size={18} />}
          color={COLORS.success}
        />
        <KPICard
          title="Outstanding Dues"
          value={formatCurrency(kpis.outstanding_dues.value)}
          icon={<Wallet size={18} />}
          color={COLORS.warning}
        />
        <KPICard
          title="Collection Rate"
          value={`${kpis.collection_rate.value}%`}
          icon={<Percent size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Avg Revenue/User"
          value={formatCurrency(kpis.arpu.value)}
          icon={<LayoutGrid size={18} />}
          color={COLORS.purple}
        />
      </div>

      {/* KPIs Row 2: Operational Health */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Operational Metrics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Active Users"
          value={kpis.active_users.value.toLocaleString()}
          trend={kpis.active_users.trend}
          isPositive={kpis.active_users.is_positive}
          icon={<Users size={18} />}
          color={COLORS.primary}
        />
        <KPICard
          title="New Connections"
          value={kpis.new_connections.value.toString()}
          trend={kpis.new_connections.trend}
          isPositive={kpis.new_connections.is_positive}
          icon={<UserPlus size={18} />}
          color={COLORS.success}
        />
        <KPICard
          title="Complaint Rate"
          value={`${kpis.complaint_rate.value}%`}
          icon={<AlertOctagon size={18} />}
          color={kpis.complaint_rate.value > 5 ? COLORS.error : COLORS.success}
        />
        <KPICard
          title="Churn Rate"
          value={`${kpis.churn_rate.value}%`}
          icon={<UserMinus size={18} />}
          color={kpis.churn_rate.value > 2 ? COLORS.error : COLORS.success}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Revenue by Area */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Areas by Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.revenue_by_area} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => `Rs ${(value/1000).toFixed(0)}k`} />
              <YAxis dataKey="area" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Trends */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">New Connections Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={charts.growth_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {/* Dynamically generate lines for first 5 areas found in data keys (excluding month) */}
              {charts.growth_trends.length > 0 && Object.keys(charts.growth_trends[0])
                .filter(key => key !== 'month')
                .slice(0, 5)
                .map((key, index) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                    strokeWidth={2}
                    dot={false}
                  />
                ))
              }
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Service Plan Popularity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.service_distribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name.substring(0, 10)}..: ${value}`}
              >
                {charts.service_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Hotspots */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Complaint Hotspots</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.complaint_hotspots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="complaints" fill={COLORS.error} name="Complaints" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Performance Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Area Performance Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Area Name</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Users</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Revenue</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">ARPU</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {tables.area_performance.map((area) => (
                  <tr key={area.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{area.name}</td>
                    <td className="py-2 px-2 text-right text-slate-600">{area.users}</td>
                    <td className="py-2 px-2 text-right text-green-600 font-medium">{formatCurrency(area.revenue)}</td>
                    <td className="py-2 px-2 text-right text-slate-500">{formatCurrency(area.arpu)}</td>
                    <td className="py-2 px-2 text-right">
                      {area.complaints > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {area.complaints} Complaints
                        </span>
                      ) : (
                         <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Zones */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500" />
            Critical Zones
          </h3>
          <div className="space-y-3">
            {tables.critical_zones.length > 0 ? tables.critical_zones.map((zone, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-slate-800">{zone.area}</span>
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    Action Needed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">{zone.issue}: <span className="font-bold">{zone.value}</span></p>
                <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-red-100">
                  Supervisor: {zone.supervisor}
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-slate-400">
                No critical zones identified
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AreaAnalysis