"use client"

import type React from "react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import axiosInstance from "../../../utils/axiosConfig.ts"
import { AdvancedFilters } from "../FinancialComponent/AdvancedFilters.tsx"
import { X } from "lucide-react"

type FilterState = {
  startDate: string
  endDate: string
  bankAccount: string
  paymentMethod: string
  invoiceStatus: string
  ispPaymentType: string
  timeRange: string
}

type BankOption = { id: string; name: string }

type LedgerItem = {
  id: string
  date: string
  time?: string
  type: "invoice_payment" | "isp_payment" | "expense" | "extra_income" | "refund" | "internal_transfer" | "other"
  reference?: string
  description?: string
  method?: string
  bank_account?: string
  amount: number
  direction: "credit" | "debit"
  status?: string
  raw?: any
}

type LedgerApiResponse = {
  items?: LedgerItem[]
  bank_accounts?: BankOption[]
}

type UnifiedResponse = {
  bank_accounts?: BankOption[]
  collections?: any
  isp_payments?: any
  expenses?: any
  extra_incomes?: any
  payments?: any[]
  data?: any
}



function buildParams(filters: FilterState) {
  const params = new URLSearchParams()
  if (filters.startDate) params.append("start_date", filters.startDate)
  if (filters.endDate) params.append("end_date", filters.endDate)
  if (filters.bankAccount !== "all") params.append("bank_account_id", filters.bankAccount)
  if (filters.paymentMethod !== "all") params.append("payment_method", filters.paymentMethod)
  if (filters.invoiceStatus !== "all") params.append("invoice_status", filters.invoiceStatus)
  if (filters.ispPaymentType !== "all") params.append("isp_payment_type", filters.ispPaymentType)
  return params.toString()
}

function mapLedgerItems(resp: UnifiedResponse | LedgerApiResponse): LedgerItem[] {
  if (Array.isArray((resp as LedgerApiResponse)?.items)) {
    const normalized = ((resp as LedgerApiResponse).items ?? []).slice()
    normalized.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    return normalized
  }

  const items: LedgerItem[] = []

  const payments =
    (Array.isArray((resp as any)?.payments) ? (resp as any)?.payments : undefined) ??
    (Array.isArray((resp as any)?.collections?.payments) ? (resp as any)?.collections?.payments : undefined) ??
    (Array.isArray((resp as any)?.collections?.list) ? (resp as any)?.collections?.list : undefined) ??
    []

  payments.forEach((p: any) => {
    const status = (p?.status ?? "").toString()
    const typeRaw = (p?.payment_type || p?.type || "").toString()
    const isRefund = typeRaw.toLowerCase() === "refund" || status.toLowerCase() === "refunded"
    items.push({
      id: (p?.id || p?.payment_id || p?.transaction_id || crypto.randomUUID()).toString(),
      date: new Date(p?.payment_date || p?.date || p?.created_at || Date.now()).toISOString(),
      type: isRefund ? "refund" : "invoice_payment",
      reference: (p?.transaction_id || p?.invoice_id || p?.invoice_number || "").toString(),
      description: (p?.description || p?.note || "").toString(),
      method: (p?.payment_method || "").toString(),
      bank_account: (p?.bank_account?.name || p?.bank_account_name || p?.bank_account_id || "").toString(),
      amount: Number(p?.amount) || 0,
      direction: isRefund ? "debit" : "credit",
      status,
      raw: p,
    })
  })

  const ispItems =
    (Array.isArray((resp as any)?.isp_payments?.items) ? (resp as any)?.isp_payments?.items : undefined) ??
    (Array.isArray((resp as any)?.isp_payments) ? (resp as any)?.isp_payments : undefined) ??
    []
  ispItems.forEach((ip: any) => {
    items.push({
      id: (ip?.id || crypto.randomUUID()).toString(),
      date: new Date(ip?.payment_date || ip?.date || ip?.created_at || Date.now()).toISOString(),
      type: "isp_payment",
      reference: (ip?.reference_number || "").toString(),
      description: (ip?.description || ip?.payment_type || "").toString(),
      method: (ip?.payment_method || "").toString(),
      bank_account: (ip?.bank_account?.name || ip?.bank_account_id || "").toString(),
      amount: Number(ip?.amount) || 0,
      direction: "debit",
      status: (ip?.status || "completed").toString(),
      raw: ip,
    })
  })

  const expenseItems =
    (Array.isArray((resp as any)?.expenses?.items) ? (resp as any)?.expenses?.items : undefined) ??
    (Array.isArray((resp as any)?.expenses) ? (resp as any)?.expenses : undefined) ??
    []
  expenseItems.forEach((ex: any) => {
    items.push({
      id: (ex?.id || crypto.randomUUID()).toString(),
      date: new Date(ex?.expense_date || ex?.date || ex?.created_at || Date.now()).toISOString(),
      type: "expense",
      reference: (ex?.vendor_payee || "").toString(),
      description: (ex?.description || ex?.expense_type?.name || ex?.expense_type || "").toString(),
      method: (ex?.payment_method || "").toString(),
      bank_account: (ex?.bank_account?.name || ex?.bank_account_id || "").toString(),
      amount: Number(ex?.amount) || 0,
      direction: "debit",
      status: "posted",
      raw: ex,
    })
  })

  const extraItems =
    (Array.isArray((resp as any)?.extra_incomes?.items) ? (resp as any)?.extra_incomes?.items : undefined) ??
    (Array.isArray((resp as any)?.extra_incomes) ? (resp as any)?.extra_incomes : undefined) ??
    []
  extraItems.forEach((ei: any) => {
    items.push({
      id: (ei?.id || crypto.randomUUID()).toString(),
      date: new Date(ei?.income_date || ei?.date || ei?.created_at || Date.now()).toISOString(),
      type: "extra_income",
      reference: (ei?.payer || "").toString(),
      description: (ei?.description || ei?.income_type?.name || ei?.income_type || "").toString(),
      method: (ei?.payment_method || "").toString(),
      bank_account: (ei?.bank_account?.name || ei?.bank_account_id || "").toString(),
      amount: Number(ei?.amount) || 0,
      direction: "credit",
      status: "posted",
      raw: ei,
    })
  })

  items.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  return items
}

