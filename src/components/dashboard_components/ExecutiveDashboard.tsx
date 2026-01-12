"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  PieChart, Pie, Cell, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  Users, DollarSign, TrendingUp, TrendingDown, AlertCircle, Clock,
  CheckCircle, Target, Percent, Calendar, Filter, RefreshCw, Download,
  ChevronDown, Building2, Wifi, Package, CreditCard, BarChart3
} from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Ledger } from "./ledger/Ledger.tsx"

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
  areaId: string
  ispId: string
  servicePlanId: string
  paymentMethod: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    collections: KPIData
    outstanding: KPIData
    net_cash_flow: KPIData
    collection_efficiency: KPIData
    active_customers: KPIData
    new_customers: KPIData
    churned_customers: KPIData
    growth_rate: KPIData
    open_complaints: KPIData
    avg_resolution_time: KPIData
    pending_tasks: KPIData
    completion_rate: KPIData
    arpu: KPIData
    gross_margin: KPIData
    avg_days_to_pay: KPIData
    recovery_rate: KPIData
  }
  charts: {
    revenue_trend: any[]
    customer_growth: any[]
    payment_methods: any[]
    top_areas: any[]
    isp_analysis: any[]
    expense_breakdown: any[]
  }
  tables: {
    top_plans: any[]
    overdue_invoices: any[]
  }
  filters: {
    areas: { id: string; name: string }[]
    isps: { id: string; name: string }[]
    service_plans: { id: string; name: string }[]
    payment_methods: string[]
    compare_options: { value: string; label: string }[]
  }
}

// Color palette
const COLORS = {
  primary: '#89A8B2',
  secondary: '#B3C8CF',
  tertiary: '#E5E1DA',
  background: '#F1F0E8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899'
}

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.purple, COLORS.pink]

