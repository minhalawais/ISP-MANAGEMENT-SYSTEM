"use client"

import type React from "react"
import { useMemo, useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Clock, MessageSquare, CheckCircle2, XCircle } from "lucide-react"
import { CRUDPage } from "../../components/complaintCrudPage.tsx"
import { ComplaintForm } from "../../components/forms/complaintForm.tsx"
import { ComplaintViewModal } from "../../components/modals/ComplaintViewModal.tsx"
import { useNavigate } from "react-router-dom"
import { useCompany } from "../../context/CompanyContext.tsx"

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

  useEffect(() => {
    setPageTitle("Complaint Management")
  }, [setPageTitle])

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
    <>
      <CRUDPage<Complaint>
        title="Complaint"
        endpoint="complaints"
        columns={columns}
        FormComponent={ComplaintForm}
        onAddNew={handleAddNew}
      />
      <ComplaintViewModal complaintId={viewComplaintId} onClose={() => setViewComplaintId(null)} />
    </>
  )
}

export default ComplaintManagement
