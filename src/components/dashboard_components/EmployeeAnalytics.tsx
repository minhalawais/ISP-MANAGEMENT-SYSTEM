"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { LineChart, Line } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-[#EBF5FF] rounded mb-4" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-[#EBF5FF] rounded" /> {/* Chart skeleton */}
      </div>
    </div>
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-[#EBF5FF] rounded mb-4" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-[#EBF5FF] rounded" /> {/* Chart skeleton */}
      </div>
    </div>
    <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-[#EBF5FF] rounded mb-4" /> {/* Metrics title skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-[#EBF5FF]/50">
              <div className="h-4 w-24 bg-[#EBF5FF] rounded mb-2" /> {/* Metric title skeleton */}
              <div className="h-8 w-16 bg-[#EBF5FF] rounded" /> {/* Metric value skeleton */}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const EmployeePerformance: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/employee-analytics", {
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

  if (loading) return <LoadingSkeleton />

  if (error)
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg p-4 text-[#EF4444]">Error: {error}</div>

  if (!analyticsData) return null

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Employee Performance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
            <XAxis dataKey="employee" tick={{ fill: "#4A5568" }} />
            <YAxis yAxisId="left" orientation="left" stroke="#3A86FF" tick={{ fill: "#4A5568" }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{ fill: "#4A5568" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderColor: "#EBF5FF",
                borderRadius: "0.375rem",
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="tasks" fill="#3A86FF" name="Tasks Completed" />
            <Bar yAxisId="right" dataKey="satisfaction" fill="#10B981" name="Satisfaction Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Productivity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.productivityTrendData}>
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
              dataKey="productivity"
              stroke="#7C3AED"
              strokeWidth={2}
              dot={{ fill: "#7C3AED", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Employee Performance Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Average Tasks Completed</h4>
            <p className="text-2xl font-bold text-[#3A86FF]">{analyticsData.metrics.avgTasksCompleted}</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Average Satisfaction Score</h4>
            <p className="text-2xl font-bold text-[#10B981]">{analyticsData.metrics.avgSatisfactionScore}</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Top Performer</h4>
            <p className="text-2xl font-bold text-[#7C3AED]">{analyticsData.metrics.topPerformer}</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Training Completion Rate</h4>
            <p className="text-2xl font-bold text-[#3A86FF]">{analyticsData.metrics.trainingCompletionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
