"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const LoadingSkeleton = () => (
  <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
      <div className="h-[300px] bg-slate-200 rounded" />
    </div>
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-4 rounded-lg bg-slate-100">
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-4 bg-slate-200 rounded w-full" />
        ))}
      </div>
    </div>
  </div>
)

// Custom color palette for charts
const COLORS = ["#3A86FF", "#10B981", "#F59E0B", "#EF4444", "#7C3AED"]

export const ServiceSupport: React.FC = () => {
  const [data, setData] = useState<any>({
    status_distribution: {},
    average_resolution_time: 0,
    customer_satisfaction_rate: 0,
    first_contact_resolution_rate: 0,
    support_ticket_volume: 0,
    remarks_summary: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get("http://127.0.0.1:8000/dashboard/service-support", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        if (response.data && !response.data.error) {
          setData(response.data)
          setLoading(false)
        } else {
          setError(response.data.error || "Unknown error")
          setLoading(false)
        }
      } catch (error) {
        setError("Failed to fetch service support data")
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error)
    return (
      <div className="bg-[#FEE2E2] border border-[#EF4444] rounded-lg p-4 text-[#B91C1C]">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 mr-2"
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

  const statusDistributionData = Object.entries(data.status_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }))

  // Custom status colors
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "#F59E0B" // Golden Amber
      case "in progress":
        return "#3A86FF" // Electric Blue
      case "resolved":
        return "#10B981" // Emerald Green
      case "closed":
        return "#4A5568" // Slate Gray
      default:
        return "#7C3AED" // Violet
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Complaint Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusDistributionData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {statusDistributionData.map((entry, index) => {
                const statusName = entry.name.toString().toLowerCase()
                return <Cell key={`cell-${index}`} fill={getStatusColor(statusName)} stroke="#FFFFFF" strokeWidth={2} />
              })}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, name]}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "0.375rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: "20px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Service & Support Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#2A5C8A] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Average Resolution Time</h4>
            <p className="text-2xl font-bold mt-1">{data.average_resolution_time} hours</p>
          </div>
          <div className="bg-[#3A86FF] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Customer Satisfaction</h4>
            <p className="text-2xl font-bold mt-1">{data.customer_satisfaction_rate}%</p>
          </div>
          <div className="bg-[#10B981] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">First Contact Resolution</h4>
            <p className="text-2xl font-bold mt-1">{data.first_contact_resolution_rate}%</p>
          </div>
          <div className="bg-[#4A5568] p-4 rounded-lg text-white shadow-md">
            <h4 className="text-sm font-medium opacity-90">Support Ticket Volume</h4>
            <p className="text-2xl font-bold mt-1">{data.support_ticket_volume}</p>
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Recent Remarks Summary</h3>
        {data.remarks_summary.length > 0 ? (
          <ul className="space-y-3">
            {data.remarks_summary.map((remark: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#EBF5FF] text-[#3A86FF] mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-[#4A5568] leading-relaxed">{remark}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-[#4A5568]">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-[#3A86FF] opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              ></path>
            </svg>
            <p>No remarks available</p>
          </div>
        )}
      </div>
    </div>
  )
}
