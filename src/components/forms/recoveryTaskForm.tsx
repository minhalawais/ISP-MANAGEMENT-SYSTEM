"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Users, AlertCircle, ClipboardList, Search, Check } from "lucide-react"
import { SearchableSelect } from "../SearchableSelect.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { useInvoiceDropdown, type DropdownInvoice } from "../../hooks/useInvoiceDropdown.ts"

const OPEN_INVOICE_STATUSES = ["pending", "Pending", "partially_paid", "Partially Paid"]
const BULK_CREATE_MAX = 50

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface RecoveryTaskFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  setFormField?: (name: string, value: unknown) => void
  isEditing: boolean
}

function invoiceLabel(inv: Pick<DropdownInvoice, "invoice_number" | "customer_name" | "customer_internet_id">) {
  return `${inv.invoice_number} · ${inv.customer_internet_id || "N/A"} · ${inv.customer_name}`
}

export function RecoveryTaskForm({
  formData,
  handleInputChange,
  setFormField,
  isEditing,
}: RecoveryTaskFormProps) {
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const { invoices, isLoading: isLoadingInvoices } = useInvoiceDropdown(
    invoiceSearch,
    isEditing ? undefined : OPEN_INVOICE_STATUSES,
    50,
    isEditing ? formData.invoice_id : undefined
  )
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedMeta, setSelectedMeta] = useState<Record<string, DropdownInvoice>>({})

  const selectedIds: string[] = Array.isArray(formData.invoice_ids) ? formData.invoice_ids : []

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (isEditing || !setFormField) return
    if (!Array.isArray(formData.invoice_ids)) {
      setFormField("invoice_ids", [])
    }
  }, [isEditing, setFormField, formData.invoice_ids])

  const fetchEmployees = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/employees/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEmployees(response.data)
    } catch (error) {
      console.error("Failed to fetch employees", error)
    }
  }

  const toggleInvoice = (inv: DropdownInvoice) => {
    if (!setFormField) return
    const exists = selectedIds.includes(inv.id)
    if (!exists && selectedIds.length >= BULK_CREATE_MAX) return
    const next = exists ? selectedIds.filter((id) => id !== inv.id) : [...selectedIds, inv.id]
    setFormField("invoice_ids", next)
    setSelectedMeta((prev) => {
      if (exists) {
        const copy = { ...prev }
        delete copy[inv.id]
        return copy
      }
      return { ...prev, [inv.id]: inv }
    })
  }

  const selectedSummary = useMemo(() => {
    return selectedIds.map((id) => {
      const inv = selectedMeta[id] || invoices.find((i) => i.id === id)
      return inv ? invoiceLabel(inv) : id
    })
  }, [selectedIds, selectedMeta, invoices])

  const selectClasses = `
    w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg shadow-sm bg-white text-sm text-slate-700
    appearance-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue
    bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4 bg-center-y
  `

  const textareaClasses = `
    w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg shadow-sm bg-white text-sm text-slate-700
    placeholder-slate-400 focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue
  `

  const labelClasses = "block text-sm font-medium text-deep-ocean mb-1"
  const iconClasses = "h-4 w-4 text-slate-400"

  const statusColors: Record<string, string> = {
    pending: "text-amber-600",
    in_progress: "text-electric-blue",
    completed: "text-emerald-600",
    cancelled: "text-red-500",
  }

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-1.5">
          <label className={labelClasses}>Invoice *</label>
          {invoices.length === 0 && isLoadingInvoices && !invoiceSearch ? (
            <div className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500">
              Loading invoices…
            </div>
          ) : (
            <SearchableSelect
              options={invoices}
              value={formData.invoice_id || ""}
              onChange={handleInputChange}
              onSearchChange={setInvoiceSearch}
              isLoading={isLoadingInvoices}
              placeholder="Search and select invoice for recovery"
            />
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className={labelClasses}>Invoices *</label>
            <span className="text-xs text-slate-500">
              {selectedIds.length} selected
              {selectedIds.length >= BULK_CREATE_MAX ? ` (max ${BULK_CREATE_MAX})` : ""}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              placeholder="Search invoice #, internet ID, or customer"
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {isLoadingInvoices && invoices.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-slate-500">Loading…</p>
            ) : invoices.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-slate-500">No open invoices found</p>
            ) : (
              invoices.map((inv) => {
                const selected = selectedIds.includes(inv.id)
                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => toggleInvoice(inv)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 hover:bg-slate-50 ${
                      selected ? "bg-electric-blue/5" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                        selected
                          ? "bg-electric-blue border-electric-blue text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium text-slate-800 block truncate">
                        {inv.invoice_number} · {inv.customer_internet_id || "N/A"}
                      </span>
                      <span className="text-slate-500 block truncate">
                        {inv.customer_name} · Rs {Number(inv.total_amount || 0).toLocaleString()}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
          {selectedSummary.length > 0 && (
            <p className="text-xs text-slate-500 line-clamp-2">
              Selected: {selectedSummary.slice(0, 3).join("; ")}
              {selectedSummary.length > 3 ? ` +${selectedSummary.length - 3} more` : ""}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className={labelClasses}>Assign To *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Users className={iconClasses} />
          </div>
          <select
            name="assigned_to"
            value={formData.assigned_to || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClasses}>Status *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AlertCircle className={iconClasses} />
          </div>
          <select
            name="status"
            value={formData.status || "pending"}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="pending" className={statusColors.pending}>Pending</option>
            <option value="in_progress" className={statusColors.in_progress}>In Progress</option>
            <option value="completed" className={statusColors.completed}>Completed</option>
            <option value="cancelled" className={statusColors.cancelled}>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClasses}>Notes</label>
        <div className="relative">
          <div className="absolute top-2.5 left-3 pointer-events-none">
            <ClipboardList className={iconClasses} />
          </div>
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            placeholder="Notes for the recovery assignment…"
            rows={3}
            className={`${textareaClasses} resize-y min-h-[88px]`}
          />
        </div>
      </div>
    </div>
  )
}

export default RecoveryTaskForm
