"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import {
  RefreshCw,
  User,
  Phone,
  Receipt,
  FileText,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react"
import {
  employeeMaySetRecoveryStatus,
  recoveryStatusLabel,
} from "../../utils/recoveryStatus.ts"
import { RecoveryInvoiceTable } from "./RecoveryInvoiceTable.tsx"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"
import { PortalSegmentedControl } from "./shared/PortalSegmentedControl.tsx"
import { PortalSheet } from "./shared/PortalSheet.tsx"
import { PortalStatusPill, portalStatusAvatar } from "./shared/PortalStatusPill.tsx"

interface Recovery {
  id: string
  invoice_id: string
  invoice_number: string | null
  invoice_due_date: string | null
  amount: number
  paid_amount: number
  remaining_amount: number
  collected_amount?: number | null
  payment_status?: string | null
  payment_method?: string | null
  status: string
  notes: string | null
  completion_notes: string | null
  completion_proof: string | null
  created_at: string | null
  completed_at: string | null
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_area: string | null
  customer_internet_id: string | null
}

interface DueInvoice {
  id: string
  invoice_number: string | null
  invoice_status: string
  invoice_type?: string | null
  due_date: string | null
  billing_start_date?: string | null
  billing_end_date?: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  customer_id: string | null
  customer_name: string | null
  customer_internet_id: string | null
  customer_phone: string | null
  customer_address?: string | null
  customer_area: string | null
  customer_sub_zone?: string | null
}

type TabKey = "assigned" | "invoices"

const TAB_OPTIONS = [
  { value: "assigned", label: "Assigned recoveries" },
  { value: "invoices", label: "Customer invoices" },
]

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: recoveryStatusLabel("pending") },
  { value: "in_progress", label: recoveryStatusLabel("in_progress") },
  { value: "collected", label: recoveryStatusLabel("collected") },
  { value: "completed", label: recoveryStatusLabel("completed") },
]

const emptyCollect = {
  amount: "",
  payment_method: "cash",
  payment_date: new Date().toISOString().slice(0, 10),
  bank_account_id: "",
  notes: "",
  proofFile: null as File | null,
}

