"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import {
  ClipboardList,
  AlertCircle,
  Users,
  Wallet,
  RefreshCw,
  TrendingUp,
  Clock,
  Target,
  Award,
} from "lucide-react"

interface DashboardStats {
  pending_tasks: number
  open_complaints: number
  managed_customers: number
  total_managed_customers: number
  current_balance: number
  todays_collections: number
  pending_recoveries: number
  month_earnings: number
}

interface PerformanceMetrics {
  complaint_resolution_rate: number
  avg_resolution_time_hours: number
  task_completion_rate: number
  customer_retention_rate: number
  collection_efficiency: number
  total_complaints_assigned: number
  resolved_complaints: number
  total_tasks_assigned: number
  completed_tasks: number
  active_customers: number
  total_managed_customers: number
}

export function PortalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = getToken()
      const [statsRes, perfRes] = await Promise.all([
        axiosInstance.get("/employee-portal/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosInstance.get("/employee-portal/performance", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setStats(statsRes.data)
      setPerformance(perfRes.data)
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      label: "Pending Tasks",
      value: stats?.pending_tasks || 0,
      icon: ClipboardList,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "Open Complaints",
      value: stats?.open_complaints || 0,
      icon: AlertCircle,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      label: "Active Customers",
      value: stats?.managed_customers || 0,
      icon: Users,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "Current Balance",
      value: `PKR ${(stats?.current_balance || 0).toLocaleString()}`,
      icon: Wallet,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      label: "Today's Collections",
      value: `PKR ${(stats?.todays_collections || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
    },
    {
      label: "Pending Recoveries",
      value: stats?.pending_recoveries || 0,
      icon: RefreshCw,
      color: "bg-red-500",
      bgColor: "bg-red-50",
    },
  ]

  const performanceCards = [
    {
      label: "Task Completion",
      value: `${performance?.task_completion_rate || 0}%`,
      subtext: `${performance?.completed_tasks || 0}/${performance?.total_tasks_assigned || 0} tasks`,
      icon: Target,
      color: "text-blue-600",
    },
    {
      label: "Complaint Resolution",
      value: `${performance?.complaint_resolution_rate || 0}%`,
      subtext: `${performance?.resolved_complaints || 0}/${performance?.total_complaints_assigned || 0} resolved`,
      icon: Award,
      color: "text-green-600",
    },
    {
      label: "Avg Resolution Time",
      value: `${performance?.avg_resolution_time_hours || 0}h`,
      subtext: "Average time to resolve",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      label: "Customer Retention",
      value: `${performance?.customer_retention_rate || 0}%`,
      subtext: `${performance?.active_customers || 0}/${performance?.total_managed_customers || 0} active`,
      icon: Users,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div
              key={index}
              className={`${kpi.bgColor} rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className={`${kpi.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-gray-600 mt-1">{kpi.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#89A8B2]" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceCards.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${metric.color}`} />
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{metric.label}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month Summary */}
      <div className="bg-gradient-to-r from-[#89A8B2] to-[#6B8A94] rounded-xl p-4 lg:p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">This Month's Earnings</h3>
        <p className="text-3xl font-bold">PKR {(stats?.month_earnings || 0).toLocaleString()}</p>
        <p className="text-sm opacity-80 mt-1">
          Including commissions, bonuses, and salary accruals
        </p>
      </div>
    </div>
  )
}
