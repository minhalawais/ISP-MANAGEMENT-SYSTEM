"use client"

import type React from "react"

interface BankPerfItem {
  bank_name: string
  account_number: string
  collections: number
  extra_income?: number // NEW
  payments: number
  isp_payments: number
  expenses: number
  net_flow: number
  utilization_rate: number
  initial_balance?: number
  adjusted_balance?: number
}

interface BankPerformanceProps {
  data: BankPerfItem[]
  cashPayments?: {
    collections: number
    payments: number
    isp_payments?: number
    expenses?: number
    extra_income?: number // NEW
    net_flow: number
  }
}

// Utility functions
const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatPercent = (v: number) => `${(v ?? 0).toFixed(1)}%`

export const BankPerformance: React.FC<BankPerformanceProps> = ({ data, cashPayments }) => {
  // Calculate totals for bank accounts
  const bankTotals = data?.reduce(
    (acc, row) => {
      acc.collections += row.collections || 0
      acc.extra_income += row.extra_income || 0
      acc.payments += row.payments || 0
      acc.isp_payments += row.isp_payments || 0
      acc.expenses += row.expenses || 0
      acc.net_flow += row.net_flow || 0
      acc.initial_balance += row.initial_balance || 0
      acc.adjusted_balance += (row.net_flow || 0) + (row.initial_balance || 0)
      return acc
    },
    {
      collections: 0,
      extra_income: 0,
      payments: 0,
      isp_payments: 0,
      expenses: 0,
      net_flow: 0,
      initial_balance: 0,
      adjusted_balance: 0,
    },
  )

  // Calculate overall totals including cash payments
  const overallTotals = {
    collections: (bankTotals?.collections || 0) + (cashPayments?.collections || 0),
    extra_income: (bankTotals?.extra_income || 0) + (cashPayments?.extra_income || 0),
    payments: (bankTotals?.payments || 0) + (cashPayments?.payments || 0),
    isp_payments: (bankTotals?.isp_payments || 0) + (cashPayments?.isp_payments || 0),
    expenses: (bankTotals?.expenses || 0) + (cashPayments?.expenses || 0),
    net_flow: (bankTotals?.net_flow || 0) + (cashPayments?.net_flow || 0),
    initial_balance: bankTotals?.initial_balance || 0,
    adjusted_balance: (bankTotals?.adjusted_balance || 0) + (cashPayments?.net_flow || 0),
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Bank & Cash Performance</h3>
      <p className="text-gray-600 text-sm mb-4">
        Collections, payments, and net cash flow by account including expenses and cash transactions
      </p>

      {/* Updated Totals - Now includes expenses breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Total Collections</div>
          <div className="text-lg font-bold text-blue-800">{formatCurrency(overallTotals.collections)}</div>
          {cashPayments && (
            <div className="text-xs text-blue-600 mt-1">Cash: {formatCurrency(cashPayments.collections || 0)}</div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="text-xs font-medium text-emerald-700">Total Extra Income</div>
          <div className="text-lg font-bold text-emerald-800">{formatCurrency(overallTotals.extra_income)}</div>
          {cashPayments && (
            <div className="text-xs text-emerald-600 mt-1">Cash: {formatCurrency(cashPayments.extra_income || 0)}</div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-xs font-medium text-orange-700">Total Payments</div>
          <div className="text-lg font-bold text-orange-800">{formatCurrency(overallTotals.payments)}</div>
          <div className="text-xs text-orange-600 mt-1">ISP: {formatCurrency(overallTotals.isp_payments || 0)}</div>
          <div className="text-xs text-red-600">Expenses: {formatCurrency(overallTotals.expenses || 0)}</div>
          {cashPayments && (
            <div className="text-xs text-orange-500 mt-1 border-t border-orange-200 pt-1">
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
          <div
            className={`text-xs font-medium ${overallTotals.adjusted_balance >= 0 ? "text-indigo-700" : "text-red-700"}`}
          >
            Adjusted Balance
          </div>
          <div
            className={`text-lg font-bold ${overallTotals.adjusted_balance >= 0 ? "text-indigo-800" : "text-red-800"}`}
          >
            {formatCurrency(overallTotals.adjusted_balance)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Initial: {formatCurrency(overallTotals.initial_balance || 0)}
          </div>
        </div>
      </div>

      {/* Updated Table with expense columns */}
      <div className="overflow-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-gray-600">
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-3 w-1/8">Account</th>
              <th className="py-2 px-3 w-1/8">Collections</th>
              <th className="py-2 px-3 w-1/8">Extra Income</th> {/* NEW */}
              <th className="py-2 px-3 w-1/8">ISP Payments</th>
              <th className="py-2 px-3 w-1/8">Expenses</th>
              <th className="py-2 px-3 w-1/8">Net Flow</th>
              <th className="py-2 px-3 w-1/8">Initial Balance</th>
              <th className="py-2 px-3 w-1/8">Adjusted Balance</th>
              <th className="py-2 pl-3 w-1/8">Utilization</th>
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
                  {formatCurrency(cashPayments.extra_income || 0)}
                </td>
                <td className="py-2 px-3 font-semibold text-yellow-800">
                  {formatCurrency(cashPayments.isp_payments || 0)}
                </td>
                <td className="py-2 px-3 font-semibold text-yellow-800">
                  {formatCurrency(cashPayments.expenses || 0)}
                </td>
                <td
                  className={`py-2 px-3 ${cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"} font-semibold`}
                >
                  {formatCurrency(cashPayments.net_flow || 0)}
                </td>
                <td className="py-2 px-3 text-gray-400 font-semibold">N/A</td>
                <td
                  className={`py-2 px-3 ${cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"} font-semibold`}
                >
                  {formatCurrency(cashPayments.net_flow || 0)}
                </td>
                <td className="py-2 pl-3 text-gray-400">N/A</td>
              </tr>
            )}

            {/* Bank Account Rows */}
            {data?.map((row, idx) => {
              const netPositive = (row.net_flow ?? 0) >= 0
              const adjustedBalance = (row.net_flow || 0) + (row.initial_balance || 0)
              const adjustedPositive = adjustedBalance >= 0
              return (
                <tr
                  key={`${row.bank_name}-${row.account_number}-${idx}`}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 pr-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{row.bank_name}</span>
                      <span className="text-xs text-gray-500">Acct: {row.account_number}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-blue-700 font-medium">{formatCurrency(row.collections || 0)}</td>
                  <td className="py-2 px-3 text-emerald-700 font-medium">{formatCurrency(row.extra_income || 0)}</td>
                  <td className="py-2 px-3 text-orange-700 font-medium">{formatCurrency(row.isp_payments || 0)}</td>
                  <td className="py-2 px-3 text-red-700 font-medium">{formatCurrency(row.expenses || 0)}</td>
                  <td className={`py-2 px-3 ${netPositive ? "text-emerald-700" : "text-red-700"} font-semibold`}>
                    {formatCurrency(row.net_flow || 0)}
                  </td>
                  <td className="py-2 px-3 text-purple-700 font-semibold">
                    {formatCurrency(row.initial_balance || 0)}
                  </td>
                  <td className={`py-2 px-3 ${adjustedPositive ? "text-indigo-700" : "text-red-700"} font-semibold`}>
                    {formatCurrency(adjustedBalance)}
                  </td>
                  <td className="py-2 pl-3">
                    <span
                      className={
                        row.utilization_rate >= 80
                          ? "text-green-600"
                          : row.utilization_rate >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {formatPercent(row.utilization_rate || 0)}
                    </span>
                  </td>
                </tr>
              )
            })}

            {/* Totals Row */}
            {data && data.length > 0 && (
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="py-2 pr-3 text-gray-900">Total</td>
                <td className="py-2 px-3 text-blue-800">{formatCurrency(bankTotals?.collections || 0)}</td>
                <td className="py-2 px-3 text-emerald-800">{formatCurrency(bankTotals?.extra_income || 0)}</td>
                <td className="py-2 px-3 text-orange-800">{formatCurrency(bankTotals?.isp_payments || 0)}</td>
                <td className="py-2 px-3 text-red-800">{formatCurrency(bankTotals?.expenses || 0)}</td>
                <td className={`py-2 px-3 ${(bankTotals?.net_flow || 0) >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                  {formatCurrency(bankTotals?.net_flow || 0)}
                </td>
                <td className="py-2 px-3 text-purple-800">{formatCurrency(bankTotals?.initial_balance || 0)}</td>
                <td
                  className={`py-2 px-3 ${(bankTotals?.adjusted_balance || 0) >= 0 ? "text-indigo-800" : "text-red-800"}`}
                >
                  {formatCurrency(bankTotals?.adjusted_balance || 0)}
                </td>
                <td className="py-2 pl-3 text-gray-700">
                  {formatPercent(
                    data.length > 0 ? data.reduce((sum, row) => sum + (row.utilization_rate || 0), 0) / data.length : 0,
                  )}
                </td>
              </tr>
            )}

            {/* No Data Message */}
            {(!data || data.length === 0) && !cashPayments && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500">
                  No bank performance data available for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Notes */}
      <div className="mt-4 space-y-2">
        {cashPayments && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Cash payments represent physical cash transactions that are not processed through
              bank accounts. They contribute to the overall cash flow but don't have associated bank balances.
            </p>
          </div>
        )}

        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Utilization Rate:</strong> Shows the percentage of collections relative to total transactions
            (collections + payments). Higher rates indicate more efficient use of bank accounts for revenue collection.
          </p>
        </div>

        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-700">
            <strong>Adjusted Balance:</strong> Represents the net position after considering initial bank balances and
            transaction flows. This shows the actual financial position of each account.
          </p>
        </div>
      </div>
    </div>
  )
}
