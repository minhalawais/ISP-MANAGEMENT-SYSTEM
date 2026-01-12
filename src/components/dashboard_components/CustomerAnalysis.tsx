"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  PieChart, Pie, Cell, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  Users, UserPlus, UserMinus, TrendingUp, TrendingDown, AlertCircle, Clock,
  CheckCircle, Target, Percent, Calendar, Filter, RefreshCw, Download,
  ChevronDown, Building2, Wifi, Package, MapPin, Star, DollarSign
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
  areaId: string
  subZoneId: string
  ispId: string
  servicePlanId: string
  connectionType: string
  status: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_customers: KPIData
    active_customers: KPIData
    new_customers: KPIData
    churned_customers: KPIData
    acquisition_rate: KPIData
    churn_rate: KPIData
    net_growth_rate: KPIData
    retention_rate: KPIData
    arpu: KPIData
    avg_lifetime_months: KPIData
    clv: KPIData
    avg_invoice: KPIData
    avg_satisfaction: KPIData
    complaint_rate: KPIData
    avg_days_to_recharge: KPIData
    equipment_ownership_rate: KPIData
  }
  charts: {
    customer_growth: any[]
    area_distribution: any[]
    service_plan_popularity: any[]
    connection_types: any[]
    isp_distribution: any[]
    tenure_distribution: any[]
    payment_behavior: any[]
  }
  tables: {
    area_performance: any[]
    at_risk_customers: any[]
    newest_customers: any[]
    longest_tenure: any[]
  }
  segments: {
    new: { count: number; label: string }
    stable: { count: number; label: string }
    at_risk: { count: number; label: string }
    churned: { count: number; label: string }
  }
  filters: {
    areas: { id: string; name: string }[]
    sub_zones: { id: string; name: string; area_id: string }[]
    isps: { id: string; name: string }[]
    service_plans: { id: string; name: string }[]
    connection_types: string[]
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
  pink: '#EC4899',
  teal: '#14B8A6',
  indigo: '#6366F1'
}

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.purple, COLORS.pink, COLORS.teal, COLORS.indigo]

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
    <div className="bg-white rounded-xl border border-[#E5E1DA] p-4 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-2">
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {trend !== 0 && (
          <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            displayPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {displayPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{title}</p>
      <p className="text-lg font-bold text-slate-800">{value}{suffix}</p>
    </div>
  )
}

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-14 bg-slate-200 rounded-xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(16)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-72 bg-slate-200 rounded-xl" />
      <div className="h-72 bg-slate-200 rounded-xl" />
    </div>
  </div>
)

// Segment Card Component
const SegmentCard: React.FC<{label: string; count: number; color: string; icon: React.ReactNode}> = ({label, count, color, icon}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{formatNumber(count)}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
)

