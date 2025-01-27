import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { LineChart, Line } from "recharts"
import axiosInstance from "../../utils/axiosConfig.ts"

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-[300px] bg-gray-200 rounded" />
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-[300px] bg-gray-200 rounded" />
      </div>
    </div>
    <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-100">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
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
        const response = await axiosInstance.get("https://mbanet.com.pk/api/dashboard/inventory-management", {
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
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">Error: {error}</div>
  if (!inventoryData) return null

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Stock Level Overview</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData.stock_level_data?.stock_levels ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Movement Trends</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={inventoryData.inventory_movement_data?.movement_data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="assignments" stroke="#8884d8" />
              <Line type="monotone" dataKey="returns" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Inventory Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Total Inventory Value</h4>
            <p className="text-2xl font-bold text-blue-900">
              ${inventoryData.inventory_metrics.total_inventory_value?.toLocaleString() ?? "N/A"}
            </p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800">Inventory Turnover Rate</h4>
            <p className="text-2xl font-bold text-green-900">
              {inventoryData.inventory_metrics.inventory_turnover_rate ?? "N/A"}
            </p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800">Low Stock Items</h4>
            <p className="text-2xl font-bold text-yellow-900">
              {inventoryData.inventory_metrics.low_stock_items ?? "N/A"}
            </p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800">Average Assignment Duration</h4>
            <p className="text-2xl font-bold text-purple-900">
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

