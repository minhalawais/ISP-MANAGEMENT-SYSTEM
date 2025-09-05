"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BarChart, Bar } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-[#EBF5FF] rounded mb-4" /> {/* Title skeleton */}
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg bg-[#EBF5FF]/50">
          <div className="h-4 w-24 bg-[#EBF5FF] rounded mb-2" /> {/* Stat title skeleton */}
          <div className="h-8 w-16 bg-[#EBF5FF] rounded" /> {/* Stat value skeleton */}
        </div>
      ))}
    </div>
  </div>
)

export const FinancialAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get("http://127.0.0.1:8000/dashboard/financial-analytics", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setAnalyticsData(response.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch analytics data")
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  if (loading)
    return (
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <LoadingSkeleton />
      </section>
    )

  if (error)
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg p-4 text-[#EF4444]">Error: {error}</div>

  if (!analyticsData) return null

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-[#2A5C8A]">Financial Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Monthly Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthly_revenue}>
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
                dataKey="revenue"
                stroke="#3A86FF"
                strokeWidth={2}
                dot={{ fill: "#3A86FF", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Revenue by Service Plans</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenue_by_plan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
              <XAxis dataKey="plan" tick={{ fill: "#4A5568" }} />
              <YAxis tick={{ fill: "#4A5568" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#EBF5FF",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Total Revenue</h4>
          <p className="text-2xl font-bold text-[#10B981]">PKR{analyticsData.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Average Revenue per User</h4>
          <p className="text-2xl font-bold text-[#3A86FF]">PKR{analyticsData.avg_revenue_per_user.toFixed(2)}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Operating Expenses</h4>
          <p className="text-2xl font-bold text-[#F59E0B]">PKR{analyticsData.operating_expenses.toFixed(2)}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Net Profit Margin</h4>
          <p className="text-2xl font-bold text-[#7C3AED]">{analyticsData.net_profit_margin.toFixed(2)}%</p>
        </div>
      </div>
    </section>
  )
}
