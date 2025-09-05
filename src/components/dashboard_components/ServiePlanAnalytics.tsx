"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { LineChart, Line } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface ServicePlanData {
  servicePlanPerformanceData: Array<{
    plan: string
    subscribers: number
    revenue: number
  }>
  planAdoptionTrendData: Array<{
    month: string
    [key: string]: number | string
  }>
  metrics: {
    totalSubscribers: number
    totalRevenue: number
    mostPopularPlan: string
    highestRevenuePlan: string
  }
}

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-slate-200 rounded mb-4" /> {/* Title skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg bg-slate-100">
          <div className="h-4 w-24 bg-slate-200 rounded mb-2" /> {/* Stat title skeleton */}
          <div className="h-8 w-16 bg-slate-200 rounded" /> {/* Stat value skeleton */}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="h-6 w-40 bg-slate-200 rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-slate-200 rounded" /> {/* Chart skeleton */}
      </div>
      <div>
        <div className="h-6 w-40 bg-slate-200 rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-slate-200 rounded" /> {/* Chart skeleton */}
      </div>
    </div>
  </div>
)

// Custom color palette for charts
const CHART_COLORS = {
  subscribers: "#3A86FF",
  revenue: "#7C3AED",
  planColors: [
    "#3A86FF",
    "#7C3AED",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#2563EB",
    "#6D28D9",
    "#059669",
    "#D97706",
    "#DC2626",
  ],
}

export const ServicePlanAnalytics: React.FC = () => {
  const [data, setData] = useState<ServicePlanData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<ServicePlanData>(
          "/dashboard/service-plan-analytics",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        )
        setData(response.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch service plan analytics data")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading)
    return (
      <section className="bg-white rounded-lg shadow-md p-6 mb-6">
        <LoadingSkeleton />
      </section>
    )

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span className="font-medium">Error:</span> {error}
        </div>
      </div>
    )

  if (!data) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Service Plan Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.servicePlanPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="plan" tick={{ fill: "#4A5568" }} />
            <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.subscribers} />
            <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.revenue} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "0.375rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              labelStyle={{ color: "#2A5C8A", fontWeight: "bold" }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            <Bar
              yAxisId="left"
              dataKey="subscribers"
              fill={CHART_COLORS.subscribers}
              name="Subscribers"
              radius={[4, 4, 0, 0]}
            />
            <Bar yAxisId="right" dataKey="revenue" fill={CHART_COLORS.revenue} name="Revenue" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Plan Adoption Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.planAdoptionTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fill: "#4A5568" }} />
            <YAxis tick={{ fill: "#4A5568" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "0.375rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
              labelStyle={{ color: "#2A5C8A", fontWeight: "bold" }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            {Object.keys(data.planAdoptionTrendData[0])
              .filter((key) => key !== "month")
              .map((plan, index) => (
                <Line
                  key={plan}
                  type="monotone"
                  dataKey={plan}
                  stroke={CHART_COLORS.planColors[index % CHART_COLORS.planColors.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Service Plan Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#2A5C8A] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Total Subscribers</h4>
            <p className="text-2xl font-bold mt-1">{data.metrics.totalSubscribers.toLocaleString()}</p>
          </div>
          <div className="bg-[#3A86FF] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Total Revenue</h4>
            <p className="text-2xl font-bold mt-1">PKR{data.metrics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#7C3AED] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Most Popular Plan</h4>
            <p className="text-2xl font-bold mt-1">{data.metrics.mostPopularPlan}</p>
          </div>
          <div className="bg-[#4A5568] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Highest Revenue Plan</h4>
            <p className="text-2xl font-bold mt-1">{data.metrics.highestRevenuePlan}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
