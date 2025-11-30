"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface NetworkAlert {
  id: string
  alert_type: string
  severity: string
  title: string
  message: string
  is_resolved: boolean
  triggered_at: string
  resolved_at: string
  customer_id: string
}

export default function NetworkAlerts() {
  const [alerts, setAlerts] = useState<NetworkAlert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterResolved, setFilterResolved] = useState<boolean | null>(false)

  useEffect(() => {
    fetchAlerts()
  }, [filterResolved])

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const params = filterResolved !== null ? { is_resolved: filterResolved } : {}
      const response = await axiosInstance.get("/network-alerts/list", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      setAlerts(response.data)
    } catch (error) {
      console.error("Failed to fetch alerts", error)
      toast.error("Failed to fetch alerts", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const token = getToken()
      await axiosInstance.put(
        `/network-alerts/resolve/${alertId}`,
        {
          resolution_notes: "Resolved by user",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Alert resolved successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      fetchAlerts()
    } catch (error) {
      console.error("Failed to resolve alert", error)
      toast.error("Failed to resolve alert", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#DC2626"
      case "high":
        return "#EF4444"
      case "medium":
        return "#F59E0B"
      case "low":
        return "#3B82F6"
      default:
        return "#6B7280"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
          Network Alerts
        </h2>
        <div className="flex gap-2">
          {[
            { label: "All", value: null },
            { label: "Active", value: false },
            { label: "Resolved", value: true },
          ].map((filter) => (
            <button
              key={String(filter.value)}
              onClick={() => setFilterResolved(filter.value)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filterResolved === filter.value ? "text-white" : "text-gray-600 hover:text-gray-900"
              }`}
              style={{
                backgroundColor: filterResolved === filter.value ? "#89A8B2" : "transparent",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto animate-spin" style={{ color: "#89A8B2" }} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: "#10B981" }} />
          <p style={{ color: "#7F8C8D" }}>No alerts to display</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border rounded-lg p-4 flex items-start justify-between"
              style={{ borderColor: getSeverityColor(alert.severity) }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" style={{ color: getSeverityColor(alert.severity) }} />
                  <h3 className="font-semibold" style={{ color: "#2C3E50" }}>
                    {alert.title}
                  </h3>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${getSeverityColor(alert.severity)}20`,
                      color: getSeverityColor(alert.severity),
                    }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: "#7F8C8D" }} className="text-sm mb-2">
                  {alert.message}
                </p>
                <p style={{ color: "#95A5A6" }} className="text-xs">
                  {new Date(alert.triggered_at).toLocaleString()}
                </p>
              </div>

              {!alert.is_resolved && (
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="ml-4 px-3 py-2 text-sm rounded-lg text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#89A8B2" }}
                >
                  Resolve
                </button>
              )}
              {alert.is_resolved && (
                <div className="ml-4 px-3 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: "#10B981" }}>
                  Resolved
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
