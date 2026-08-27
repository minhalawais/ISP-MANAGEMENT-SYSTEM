"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import {
  Users,
  Phone,
  ChevronRight,
  Search,
  Wallet,
  UserCheck,
} from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"
import { PortalSegmentedControl } from "./shared/PortalSegmentedControl.tsx"

interface Customer {
  id: string
  internet_id: string
  first_name: string
  last_name: string
  email: string | null
  phone_1: string | null
  phone_2: string | null
  cnic: string | null
  installation_address: string | null
  area: string | null
  sub_zone: string | null
  isp_name: string | null
  connection_type: string | null
  is_active: boolean
  installation_date: string | null
  total_due: number
}

function initials(first: string, last: string) {
  return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase() || "?"
}

export function PortalCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")

  useEffect(() => {
    fetchCustomers()
  }, [search, activeFilter])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (activeFilter === "active") params.append("is_active", "true")
      if (activeFilter === "inactive") params.append("is_active", "false")
      
      const response = await axiosInstance.get(`/employee-portal/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCustomers(response.data)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const totalDue = customers.reduce((sum, c) => sum + c.total_due, 0)
  const activeCount = customers.filter((c) => c.is_active).length

  const statItems: PortalStatItem[] = [
    { key: "total", label: "Total", value: customers.length, icon: Users, tone: "default" },
    { key: "active", label: "Active", value: activeCount, icon: UserCheck, tone: "success" },
    {
      key: "due",
      label: "Due",
      value: `PKR ${totalDue.toLocaleString()}`,
      icon: Wallet,
      tone: totalDue > 0 ? "danger" : "success",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-14 bg-gray-200 rounded-lg animate-pulse" />
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search & filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or internet ID..."
            className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
          />
        </div>
        <PortalSegmentedControl
          options={[
            { value: "all", label: "all" },
            { value: "active", label: "active" },
            { value: "inactive", label: "inactive" },
          ]}
          value={activeFilter}
          onChange={setActiveFilter}
          className="shrink-0"
        />
      </div>

      {/* Summary strip */}
      <PortalStatStrip items={statItems} columnsMobile={3} columnsDesktop={3} />

      {/* Customer list */}
      {customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No customers found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
          {customers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => navigate(`/employee-portal/customers/${customer.id}`)}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm ${
                  customer.is_active
                    ? "bg-emerald-green/15 text-emerald-green ring-2 ring-emerald-green/20"
                    : "bg-slate-gray/15 text-slate-gray ring-2 ring-slate-gray/10"
                }`}
              >
                {initials(customer.first_name, customer.last_name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </p>
                  {!customer.is_active && (
                    <span className="shrink-0 rounded-full bg-slate-gray/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-gray">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-electric-blue">
                  {customer.internet_id}
                  {customer.area ? <span className="text-gray-500">{` · ${customer.area}`}</span> : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {customer.total_due > 0 ? (
                  <span className="text-sm font-semibold text-coral-red whitespace-nowrap">
                    PKR {customer.total_due.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-green whitespace-nowrap">Paid</span>
                )}
                {customer.phone_1 && (
                  <a
                    href={`tel:${customer.phone_1}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-electric-blue/10 hover:text-electric-blue transition-colors"
                    aria-label={`Call ${customer.first_name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
