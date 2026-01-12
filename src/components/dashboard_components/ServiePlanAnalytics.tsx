"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  TrendingUp, TrendingDown, Filter, RefreshCw, Download, 
  Package, DollarSign, Users, UserPlus, UserMinus, Repeat, Award, Layers
} from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"

// Types
interface KPIData {
  value: number | string
  previous: number | string
  trend: number
  is_positive: boolean
}

interface FilterState {
  startDate: string
  endDate: string
  planIds: string[]
  status: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_revenue: KPIData
    active_subs: KPIData
    arpu: KPIData
    new_subs: KPIData
    churn_subs: KPIData
    retention_rate: KPIData
    top_rev_plan: KPIData
    top_vol_plan: KPIData
  }
  charts: {
    revenue_by_plan: any[]
    subscription_trends: any[]
    market_share: any[]
    revenue_vs_volume: any[]
  }
  tables: {
    plan_performance: any[]
    recent_activity: any[]
  }
  filters: {
    plans: { id: string; name: string }[]
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

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#89A8B2', '#6D28D9', '#059669']

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

// Compact KPI Card
interface KPICardProps {
  title: string
  value: string | number
  trend?: number
  isPositive?: boolean
  icon: React.ReactNode
  color: string
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, isPositive, icon, color }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between mb-1">
      <div 
        className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <TrendingUp size={8} className="mr-0.5" /> : <TrendingDown size={8} className="mr-0.5" />}
          {Math.abs(trend).toFixed(0)}%
        </span>
      )}
    </div>
    <div className="mt-1">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className="text-sm font-bold text-slate-800 truncate" title={value.toString()}>{value}</p>
    </div>
  </div>
)

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-slate-200 rounded-lg w-full" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-60 bg-slate-200 rounded-lg" />
      <div className="h-60 bg-slate-200 rounded-lg" />
    </div>
  </div>
)

