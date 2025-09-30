"use client"

import type React from "react"

interface BankPerfItem {
  bank_name: string
  account_number: string
  collections: number
  payments: number
  net_flow: number
  utilization_rate: number
}

interface BankPerformanceProps {
  data: BankPerfItem[]
}

const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatPercent = (v: number) => `${(v ?? 0).toFixed(1)}%`

export const BankPerformance: React.FC<BankPerformanceProps> = ({ data }) => {
  const totals = data?.reduce(
    (acc, row) => {
      acc.collections += row.collections || 0
      acc.payments += row.payments || 0
      acc.net_flow += row.net_flow || 0
      return acc
    },
    { collections: 0, payments: 0, net_flow: 0 },
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Performance</h3>
      <p className="text-gray-600 text-sm mb-4">Collections, ISP payments, and net cash flow by account</p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Total Collections</div>
          <div className="text-lg font-bold text-blue-800">{formatCurrency(totals.collections)}</div>
        </div>
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-xs font-medium text-orange-700">Total ISP Payments</div>
          <div className="text-lg font-bold text-orange-800">{formatCurrency(totals.payments)}</div>
        </div>
        <div
          className={`p-3 rounded-lg border ${totals.net_flow >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
        >
          <div className={`text-xs font-medium ${totals.net_flow >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            Net Cash Flow
          </div>
          <div className={`text-lg font-bold ${totals.net_flow >= 0 ? "text-emerald-800" : "text-red-800"}`}>
            {formatCurrency(totals.net_flow)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 px-3">Collections</th>
              <th className="py-2 px-3">ISP Payments</th>
              <th className="py-2 px-3">Net Cash Flow</th>
              <th className="py-2 pl-3">Utilization</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {data?.map((row, idx) => {
              const netPositive = (row.net_flow ?? 0) >= 0
              return (
                <tr key={`${row.bank_name}-${row.account_number}-${idx}`} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{row.bank_name}</span>
                      <span className="text-xs text-gray-500">Acct: {row.account_number}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">{formatCurrency(row.collections || 0)}</td>
                  <td className="py-2 px-3">{formatCurrency(row.payments || 0)}</td>
                  <td className={`py-2 px-3 ${netPositive ? "text-emerald-700" : "text-red-700"} font-semibold`}>
                    {formatCurrency(row.net_flow || 0)}
                  </td>
                  <td className="py-2 pl-3">{formatPercent(row.utilization_rate || 0)}</td>
                </tr>
              )
            })}
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  No bank performance data available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
