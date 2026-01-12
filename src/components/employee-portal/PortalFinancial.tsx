"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react"

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
}

const transactionTypeColors: Record<string, string> = {
  connection_commission: "text-green-600 bg-green-50",
  complaint_commission: "text-blue-600 bg-blue-50",
  salary_accrual: "text-purple-600 bg-purple-50",
  payout: "text-red-600 bg-red-50",
  adjustment: "text-orange-600 bg-orange-50",
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
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load financial data</p>
      </div>
    )
  }

  const summaryCards = [
    {
      label: "Current Balance",
      value: data.current_balance,
      icon: Wallet,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      label: "This Month",
      value: data.month_earnings,
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      label: "Total Earned",
      value: data.total_earned,
      icon: DollarSign,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      label: "Total Paid",
      value: data.total_paid,
      icon: CreditCard,
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-4 border border-gray-100`}
            >
              <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                PKR {card.value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Salary Info */}
      <div className="bg-gradient-to-r from-[#89A8B2] to-[#6B8A94] rounded-xl p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Monthly Salary</p>
            <p className="text-2xl font-bold">PKR {data.salary.toLocaleString()}</p>
          </div>
          <CreditCard className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Breakdown */}
      {Object.keys(data.breakdown).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#89A8B2]" />
            Earnings Breakdown
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.breakdown).map(([type, amount]) => (
              <div key={type} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 capitalize">
                  {transactionTypeLabels[type] || type.replace("_", " ")}
                </p>
                <p className={`text-lg font-bold ${amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                  PKR {Math.abs(amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#89A8B2]" />
          Transaction History
        </h3>
        
        {data.ledger.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {data.ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${transactionTypeColors[entry.transaction_type] || "bg-gray-100 text-gray-600"}`}>
                    {entry.amount >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transactionTypeLabels[entry.transaction_type] || entry.transaction_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.description || "No description"}
                    </p>
                    {entry.created_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-bold ${entry.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {entry.amount >= 0 ? "+" : ""}PKR {entry.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
