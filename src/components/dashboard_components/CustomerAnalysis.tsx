"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { PieChart, Pie, Cell } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

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

const COLORS = ["#3A86FF", "#10B981", "#F59E0B", "#EF4444"]

export const CustomerAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/customer-analytics", {
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
      <h2 className="text-2xl font-bold mb-4 text-[#2A5C8A]">Customer Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Customer Acquisition Rate</h4>
          <p className="text-2xl font-bold text-[#3A86FF]">{analyticsData.acquisition_rate}%</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Customer Churn Rate</h4>
          <p className="text-2xl font-bold text-[#EF4444]">{analyticsData.churn_rate}%</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Average Customer Lifetime Value</h4>
          <p className="text-2xl font-bold text-[#3A86FF]">${analyticsData.avg_customer_lifetime_value}</p>
        </div>
        <div className="bg-[#EBF5FF] p-4 rounded-lg">
          <h4 className="text-sm font-medium text-[#2A5C8A]">Customer Satisfaction Score</h4>
          <p className="text-2xl font-bold text-[#10B981]">{analyticsData.customer_satisfaction_score}/5</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Customer Distribution by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.customer_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
              <XAxis dataKey="area" tick={{ fill: "#4A5568" }} />
              <YAxis tick={{ fill: "#4A5568" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#EBF5FF",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
              <Bar dataKey="customers" fill="#3A86FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-[#2A5C8A]">Service Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.service_plan_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.service_plan_distribution.map((entry: any, index: number) => (
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
    </section>
  )
}