export function PortalRecoveries() {
  const [tab, setTab] = useState<TabKey>("assigned")
  const [recoveries, setRecoveries] = useState<Recovery[]>([])
  const [invoices, setInvoices] = useState<DueInvoice[]>([])
  const [cashHeld, setCashHeld] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Recovery | null>(null)
  const [collectTarget, setCollectTarget] = useState<{
    invoice_id: string
    recovery_task_id?: string
    remaining: number
    label: string
  } | null>(null)
  const [collectForm, setCollectForm] = useState(emptyCollect)
  const [bankAccounts, setBankAccounts] = useState<{ id: string; label: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [statusDraft, setStatusDraft] = useState("pending")

  const fetchAssigned = useCallback(async () => {
    const token = getToken()
    const params = filter !== "all" ? `?status=${filter}` : ""
    const response = await axiosInstance.get(`/employee-portal/recoveries${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = response.data
    if (Array.isArray(data)) {
      setRecoveries(data)
      setCashHeld(0)
    } else {
      setRecoveries(data.recoveries || [])
      setCashHeld(Number(data.cash_held) || 0)
    }
  }, [filter])

  const fetchInvoices = useCallback(async () => {
    const token = getToken()
    const response = await axiosInstance.get(`/employee-portal/recoveries/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setInvoices(response.data || [])
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchAssigned(), fetchInvoices()])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load recoveries")
    } finally {
      setLoading(false)
    }
  }, [fetchAssigned, fetchInvoices])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const token = getToken()
        const res = await axiosInstance.get("/bank-accounts/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const rows = Array.isArray(res.data) ? res.data : []
        setBankAccounts(
          rows.map((b: any) => ({
            id: String(b.id),
            label: `${b.bank_name || "Bank"} · ${b.account_number || b.id}`,
          }))
        )
      } catch {
        setBankAccounts([])
      }
    }
    loadBanks()
  }, [])

  const openCollectFromRecovery = (r: Recovery) => {
    setCollectTarget({
      invoice_id: r.invoice_id,
      recovery_task_id: r.id,
      remaining: r.remaining_amount,
      label: `${r.invoice_number || "Invoice"} · ${r.customer_name || ""}`,
    })
    setCollectForm({
      ...emptyCollect,
      amount: String(r.remaining_amount || ""),
    })
  }

  const openCollectFromInvoice = (inv: DueInvoice) => {
    setCollectTarget({
      invoice_id: inv.id,
      remaining: inv.remaining_amount,
      label: `${inv.invoice_number || "Invoice"} · ${inv.customer_name || ""}`,
    })
    setCollectForm({
      ...emptyCollect,
      amount: String(inv.remaining_amount || ""),
    })
  }

  const submitCollect = async () => {
    if (!collectTarget) return
    const amount = Number(collectForm.amount)
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (amount > collectTarget.remaining) {
      toast.error("Amount exceeds remaining balance")
      return
    }
    if (collectForm.payment_method === "bank_transfer" && !collectForm.bank_account_id) {
      toast.error("Select a bank account")
      return
    }
    setSubmitting(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("invoice_id", collectTarget.invoice_id)
      formData.append("amount", String(amount))
      formData.append("payment_method", collectForm.payment_method)
      formData.append("payment_date", collectForm.payment_date)
      if (collectTarget.recovery_task_id) {
        formData.append("recovery_task_id", collectTarget.recovery_task_id)
      }
      if (collectForm.bank_account_id) {
        formData.append("bank_account_id", collectForm.bank_account_id)
      }
      if (collectForm.notes) {
        formData.append("notes", collectForm.notes)
      }
      if (collectForm.proofFile) {
        formData.append("payment_proof", collectForm.proofFile)
      }
      await axiosInstance.post("/employee-portal/recoveries/collect", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      toast.success("Collection recorded")
      setCollectTarget(null)
      setSelected(null)
      await refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to record collection")
    } finally {
      setSubmitting(false)
    }
  }

  const saveStatus = async () => {
    if (!selected || !employeeMaySetRecoveryStatus(statusDraft)) return
    setSubmitting(true)
    try {
      const token = getToken()
      await axiosInstance.put(
        `/employee-portal/recoveries/${selected.id}/status`,
        { status: statusDraft },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Status updated")
      setSelected(null)
      await refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status")
    } finally {
      setSubmitting(false)
    }
  }

  const openCount = recoveries.filter((r) => r.status === "pending" || r.status === "in_progress").length
  const dueCount = invoices.length

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statItems: PortalStatItem[] = [
    { key: "assigned_open", label: "Assigned open", value: openCount, icon: RefreshCw, tone: "warning" },
    { key: "invoices_due", label: "Invoices due", value: dueCount, icon: FileText, tone: "danger" },
    { key: "cash_held", label: "Cash held", value: `PKR ${Math.abs(cashHeld).toLocaleString()}`, icon: Receipt, tone: "accent" },
  ]

  const selectRecovery = (r: Recovery) => {
    setSelected(r)
    setStatusDraft(employeeMaySetRecoveryStatus(r.status) ? r.status : "pending")
  }

  const detailFooter = selected && (
    <>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="h-9 px-3 text-sm border border-gray-200 rounded-md"
      >
        Close
      </button>
      {employeeMaySetRecoveryStatus(selected.status) && (
        <>
          <button
            type="button"
            onClick={() => openCollectFromRecovery(selected)}
            className="h-9 px-3 text-sm bg-portal-primary text-white rounded-md hover:bg-portal-primary-dark"
          >
            Collect
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={saveStatus}
            className="h-9 px-3 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Save status
          </button>
        </>
      )}
    </>
  )

  const detailBody = selected && (
    <div className="space-y-3 text-sm">
            <PortalStatusPill status={selected.status} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-deep-ocean/10 bg-light-sky/50 p-2.5">
                <p className="text-xs text-slate-gray">Total</p>
                <p className="font-semibold text-deep-ocean">PKR {selected.amount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-emerald-green/15 bg-emerald-green/5 p-2.5">
                <p className="text-xs text-slate-gray">Paid</p>
                <p className="font-semibold text-emerald-green">PKR {selected.paid_amount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-coral-red/15 bg-coral-red/5 p-2.5">
                <p className="text-xs text-slate-gray">Remaining</p>
                <p className="font-semibold text-coral-red">PKR {selected.remaining_amount.toLocaleString()}</p>
              </div>
            </div>
            {selected.customer_name && (
              <div className="space-y-1 text-gray-700">
                {selected.customer_id ? (
                  <Link
                    to={`/employee-portal/customers/${selected.customer_id}`}
                    className="flex items-center gap-1.5 text-electric-blue hover:underline"
                  >
                    <User className="w-3.5 h-3.5" />
                    {selected.customer_name}
                    {selected.customer_internet_id ? (
                      <span className="text-xs">({selected.customer_internet_id})</span>
                    ) : null}
                  </Link>
                ) : (
                  <p className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {selected.customer_name}
                  </p>
                )}
                {selected.customer_phone && (
                  <a href={`tel:${selected.customer_phone}`} className="flex items-center gap-1.5 text-electric-blue">
                    <Phone className="w-3.5 h-3.5" />{selected.customer_phone}
                  </a>
                )}
              </div>
            )}
            <Link
              to={`/invoices/${selected.invoice_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-electric-blue hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open full invoice
            </Link>
            {employeeMaySetRecoveryStatus(selected.status) && (
              <div>
                <label className="text-xs font-medium text-gray-600">Status</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="mt-1 w-full h-9 px-2 border border-gray-200 rounded-md text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
            )}
            {selected.status === "collected" && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2">
                Awaiting owner settlement. Cash is held on your balance.
              </p>
            )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/80 space-y-3">
        <PortalStatStrip items={statItems} columnsMobile={3} columnsDesktop={3} />
        <PortalSegmentedControl options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as TabKey)} />
      </div>

      {tab === "assigned" && (
        <div className="lg:grid lg:grid-cols-[360px_1fr] lg:items-start lg:gap-4">
          <div className="space-y-3">
            <PortalSegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

            {recoveries.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recovery tasks</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
                {recoveries.map((r) => {
                  const overdue =
                    r.invoice_due_date &&
                    new Date(r.invoice_due_date) < new Date() &&
                    !["completed", "cancelled"].includes(r.status)
                  const isSelected = selected?.id === r.id
                  const avatar = portalStatusAvatar(r.status)
                  return (
                    <div
                      key={r.id}
                      onClick={() => selectRecovery(r)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-portal-tint border-l-2 border-l-electric-blue"
                          : "hover:bg-gray-50 active:bg-gray-100 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatar.bg}`}>
                        <Receipt className={`w-4 h-4 ${avatar.text}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {r.customer_name || r.invoice_number || "Recovery"}
                          </p>
                          {overdue && (
                            <span className="shrink-0 rounded-full bg-coral-red/10 px-1.5 py-0.5 text-[10px] font-medium text-coral-red">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {r.invoice_number || "—"}
                          {r.customer_area ? ` · ${r.customer_area}` : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs font-semibold tabular-nums text-coral-red whitespace-nowrap">
                          PKR {r.remaining_amount.toLocaleString()}
                        </span>
                        <PortalStatusPill status={r.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-160px)] lg:flex-col lg:rounded-xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-gray-900">Recovery</h3>
                    {selected.invoice_number && (
                      <p className="truncate text-xs text-gray-500">{selected.invoice_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">{detailBody}</div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
                  {detailFooter}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
                <RefreshCw className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">Select a recovery to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <>
          {invoices.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No unpaid invoices in scope</p>
            </div>
          ) : (
            <RecoveryInvoiceTable
              invoices={invoices}
              onCollect={openCollectFromInvoice}
            />
          )}
        </>
      )}

      <PortalSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Recovery"
        subtitle={selected?.invoice_number || undefined}
        footer={detailFooter}
        hideOnDesktop
      >
        {detailBody}
      </PortalSheet>

      <PortalSheet
        open={!!collectTarget}
        onClose={() => setCollectTarget(null)}
        title="Collect payment"
        subtitle={collectTarget?.label}
        footer={
          <>
            <button
              type="button"
              onClick={() => setCollectTarget(null)}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitCollect}
              className="h-9 px-3 text-sm bg-portal-primary text-white rounded-md disabled:opacity-50 hover:bg-portal-primary-dark"
            >
              {submitting ? "Saving..." : "Submit collection"}
            </button>
          </>
        }
      >
        {collectTarget && (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-gray-500">
              Remaining: <span className="font-semibold text-gray-800">PKR {collectTarget.remaining.toLocaleString()}</span>
            </p>
            <div>
              <label className="text-xs font-medium text-gray-600">Amount</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={collectForm.amount}
                onChange={(e) => setCollectForm({ ...collectForm, amount: e.target.value })}
                className="mt-1 w-full h-9 px-2 border border-gray-200 rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Method</label>
              <select
                value={collectForm.payment_method}
                onChange={(e) => setCollectForm({ ...collectForm, payment_method: e.target.value })}
                className="mt-1 w-full h-9 px-2 border border-gray-200 rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
              </select>
            </div>
            {collectForm.payment_method === "bank_transfer" && (
              <div>
                <label className="text-xs font-medium text-gray-600">Bank account</label>
                <select
                  value={collectForm.bank_account_id}
                  onChange={(e) => setCollectForm({ ...collectForm, bank_account_id: e.target.value })}
                  className="mt-1 w-full h-9 px-2 border border-gray-200 rounded-md"
                >
                  <option value="">Select account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">Payment date</label>
              <input
                type="date"
                value={collectForm.payment_date}
                onChange={(e) => setCollectForm({ ...collectForm, payment_date: e.target.value })}
                className="mt-1 w-full h-9 px-2 border border-gray-200 rounded-md"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
              <textarea
                rows={2}
                value={collectForm.notes}
                onChange={(e) => setCollectForm({ ...collectForm, notes: e.target.value })}
                className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-md resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Payment proof
              </label>
              <div className="mt-1 flex justify-center px-4 py-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/80">
                <div className="w-full text-center space-y-1">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.pdf,.webp,.jfif"
                    onChange={(e) =>
                      setCollectForm({
                        ...collectForm,
                        proofFile: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-portal-primary file:text-white"
                  />
                  <p className="text-[11px] text-gray-500">PNG, JPG, JPEG, or PDF up to 10MB</p>
                  {collectForm.proofFile && (
                    <p className="text-xs text-gray-700 font-medium truncate">
                      {collectForm.proofFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </PortalSheet>
    </div>
  )
}
