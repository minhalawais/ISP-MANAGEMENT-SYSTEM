"use client"

import type React from "react"

interface BankPerfItem {
  bank_name: string
  account_number: string
  collections: number
  payments: number
  net_flow: number
  utilization_rate: number
  initial_balance?: number
  adjusted_balance?: number
}

interface BankPerformanceProps {
  data: BankPerfItem[]
  cashPayments?: {  // NEW: Cash payments data
    collections: number
    payments: number
    net_flow: number
  }
}

// ADD THESE UTILITY FUNCTIONS AT THE TOP LEVEL
const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatPercent = (v: number) => `${(v ?? 0).toFixed(1)}%`

export const BankPerformance: React.FC<BankPerformanceProps> = ({ data, cashPayments }) => {
  // Calculate totals for bank accounts
  const bankTotals = data?.reduce(
    (acc, row) => {
      acc.collections += row.collections || 0
      acc.payments += row.payments || 0
      acc.net_flow += row.net_flow || 0
      acc.initial_balance += row.initial_balance || 0
      acc.adjusted_balance += (row.net_flow || 0) + (row.initial_balance || 0)
      return acc
    },
    { collections: 0, payments: 0, net_flow: 0, initial_balance: 0, adjusted_balance: 0 },
  )

  // Calculate overall totals including cash payments
  const overallTotals = {
    collections: (bankTotals?.collections || 0) + (cashPayments?.collections || 0),
    payments: (bankTotals?.payments || 0) + (cashPayments?.payments || 0),
    net_flow: (bankTotals?.net_flow || 0) + (cashPayments?.net_flow || 0),
    initial_balance: bankTotals?.initial_balance || 0, // Cash doesn't have initial balance
    adjusted_balance: (bankTotals?.adjusted_balance || 0) + (cashPayments?.net_flow || 0) // Cash affects adjusted balance
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Bank & Cash Performance</h3>
      <p className="text-gray-600 text-sm mb-4">Collections, ISP payments, net cash flow and balances by account including cash transactions</p>

      {/* Updated Totals - Now includes cash */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Total Collections</div>
          <div className="text-lg font-bold text-blue-800">{formatCurrency(overallTotals.collections)}</div>
          {cashPayments && (
            <div className="text-xs text-blue-600 mt-1">
              Cash: {formatCurrency(cashPayments.collections || 0)}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-xs font-medium text-orange-700">Total ISP Payments</div>
          <div className="text-lg font-bold text-orange-800">{formatCurrency(overallTotals.payments)}</div>
          {cashPayments && (
            <div className="text-xs text-orange-600 mt-1">
              Cash: {formatCurrency(cashPayments.payments || 0)}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg border ${overallTotals.net_flow >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
        >
          <div className={`text-xs font-medium ${overallTotals.net_flow >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            Net Cash Flow
          </div>
          <div className={`text-lg font-bold ${overallTotals.net_flow >= 0 ? "text-emerald-800" : "text-red-800"}`}>
            {formatCurrency(overallTotals.net_flow)}
          </div>
          {cashPayments && (
            <div className={`text-xs ${cashPayments.net_flow >= 0 ? "text-emerald-600" : "text-red-600"} mt-1`}>
              Cash: {formatCurrency(cashPayments.net_flow || 0)}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg border ${overallTotals.adjusted_balance >= 0 ? "bg-indigo-50 border-indigo-200" : "bg-red-50 border-red-200"}`}
        >
          <div className={`text-xs font-medium ${overallTotals.adjusted_balance >= 0 ? "text-indigo-700" : "text-red-700"}`}>
            Adjusted Balance
          </div>
          <div className={`text-lg font-bold ${overallTotals.adjusted_balance >= 0 ? "text-indigo-800" : "text-red-800"}`}>
            {formatCurrency(overallTotals.adjusted_balance)}
          </div>
        </div>
      </div>

      {/* Updated Table with cash row */}
      <div className="overflow-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3 w-1/6">Account</th>
              <th className="py-2 px-3 w-1/6">Collections</th>
              <th className="py-2 px-3 w-1/6">ISP Payments</th>
              <th className="py-2 px-3 w-1/6">Net Cash Flow</th>
              <th className="py-2 px-3 w-1/6">Initial Balance</th>
              <th className="py-2 px-3 w-1/6">Adjusted Balance</th>
              <th className="py-2 pl-3 w-1/6">Utilization</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {/* Cash Payments Row - Always show at the top */}
            {cashPayments && (
              <tr className="border-b border-gray-100 bg-yellow-50">
                <td className="py-2 pr-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-yellow-800">Cash Payments</span>
                    <span className="text-xs text-yellow-600">Cash transactions</span>
                  </div>
                </td>
                <td className="py-2 px-3 font-semibold text-yellow-800">
                  {formatCurrency(cashPayments.collections || 0)}
                </td>
                <td className="py-2 px-3 font-semibold text-yellow-800">
                  {formatCurrency(cashPayments.payments || 0)}
                </td>
                <td className={`py-2 px-3 ${cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"} font-semibold`}>
                  {formatCurrency(cashPayments.net_flow || 0)}
                </td>
                <td className="py-2 px-3 text-gray-400 font-semibold">
                  N/A
                </td>
                <td className={`py-2 px-3 ${cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"} font-semibold`}>
                  {formatCurrency(cashPayments.net_flow || 0)}
                </td>
                <td className="py-2 pl-3 text-gray-400">
                  N/A
                </td>
              </tr>
            )}

            {/* Bank Account Rows */}
            {data?.map((row, idx) => {
              const netPositive = (row.net_flow ?? 0) >= 0
              const adjustedBalance = (row.net_flow || 0) + (row.initial_balance || 0)
              const adjustedPositive = adjustedBalance >= 0
              
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
                  <td className="py-2 px-3 text-purple-700 font-semibold">
                    {formatCurrency(row.initial_balance || 0)}
                  </td>
                  <td className={`py-2 px-3 ${adjustedPositive ? "text-indigo-700" : "text-red-700"} font-semibold`}>
                    {formatCurrency(adjustedBalance)}
                  </td>
                  <td className="py-2 pl-3">{formatPercent(row.utilization_rate || 0)}</td>
                </tr>
              )
            })}

            {/* No Data Message */}
            {(!data || data.length === 0) && !cashPayments && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  No bank performance data available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Note */}
      {cashPayments && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Cash payments represent physical cash transactions that are not processed through bank accounts. 
            They contribute to the overall cash flow but don't have associated bank balances.
          </p>
        </div>
      )}
    </div>
  )
}