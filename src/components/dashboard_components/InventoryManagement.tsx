"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { LineChart, Line } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-[#EBF5FF] rounded mb-4" />
        <div className="h-[300px] bg-[#EBF5FF] rounded" />
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-[#EBF5FF] rounded mb-4" />
        <div className="h-[300px] bg-[#EBF5FF] rounded" />
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-[#EBF5FF] rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-[#EBF5FF]/50">
              <div className="h-4 w-24 bg-[#EBF5FF] rounded mb-2" />
              <div className="h-8 w-16 bg-[#EBF5FF] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export const InventoryManagement: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/inventory-management", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setInventoryData(response.data)
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch inventory data")
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [])

  if (loading) return <LoadingSkeleton />
  if (error)
    return <div className="bg-[#FEE2E2] border border-[#EF4444]/20 rounded-lg p-4 text-[#EF4444]">Error: {error}</div>
  if (!inventoryData) return null

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#2A5C8A]">Stock Level Overview</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData.stock_level_data?.stock_levels ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
              <XAxis dataKey="name" tick={{ fill: "#4A5568" }} />
              <YAxis tick={{ fill: "#4A5568" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderColor: "#EBF5FF",
                  borderRadius: "0.375rem",
                }}
              />
              <Legend />
              <Bar dataKey="quantity" fill="#3A86FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#2A5C8A]">Inventory Movement Trends</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={inventoryData.inventory_movement_data?.movement_data ?? []}>
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
                dataKey="assignments"
                stroke="#3A86FF"
                strokeWidth={2}
                dot={{ fill: "#3A86FF", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="returns"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4 text-[#2A5C8A]">Inventory Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Total Inventory Value</h4>
            <p className="text-2xl font-bold text-[#3A86FF]">
              PKR{inventoryData.inventory_metrics.total_inventory_value?.toLocaleString() ?? "N/A"}
            </p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Inventory Turnover Rate</h4>
            <p className="text-2xl font-bold text-[#10B981]">
              {inventoryData.inventory_metrics.inventory_turnover_rate ?? "N/A"}
            </p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Low Stock Items</h4>
            <p className="text-2xl font-bold text-[#F59E0B]">
              {inventoryData.inventory_metrics.low_stock_items ?? "N/A"}
            </p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Average Assignment Duration</h4>
            <p className="text-2xl font-bold text-[#7C3AED]">
              {inventoryData.inventory_metrics.avg_assignment_duration
                ? `${inventoryData.inventory_metrics.avg_assignment_duration} days`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
