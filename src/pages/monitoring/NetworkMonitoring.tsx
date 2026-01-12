"use client"

import { useEffect, useState } from "react"
import { Topbar } from "../../components/topNavbar.tsx"
import { Sidebar } from "../../components/sideNavbar.tsx"
import { Activity, Settings, AlertCircle } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import APIConnectionList from "../../components/monitoring/APIConnectionList.tsx"
import MetricsDashboard from "../../components/monitoring/MetricsDashboard.tsx"
import NetworkAlerts from "../../components/monitoring/NetworkAlerts.tsx"

export default function NetworkMonitoring() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"connections" | "metrics" | "alerts">("connections")
  const [connections, setConnections] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    document.title = "MBA NET - Network Monitoring"
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axiosInstance.get("/api-connections/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setConnections(response.data)
    } catch (error) {
      console.error("Failed to fetch connections", error)
      toast.error("Failed to fetch API connections", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#F1F0E8" }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto p-0 sm:p-6 pt-20 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0 lg:ml-20"
          }`}
          style={{ backgroundColor: "#F1F0E8" }}
        >
          <div className="container mx-auto mt-10">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#89A8B2" }}>
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold" style={{ color: "#2C3E50" }}>
                      Network Monitoring
                    </h1>
                    <p style={{ color: "#7F8C8D" }}>Monitor your network infrastructure and API connections</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
              {[
                { id: "connections", label: "API Connections", icon: Settings },
                { id: "metrics", label: "Metrics", icon: Activity },
                { id: "alerts", label: "Alerts", icon: AlertCircle },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                      activeTab === tab.id ? "text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={{
                      backgroundColor: activeTab === tab.id ? "#89A8B2" : "transparent",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div>
              {activeTab === "connections" && (
                <APIConnectionList connections={connections} onRefresh={fetchConnections} />
              )}
              {activeTab === "metrics" && <MetricsDashboard connections={connections} />}
              {activeTab === "alerts" && <NetworkAlerts />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
