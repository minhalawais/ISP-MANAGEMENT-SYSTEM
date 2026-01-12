"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ComposedChart, BarChart, Bar, Area, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  AlertCircle, CheckCircle, Clock, Users, Star, Target,
  Filter, RefreshCw, Download, TrendingUp, TrendingDown,
  Headphones, UserCheck, ListTodo, AlertTriangle
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
  status: string
  priority: string
  areaId: string
  technicianId: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_complaints: KPIData
    open_complaints: KPIData
    avg_resolution_time: KPIData
    fcr_rate: KPIData
    avg_satisfaction: KPIData
    sla_compliance: KPIData
    pending_tasks: KPIData
    overdue_tasks: KPIData
  }
  charts: {
    complaint_trend: any[]
    status_distribution: any[]
    resolution_time: any[]
    technician_performance: any[]
  }
  tables: {
    open_complaints: any[]
    technician_summary: any[]
  }
  filters: {
    areas: { id: string; name: string }[]
    technicians: { id: string; name: string }[]
    statuses: string[]
    priorities: string[]
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

const STATUS_COLORS: Record<string, string> = {
  open: '#F59E0B',
  in_progress: '#3B82F6',
  resolved: '#10B981',
  closed: '#6B7280'
}

// Helpers
const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getPakistaniDate = () => {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (3600000 * 5))
}

// KPI Card
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
export const ServiceSupport: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    status: 'all',
    priority: 'all',
    areaId: 'all',
    technicianId: 'all',
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
        status: filters.status,
        priority: filters.priority,
        area_id: filters.areaId,
        technician_id: filters.technicianId,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/service-support-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load service support data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 5 minutes
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Headphones className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Service & Support</h1>
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
            onClick={() => alert('Export coming soon!')}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
            
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                {filterOptions?.statuses?.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {filterOptions?.priorities?.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            
            {/* Area */}
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
            
            {/* Technician */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Technician</label>
              <select
                value={filters.technicianId}
                onChange={(e) => setFilters(prev => ({ ...prev, technicianId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {filterOptions?.technicians?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
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
                <option value="last_year">vs Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Row 1: Complaints */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Complaints"
          value={kpis.total_complaints.value}
          trend={kpis.total_complaints.trend}
          isPositive={kpis.total_complaints.is_positive}
          icon={<AlertCircle size={18} />}
          color={COLORS.warning}
          invertTrend
        />
        <KPICard
          title="Open Complaints"
          value={kpis.open_complaints.value}
          trend={kpis.open_complaints.trend}
          isPositive={kpis.open_complaints.is_positive}
          icon={<AlertTriangle size={18} />}
          color={COLORS.error}
          invertTrend
        />
        <KPICard
          title="Avg Resolution"
          value={`${kpis.avg_resolution_time.value}h`}
          trend={kpis.avg_resolution_time.trend}
          isPositive={kpis.avg_resolution_time.is_positive}
          icon={<Clock size={18} />}
          color={COLORS.info}
          invertTrend
        />
        <KPICard
          title="First Contact Res %"
          value={`${kpis.fcr_rate.value}%`}
          trend={kpis.fcr_rate.trend}
          isPositive={kpis.fcr_rate.is_positive}
          icon={<CheckCircle size={18} />}
          color={COLORS.success}
        />
      </div>

      {/* KPIs Row 2: Satisfaction & Tasks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Satisfaction"
          value={`${kpis.avg_satisfaction.value}/5`}
          trend={kpis.avg_satisfaction.trend}
          isPositive={kpis.avg_satisfaction.is_positive}
          icon={<Star size={18} />}
          color={COLORS.warning}
        />
        <KPICard
          title="SLA Compliance"
          value={`${kpis.sla_compliance.value}%`}
          trend={kpis.sla_compliance.trend}
          isPositive={kpis.sla_compliance.is_positive}
          icon={<Target size={18} />}
          color={COLORS.success}
        />
        <KPICard
          title="Pending Tasks"
          value={kpis.pending_tasks.value}
          trend={0}
          isPositive={kpis.pending_tasks.is_positive}
          icon={<ListTodo size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Overdue Tasks"
          value={kpis.overdue_tasks.value}
          trend={0}
          isPositive={kpis.overdue_tasks.is_positive}
          icon={<AlertTriangle size={18} />}
          color={COLORS.error}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Complaint Trend (12 Weeks)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={charts.complaint_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="new" name="New" fill={COLORS.warning} fillOpacity={0.3} stroke={COLORS.warning} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.success} strokeWidth={2} dot={{ fill: COLORS.success }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={charts.status_distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {charts.status_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS.primary} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Resolution Time Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.resolution_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.info} radius={[4, 4, 0, 0]} name="Complaints" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Technician Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Technician Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.technician_performance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="completed" fill={COLORS.success} radius={[0, 4, 4, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Complaints */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Open Complaints</h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-sm font-medium rounded-full">
              {tables.open_complaints.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Ticket</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Customer</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {tables.open_complaints.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{c.ticket_number}</td>
                    <td className="py-2 px-2 text-slate-600">{c.customer_name}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        c.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-600">{c.assigned_to || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technician Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Technician Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Name</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Resolved</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Avg Time</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">CSAT</th>
                </tr>
              </thead>
              <tbody>
                {tables.technician_summary.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{t.name}</td>
                    <td className="py-2 px-2 text-right text-green-600 font-medium">{t.resolved}</td>
                    <td className="py-2 px-2 text-right text-slate-600">{t.avg_resolution_hours}h</td>
                    <td className="py-2 px-2 text-right">
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />
                        {t.csat_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceSupport