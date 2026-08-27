"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Calendar, MessageSquare, Plus, Trash2 } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { SearchableCustomerSelect } from "../SearchableCustomerSelect.tsx"
import { SearchableInventorySelect } from "../SearchableInventorySelect.tsx"
import { useCustomerDropdown, type DropdownCustomer } from "../../hooks/useCustomerDropdown.ts"
import { buildSubscriptionLinesFromPackages } from "../../utils/invoiceSubscriptionLines.ts"

interface InvoiceFormProps {
  formData: any
  handleInputChange: (e: any) => void
  isEditing: boolean
}

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  unit_price: number | null
}

interface InvoiceLine {
  key: string
  charge_type: string
  description: string
  quantity: number
  unit_price: number
  discount_amount: number
  billing_start_date?: string
  billing_end_date?: string
  inventory_item_id?: string
  customer_package_id?: string
}

const CHARGE_TYPES = [
  { value: "subscription", label: "Subscription" },
  { value: "installation", label: "Installation" },
  { value: "equipment", label: "Equipment" },
  { value: "add_on", label: "Add-on" },
  { value: "deposit", label: "Deposit" },
  { value: "maintenance", label: "Maintenance" },
  { value: "late_fee", label: "Late fee" },
  { value: "reconnection", label: "Reconnection" },
  { value: "upgrade", label: "Upgrade" },
]

const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
]

const emptyLine = (charge_type = "subscription"): InvoiceLine => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  charge_type,
  description: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  billing_start_date: "",
  billing_end_date: "",
})

/** Qty only matters for countable items (equipment / add-ons). Other charge types stay at 1. */
function showsQuantity(chargeType: string) {
  return chargeType === "equipment" || chargeType === "add_on"
}

function formatDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Billing period for a calendar month (1–12) in the given year.
 * Due date = last day of month + 5 days (same rule as customer autofill).
 */
function billingPeriodForMonth(month: number, year: number = new Date().getFullYear()) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  const due = new Date(end)
  due.setDate(due.getDate() + 5)
  return {
    billing_start_date: formatDateLocal(start),
    billing_end_date: formatDateLocal(end),
    due_date: formatDateLocal(due),
  }
}

/** Current calendar month start/end + due date (end + 5 days). */
function currentBillingPeriod() {
  const now = new Date()
  return billingPeriodForMonth(now.getMonth() + 1, now.getFullYear())
}

function lineTotal(line: InvoiceLine) {
  return Math.max(0, (Number(line.unit_price) || 0) * (Number(line.quantity) || 1) - (Number(line.discount_amount) || 0))
}

function setField(handleInputChange: (e: any) => void, name: string, value: any) {
  handleInputChange({ target: { name, value } })
}

