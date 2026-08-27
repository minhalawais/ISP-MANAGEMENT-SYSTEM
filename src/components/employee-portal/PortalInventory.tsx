"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import { Box, Router, Cable, HardDrive, Calendar, CheckCircle, ArrowLeftRight } from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"

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

const itemTypeTints: Record<string, string> = {
  router: "bg-blue-50 text-blue-600",
  ont: "bg-violet-50 text-violet-600",
  cable: "bg-amber-50 text-amber-600",
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
      <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const assignedItems = inventory.filter((item) => item.status === "assigned")
  const returnedItems = inventory.filter((item) => item.status === "returned")

  const statItems: PortalStatItem[] = [
    { key: "total", label: "Total items", value: inventory.length, icon: Box },
    { key: "with_me", label: "With me", value: assignedItems.length, icon: CheckCircle, tone: "accent" },
    { key: "returned", label: "Returned", value: returnedItems.length, icon: ArrowLeftRight },
  ]

  return (
    <div className="space-y-4">
      <PortalStatStrip items={statItems} columnsMobile={3} columnsDesktop={3} />

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-portal-tint">
                <Box className="h-3.5 w-3.5 text-portal-primary" />
              </span>
              Currently assigned
            </h3>
          </div>

          {assignedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No items currently assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignedItems.map((item) => {
                const typeKey = item.item_type?.toLowerCase() || ""
                const Icon = itemTypeIcons[typeKey] || Box
                const tint = itemTypeTints[typeKey] || "bg-portal-tint text-portal-primary"
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tint}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-gray-900">
                          {item.item_type?.replace("_", " ") || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {item.serial_number ? `S/N: ${item.serial_number}` : "No serial number"}
                          {item.assigned_at && (
                            <span className="inline-flex items-center gap-1">
                              {" · "}
                              <Calendar className="w-3 h-3" />
                              {new Date(item.assigned_at).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${statusColors[item.status] || statusColors.assigned}`}
                    >
                      {item.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm lg:mt-0">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
                <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
              </span>
              Returned items
            </h3>
          </div>
          {returnedItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No returned items</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {returnedItems.map((item) => {
                const Icon = itemTypeIcons[item.item_type?.toLowerCase() || ""] || Box
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 opacity-70">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize text-gray-700">
                          {item.item_type?.replace("_", " ") || "Unknown"}
                        </p>
                        {item.serial_number && (
                          <p className="truncate text-xs text-gray-500">S/N: {item.serial_number}</p>
                        )}
                      </div>
                    </div>
                    {item.returned_at && (
                      <span className="shrink-0 text-xs text-gray-500 whitespace-nowrap">
                        Returned {new Date(item.returned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
