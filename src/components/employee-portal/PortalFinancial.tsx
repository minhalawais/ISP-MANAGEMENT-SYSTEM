"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import { Wallet, Banknote, HandCoins, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"

interface FinancialData {
  total_paid: number
  salary: number
  hold_money: number
  ledger: LedgerEntry[]
  period?: { start: string; end: string; label: string }
}

interface LedgerEntry {
  id: string
  transaction_type: string
  amount: number
  description: string | null
  created_at: string | null
}

const transactionTypeLabels: Record<string, string> = {
  connection_commission: "Connection Commission",
  complaint_commission: "Complaint Commission",
  salary_accrual: "Salary",
  payout: "Payout",
  adjustment: "Adjustment",
  recovery_cash_hold: "Recovery cash hold",
  recovery_cash_settle: "Recovery cash settle",
  complaint_cash_hold: "Complaint cash hold",
  complaint_cash_settle: "Complaint cash settle",
}

export function PortalFinancial() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancial()
  }, [])

  const fetchFinancial = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/employee-portal/financial", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(response.data)
    } catch (error) {
      console.error("Failed to fetch financial:", error)
      toast.error("Failed to load financial data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Failed to load financial data</p>
      </div>
    )
  }

  const periodLabel = data.period?.label
  const statItems: PortalStatItem[] = [
    { key: "salary", label: "Monthly salary", value: `PKR ${data.salary.toLocaleString()}`, icon: Banknote, tone: "accent" },
    { key: "total_paid", label: "Paid this month", value: `PKR ${data.total_paid.toLocaleString()}`, icon: HandCoins, tone: "success" },
    { key: "hold_money", label: "Hold money", value: `PKR ${data.hold_money.toLocaleString()}`, icon: Wallet, tone: data.hold_money > 0 ? "warning" : "default" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-deep-ocean">Financial summary</h2>
          <p className="mt-0.5 text-xs text-slate-500">Salary, payments and unsettled customer collections</p>
        </div>
        {periodLabel ? <p className="text-xs font-medium text-slate-500">{periodLabel}</p> : null}
      </div>

      <PortalStatStrip items={statItems} columnsMobile={1} columnsDesktop={3} />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Transaction history</h3>
          {periodLabel ? (
            <p className="text-xs text-slate-500 mt-0.5">{periodLabel}</p>
          ) : null}
        </div>

        {data.ledger.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No transactions this month</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
            {data.ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      entry.amount >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {entry.amount >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {transactionTypeLabels[entry.transaction_type] || entry.transaction_type}
                    </p>
                    {entry.description ? (
                      <p className="truncate text-xs text-gray-500">{entry.description}</p>
                    ) : null}
                    <p className="text-xs text-gray-400 tabular-nums">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleString("en-PK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums whitespace-nowrap ${
                    entry.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {entry.amount >= 0 ? "+" : ""}PKR {entry.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