// Custom Select Component
const CustomSelect: React.FC<{
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}> = ({ value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-[#E5E1DA] rounded-lg hover:border-[#89A8B2] focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:ring-opacity-50 transition-all duration-200"
      >
        <span className="block truncate text-[#1F2937]">
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-[#E5E1DA] rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-[#F1F0E8] transition-colors ${
                  value === option.value ? "bg-[#E5E1DA] text-[#1F2937] font-medium" : "text-[#374151]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Custom Modal Component
const CustomModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E5E1DA] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-[#1F2937]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F1F0E8] rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export const Ledger: React.FC = () => {
  // Helper functions (define these at the top of your component or in a utils file)
  const getPakistaniDate = () => {
    const now = new Date()
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    return new Date(utc + (3600000 * 5)) // Add 5 hours for PKT
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Initial state
  const today = getPakistaniDate()
  const startOfMonth = formatDate(new Date(today.getFullYear(), today.getMonth(), 1))

  const [filters, setFilters] = useState<FilterState>({
    startDate: startOfMonth,
    endDate: formatDate(today),
    bankAccount: "all",
    paymentMethod: "all",
    invoiceStatus: "all",
    ispPaymentType: "all",
    timeRange: "mtd",
  })
  const [search, setSearch] = useState("")
  const [directionFilter, setDirectionFilter] = useState<"all" | "credit" | "debit">("all")
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<LedgerItem | null>(null)

  const key = buildParams(filters)

  const fetcher = async (qs: string) => {
    const headers = {
      Authorization: `Bearer ${typeof window !== "undefined" ? (localStorage.getItem("token") ?? "") : ""}`,
    }
    const prefer = `/dashboard/ledger?${qs}`
    try {
      const r1 = await axiosInstance.get<LedgerApiResponse>(prefer, { headers })
      return r1.data
    } catch (e) {
      const legacy = `/dashboard/unified-financial?${qs}`
      const r2 = await axiosInstance.get<UnifiedResponse>(legacy, { headers })
      return r2.data as any
    }
  }

  const { data, isLoading, error } = useSWR<UnifiedResponse | LedgerApiResponse>(key, fetcher, {
    revalidateOnFocus: false,
  })

  const bankAccounts: BankOption[] = useMemo(() => {
    if (!data) return []
    
    // Try multiple possible locations for bank accounts
    const ledgerResp = data as LedgerApiResponse
    const unifiedResp = data as UnifiedResponse
    
    if (Array.isArray(ledgerResp?.bank_accounts)) return ledgerResp.bank_accounts
    if (Array.isArray(unifiedResp?.bank_accounts)) return unifiedResp.bank_accounts
    if (Array.isArray((data as any)?.bank_accounts)) return (data as any).bank_accounts
    
    // If no bank accounts in response, return empty array but don't reset the filter
    return []
  }, [data])

  const allItems = useMemo(() => mapLedgerItems(data ?? {}), [data])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return allItems.filter((it) => {
      const dirOk = directionFilter === "all" || it.direction === directionFilter
      if (!dirOk) return false
      if (!s) return true
      const blob = [it.id, it.type, it.reference, it.description, it.method, it.bank_account, it.status, it.date]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return blob.includes(s)
    })
  }, [allItems, search, directionFilter])

  const totals = useMemo(() => {
    const credits = filtered.filter((i) => i.direction === "credit").reduce((s, i) => s + i.amount, 0)
    const debits = filtered.filter((i) => i.direction === "debit").reduce((s, i) => s + i.amount, 0)
    return { credits, debits, net: credits - debits, count: filtered.length }
  }, [filtered])

// Quick filter function
const onQuickFilter = (timeRange: string) => {
  const t = getPakistaniDate()
  let start = new Date(t)
  
  switch (timeRange) {
    case "today":
      start = new Date(t)
      break
    case "week":
      start = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 7)
      break
    case "mtd":
      start = new Date(t.getFullYear(), t.getMonth(), 1)
      break
    case "qtd":
      start = new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1)
      break
    case "ytd":
      start = new Date(t.getFullYear(), 0, 1)
      break
    case "last_month":
      start = new Date(t.getFullYear(), t.getMonth() - 1, 1)
      const end = new Date(t.getFullYear(), t.getMonth(), 0)
      setFilters((prev) => ({
        ...prev,
        timeRange,
        startDate: formatDate(start),
        endDate: formatDate(end),
      }))
      return
  }
  
  setFilters((prev) => ({
    ...prev,
    timeRange,
    startDate: formatDate(start),
    endDate: formatDate(getPakistaniDate()),
  }))
}
  return (
    <div className="space-y-6">
      {/* Filters */}
      <AdvancedFilters
        filters={filters}
        onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        onQuickFilter={onQuickFilter}
        bankAccounts={bankAccounts}
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg border border-[#E5E1DA] bg-[#F1F0E8]">
            <span className="text-sm font-medium text-[#1F2937]">Direction</span>
          </div>
          <CustomSelect
            value={directionFilter}
            onChange={(v) => setDirectionFilter(v as "all" | "credit" | "debit")}
            options={[
              { value: "all", label: "All" },
              { value: "credit", label: "Credits" },
              { value: "debit", label: "Debits" },
            ]}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search transaction, reference, method…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-[#E5E1DA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent transition-all duration-200"
          />
          <button
            onClick={() => {
              setSearch("")
              setDirectionFilter("all")
            }}
            className="px-4 py-2 border border-[#E5E1DA] rounded-lg hover:bg-[#F1F0E8] transition-colors font-medium text-[#1F2937]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#E5E1DA] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E1DA] flex flex-row items-center justify-between">
          <h3 className="text-lg font-bold text-[#1F2937]">Ledger</h3>
          <div className="text-sm text-[#6B7280]">
            {isLoading ? "Loading…" : error ? "Failed to load" : `${filtered.length} records`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F1F0E8] border-b border-[#E5E1DA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Bank
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DA]">
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280]">
                    No transactions for the selected filters.
                  </td>
                </tr>
              )}
              {filtered.map((row) => {
                const isCredit = row.direction === "credit"
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer hover:bg-[#F1F0E8] transition-colors"
                    onClick={() => {
                      setSelected(row)
                      setDetailOpen(true)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">
                      {new Date(row.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151] capitalize">
                      {row.type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] truncate max-w-[160px]">
                      {row.reference || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#374151] truncate max-w-[260px]">
                      {row.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{row.method || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{row.bank_account || "-"}</td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        isCredit ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {isCredit ? "+" : "-"} PKR {Math.round(row.amount).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div className="p-6 border-t border-[#E5E1DA] bg-gradient-to-br from-[#F1F0E8] to-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#E5E1DA] bg-white shadow-sm">
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Total Credits</div>
              <div className="text-2xl font-bold text-emerald-700">
                PKR {Math.round(totals.credits).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E1DA] bg-white shadow-sm">
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Total Debits</div>
              <div className="text-2xl font-bold text-red-700">PKR {Math.round(totals.debits).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E1DA] bg-white shadow-sm">
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Net</div>
              <div className={`text-2xl font-bold ${totals.net >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                PKR {Math.round(totals.net).toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[#E5E1DA] bg-white shadow-sm">
              <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Transactions</div>
              <div className="text-2xl font-bold text-[#1F2937]">{totals.count}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <CustomModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Transaction Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Type</div>
            <div className="text-base font-semibold text-[#1F2937] capitalize">
              {selected?.type.replace("_", " ")}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Date</div>
            <div className="text-base font-semibold text-[#1F2937]">
              {selected ? new Date(selected.date).toLocaleString() : "-"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Reference</div>
            <div className="text-base font-semibold text-[#1F2937]">{selected?.reference || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Method</div>
            <div className="text-base font-semibold text-[#1F2937]">{selected?.method || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Bank</div>
            <div className="text-base font-semibold text-[#1F2937]">{selected?.bank_account || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Status</div>
            <div className="text-base font-semibold text-[#1F2937] capitalize">{selected?.status || "-"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Amount</div>
            <div
              className={`text-3xl font-bold ${
                selected?.direction === "credit" ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {selected?.direction === "credit" ? "+" : "-"} PKR{" "}
              {selected ? Math.round(selected.amount).toLocaleString() : "0"}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">Description</div>
            <div className="text-base text-[#1F2937]">{selected?.description || "-"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">Raw Data</div>
            <pre className="text-xs p-4 rounded-xl border border-[#E5E1DA] bg-[#F1F0E8] overflow-auto max-h-64 font-mono">
              {selected ? JSON.stringify(selected.raw ?? {}, null, 2) : "{}"}
            </pre>
          </div>
        </div>
      </CustomModal>
    </div>
  )
}