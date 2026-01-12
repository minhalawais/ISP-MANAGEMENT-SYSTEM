"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  Box,
  Router,
  Cable,
  HardDrive,
  Calendar,
  CheckCircle,
  ArrowLeftRight,
} from "lucide-react"

interface InventoryItem {
  id: string
  item_id: string
  item_type: string | null
  serial_number: string | null
  assigned_at: string | null
  returned_at: string | null
  status: string
}

const itemTypeIcons: Record<string, React.ElementType> = {
  router: Router,
  ont: HardDrive,
  cable: Cable,
}

const statusColors: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  returned: "bg-gray-100 text-gray-700",
  damaged: "bg-red-100 text-red-700",
}

export function PortalInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/employee-portal/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInventory(response.data)
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      toast.error("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    )
  }

  const assignedItems = inventory.filter((item) => item.status === "assigned")
  const returnedItems = inventory.filter((item) => item.status === "returned")

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Box className="w-8 h-8 text-[#89A8B2] mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{assignedItems.length}</p>
          <p className="text-xs text-blue-600">With Me</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
          <ArrowLeftRight className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-700">{returnedItems.length}</p>
          <p className="text-xs text-gray-500">Returned</p>
        </div>
      </div>

      {/* Currently Assigned */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-[#89A8B2]" />
          Currently Assigned
        </h3>

        {assignedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No items currently assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedItems.map((item) => {
              const Icon = itemTypeIcons[item.item_type?.toLowerCase() || ""] || Box
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#89A8B2]/10 rounded-lg">
                      <Icon className="w-6 h-6 text-[#89A8B2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {item.item_type?.replace("_", " ") || "Unknown"}
                      </p>
                      {item.serial_number && (
                        <p className="text-xs text-gray-500">S/N: {item.serial_number}</p>
                      )}
                      {item.assigned_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Assigned: {new Date(item.assigned_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[item.status] || statusColors.assigned}`}>
                    {item.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History */}
      {returnedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-gray-500" />
            Returned Items
          </h3>
          <div className="space-y-3">
            {returnedItems.map((item) => {
              const Icon = itemTypeIcons[item.item_type?.toLowerCase() || ""] || Box
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {item.item_type?.replace("_", " ") || "Unknown"}
                      </p>
                      {item.serial_number && (
                        <p className="text-xs text-gray-500">S/N: {item.serial_number}</p>
                      )}
                    </div>
                  </div>
                  {item.returned_at && (
                    <span className="text-xs text-gray-500">
                      Returned: {new Date(item.returned_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
