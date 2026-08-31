"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Box, CheckCircle2, Clock3, History, PackageCheck, ShieldCheck, UserRound, XCircle } from "lucide-react"
import { Modal } from "../modal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { toast } from "../../utils/notify.ts"

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  attributes?: Record<string, unknown>
}

interface InventoryAssignment {
  id: string
  item_type: string | null
  assigned_to_customer: string | null
  assigned_to_employee: string | null
  quantity: number
  unit_of_measure: string
  assigned_at: string | null
  notes: string | null
  status_reason: string | null
  status: string
}

interface EmployeeOption {
  id: string
  first_name?: string
  last_name?: string
  full_name?: string
  role?: string
  is_active?: boolean
}

interface Props {
  isVisible: boolean
  onClose: () => void
  inventoryItem: InventoryItem
}

const initialForm = {
  assigned_to_employee_id: "",
  quantity: 1,
  unit_of_measure: "piece",
  notes: "",
}

const statusTone: Record<string, string> = {
  pending_acceptance: "bg-amber-50 text-amber-700 ring-amber-200",
  assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  pending_return: "bg-violet-50 text-violet-700 ring-violet-200",
  pending_incident: "bg-red-50 text-red-700 ring-red-200",
  installed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  returned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  consumed: "bg-slate-100 text-slate-700 ring-slate-200",
  incident: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-slate-100 text-slate-600 ring-slate-200",
  transferred: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
}

const activeStatuses = new Set(["pending_acceptance", "assigned", "pending_return", "pending_incident", "pending_damage", "pending_loss"])
const labelStatus = (status: string) => status.replaceAll("_", " ")
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback

export const InventoryAssignmentsModal: React.FC<Props> = ({ isVisible, onClose, inventoryItem }) => {
  const [assignments, setAssignments] = useState<InventoryAssignment[]>([])
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [available, setAvailable] = useState(inventoryItem.quantity)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<"active" | "history">("active")
  const tokenHeaders = useMemo(() => ({ Authorization: `Bearer ${getToken()}` }), [])

  const refresh = async () => {
    setLoading(true)
    try {
      const [assignmentResponse, employeeResponse, inventoryResponse] = await Promise.all([
        axiosInstance.get(`/inventory/assignments?inventory_item_id=${inventoryItem.id}`, { headers: tokenHeaders }),
        axiosInstance.get("/employees/list", { headers: tokenHeaders }),
        axiosInstance.get("/inventory/list", { headers: tokenHeaders }),
      ])
      setAssignments(assignmentResponse.data)
      setEmployees(employeeResponse.data.filter((employee: EmployeeOption) =>
        employee.is_active !== false && ["employee", "technician", "recovery_agent"].includes(employee.role || ""),
      ))
      const current = inventoryResponse.data.find((item: InventoryItem) => item.id === inventoryItem.id)
      setAvailable(current?.quantity ?? inventoryItem.quantity)
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load custody records"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, inventoryItem.id])

  const submitAssignment = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await axiosInstance.post("/inventory/assignments/add", { ...form, inventory_item_id: inventoryItem.id }, { headers: tokenHeaders })
      toast.success("Inventory issued for employee acceptance")
      setForm(initialForm)
      await refresh()
    } catch (error) {
      toast.error(errorMessage(error, "Unable to issue inventory"))
    } finally {
      setSubmitting(false)
    }
  }

  const verify = async (assignment: InventoryAssignment, action?: "cancel") => {
    try {
      await axiosInstance.put(`/inventory/assignments/${assignment.id}/verify`, action ? { action } : {}, { headers: tokenHeaders })
      toast.success(action === "cancel" ? "Unaccepted issue cancelled" : "Handover verified")
      await refresh()
    } catch (error) {
      toast.error(errorMessage(error, "Unable to verify handover"))
    }
  }

  const visible = assignments.filter((assignment) =>
    filter === "active" ? activeStatuses.has(assignment.status) : !activeStatuses.has(assignment.status),
  )
  const awaitingVerification = assignments.filter((assignment) =>
    ["pending_return", "pending_incident", "pending_damage", "pending_loss"].includes(assignment.status),
  ).length

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Employee inventory custody" size="lg" isLoading={submitting}
      headerClassName="bg-white border-slate-200" headerTone="dark">
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700"><Box className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{inventoryItem.item_type}</p>
              <p className="truncate text-xs text-slate-500">{(inventoryItem.attributes?.serial_number as string) || "Bulk inventory record"}</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-medium text-emerald-700">Available in warehouse</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{available}</p>
          </div>
        </section>

        <form onSubmit={submitAssignment} className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <PackageCheck className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-slate-900">Issue directly to employee</h3>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-slate-700">Employee</span>
              <select required value={form.assigned_to_employee_id}
                onChange={(event) => setForm((current) => ({ ...current, assigned_to_employee_id: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="">Select employee</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>
                  {employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim()}
                </option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Quantity</span>
              <input required type="number" min={1} max={Math.max(available, 1)} value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">Unit</span>
              <select value={form.unit_of_measure} onChange={(event) => setForm((current) => ({ ...current, unit_of_measure: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="piece">Piece</option><option value="meter">Meter</option><option value="roll">Roll</option><option value="box">Box</option>
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-slate-700">Handover notes</span>
              <textarea rows={2} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Purpose, job reference, accessories, or handling instructions"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-y" />
            </label>
          </div>
          <div className="flex justify-end border-t border-slate-100 px-4 py-3">
            <button type="submit" disabled={submitting || available < 1}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              <UserRound className="h-4 w-4" /> Issue inventory
            </button>
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><History className="h-4 w-4 text-slate-500" /> Custody ledger</h3>
              <p className="mt-0.5 text-xs text-slate-500">{awaitingVerification ? `${awaitingVerification} handover(s) need store verification` : "No handovers awaiting verification"}</p>
            </div>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
              {(["active", "history"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)}
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${filter === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{value}</button>)}
            </div>
          </div>
          {loading ? <div className="space-y-2 p-4 animate-pulse">{[0, 1, 2].map((key) => <div key={key} className="h-14 rounded bg-slate-100" />)}</div>
            : visible.length === 0 ? <div className="px-4 py-10 text-center text-sm text-slate-500">No {filter} custody records</div>
            : <div className="divide-y divide-slate-100">{visible.map((assignment) => {
              const needsVerification = ["pending_return", "pending_incident", "pending_damage", "pending_loss"].includes(assignment.status)
              return <div key={assignment.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{assignment.assigned_to_employee || assignment.assigned_to_customer || "Unknown custodian"}</p>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${statusTone[assignment.status] || statusTone.cancelled}`}>{labelStatus(assignment.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{assignment.quantity} {assignment.unit_of_measure}{assignment.assigned_at ? ` · ${new Date(assignment.assigned_at).toLocaleDateString()}` : ""}</p>
                  {(assignment.status_reason || assignment.notes) && <p className="mt-1 truncate text-xs text-slate-600">{assignment.status_reason || assignment.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {needsVerification && <button type="button" onClick={() => verify(assignment)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"><ShieldCheck className="h-3.5 w-3.5" /> Verify</button>}
                  {assignment.status === "pending_acceptance" && <button type="button" onClick={() => verify(assignment, "cancel")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><XCircle className="h-3.5 w-3.5" /> Cancel</button>}
                </div>
              </div>
            })}</div>}
        </section>

        <div className="grid gap-2 sm:grid-cols-3">
          <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Employee acceptance confirms custody</p>
          <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Store verifies returns and incidents</p>
          <p className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-3.5 w-3.5" /> Verified returns restore stock</p>
        </div>
      </div>
    </Modal>
  )
}