// Main Component
export const ServicePlanAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    planIds: [],
    status: 'all',
    compare: 'last_month',
    timeRange: 'mtd'
  })

  const handlePlanToggle = (planId: string) => {
    setFilters(prev => {
      const exists = prev.planIds.includes(planId)
      if (exists) {
        return { ...prev, planIds: prev.planIds.filter(id => id !== planId) }
      } else {
        return { ...prev, planIds: [...prev.planIds, planId] }
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
        plan_ids: filters.planIds.length > 0 ? filters.planIds.join(',') : 'all',
        status: filters.status,
        compare: filters.compare
      })
      const response = await axiosInstance.get(`/dashboard/service-plan-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      setData(response.data)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleTimeRangeChange = (range: string) => {
    const today = getPakistaniDate()
    let startDate: Date
    switch (range) {
      case 'today': startDate = today; break
      case 'week': startDate = new Date(today); startDate.setDate(today.getDate() - 7); break
      case 'mtd': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break
      case 'qtd': startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break
      case 'ytd': startDate = new Date(today.getFullYear(), 0, 1); break
      default: startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }
    setFilters(prev => ({ ...prev, timeRange: range, startDate: formatDate(startDate), endDate: formatDate(today) }))
  }

  if (loading && !data) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center text-red-700">
          <TrendingDown className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button onClick={fetchData} className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-xs hover:bg-red-50">Retry</button>
      </div>
    )
  }

  if (!data) return null

  const { kpis, charts, tables, filters: filterOptions } = data

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-slate-500" />
          Service Plans
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 ${
              showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            Filters
          </button>
          <button onClick={fetchData} className="p-1.5 bg-white border border-slate-200 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="p-1.5 bg-green-50 border border-green-200 rounded text-green-600 hover:bg-green-100">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-400"
              >
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="mtd">This Month</option>
                <option value="qtd">This Quarter</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Plans</label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-16 overflow-y-auto">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, planIds: [] }))}
                  className={`px-2 py-1 text-[10px] rounded-full border ${filters.planIds.length === 0 ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  All
                </button>
                {filterOptions?.plans?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlanToggle(p.id)}
                    className={`px-2 py-1 text-[10px] rounded-full border ${filters.planIds.includes(p.id) ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Compare</label>
              <select
                value={filters.compare}
                onChange={(e) => setFilters(prev => ({ ...prev, compare: e.target.value }))}
                className="w-full mt-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-slate-400"
              >
                <option value="last_month">vs Last Month</option>
                <option value="last_year">vs Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KPICard title="Revenue" value={formatCurrency(Number(kpis.total_revenue.value))} trend={kpis.total_revenue.trend} isPositive={kpis.total_revenue.is_positive} icon={<DollarSign size={14} />} color={COLORS.success} />
        <KPICard title="Active Subs" value={kpis.active_subs.value.toLocaleString()} trend={kpis.active_subs.trend} isPositive={kpis.active_subs.is_positive} icon={<Users size={14} />} color={COLORS.primary} />
        <KPICard title="ARPU" value={formatCurrency(Number(kpis.arpu.value))} trend={kpis.arpu.trend} isPositive={kpis.arpu.is_positive} icon={<Layers size={14} />} color={COLORS.info} />
        <KPICard title="New / Churn" value={`${kpis.new_subs.value} / ${kpis.churn_subs.value}`} trend={kpis.new_subs.trend} isPositive={kpis.new_subs.is_positive} icon={<UserPlus size={14} />} color={COLORS.purple} />
        
        <KPICard title="Retention" value={`${kpis.retention_rate.value}%`} trend={0} isPositive={true} icon={<Repeat size={14} />} color={COLORS.info} />
        <KPICard title="Top Plan (Rev)" value={kpis.top_rev_plan.value.toString()} trend={0} isPositive={true} icon={<Award size={14} />} color={COLORS.warning} />
        <KPICard title="Top Plan (Vol)" value={kpis.top_vol_plan.value.toString()} trend={0} isPositive={true} icon={<Package size={14} />} color={COLORS.primary} />
        <KPICard title="Total Plans" value={filterOptions.plans.length} trend={0} isPositive={true} icon={<Layers size={14} />} color={COLORS.secondary} />
      </div>

      {/* Charts - Compact Height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.revenue_by_plan} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                formatter={(value) => formatCurrency(Number(value))} 
              />
              <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase">Subscription Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={charts.subscription_trends} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="new" stroke={COLORS.success} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="churn" stroke={COLORS.error} strokeWidth={2} dot={false} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scatter Chart - Compact */}
        <div className="bg-white rounded-lg border border-slate-200 p-3">
          <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase">Rev. vs Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ left: -20, bottom: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="volume" name="Subs" unit="" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="revenue" name="Rev" unit="" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <ZAxis type="category" dataKey="name" name="Plan" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: '11px' }} />
              <Scatter name="Plans" data={charts.revenue_vs_volume} fill={COLORS.purple}>
                {charts.revenue_vs_volume.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Compact Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-3 flex flex-col">
          <h3 className="text-xs font-bold text-slate-700 mb-2 uppercase">Performance Matrix</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-1.5 px-2 text-slate-500 font-semibold">Plan</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Price</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Subs</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Revenue</th>
                  <th className="text-right py-1.5 px-2 text-slate-500 font-semibold">Churn</th>
                </tr>
              </thead>
              <tbody>
                {tables.plan_performance.slice(0, 5).map((plan) => (
                  <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-1.5 px-2 font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{plan.name}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{formatCurrency(plan.price)}</td>
                    <td className="py-1.5 px-2 text-right text-slate-500">{plan.subscribers}</td>
                    <td className="py-1.5 px-2 text-right text-green-600 font-medium">{formatCurrency(plan.revenue)}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        plan.churn_rate > 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {plan.churn_rate}%
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

export default ServicePlanAnalytics
