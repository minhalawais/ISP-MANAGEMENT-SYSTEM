"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { PieChart, Pie, Cell } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const COLORS = ["#3A86FF", "#10B981", "#F59E0B", "#7C3AED"]

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-[#EBF5FF] rounded mb-4" /> {/* Title skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg bg-[#EBF5FF]/50">
          <div className="h-4 w-24 bg-[#EBF5FF] rounded mb-2" /> {/* Stat title skeleton */}
          <div className="h-8 w-16 bg-[#EBF5FF] rounded" /> {/* Stat value skeleton */}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="h-6 w-40 bg-[#EBF5FF] rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-[#EBF5FF] rounded" /> {/* Chart skeleton */}
      </div>
      <div>
        <div className="h-6 w-40 bg-[#EBF5FF] rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-[#EBF5FF] rounded" /> {/* Chart skeleton */}
      </div>
    </div>
  </div>
)

export const ExecutiveSummary: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get("http://127.0.0.1:8000/dashboard/executive-summary", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setDashboardData(response.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch dashboard data")
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading)
    return (
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <LoadingSkeleton />
      </section>
    )

  if (error)
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg p-4 text-[#EF4444]">Error: {error}</div>

  if (!dashboardData) return null

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-[#2A5C8A]">Executive Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Customer Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.customer_growth_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
              <XAxis dataKey="month" tick={{ fill: "#4A5568" }} />
              <YAxis tick={{ fill: "#4A5568" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#EBF5FF",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#3A86FF"
                strokeWidth={2}
                dot={{ fill: "#3A86FF", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Active Service Plans Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.service_plan_data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.service_plan_data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#EBF5FF",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Total Active Customers</h4>
          <p className="text-2xl font-bold text-[#3A86FF]">{dashboardData.total_active_customers}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Monthly Recurring Revenue</h4>
          <p className="text-2xl font-bold text-[#10B981]">PKR{dashboardData.monthly_recurring_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Outstanding Payments</h4>
          <p className="text-2xl font-bold text-[#F59E0B]">PKR{dashboardData.outstanding_payments.toFixed(2)}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Active Complaints</h4>
          <p className="text-2xl font-bold text-[#EF4444]">{dashboardData.active_complaints}</p>
        </div>
      </div>
    </section>
  )
}
