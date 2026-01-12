"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Play, AlertCircle, CheckCircle2 } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import APIConnectionForm from "../../components/forms/APIConnectionForm.tsx"
import { Modal } from "../../components/modal.tsx"

interface APIConnection {
  id: string
  name: string
  provider_type: string
  description: string
  is_active: boolean
  sync_status: string
  last_sync: string
  error_message: string
  total_syncs: number
  successful_syncs: number
  failed_syncs: number
}

interface APIConnectionListProps {
  connections: APIConnection[]
  onRefresh: () => void
}

export default function APIConnectionList({ connections, onRefresh }: APIConnectionListProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingConnection, setEditingConnection] = useState<APIConnection | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddConnection = () => {
    setEditingConnection(null)
    setShowModal(true)
  }

  const handleEditConnection = (connection: APIConnection) => {
    setEditingConnection(connection)
    setShowModal(true)
  }

  const handleDeleteConnection = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this API connection?")) return

    try {
      setIsLoading(true)
      const token = getToken()
      await axiosInstance.delete(`/api-connections/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("API connection deleted successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      onRefresh()
    } catch (error) {
      console.error("Failed to delete connection", error)
      toast.error("Failed to delete API connection", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncConnection = async (id: string) => {
    try {
      setIsLoading(true)
      const token = getToken()
      const response = await axiosInstance.post(
        `/api-connections/sync/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success("Sync completed successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      onRefresh()
    } catch (error) {
      console.error("Failed to sync connection", error)
      toast.error("Failed to sync API connection", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#10B981"
      case "failed":
        return "#EF4444"
      case "syncing":
        return "#F59E0B"
      default:
        return "#6B7280"
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: "#2C3E50" }}>
            API Connections
          </h2>
          <button
            onClick={handleAddConnection}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all"
            style={{ backgroundColor: "#89A8B2" }}
          >
            <Plus className="h-5 w-5" />
            Add Connection
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#B3C8CF" }} />
            <p style={{ color: "#7F8C8D" }}>No API connections configured yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all"
                style={{ borderColor: "#B3C8CF" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold" style={{ color: "#2C3E50" }}>
                      {connection.name}
                    </h3>
                    <p style={{ color: "#7F8C8D" }} className="text-sm">
                      {connection.provider_type.toUpperCase()} • {connection.description}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{
                      backgroundColor: `${getSyncStatusColor(connection.sync_status)}20`,
                      color: getSyncStatusColor(connection.sync_status),
                    }}
                  >
                    {connection.sync_status === "success" && <CheckCircle2 className="h-3 w-3" />}
                    {connection.sync_status === "failed" && <AlertCircle className="h-3 w-3" />}
                    {connection.sync_status.charAt(0).toUpperCase() + connection.sync_status.slice(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p style={{ color: "#7F8C8D" }}>Total Syncs</p>
                    <p className="font-semibold" style={{ color: "#2C3E50" }}>
                      {connection.total_syncs}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#7F8C8D" }}>Successful</p>
                    <p className="font-semibold" style={{ color: "#10B981" }}>
                      {connection.successful_syncs}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#7F8C8D" }}>Failed</p>
                    <p className="font-semibold" style={{ color: "#EF4444" }}>
                      {connection.failed_syncs}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: "#7F8C8D" }}>Last Sync</p>
                    <p className="font-semibold" style={{ color: "#2C3E50" }}>
                      {connection.last_sync ? new Date(connection.last_sync).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSyncConnection(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white hover:opacity-90 transition-all disabled:opacity-50"
                    style={{ backgroundColor: "#89A8B2" }}
                  >
                    <Play className="h-4 w-4" />
                    Sync Now
                  </button>
                  <button
                    onClick={() => handleEditConnection(connection)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white hover:opacity-90 transition-all"
                    style={{ backgroundColor: "#B3C8CF" }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-white hover:opacity-90 transition-all disabled:opacity-50 bg-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        title={editingConnection ? "Edit API Connection" : "Add New API Connection"}
        size="lg"
      >
        <APIConnectionForm
          connection={editingConnection}
          onSuccess={() => {
            setShowModal(false)
            onRefresh()
          }}
        />
      </Modal>
    </>
  )
}
