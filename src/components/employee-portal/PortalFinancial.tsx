"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import { Wallet, TrendingUp, CreditCard, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"

interface FinancialData {
  current_balance: number
  total_paid: number
  total_earned: number
  month_earnings: number
  salary: number
  breakdown: Record<string, number>
  ledger: LedgerEntry[]
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

  const statItems: PortalStatItem[] = [
    { key: "month_earnings", label: "This month", value: `PKR ${data.month_earnings.toLocaleString()}`, icon: TrendingUp, tone: "success" },
    { key: "total_earned", label: "Total earned", value: `PKR ${data.total_earned.toLocaleString()}`, icon: DollarSign, tone: "default" },
    { key: "total_paid", label: "Total paid", value: `PKR ${data.total_paid.toLocaleString()}`, icon: CreditCard, tone: "default" },
    { key: "salary", label: "Monthly salary", value: `PKR ${data.salary.toLocaleString()}`, icon: CreditCard, tone: "accent" },
  ]

  const hasCustody = data.breakdown.recovery_cash_hold != null || data.breakdown.recovery_cash_settle != null

  return (
    <div className="lg:grid lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-4">
      <div className="space-y-4">
        <div className="rounded-xl border border-electric-blue/15 bg-gradient-to-br from-electric-blue/5 to-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-deep-ocean">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-electric-blue/10">
              <Wallet className="h-4 w-4 text-electric-blue" />
            </span>
            Current balance
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-deep-ocean">
            PKR {data.current_balance.toLocaleString()}
          </p>
        </div>

        <PortalStatStrip items={statItems} columnsMobile={2} columnsDesktop={4} />

        {hasCustody && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recovery cash custody</h3>
            <div className="grid grid-cols-2 divide-x divide-gray-100 text-sm">
              <div className="pr-3">
                <p className="text-xs text-gray-500">Holds (field collections)</p>
                <p className="text-lg font-bold tabular-nums text-amber-600">
                  PKR {Math.abs(Number(data.breakdown.recovery_cash_hold || 0)).toLocaleString()}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-xs text-gray-500">Settled (cleared)</p>
                <p className="text-lg font-bold tabular-nums text-portal-primary">
                  PKR {Math.abs(Number(data.breakdown.recovery_cash_settle || 0)).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Net custody is included in current balance (holds negative, settles positive).
            </p>
          </div>
        )}

        {Object.keys(data.breakdown).length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100">
            <div className="px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Earnings breakdown</h3>
            </div>
            {Object.entries(data.breakdown).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-600">{transactionTypeLabels[type] || type.replace("_", " ")}</span>
                <span className={`font-semibold tabular-nums ${amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  PKR {Math.abs(amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm lg:mt-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Transaction history</h3>
        </div>

        {data.ledger.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-160px)]">
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
                    <p className="truncate text-xs text-gray-500">
                      {entry.description || (entry.created_at ? new Date(entry.created_at).toLocaleString() : "No description")}
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