// Helper functions
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `PKR ${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `PKR ${(value / 1000).toFixed(0)}K`
  return `PKR ${value.toLocaleString()}`
}

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

const getPakistaniDate = () => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (3600000 * 5))
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// KPI Card Component
interface KPICardProps {
  title: string
  value: string | number
  trend: number
  isPositive: boolean
  icon: React.ReactNode
  color: string
  suffix?: string
  invertTrend?: boolean
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, isPositive, icon, color, suffix = '', invertTrend = false }) => {
  const displayPositive = invertTrend ? !isPositive : isPositive
  
  return (
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {trend !== 0 && (
          <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
            displayPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {displayPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}{suffix}</p>
    </div>
  )
}

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-16 bg-slate-200 rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-slate-200 rounded-xl" />
      <div className="h-80 bg-slate-200 rounded-xl" />
    </div>
  </div>
)

// Main Component
export const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'executive' | 'ledger'>('executive')
  const [showFilters, setShowFilters] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    areaId: 'all',
    ispId: 'all',
    servicePlanId: 'all',
    paymentMethod: 'all',
    compare: 'last_month',
    timeRange: 'mtd'
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate,
        area_id: filters.areaId,
        isp_id: filters.ispId,
        service_plan_id: filters.servicePlanId,
        payment_method: filters.paymentMethod,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/executive-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

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

  const handleExport = async () => {
    // TODO: Implement Excel export
    alert('Excel export coming soon!')
  }

  if (loading && !data) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500 mr-4" />
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
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Executive Dashboard</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'executive' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'ledger' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Ledger
            </button>
          </div>
          
          {activeTab === 'executive' && (
            <>
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
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {activeTab === 'executive' && showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Time Range Presets */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time Range</label>
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
                <option value="custom">Custom</option>
              </select>
            </div>
            
            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, timeRange: 'custom' }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, timeRange: 'custom' }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Area Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Area</label>
              <select
                value={filters.areaId}
                onChange={(e) => setFilters(prev => ({ ...prev, areaId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Areas</option>
                {filterOptions?.areas?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            
            {/* ISP Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ISP</label>
              <select
                value={filters.ispId}
                onChange={(e) => setFilters(prev => ({ ...prev, ispId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ISPs</option>
                {filterOptions?.isps?.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            
            {/* Payment Method Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
              </select>
            </div>
            
            {/* Compare Period */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Compare To</label>
              <select
                value={filters.compare}
                onChange={(e) => setFilters(prev => ({ ...prev, compare: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_month">Last Month</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'executive' ? (
        <>
          {/* Tier 1: Financial KPIs (Priority) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Collections"
              value={formatCurrency(kpis.collections.value)}
              trend={kpis.collections.trend}
              isPositive={kpis.collections.is_positive}
              icon={<DollarSign size={20} />}
              color={COLORS.success}
            />
            <KPICard
              title="Outstanding Amount"
              value={formatCurrency(kpis.outstanding.value)}
              trend={kpis.outstanding.trend}
              isPositive={kpis.outstanding.is_positive}
              icon={<AlertCircle size={20} />}
              color={COLORS.warning}
              invertTrend
            />
            <KPICard
              title="Net Cash Flow"
              value={formatCurrency(kpis.net_cash_flow.value)}
              trend={kpis.net_cash_flow.trend}
              isPositive={kpis.net_cash_flow.is_positive}
              icon={<TrendingUp size={20} />}
              color={COLORS.info}
            />
            <KPICard
              title="Collection Efficiency"
              value={`${kpis.collection_efficiency.value.toFixed(1)}%`}
              trend={kpis.collection_efficiency.trend}
              isPositive={kpis.collection_efficiency.is_positive}
              icon={<Target size={20} />}
              color={COLORS.purple}
            />
          </div>

          {/* Tier 2: Customer KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Active Customers"
              value={formatNumber(kpis.active_customers.value)}
              trend={kpis.active_customers.trend}
              isPositive={kpis.active_customers.is_positive}
              icon={<Users size={20} />}
              color={COLORS.primary}
            />
            <KPICard
              title="New Customers"
              value={kpis.new_customers.value}
              trend={kpis.new_customers.trend}
              isPositive={kpis.new_customers.is_positive}
              icon={<Users size={20} />}
              color={COLORS.success}
            />
            <KPICard
              title="Churned"
              value={kpis.churned_customers.value}
              trend={kpis.churned_customers.trend}
              isPositive={kpis.churned_customers.is_positive}
              icon={<Users size={20} />}
              color={COLORS.error}
              invertTrend
            />
            <KPICard
              title="Growth Rate"
              value={`${kpis.growth_rate.value.toFixed(1)}%`}
              trend={kpis.growth_rate.trend}
              isPositive={kpis.growth_rate.is_positive}
              icon={<TrendingUp size={20} />}
              color={COLORS.info}
            />
          </div>

          {/* Tier 3 & 4: Operations & BI KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Open Complaints"
              value={kpis.open_complaints.value}
              trend={kpis.open_complaints.trend}
              isPositive={kpis.open_complaints.is_positive}
              icon={<AlertCircle size={20} />}
              color={COLORS.error}
              invertTrend
            />
            <KPICard
              title="Avg Resolution (hrs)"
              value={kpis.avg_resolution_time.value.toFixed(0)}
              trend={kpis.avg_resolution_time.trend}
              isPositive={kpis.avg_resolution_time.is_positive}
              icon={<Clock size={20} />}
              color={COLORS.warning}
              invertTrend
            />
            <KPICard
              title="ARPU"
              value={formatCurrency(kpis.arpu.value)}
              trend={kpis.arpu.trend}
              isPositive={kpis.arpu.is_positive}
              icon={<DollarSign size={20} />}
              color={COLORS.success}
            />
            <KPICard
              title="Gross Margin"
              value={`${kpis.gross_margin.value.toFixed(1)}%`}
              trend={kpis.gross_margin.trend}
              isPositive={kpis.gross_margin.is_positive}
              icon={<Percent size={20} />}
              color={COLORS.purple}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Collection Trend */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue vs Collection Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.revenue_trend}>
                  <defs>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month_short" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="expected" name="Expected" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorExpected)" />
                  <Area type="monotone" dataKey="collected" name="Collected" stroke={COLORS.success} fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Growth */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={charts.customer_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month_short" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="new" name="New" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="churned" name="Churned" fill={COLORS.error} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="total" name="Total Active" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={charts.payment_methods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="method"
                    label={({ method, percentage }) => `${method}: ${percentage}%`}
                    labelLine={false}
                  >
                    {charts.payment_methods.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Areas */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Areas by Revenue</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.top_areas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="mrr" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ISP Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">ISP Revenue vs Cost</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.isp_analysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="isp" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Cost" fill={COLORS.error} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Service Plans */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Service Plans</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">#</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Plan</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium">Subscribers</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium">MRR</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.top_plans.slice(0, 5).map((plan, i) => (
                      <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2 text-slate-600">{i + 1}</td>
                        <td className="py-3 px-2 font-medium text-slate-800">{plan.name}</td>
                        <td className="py-3 px-2 text-right text-slate-600">{plan.subscribers}</td>
                        <td className="py-3 px-2 text-right text-slate-600">{formatCurrency(plan.mrr)}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            plan.growth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {plan.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(plan.growth).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overdue Invoices */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Overdue Invoices</h3>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  {tables.overdue_invoices.length} Pending
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Invoice</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium">Amount</th>
                      <th className="text-right py-3 px-2 text-slate-500 font-medium">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.overdue_invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div className="font-medium text-slate-800">{inv.customer_name}</div>
                          <div className="text-xs text-slate-500">{inv.internet_id}</div>
                        </td>
                        <td className="py-3 px-2 text-slate-600">{inv.invoice_number}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-800">{formatCurrency(inv.amount)}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            inv.days_overdue > 30 ? 'bg-red-100 text-red-600' :
                            inv.days_overdue > 14 ? 'bg-orange-100 text-orange-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {inv.days_overdue}d
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Ledger />
      )}
    </div>
  )
}

export default ExecutiveDashboard