// Main Component
export const CustomerAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'areas' | 'at-risk'>('overview')
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    areaId: 'all',
    subZoneId: 'all',
    ispId: 'all',
    servicePlanId: 'all',
    connectionType: 'all',
    status: 'all',
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
        sub_zone_id: filters.subZoneId,
        isp_id: filters.ispId,
        service_plan_id: filters.servicePlanId,
        connection_type: filters.connectionType,
        status: filters.status,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/customer-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load customer dashboard data')
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

  const filteredSubZones = useMemo(() => {
    if (!data?.filters?.sub_zones || filters.areaId === 'all') return []
    return data.filters.sub_zones.filter(sz => sz.area_id === filters.areaId)
  }, [data?.filters?.sub_zones, filters.areaId])

  const handleExport = async () => {
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

  const { kpis, charts, tables, segments, filters: filterOptions } = data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Customer Analytics</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'areas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              Areas
            </button>
            <button
              onClick={() => setActiveTab('at-risk')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'at-risk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              At-Risk
            </button>
          </div>
          
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
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Time Range */}
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
              </select>
            </div>
            
            {/* Area */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Area</label>
              <select
                value={filters.areaId}
                onChange={(e) => setFilters(prev => ({ ...prev, areaId: e.target.value, subZoneId: 'all' }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Areas</option>
                {filterOptions?.areas?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            
            {/* Sub-Zone */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sub-Zone</label>
              <select
                value={filters.subZoneId}
                onChange={(e) => setFilters(prev => ({ ...prev, subZoneId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={filters.areaId === 'all'}
              >
                <option value="all">All Sub-Zones</option>
                {filteredSubZones.map((sz) => (
                  <option key={sz.id} value={sz.id}>{sz.name}</option>
                ))}
              </select>
            </div>
            
            {/* ISP */}
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
            
            {/* Service Plan */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Plan</label>
              <select
                value={filters.servicePlanId}
                onChange={(e) => setFilters(prev => ({ ...prev, servicePlanId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                {filterOptions?.service_plans?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            {/* Connection Type */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Connection</label>
              <select
                value={filters.connectionType}
                onChange={(e) => setFilters(prev => ({ ...prev, connectionType: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {filterOptions?.connection_types?.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {/* Compare */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Compare</label>
              <select
                value={filters.compare}
                onChange={(e) => setFilters(prev => ({ ...prev, compare: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_month">vs Last Month</option>
                <option value="last_quarter">vs Last Quarter</option>
                <option value="last_year">vs Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Customer Segments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SegmentCard label={segments.new.label} count={segments.new.count} color={COLORS.success} icon={<UserPlus size={20} />} />
        <SegmentCard label={segments.stable.label} count={segments.stable.count} color={COLORS.info} icon={<CheckCircle size={20} />} />
        <SegmentCard label={segments.at_risk.label} count={segments.at_risk.count} color={COLORS.warning} icon={<AlertCircle size={20} />} />
        <SegmentCard label={segments.churned.label} count={segments.churned.count} color={COLORS.error} icon={<UserMinus size={20} />} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Row 1: Core Customer Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="Total Customers"
              value={formatNumber(kpis.total_customers.value)}
              trend={kpis.total_customers.trend}
              isPositive={kpis.total_customers.is_positive}
              icon={<Users size={18} />}
              color={COLORS.primary}
            />
            <KPICard
              title="Active Customers"
              value={formatNumber(kpis.active_customers.value)}
              trend={kpis.active_customers.trend}
              isPositive={kpis.active_customers.is_positive}
              icon={<CheckCircle size={18} />}
              color={COLORS.success}
            />
            <KPICard
              title="New Customers"
              value={kpis.new_customers.value}
              trend={kpis.new_customers.trend}
              isPositive={kpis.new_customers.is_positive}
              icon={<UserPlus size={18} />}
              color={COLORS.info}
            />
            <KPICard
              title="Churned"
              value={kpis.churned_customers.value}
              trend={kpis.churned_customers.trend}
              isPositive={kpis.churned_customers.is_positive}
              icon={<UserMinus size={18} />}
              color={COLORS.error}
              invertTrend
            />
          </div>

          {/* Row 2: Health Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="Acquisition Rate"
              value={`${kpis.acquisition_rate.value.toFixed(1)}%`}
              trend={kpis.acquisition_rate.trend}
              isPositive={kpis.acquisition_rate.is_positive}
              icon={<TrendingUp size={18} />}
              color={COLORS.success}
            />
            <KPICard
              title="Churn Rate"
              value={`${kpis.churn_rate.value.toFixed(2)}%`}
              trend={kpis.churn_rate.trend}
              isPositive={kpis.churn_rate.is_positive}
              icon={<TrendingDown size={18} />}
              color={COLORS.error}
              invertTrend
            />
            <KPICard
              title="Net Growth"
              value={`${kpis.net_growth_rate.value.toFixed(1)}%`}
              trend={kpis.net_growth_rate.trend}
              isPositive={kpis.net_growth_rate.is_positive}
              icon={<TrendingUp size={18} />}
              color={COLORS.purple}
            />
            <KPICard
              title="Retention Rate"
              value={`${kpis.retention_rate.value.toFixed(1)}%`}
              trend={kpis.retention_rate.trend}
              isPositive={kpis.retention_rate.is_positive}
              icon={<Target size={18} />}
              color={COLORS.teal}
            />
          </div>

          {/* Row 3: Revenue Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="ARPU"
              value={formatCurrency(kpis.arpu.value)}
              trend={kpis.arpu.trend}
              isPositive={kpis.arpu.is_positive}
              icon={<DollarSign size={18} />}
              color={COLORS.success}
            />
            <KPICard
              title="Avg Lifetime"
              value={`${kpis.avg_lifetime_months.value.toFixed(1)} mo`}
              trend={0}
              isPositive={true}
              icon={<Clock size={18} />}
              color={COLORS.info}
            />
            <KPICard
              title="CLV"
              value={formatCurrency(kpis.clv.value)}
              trend={0}
              isPositive={true}
              icon={<DollarSign size={18} />}
              color={COLORS.purple}
            />
            <KPICard
              title="Avg Invoice"
              value={formatCurrency(kpis.avg_invoice.value)}
              trend={kpis.avg_invoice.trend}
              isPositive={kpis.avg_invoice.is_positive}
              icon={<DollarSign size={18} />}
              color={COLORS.warning}
            />
          </div>

          {/* Row 4: Satisfaction Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard
              title="Satisfaction"
              value={`${kpis.avg_satisfaction.value.toFixed(1)}/5`}
              trend={0}
              isPositive={kpis.avg_satisfaction.is_positive}
              icon={<Star size={18} />}
              color={COLORS.warning}
            />
            <KPICard
              title="Complaint Rate"
              value={`${kpis.complaint_rate.value.toFixed(1)}%`}
              trend={kpis.complaint_rate.trend}
              isPositive={kpis.complaint_rate.is_positive}
              icon={<AlertCircle size={18} />}
              color={COLORS.error}
              invertTrend
            />
            <KPICard
              title="Avg Days to Pay"
              value={kpis.avg_days_to_recharge.value.toFixed(0)}
              trend={0}
              isPositive={kpis.avg_days_to_recharge.is_positive}
              icon={<Calendar size={18} />}
              color={COLORS.info}
            />
            <KPICard
              title="Company Equip %"
              value={`${kpis.equipment_ownership_rate.value.toFixed(0)}%`}
              trend={0}
              isPositive={true}
              icon={<Wifi size={18} />}
              color={COLORS.primary}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Growth */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Growth Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={charts.customer_growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month_short" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="new" name="New" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="churned" name="Churned" fill={COLORS.error} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="total" name="Total Active" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Service Plan Popularity */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Service Plan Popularity</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.service_plan_popularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Bar dataKey="subscribers" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Subscribers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection Types */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Connection Types</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={charts.connection_types}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="type"
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                    labelLine={false}
                  >
                    {charts.connection_types.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* ISP Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">ISP Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={charts.isp_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="customers"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    labelLine={false}
                  >
                    {charts.isp_distribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tenure Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Customer Tenure</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.tenure_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="tenure" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.info} radius={[4, 4, 0, 0]} name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Behavior */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Behavior</h3>
            <div className="grid grid-cols-3 gap-4">
              {charts.payment_behavior.map((item, i) => (
                <div key={i} className={`p-4 rounded-lg text-center ${
                  item.category === 'Early' ? 'bg-green-50' :
                  item.category === 'On-Time' ? 'bg-blue-50' : 'bg-red-50'
                }`}>
                  <p className={`text-2xl font-bold ${
                    item.category === 'Early' ? 'text-green-600' :
                    item.category === 'On-Time' ? 'text-blue-600' : 'text-red-600'
                  }`}>{item.count}</p>
                  <p className="text-sm text-slate-600">{item.category}</p>
                  <p className="text-xs text-slate-400">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Areas Tab */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Area Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">#</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Area</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Sub-Zones</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Customers</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">MRR</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">New</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Churned</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Growth</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Complaints</th>
                </tr>
              </thead>
              <tbody>
                {tables.area_performance.map((area, i) => (
                  <tr key={area.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600">{i + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{area.name}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{area.sub_zones}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">{area.customers}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(area.mrr)}</td>
                    <td className="py-3 px-3 text-right text-green-600">+{area.new}</td>
                    <td className="py-3 px-3 text-right text-red-600">-{area.churned}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        area.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {area.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(area.growth)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {area.complaints > 0 && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          {area.complaints}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* At-Risk Tab */}
      {activeTab === 'at-risk' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">At-Risk Customers</h3>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
              {tables.at_risk_customers.length} Customers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium" style={{width:"120px",maxWidth:"120px"}}>Customer</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Internet ID</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Area</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Phone</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Overdue</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Amount</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium">Complaints</th>
                </tr>
              </thead>
              <tbody>
                {tables.at_risk_customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3 px-3 text-slate-600">{c.internet_id}</td>
                    <td className="py-3 px-3 text-slate-600">{c.area}</td>
                    <td className="py-3 px-3 text-slate-600">{c.phone}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                        {c.overdue_invoices} inv
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-red-600">{formatCurrency(c.overdue_amount)}</td>
                    <td className="py-3 px-3 text-right">
                      {c.complaints > 0 && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          {c.complaints}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerAnalytics