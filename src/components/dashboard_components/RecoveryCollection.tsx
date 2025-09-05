"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { PieChart, Pie, Cell } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface RecoveryPerformanceData {
  month: string
  recovered: number
  outstanding: number
}

interface OutstandingByAgeData {
  name: string
  value: number
}

interface RecoveryMetrics {
  totalRecovered: number
  totalOutstanding: number
  recoveryRate: number
  avgCollectionTime: number
}

const COLORS = ["#3A86FF", "#10B981", "#F59E0B", "#EF4444"]

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

export const RecoveryCollections: React.FC = () => {
  const [recoveryPerformanceData, setRecoveryPerformanceData] = useState<RecoveryPerformanceData[]>([])
  const [outstandingByAgeData, setOutstandingByAgeData] = useState<OutstandingByAgeData[]>([])
  const [metrics, setMetrics] = useState<RecoveryMetrics>({
    totalRecovered: 0,
    totalOutstanding: 0,
    recoveryRate: 0,
    avgCollectionTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/recovery-collections", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setRecoveryPerformanceData(response.data.recoveryPerformanceData)
        setOutstandingByAgeData(response.data.outstandingByAgeData)
        setMetrics(response.data.metrics)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch recovery and collections data")
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
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg p-4 text-[#EF4444]">Error: {error}</div>

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Recovery Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={recoveryPerformanceData}>
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
            <Bar dataKey="recovered" fill="#10B981" name="Recovered Amount" />
            <Bar dataKey="outstanding" fill="#F59E0B" name="Outstanding Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Outstanding by Age</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={outstandingByAgeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {outstandingByAgeData.map((entry, index) => (
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
      <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Recovery & Collections Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Total Recovered</h4>
            <p className="text-2xl font-bold text-[#10B981]">PKR{metrics.totalRecovered.toLocaleString()}</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Total Outstanding</h4>
            <p className="text-2xl font-bold text-[#F59E0B]">PKR{metrics.totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Recovery Rate</h4>
            <p className="text-2xl font-bold text-[#3A86FF]">{metrics.recoveryRate.toFixed(2)}%</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Avg. Collection Time</h4>
            <p className="text-2xl font-bold text-[#7C3AED]">{metrics.avgCollectionTime} days</p>
          </div>
        </div>
      </div>
    </div>
  )
}
