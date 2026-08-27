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
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"

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
      <div className="space-y-3 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const kpiItems: PortalStatItem[] = [
    { key: "pending_tasks", label: "Pending tasks", value: stats?.pending_tasks || 0, icon: ClipboardList, tone: "warning" },
    { key: "open_complaints", label: "Open complaints", value: stats?.open_complaints || 0, icon: AlertCircle, tone: "danger" },
    { key: "active_customers", label: "Active customers", value: stats?.managed_customers || 0, icon: Users, tone: "accent" },
    {
      key: "current_balance",
      label: "Current balance",
      value: `PKR ${(stats?.current_balance || 0).toLocaleString()}`,
      icon: Wallet,
      tone: "default",
    },
    {
      key: "todays_collections",
      label: "Today's collections",
      value: `PKR ${(stats?.todays_collections || 0).toLocaleString()}`,
      icon: TrendingUp,
      tone: "success",
    },
    {
      key: "pending_recoveries",
      label: "Pending recoveries",
      value: stats?.pending_recoveries || 0,
      icon: RefreshCw,
      tone: stats?.pending_recoveries ? "warning" : "default",
    },
    {
      key: "month_earnings",
      label: "This month's earnings",
      value: `PKR ${(stats?.month_earnings || 0).toLocaleString()}`,
      icon: Award,
      tone: "success",
    },
  ]

  const performanceCards = [
    {
      key: "task_completion",
      label: "Task completion",
      value: `${performance?.task_completion_rate || 0}%`,
      subtext: `${performance?.completed_tasks || 0}/${performance?.total_tasks_assigned || 0} tasks`,
      icon: Target,
      progress: performance?.task_completion_rate || 0,
    },
    {
      key: "complaint_resolution",
      label: "Complaint resolution",
      value: `${performance?.complaint_resolution_rate || 0}%`,
      subtext: `${performance?.resolved_complaints || 0}/${performance?.total_complaints_assigned || 0} resolved`,
      icon: Award,
      progress: performance?.complaint_resolution_rate || 0,
    },
    {
      key: "avg_resolution_time",
      label: "Avg resolution time",
      value: `${performance?.avg_resolution_time_hours || 0}h`,
      subtext: "Average time to resolve",
      icon: Clock,
      progress: undefined,
    },
    {
      key: "customer_retention",
      label: "Customer retention",
      value: `${performance?.customer_retention_rate || 0}%`,
      subtext: `${performance?.active_customers || 0}/${performance?.total_managed_customers || 0} active`,
      icon: Users,
      progress: performance?.customer_retention_rate || 0,
    },
  ]

  const progressTone = (pct: number) =>
    pct >= 70
      ? { bar: "bg-emerald-500", text: "text-emerald-600" }
      : pct >= 40
        ? { bar: "bg-amber-500", text: "text-amber-600" }
        : { bar: "bg-red-500", text: "text-red-600" }

  return (
    <div className="space-y-4">
      <PortalStatStrip items={kpiItems} columnsMobile={3} columnsDesktop={4} />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-blue/10">
            <Target className="h-3.5 w-3.5 text-electric-blue" />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
        </div>
        <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-2 lg:divide-y-0">
          {performanceCards.map((metric, idx) => {
            const Icon = metric.icon
            const tone = metric.progress != null ? progressTone(metric.progress) : null
            return (
              <div
                key={metric.key}
                className={`p-4 ${idx % 2 === 0 ? "lg:border-r lg:border-gray-100" : ""} ${
                  idx < performanceCards.length - 2 ? "lg:border-b lg:border-gray-100" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electric-blue/10">
                      <Icon className="h-3.5 w-3.5 text-electric-blue" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{metric.label}</p>
                      <p className="truncate text-xs text-gray-500">{metric.subtext}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-base font-bold tabular-nums ${tone?.text || "text-gray-900"}`}>
                    {metric.value}
                  </span>
                </div>
                {metric.progress != null && (
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-1.5 rounded-full ${tone?.bar}`}
                      style={{ width: `${Math.min(100, Math.max(0, metric.progress))}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