export function InvoiceForm({ formData, handleInputChange, isEditing }: InvoiceFormProps) {
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const { customers, isLoading: customersLoading } = useCustomerDropdown(
    customerSearch,
    50,
    isEditing ? formData.customer_id : undefined
  )
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [lines, setLines] = useState<InvoiceLine[]>(() => {
    if (Array.isArray(formData.lines) && formData.lines.length) {
      return formData.lines.map((l: any) => ({
        key: l.key || `${l.id || Math.random()}`,
        charge_type: l.charge_type || "subscription",
        description: l.description || "",
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
        discount_amount: Number(l.discount_amount) || 0,
        billing_start_date: (l.billing_start_date || "").toString().slice(0, 10),
        billing_end_date: (l.billing_end_date || "").toString().slice(0, 10),
        inventory_item_id: l.inventory_item_id || "",
        customer_package_id: l.customer_package_id || "",
      }))
    }
    if (Array.isArray(formData.line_items) && formData.line_items.length) {
      return formData.line_items.map((l: any) => ({
        key: l.id || `${Math.random()}`,
        charge_type: l.charge_type || (l.item_type === "equipment" ? "equipment" : "subscription"),
        description: l.description || "",
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
        discount_amount: Number(l.discount_amount) || 0,
        billing_start_date: (l.billing_start_date || "").toString().slice(0, 10),
        billing_end_date: (l.billing_end_date || "").toString().slice(0, 10),
        inventory_item_id: l.inventory_item_id || "",
        customer_package_id: l.customer_package_id || "",
      }))
    }
    return [emptyLine("subscription")]
  })

  useEffect(() => {
    const load = async () => {
      const token = getToken()
      try {
        const invRes = await axiosInstance.get("/inventory/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
        setInventory(
          (Array.isArray(invRes.data) ? invRes.data : invRes.data?.items || []).map((i: any) => ({
            id: i.id,
            item_type: i.item_type,
            quantity: i.quantity,
            unit_price: i.unit_price,
          }))
        )
      } catch (err) {
        console.error("Failed to load invoice form data", err)
      }
    }
    load()
  }, [])

  const syncLines = (next: InvoiceLine[]) => {
    setLines(next)
    const payload = next.map(({ key, ...rest }) => ({
      ...rest,
      quantity: Number(rest.quantity) || 1,
      unit_price: Number(rest.unit_price) || 0,
      discount_amount: Number(rest.discount_amount) || 0,
    }))
    const subtotal = payload.reduce((s, l) => s + l.unit_price * l.quantity, 0)
    const total = payload.reduce((s, l) => s + lineTotal(l as InvoiceLine), 0)
    const types = Array.from(new Set(payload.map((l) => l.charge_type)))
    setField(handleInputChange, "lines", payload)
    setField(handleInputChange, "subtotal", subtotal)
    setField(handleInputChange, "total_amount", total)
    setField(handleInputChange, "invoice_type", types.length === 1 ? types[0] : "mixed")
  }

  useEffect(() => {
    if (!isEditing || !formData.id) return
    const source = Array.isArray(formData.line_items) && formData.line_items.length
      ? formData.line_items
      : Array.isArray(formData.lines) && formData.lines.length
        ? formData.lines
        : null
    if (!source) return
    const mapped = source.map((l: any) => ({
      key: String(l.id || l.key || Math.random()),
      charge_type: l.charge_type || (l.item_type === "equipment" ? "equipment" : "subscription"),
      description: l.description || "",
      quantity: Number(l.quantity) || 1,
      unit_price: Number(l.unit_price) || 0,
      discount_amount: Number(l.discount_amount) || 0,
      billing_start_date: (l.billing_start_date || "").toString().slice(0, 10),
      billing_end_date: (l.billing_end_date || "").toString().slice(0, 10),
      inventory_item_id: l.inventory_item_id || "",
      customer_package_id: l.customer_package_id || "",
    }))
    syncLines(mapped)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, formData.id, Array.isArray(formData.line_items) ? formData.line_items.length : 0])

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + (Number(l.unit_price) || 0) * (Number(l.quantity) || 1), 0)
    const total = lines.reduce((s, l) => s + lineTotal(l), 0)
    return { subtotal, total, discount: subtotal - total }
  }, [lines])

  const updateLine = (key: string, patch: Partial<InvoiceLine>) => {
    syncLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const removeLine = (key: string) => {
    if (lines.length <= 1) return
    syncLines(lines.filter((l) => l.key !== key))
  }

  const addLine = () => syncLines([...lines, emptyLine("installation")])

  const resolveBillingPeriod = () => {
    if (selectedMonth) {
      return billingPeriodForMonth(Number.parseInt(selectedMonth, 10))
    }
    return currentBillingPeriod()
  }

  const applyCustomerSubscriptionDefaults = (customer: DropdownCustomer, sourceLines: InvoiceLine[]) => {
    const period = resolveBillingPeriod()

    // Keep non-subscription charges (equipment, installation, etc.) when switching customers.
    const preserved = sourceLines.filter((l) => {
      if (l.charge_type === "subscription") return false
      const isBlankStarter =
        sourceLines.length === 1 &&
        !l.unit_price &&
        !l.discount_amount &&
        !l.description &&
        !l.billing_start_date &&
        !l.billing_end_date
      return !isBlankStarter
    })

    const packages = Array.isArray(customer.packages) ? customer.packages : []
    if (packages.length > 0) {
      const packageLines: InvoiceLine[] = buildSubscriptionLinesFromPackages(packages, period).map(
        (seed) => ({
          ...emptyLine("subscription"),
          ...seed,
        }),
      )
      if (!formData.due_date) {
        setField(handleInputChange, "due_date", period.due_date)
      }
      syncLines([...packageLines, ...preserved])
      return
    }

    // Fallback when customer has no active packages: fill one aggregated subscription line.
    let touched = false
    const next = sourceLines.map((l) => {
      const isBlank =
        !l.unit_price &&
        !l.discount_amount &&
        !l.description &&
        !l.billing_start_date &&
        !l.billing_end_date

      const shouldFill =
        l.charge_type === "subscription" ||
        (sourceLines.length === 1 && isBlank && l.charge_type !== "equipment")

      if (!shouldFill) return l

      touched = true
      return {
        ...l,
        charge_type: "subscription",
        unit_price: customer.servicePlanPrice || 0,
        discount_amount: customer.discountAmount || 0,
        description: l.description || "Monthly subscription",
        billing_start_date: l.billing_start_date || period.billing_start_date,
        billing_end_date: l.billing_end_date || period.billing_end_date,
        customer_package_id: "",
      }
    })

    if (touched) {
      if (!formData.due_date) {
        setField(handleInputChange, "due_date", period.due_date)
      }
      syncLines(next)
    }
  }

  const onCustomerSelect = (customerId: string) => {
    setField(handleInputChange, "customer_id", customerId)
    const customer = customers.find((c) => c.id === customerId)
    if (!customer || isEditing) return
    applyCustomerSubscriptionDefaults(customer, lines)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value
    setSelectedMonth(month)
    if (!month) return

    const period = billingPeriodForMonth(Number.parseInt(month, 10))
    setField(handleInputChange, "due_date", period.due_date)

    // Apply billing period to every subscription line (month picker is an
    // explicit override — same shortcut the old single-line form offered).
    const next = lines.map((l) =>
      l.charge_type === "subscription"
        ? {
            ...l,
            billing_start_date: period.billing_start_date,
            billing_end_date: period.billing_end_date,
          }
        : l
    )
    syncLines(next)
  }

  const onChargeTypeChange = (key: string, chargeType: string) => {
    const customer = customers.find((c) => c.id === formData.customer_id)
    const period = resolveBillingPeriod()
    const patch: Partial<InvoiceLine> = { charge_type: chargeType }

    // Non-countable charges always bill as qty 1 — clear any leftover qty from equipment/add-on.
    if (!showsQuantity(chargeType)) {
      patch.quantity = 1
    }

    if (chargeType === "subscription" && customer && !isEditing) {
      const current = lines.find((l) => l.key === key)
      const hasPackages = Array.isArray(customer.packages) && customer.packages.length > 0
      // Don't dump the summed package total into a manual subscription line when
      // the customer already has per-package lines (or packages available).
      if (current && (!current.unit_price || current.unit_price === 0) && !hasPackages) {
        patch.unit_price = customer.servicePlanPrice || 0
        patch.discount_amount = customer.discountAmount || 0
        patch.description = current.description || "Monthly subscription"
      }
      if (current) {
        patch.billing_start_date = current.billing_start_date || period.billing_start_date
        patch.billing_end_date = current.billing_end_date || period.billing_end_date
        if (!formData.due_date) {
          setField(handleInputChange, "due_date", period.due_date)
        }
      }
    }

    updateLine(key, patch)
  }

  const inputClasses =
    "w-full h-9 px-3 text-sm border border-slate-300 rounded-md bg-[#F8FAFB] text-slate-800 placeholder:text-slate-400 shadow-sm focus:bg-white focus:border-[#2A5C8A] focus:outline-none focus:ring-1 focus:ring-[#2A5C8A]/25 disabled:bg-slate-100 disabled:text-slate-400"
  const labelClasses = "block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
  const secondaryBtn =
    "h-8 px-2.5 text-xs font-medium rounded-md text-[#2A5C8A] bg-[#E8EEF1] border border-[#C5D4DA] shadow-sm hover:bg-[#dce6ea] inline-flex items-center gap-1 transition-colors"
  const iconBtn =
    "p-1.5 rounded-md text-slate-500 border border-transparent hover:text-red-600 hover:bg-red-50 hover:border-red-100 disabled:opacity-30 transition-colors"

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div>
          <label className={labelClasses}>Customer *</label>
          {customers.length === 0 && customersLoading && !customerSearch ? (
            <div className={`${inputClasses} flex items-center text-slate-400`}>Loading customers…</div>
        ) : (
          <SearchableCustomerSelect
            customers={customers}
            value={formData.customer_id || ""}
              onChange={(e) => handleInputChange(e)}
              onCustomerSelect={onCustomerSelect}
              onSearchChange={setCustomerSearch}
              isLoading={customersLoading}
              placeholder="Search customer"
          />
        )}
      </div>

        <div>
          <label className={labelClasses}>Select month (optional)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className={`${inputClasses} pl-9 appearance-none`}
              aria-label="Select billing month"
            >
              <option value="">Select month</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label} {new Date().getFullYear()}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Sets due date and billing dates on subscription lines
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${isEditing && formData.invoice_number ? "md:grid-cols-2" : ""}`}>
          <div>
            <label className={labelClasses}>Due date *</label>
          <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              name="due_date"
                value={(formData.due_date || "").toString().slice(0, 10)}
                onChange={handleInputChange}
              required
                className={`${inputClasses} pl-9`}
            />
            </div>
          </div>
          {isEditing && formData.invoice_number ? (
            <div>
              <label className={labelClasses}>Invoice #</label>
              <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 bg-slate-50 text-sm font-mono font-medium text-slate-700">
                {formData.invoice_number}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-semibold text-slate-800">Charges</h3>
          <button type="button" onClick={addLine} className={secondaryBtn}>
            <Plus className="h-3.5 w-3.5" />
            Add line
          </button>
        </div>

        <div className="rounded-md border border-slate-200 divide-y divide-slate-100 overflow-visible bg-slate-50/80">
          {lines.map((line, idx) => (
            <div key={line.key} className="p-3 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Line {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length <= 1}
                  className={iconBtn}
                  title="Remove line"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Charge type *</label>
                  <select
                    value={line.charge_type}
                    onChange={(e) => onChargeTypeChange(line.key, e.target.value)}
                    className={inputClasses}
                  >
                    {CHARGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Description *</label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    className={inputClasses}
                    placeholder="Charge description"
                  />
                </div>
              </div>

              {line.charge_type === "subscription" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClasses}>Billing start *</label>
                    <input
                      type="date"
                      value={line.billing_start_date || ""}
                      onChange={(e) => updateLine(line.key, { billing_start_date: e.target.value })}
                      className={inputClasses}
                      required
                    />
            </div>
                  <div>
                    <label className={labelClasses}>Billing end *</label>
            <input
                      type="date"
                      value={line.billing_end_date || ""}
                      onChange={(e) => updateLine(line.key, { billing_end_date: e.target.value })}
                      className={inputClasses}
              required
            />
          </div>
        </div>
              )}

              {line.charge_type === "equipment" && (
                <div>
                  <label className={labelClasses}>Inventory item *</label>
                  {line.inventory_item_id && (
                    <p className="mb-1 text-xs text-slate-500">
                      Selected: {inventory.find((i) => i.id === line.inventory_item_id)?.item_type || line.description}
                    </p>
                  )}
                  <SearchableInventorySelect
                    items={inventory}
                    excludeIds={lines
                      .filter((l) => l.key !== line.key && l.inventory_item_id)
                      .map((l) => l.inventory_item_id as string)}
                    onItemSelect={(itemId: string) => {
                      const item = inventory.find((i) => i.id === itemId)
                      updateLine(line.key, {
                        inventory_item_id: itemId,
                        description: item?.item_type || line.description,
                        unit_price: Number(item?.unit_price || line.unit_price || 0),
                      })
                    }}
                  />
                </div>
              )}

              <div className={`grid gap-3 ${showsQuantity(line.charge_type) ? "grid-cols-3" : "grid-cols-2"}`}>
                {showsQuantity(line.charge_type) ? (
                  <div>
                    <label className={labelClasses}>Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 1 })}
                      className={inputClasses}
                    />
                  </div>
                ) : null}
                <div>
                  <label className={labelClasses}>Unit price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) || 0 })}
                    className={inputClasses}
                  />
            </div>
                <div>
                  <label className={labelClasses}>Discount</label>
            <input
              type="number"
                    min={0}
              step="0.01"
                    value={line.discount_amount}
                    onChange={(e) => updateLine(line.key, { discount_amount: Number(e.target.value) || 0 })}
                    className={inputClasses}
            />
          </div>
              </div>
              <p className="text-xs text-right tabular-nums text-slate-500">
                Line total <span className="font-medium text-slate-800">Rs. {lineTotal(line).toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm space-y-1.5 shadow-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="tabular-nums text-slate-700">Rs. {totals.subtotal.toLocaleString()}</span>
          </div>
        <div className="flex justify-between text-slate-500">
          <span>Discounts</span>
          <span className="tabular-nums text-slate-700">Rs. {totals.discount.toLocaleString()}</span>
          </div>
        <div className="flex justify-between pt-1.5 border-t border-slate-200 text-[#2A5C8A] font-semibold">
          <span>Total</span>
          <span className="tabular-nums">Rs. {totals.total.toLocaleString()}</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className={labelClasses}>Notes</label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            rows={2}
            className={`${inputClasses} h-auto pl-9 py-2 resize-none`}
            placeholder="Optional notes"
          />
        </div>
      </div>
    </div>
  )
}

export default InvoiceForm
