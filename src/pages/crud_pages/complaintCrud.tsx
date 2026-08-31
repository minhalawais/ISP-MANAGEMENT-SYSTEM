"use client"

import type React from "react"
import { useMemo, useEffect, useState, useCallback } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Clock, MessageSquare, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { CRUDPage } from "../../components/complaintCrudPage.tsx"
import { ComplaintForm } from "../../components/forms/complaintForm.tsx"
import { ComplaintViewModal } from "../../components/modals/ComplaintViewModal.tsx"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../context/CompanyContext.tsx"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts"

interface Complaint {
  id: string
  ticket_number?: string
  internet_id?: string
  customer_name: string
  phone_number?: string
  description: string
  category?: string
  category_label?: string
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to?: string | null
  assigned_to_name: string
  is_unassigned?: boolean
  created_at: string
  response_due_date: string | null
  is_active: boolean
  remarks: string
  attachment_path: string | null
}

const statusBadgeClass: Record<string, string> = {
  open: "bg-golden-amber/10 text-golden-amber",
  in_progress: "bg-electric-blue/10 text-electric-blue",
  resolved: "bg-emerald-green/10 text-emerald-green",
  closed: "bg-slate-gray/10 text-slate-gray",
}

function StatusIcon({ status }: { status: string }) {
  if (status === "in_progress") return <MessageSquare className="h-3.5 w-3.5" />
  if (status === "resolved") return <CheckCircle2 className="h-3.5 w-3.5" />
  if (status === "closed") return <XCircle className="h-3.5 w-3.5" />
  return <Clock className="h-3.5 w-3.5" />
}

const ComplaintManagement: React.FC = () => {
  const navigate = useNavigate()
  const { setPageTitle } = useCompany()
  const [viewComplaintId, setViewComplaintId] = useState<string | null>(null)
  const [collections, setCollections] = useState<any[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setPageTitle("Complaint Management")
  }, [setPageTitle])

  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true)
    try {
      const token = getToken()
      const res = await axiosInstance.get("/complaints/collections?pending=true", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCollections(Array.isArray(res.data) ? res.data : [])
    } catch {
      setCollections([])
    } finally {
      setCollectionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCollections()
  }, [loadCollections, refreshKey])

  const settleCollection = async (paymentId: string) => {
    try {
      const token = getToken()
      await axiosInstance.post(
        `/payments/${paymentId}/settle-complaint-cash`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Collection settled")
      loadCollections()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Settle failed")
    }
  }

  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => [
      {
        header: "Ticket #",
        accessorKey: "ticket_number",
        cell: (info) => (
          <button
            type="button"
            onClick={() => setViewComplaintId(info.row.original.id)}
            className="text-electric-blue font-medium hover:underline text-sm whitespace-nowrap"
            title={`View complaint ${info.getValue()}`}
          >
            {info.getValue() as string}
          </button>
        ),
      },
      {
        header: "Internet ID",
        accessorKey: "internet_id",
      },
      {
        header: "Customer",
        accessorKey: "customer_name",
      },
      {
        header: "Phone No",
        accessorKey: "phone_number",
      },
      {
        header: "Category",
        accessorKey: "category_label",
        cell: (info) => (
          <span className="text-sm text-slate-700 whitespace-nowrap">
            {(info.getValue() as string) || info.row.original.category || "—"}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          return String(row.getValue(columnId)) === String(filterValue)
        },
        cell: (info) => {
          const status = String(info.getValue() || "open")
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                statusBadgeClass[status] || statusBadgeClass.open
              }`}
            >
              <StatusIcon status={status} />
              {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )
        },
      },
      {
        header: "Assigned To",
        accessorKey: "assigned_to_name",
        cell: (info) => {
          const row = info.row.original
          const unassigned =
            row.is_unassigned === true ||
            !row.assigned_to ||
            !row.assigned_to_name ||
            row.assigned_to_name === "Unassigned"
          if (unassigned) {
            return (
              <span className="inline-flex items-center rounded-full bg-coral-red/10 px-2 py-0.5 text-xs font-medium text-coral-red whitespace-nowrap">
                Unassigned
              </span>
            )
          }
          return <span className="text-sm text-slate-700 whitespace-nowrap">{row.assigned_to_name}</span>
        },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        cell: (info) => (
          <span className="text-sm whitespace-nowrap">
            {new Date(info.getValue() as string).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Due Date",
        accessorKey: "response_due_date",
        cell: (info) => (
          <span className="text-sm whitespace-nowrap">
            {info.getValue() ? new Date(info.getValue() as string).toLocaleString() : "N/A"}
          </span>
        ),
      },
    ],
    [],
  )

  const handleAddNew = () => {
    navigate("/complaints/new")
  }

  return (
    <div className="relative">
      <CRUDPage<Complaint>
        key={refreshKey}
        title="Complaint"
        endpoint="complaints"
        columns={columns}
        FormComponent={ComplaintForm}
        onAddNew={handleAddNew}
      />
      <ComplaintViewModal
        complaintId={viewComplaintId}
        onClose={() => setViewComplaintId(null)}
        onResolved={() => setRefreshKey((k) => k + 1)}
      />

      <div className="fixed bottom-4 right-4 z-40 w-full max-w-lg max-h-[40vh] overflow-hidden bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-deep-ocean">Complaint cash collections</h2>
          <button
            type="button"
            onClick={loadCollections}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${collectionsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 text-sm">
          {collectionsLoading && collections.length === 0 ? (
            <p className="p-4 text-slate-500 text-xs">Loading…</p>
          ) : collections.length === 0 ? (
            <p className="p-4 text-slate-500 text-xs">No pending complaint collections</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-white sticky top-0 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Ticket</th>
                  <th className="text-left px-3 py-2 font-medium">Employee</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs">
                      {c.ticket_number || "—"}
                      <div className="text-slate-400">{c.invoice_number}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{c.received_by_name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-right tabular-nums">
                      Rs {Number(c.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => settleCollection(c.payment_id || c.id)}
                        className="h-8 px-2 text-xs rounded-md bg-electric-blue text-white"
                      >
                        Settle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplaintManagement
