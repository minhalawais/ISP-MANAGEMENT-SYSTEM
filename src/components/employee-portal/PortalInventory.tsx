"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Box,
  Building2,
  Cable,
  Check,
  Clock3,
  HardDrive,
  History,
  PackageOpen,
  Router,
  RotateCcw,
  Send,
  UserCheck,
  X,
} from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts"
import { Modal } from "../modal.tsx"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"
import { PortalSegmentedControl } from "./shared/PortalSegmentedControl.tsx"

type InventoryAction = "reject" | "use" | "return" | "incident"
type ViewName = "custody" | "customers" | "history"

interface InventoryItem {
  id: string
  item_id: string
  item_type: string | null
  serial_number: string | null
  quantity: number
  unit_of_measure: string
  assigned_to_customer: string | null
  assigned_at: string | null
  accepted_at: string | null
  returned_at: string | null
  notes: string | null
  status_reason: string | null
  status: string
  scope_type: "employee_custody" | "customer_equipment" | "history"
  can_accept: boolean
  can_operate: boolean
}

interface OptionItem { id: string; name: string; internet_id?: string }
interface ActionOptions { customers: OptionItem[] }

const itemTypeIcons: Record<string, React.ElementType> = { router: Router, ont: HardDrive, onu: HardDrive, cable: Cable }
const statusTone: Record<string, string> = {
  pending_acceptance: "bg-amber-50 text-amber-700 ring-amber-200",
  assigned: "bg-blue-50 text-blue-700 ring-blue-200",
  pending_return: "bg-violet-50 text-violet-700 ring-violet-200",
  pending_incident: "bg-red-50 text-red-700 ring-red-200",
  installed: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  returned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  consumed: "bg-slate-100 text-slate-700 ring-slate-200",
  transferred: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  rejected: "bg-slate-100 text-slate-600 ring-slate-200",
  incident: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
}

const terminalStatuses = new Set(["returned", "consumed", "transferred", "rejected", "incident", "damaged", "lost", "cancelled"])
const actionLabels: Record<InventoryAction, string> = {
  reject: "Reject handover",
  use: "Use inventory",
  return: "Return to warehouse",
  incident: "Report damaged or lost inventory",
}
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback

export function PortalInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [options, setOptions] = useState<ActionOptions>({ customers: [] })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewName>("custody")
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [action, setAction] = useState<InventoryAction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ quantity: 1, usage_outcome: "consumed", customer_id: "", reason: "" })
  const headers = useMemo(() => ({ Authorization: `Bearer ${getToken()}` }), [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const [inventoryResponse, optionResponse] = await Promise.all([
        axiosInstance.get("/employee-portal/inventory", { headers }),
        axiosInstance.get("/employee-portal/inventory/options", { headers }),
      ])
      setInventory(inventoryResponse.data)
      setOptions(optionResponse.data)
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load inventory"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pending = inventory.filter((item) => item.scope_type === "employee_custody" && item.status === "pending_acceptance")
  const custody = inventory.filter((item) => item.scope_type === "employee_custody" && !terminalStatuses.has(item.status) && item.status !== "pending_acceptance")
  const customerEquipment = inventory.filter((item) => item.scope_type === "customer_equipment" && !terminalStatuses.has(item.status))
  const history = inventory.filter((item) => terminalStatuses.has(item.status))
  const attention = custody.filter((item) => ["pending_return", "pending_incident", "pending_damage", "pending_loss"].includes(item.status)).length
  const custodyQuantity = custody.reduce((total, item) => total + item.quantity, 0)

  const statItems: PortalStatItem[] = [
    { key: "custody", label: "With me", value: custodyQuantity, icon: Box, tone: "accent" },
    { key: "pending", label: "To accept", value: pending.length, icon: Clock3, tone: pending.length ? "danger" : "default" },
    { key: "installed", label: "At customers", value: customerEquipment.length, icon: Building2 },
    { key: "attention", label: "Awaiting store", value: attention, icon: AlertTriangle, tone: attention ? "danger" : "default" },
  ]

  const openAction = (item: InventoryItem, nextAction: InventoryAction) => {
    setSelected(item)
    setAction(nextAction)
    setForm({ quantity: item.quantity, usage_outcome: "consumed", customer_id: "", reason: "" })
  }

  const closeAction = () => { setSelected(null); setAction(null) }

  const runSimpleAction = async (item: InventoryItem, nextAction: "accept") => {
    setSubmitting(true)
    try {
      await axiosInstance.post(`/employee-portal/inventory/${item.id}/action`, { action: nextAction }, { headers })
      toast.success("Custody accepted")
      await fetchInventory()
    } catch (error) {
      toast.error(errorMessage(error, "Unable to update custody"))
    } finally { setSubmitting(false) }
  }

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected || !action) return
    setSubmitting(true)
    try {
      await axiosInstance.post(`/employee-portal/inventory/${selected.id}/action`, { action, ...form }, { headers })
      toast.success(`${actionLabels[action]} recorded`)
      closeAction()
      await fetchInventory()
    } catch (error) {
      toast.error(errorMessage(error, "Unable to record inventory movement"))
    } finally { setSubmitting(false) }
  }

  const records = view === "customers" ? customerEquipment : view === "history" ? history : [...pending, ...custody]

  if (loading) return <div className="space-y-3 animate-pulse"><div className="h-16 rounded-lg bg-gray-200" /><div className="h-10 rounded-lg bg-gray-200" /><div className="h-56 rounded-lg bg-gray-200" /></div>

  return (
    <div className="space-y-4">
      <PortalStatStrip items={statItems} columnsMobile={2} columnsDesktop={4} />

      <div className="flex overflow-x-auto pb-1">
        <PortalSegmentedControl options={[
          { value: "custody", label: `my inventory (${pending.length + custody.length})` },
          { value: "customers", label: "customer equipment" },
          { value: "history", label: "history" },
        ]} value={view} onChange={(value) => setView(value as ViewName)} />
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {view === "custody" ? "My assigned inventory" : view === "customers" ? "Equipment installed at customers" : "Movement history"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {view === "customers"
                ? "Visible for service work; these items are not counted as being with you."
                : view === "custody" && pending.length
                  ? `${pending.length} awaiting acceptance · ${custody.length} in custody`
                  : `${records.length} record${records.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {view === "history" ? <History className="h-4 w-4 text-gray-400" /> : <PackageOpen className="h-4 w-4 text-gray-400" />}
        </div>

        {records.length === 0 ? <EmptyState view={view} /> : <div className="divide-y divide-gray-100">
          {records.map((item) => <InventoryRow key={item.id} item={item} view={view} disabled={submitting}
            onAccept={() => runSimpleAction(item, "accept")} onAction={(nextAction) => openAction(item, nextAction)} />)}
        </div>}
      </section>

      <Modal isVisible={!!selected && !!action} onClose={closeAction} title={action ? actionLabels[action] : "Inventory action"}
        size="sm" isLoading={submitting} headerClassName="bg-white border-slate-200" headerTone="dark">
        {selected && action && <form onSubmit={submitAction} className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">{selected.item_type || "Inventory item"}</p>
            <p className="mt-1 text-xs text-slate-500">Available in this custody record: {selected.quantity} {selected.unit_of_measure}</p>
          </div>

          {!(["reject"] as InventoryAction[]).includes(action) && <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Quantity</span>
            <input type="number" required min={1} max={selected.quantity} value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm" />
          </label>}

          {action === "use" && <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Where was it used?</span>
            <select required value={form.usage_outcome} onChange={(event) => setForm((current) => ({ ...current, usage_outcome: event.target.value, customer_id: "" }))}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="consumed">Used up during field work</option>
              <option value="installed">Left installed at a customer</option>
            </select>
          </label>}

          {action === "use" && form.usage_outcome === "installed" && <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">Customer</span>
            <select required value={form.customer_id} onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
              <option value="">Select customer</option>
              {options.customers.map((option) => <option key={option.id} value={option.id}>{option.name}{option.internet_id ? ` · ${option.internet_id}` : ""}</option>)}
            </select>
          </label>}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">{["incident", "reject"].includes(action) ? "Reason *" : "Notes"}</span>
            <textarea rows={3} required={["incident", "reject"].includes(action)} value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder={action === "use" ? "Task reference or usage note" : action === "incident" ? "Describe what was damaged or lost and what happened" : "Add a clear handover note"}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-y" />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeAction} className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">
              <Send className="h-4 w-4" /> Confirm
            </button>
          </div>
        </form>}
      </Modal>
    </div>
  )
}

function InventoryRow({ item, view, disabled, onAccept, onAction }: {
  item: InventoryItem; view: ViewName; disabled: boolean; onAccept: () => void; onAction: (action: InventoryAction) => void
}) {
  const typeKey = item.item_type?.toLowerCase() || ""
  const Icon = itemTypeIcons[typeKey] || Box
  return <div className="px-4 py-3">
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold capitalize text-gray-900">{item.item_type?.replaceAll("_", " ") || "Inventory item"}</p>
          <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset ${statusTone[item.status] || statusTone.cancelled}`}>{item.status.replaceAll("_", " ")}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{item.quantity} {item.unit_of_measure}{item.serial_number ? ` · S/N ${item.serial_number}` : ""}{item.assigned_at ? ` · ${new Date(item.assigned_at).toLocaleDateString()}` : ""}</p>
        {item.assigned_to_customer && <p className="mt-1 text-xs font-medium text-cyan-700">Installed at {item.assigned_to_customer}</p>}
        {(item.status_reason || item.notes) && <p className="mt-1 text-xs text-gray-600">{item.status_reason || item.notes}</p>}
      </div>
    </div>

    {view === "custody" && item.status === "pending_acceptance" && <div className="mt-3 flex justify-end gap-2">
      <button type="button" disabled={disabled} onClick={() => onAction("reject")} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700"><X className="h-3.5 w-3.5" /> Reject</button>
      <button type="button" disabled={disabled} onClick={onAccept} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" /> Accept custody</button>
    </div>}

    {view === "custody" && item.can_operate && <div className="mt-3 flex flex-wrap justify-end gap-2">
      <ActionButton icon={PackageOpen} label="Use inventory" onClick={() => onAction("use")} />
      <ActionButton icon={RotateCcw} label="Return" onClick={() => onAction("return")} />
      <ActionButton icon={AlertTriangle} label="Damaged / Lost" onClick={() => onAction("incident")} danger />
    </div>}

    {view === "custody" && ["pending_return", "pending_incident", "pending_damage", "pending_loss"].includes(item.status) &&
      <p className="mt-3 flex items-center justify-end gap-1.5 text-xs font-medium text-violet-700"><UserCheck className="h-3.5 w-3.5" /> Waiting for store verification</p>}
  </div>
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
    <Icon className="h-3.5 w-3.5" /> {label}
  </button>
}

function EmptyState({ view }: { view: ViewName }) {
  const content = view === "customers" ? [Building2, "No customer equipment", "Installed equipment in your customer scope will appear here."]
    : view === "history" ? [History, "No movement history", "Completed returns, incidents, and field usage will appear here."]
    : [Box, "No inventory in your custody", "Accepted equipment and field stock will appear here."]
  const Icon = content[0] as React.ElementType
  return <div className="px-4 py-12 text-center"><Icon className="mx-auto h-9 w-9 text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-700">{content[1] as string}</p><p className="mt-1 text-xs text-gray-500">{content[2] as string}</p></div>
}
