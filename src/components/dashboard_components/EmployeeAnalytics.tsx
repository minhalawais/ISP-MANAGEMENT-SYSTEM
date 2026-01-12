"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  AreaChart,LineChart, BarChart, Bar, Area, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  Users, DollarSign, Wallet, CheckCircle, Award, Star, Briefcase,
  AlertCircle, Filter, RefreshCw, Download, TrendingUp, TrendingDown,
  UserCheck, UserX, User
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
  role: string
  status: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_employees: KPIData
    total_salary: KPIData
    pending_balance: KPIData
    paid_period: KPIData
    tasks_completed: KPIData
    complaints_resolved: KPIData
    avg_satisfaction: KPIData
    top_performer: KPIData
  }
  charts: {
    performance_by_employee: any[]
    productivity_trend: any[]
    role_distribution: any[]
    satisfaction_trend: any[]
  }
  tables: {
    top_performers: any[]
    recent_payouts: any[]
  }
  filters: {
    roles: string[]
    statuses: string[]
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

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

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
export const EmployeeAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    role: 'all',
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
        role: filters.role,
        status: filters.status,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/employee-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load employee data')
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
          <Users className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Employee Analytics</h1>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
            
            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {filterOptions?.roles?.map((r) => (
                  <option key={r} value={r}>{r}</option>
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
                <option value="last_year">vs Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Row 1: Workforce Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Employees"
          value={kpis.total_employees.value}
          icon={<Users size={18} />}
          color={COLORS.primary}
        />
        <KPICard
          title="Total Salary (Mo)"
          value={formatCurrency(kpis.total_salary.value)}
          icon={<Briefcase size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Pending Balance"
          value={formatCurrency(kpis.pending_balance.value)}
          icon={<Wallet size={18} />}
          color={COLORS.warning}
        />
        <KPICard
          title="Paid This Period"
          value={formatCurrency(kpis.paid_period.value)}
          trend={kpis.paid_period.trend}
          isPositive={kpis.paid_period.is_positive}
          icon={<DollarSign size={18} />}
          color={COLORS.success}
        />
      </div>

      {/* KPIs Row 2: Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Tasks Completed"
          value={kpis.tasks_completed.value}
          trend={kpis.tasks_completed.trend}
          isPositive={kpis.tasks_completed.is_positive}
          icon={<CheckCircle size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Complaints Done"
          value={kpis.complaints_resolved.value}
          trend={kpis.complaints_resolved.trend}
          isPositive={kpis.complaints_resolved.is_positive}
          icon={<UserCheck size={18} />}
          color={COLORS.purple}
        />
        <KPICard
          title="Avg Satisfaction"
          value={`${kpis.avg_satisfaction.value}/5`}
          trend={kpis.avg_satisfaction.trend}
          isPositive={kpis.avg_satisfaction.is_positive}
          icon={<Star size={18} />}
          color={COLORS.warning}
        />
        <KPICard
          title="Top Performer"
          value={kpis.top_performer.value.toString()}
          icon={<Award size={18} />}
          color={COLORS.success}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Employee */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Employees (Tasks)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.performance_by_employee} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="tasks" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts.productivity_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="tasks" name="Tasks" fill={COLORS.info} fillOpacity={0.3} stroke={COLORS.info} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.role_distribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
                nameKey="role"
                label={({ role, count }) => `${role}: ${count}`}
              >
                {charts.role_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Satisfaction Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Satisfaction Trend (6 Mo)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.satisfaction_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="rating" name="Rating" stroke={COLORS.warning} strokeWidth={2} dot={{ fill: COLORS.warning }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Name</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Role</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Task</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">CSAT</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Bal</th>
                </tr>
              </thead>
              <tbody>
                {tables.top_performers.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2 px-2 text-slate-600 text-xs uppercase">{p.role}</td>
                    <td className="py-2 px-2 text-right font-medium text-slate-800">{p.tasks}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="flex items-center justify-end gap-1 text-slate-600">
                        <Star size={10} className="text-yellow-500" />
                        {p.satisfaction}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-xs text-slate-500">{formatCurrency(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Payouts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Employee</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Type</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Amount</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {tables.recent_payouts.length > 0 ? tables.recent_payouts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{p.employee}</td>
                    <td className="py-2 px-2 text-xs uppercase text-slate-500">{p.type}</td>
                    <td className="py-2 px-2 text-right text-green-600 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="py-2 px-2 text-right text-slate-500 text-xs">
                      {p.date ? new Date(p.date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No recent payouts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeAnalytics