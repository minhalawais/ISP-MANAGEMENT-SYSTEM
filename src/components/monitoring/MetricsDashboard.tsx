"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { AlertCircle, TrendingUp } from "lucide-react"

interface APIConnection {
  id: string
  name: string
  provider_type: string
}

interface MetricsDashboardProps {
  connections: APIConnection[]
}

export default function MetricsDashboard({ connections }: MetricsDashboardProps) {
  const [selectedConnection, setSelectedConnection] = useState<string>("")
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (connections.length > 0 && !selectedConnection) {
      setSelectedConnection(connections[0].id)
    }
  }, [connections])

  useEffect(() => {
    if (selectedConnection) {
      fetchMetrics()
    }
  }, [selectedConnection])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/network-metrics/connection/${selectedConnection}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      })
      setMetrics(response.data.metrics || [])
    } catch (error) {
      console.error("Failed to fetch metrics", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (connections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#B3C8CF" }} />
          <p style={{ color: "#7F8C8D" }}>No API connections available. Please add one first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E50" }}>
          Select Connection
        </label>
        <select
          value={selectedConnection}
          onChange={(e) => setSelectedConnection(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ borderColor: "#B3C8CF", color: "#2C3E50" }}
        >
          {connections.map((conn) => (
            <option key={conn.id} value={conn.id}>
              {conn.name} ({conn.provider_type})
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">
            <TrendingUp className="h-8 w-8" style={{ color: "#89A8B2" }} />
          </div>
        </div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#B3C8CF" }} />
          <p style={{ color: "#7F8C8D" }}>No metrics available yet</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "#2C3E50" }}>
              Metrics Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.slice(-20)}>
                <CartesianGrid stroke="#B3C8CF" />
                <XAxis dataKey="metric_type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="metric_type" stroke="#89A8B2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.slice(0, 4).map((metric, idx) => (
              <div key={idx} className="border rounded-lg p-4" style={{ borderColor: "#B3C8CF" }}>
                <p className="text-sm font-medium" style={{ color: "#7F8C8D" }}>
                  {metric.metric_type}
                </p>
                <p className="text-2xl font-bold mt-2" style={{ color: "#89A8B2" }}>
                  {JSON.stringify(metric.metric_data).substring(0, 50)}...
                </p>
                <p className="text-xs mt-2" style={{ color: "#7F8C8D" }}>
                  {new Date(metric.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
