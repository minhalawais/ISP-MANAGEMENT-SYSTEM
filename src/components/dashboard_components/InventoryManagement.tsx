"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  ComposedChart, BarChart, Bar, Area, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import {
  Package, DollarSign, Box, UserCheck, AlertTriangle, RefreshCcw,
  Clock, RotateCcw, Filter, RefreshCw, Download, TrendingUp, TrendingDown
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
  itemType: string
  supplierId: string
  status: string
  compare: string
  timeRange: string
}

interface DashboardData {
  kpis: {
    total_items: KPIData
    total_value: KPIData
    in_stock: KPIData
    assigned: KPIData
    low_stock: KPIData
    turnover_rate: KPIData
    avg_assignment_days: KPIData
    returns: KPIData
  }
  charts: {
    stock_by_type: any[]
    movement_trend: any[]
    value_distribution: any[]
    assignment_status: any[]
  }
  tables: {
    low_stock_items: any[]
    recent_transactions: any[]
  }
  filters: {
    item_types: string[]
    suppliers: { id: string; name: string }[]
    statuses: string[]
  }
}

// Colors
const COLORS = {
  primary: '#89A8B2',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6'
}

const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']

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
    <p className="text-lg font-bold text-slate-800">{value}</p>
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
export const InventoryManagement: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const today = getPakistaniDate()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: formatDate(startOfMonth),
    endDate: formatDate(today),
    itemType: 'all',
    supplierId: 'all',
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
        item_type: filters.itemType,
        supplier_id: filters.supplierId,
        status: filters.status,
        compare: filters.compare
      })
      
      const response = await axiosInstance.get(`/dashboard/inventory-advanced?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        timeout: 30000
      })
      
      setData(response.data)
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.response?.data?.error || 'Failed to load inventory data')
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
            <AlertTriangle className="w-8 h-8 text-red-500 mr-4" />
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
          <Package className="w-8 h-8" style={{ color: COLORS.primary }} />
          <h1 className="text-2xl font-bold text-slate-800">Inventory Analytics</h1>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            
            {/* Item Type */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Item Type</label>
              <select
                value={filters.itemType}
                onChange={(e) => setFilters(prev => ({ ...prev, itemType: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {filterOptions?.item_types?.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            
            {/* Supplier */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
              <select
                value={filters.supplierId}
                onChange={(e) => setFilters(prev => ({ ...prev, supplierId: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Suppliers</option>
                {filterOptions?.suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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

      {/* KPIs Row 1: Stock Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Items"
          value={kpis.total_items.value.toLocaleString()}
          icon={<Package size={18} />}
          color={COLORS.primary}
        />
        <KPICard
          title="Total Value"
          value={formatCurrency(kpis.total_value.value)}
          icon={<DollarSign size={18} />}
          color={COLORS.success}
        />
        <KPICard
          title="In Stock"
          value={kpis.in_stock.value.toLocaleString()}
          icon={<Box size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Assigned"
          value={kpis.assigned.value.toLocaleString()}
          icon={<UserCheck size={18} />}
          color={COLORS.purple}
        />
      </div>

      {/* KPIs Row 2: Performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Low Stock Alerts"
          value={kpis.low_stock.value}
          icon={<AlertTriangle size={18} />}
          color={kpis.low_stock.value > 0 ? COLORS.error : COLORS.success}
        />
        <KPICard
          title="Turnover Rate"
          value={`${kpis.turnover_rate.value}x`}
          icon={<RefreshCcw size={18} />}
          color={COLORS.info}
        />
        <KPICard
          title="Avg Assignment"
          value={`${kpis.avg_assignment_days.value}d`}
          icon={<Clock size={18} />}
          color={COLORS.purple}
        />
        <KPICard
          title="Returns"
          value={kpis.returns.value}
          trend={kpis.returns.trend}
          isPositive={kpis.returns.is_positive}
          icon={<RotateCcw size={18} />}
          color={COLORS.warning}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.stock_by_type} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill={COLORS.primary} radius={[0, 4, 4, 0]} name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Movement Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Movement Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={charts.movement_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="assignments" name="Assigned" fill={COLORS.info} fillOpacity={0.3} stroke={COLORS.info} />
              <Line type="monotone" dataKey="returns" name="Returned" stroke={COLORS.warning} strokeWidth={2} dot={{ fill: COLORS.warning }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Value Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.value_distribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="type"
                label={({ type, value }) => `${type}: ${formatCurrency(value)}`}
              >
                {charts.value_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Assignment Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Assignment Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.assignment_status}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                label={({ status, count }) => `${status}: ${count}`}
              >
                <Cell fill={COLORS.success} />
                <Cell fill={COLORS.info} />
                <Cell fill={COLORS.purple} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Low Stock Items</h3>
            {tables.low_stock_items.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                {tables.low_stock_items.length} alerts
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Type</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Qty</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {tables.low_stock_items.length > 0 ? tables.low_stock_items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2 font-medium text-slate-800">{item.item_type}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-red-600 font-medium">{item.quantity}</span>
                      <span className="text-slate-400">/{item.threshold}</span>
                    </td>
                    <td className="py-2 px-2 text-slate-600">{item.supplier}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      All items have sufficient stock
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Type</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Item</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Qty</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {tables.recent_transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        t.type === 'assignment' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">{t.item_type}</td>
                    <td className="py-2 px-2 text-right text-slate-600">{t.quantity}</td>
                    <td className="py-2 px-2 text-slate-600 truncate max-w-20">{t.performed_by}</td>
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

export default InventoryManagement