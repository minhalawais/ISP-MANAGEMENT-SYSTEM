"use client"

import type React from "react"
import { motion } from "framer-motion"

interface BankPerfItem {
  bank_name: string
  account_number: string
  collections: number
  extra_income?: number
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
    extra_income?: number
    net_flow: number
  }
}

const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatPercent = (v: number) => `${(v ?? 0).toFixed(1)}%`

export const BankPerformance: React.FC<BankPerformanceProps> = ({ data, cashPayments }) => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  }

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Bank & Cash Performance</h3>
        <p className="text-sm text-gray-600">
          Collections, payments, and net cash flow by account including expenses and cash transactions
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6"
      >
        {[
          { label: "Total Collections", value: overallTotals.collections, color: "blue", positive: true },
          { label: "Total Extra Income", value: overallTotals.extra_income, color: "emerald", positive: true },
          { label: "Total Payments", value: overallTotals.payments, color: "orange", positive: false },
          { label: "Net Cash Flow", value: overallTotals.net_flow, color: overallTotals.net_flow >= 0 ? "emerald" : "red", positive: overallTotals.net_flow >= 0 },
          { label: "Adjusted Balance", value: overallTotals.adjusted_balance, color: overallTotals.adjusted_balance >= 0 ? "indigo" : "red", positive: overallTotals.adjusted_balance >= 0 },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            variants={cardVariants}
            className={`p-4 rounded-xl bg-${card.color}-50 border border-${card.color}-200 backdrop-blur-sm bg-white/90 hover:shadow-lg transition-all duration-300`}
          >
            <div className={`text-xs md:text-sm font-semibold text-${card.color}-700 mb-1`}>{card.label}</div>
            <div className={`text-lg md:text-xl font-bold text-${card.color}-800`}>
              {formatCurrency(card.value)}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
                <th className="py-3 px-4 text-left font-semibold text-gray-700 rounded-l-xl">Account</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Collections</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Extra Income</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">ISP Payments</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Expenses</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Net Flow</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Initial Balance</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700">Adjusted</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700 rounded-r-xl">Util.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashPayments && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-amber-50/50 hover:bg-amber-100/50 transition-colors duration-200"
                >
                  <td className="py-3 px-4 rounded-l-xl">
                    <div className="flex flex-col">
                      <span className="font-semibold text-amber-800">Cash Payments</span>
                      <span className="text-xs text-amber-600">Cash transactions</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-800">
                    {formatCurrency(cashPayments.collections || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-800">
                    {formatCurrency(cashPayments.extra_income || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-800">
                    {formatCurrency(cashPayments.isp_payments || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-800">
                    {formatCurrency(cashPayments.expenses || 0)}
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}>
                    {formatCurrency(cashPayments.net_flow || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 font-medium">N/A</td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    cashPayments.net_flow >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}>
                    {formatCurrency(cashPayments.net_flow || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 rounded-r-xl">N/A</td>
                </motion.tr>
              )}

              {data?.map((row, idx) => {
                const netPositive = (row.net_flow ?? 0) >= 0
                const adjustedBalance = (row.net_flow || 0) + (row.initial_balance || 0)
                const adjustedPositive = adjustedBalance >= 0
                return (
                  <motion.tr
                    key={`${row.bank_name}-${row.account_number}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50/50 transition-all duration-200 group"
                  >
                    <td className="py-3 px-4 rounded-l-xl group-hover:bg-white/50">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{row.bank_name}</span>
                        <span className="text-xs text-gray-500">Acct: {row.account_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-700 group-hover:bg-white/50">
                      {formatCurrency(row.collections || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700 group-hover:bg-white/50">
                      {formatCurrency(row.extra_income || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-orange-700 group-hover:bg-white/50">
                      {formatCurrency(row.isp_payments || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-red-700 group-hover:bg-white/50">
                      {formatCurrency(row.expenses || 0)}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold group-hover:bg-white/50 ${
                      netPositive ? "text-emerald-700" : "text-red-700"
                    }`}>
                      {formatCurrency(row.net_flow || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-700 group-hover:bg-white/50">
                      {formatCurrency(row.initial_balance || 0)}
                    </td>
                    <td className={`py-3 px-4 text-right font-semibold group-hover:bg-white/50 ${
                      adjustedPositive ? "text-indigo-700" : "text-red-700"
                    }`}>
                      {formatCurrency(adjustedBalance)}
                    </td>
                    <td className="py-3 px-4 text-right rounded-r-xl group-hover:bg-white/50">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.utilization_rate >= 80
                          ? "bg-green-100 text-green-800"
                          : row.utilization_rate >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {formatPercent(row.utilization_rate || 0)}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}

              {data && data.length > 0 && (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-50/80 border-t-2 border-gray-200 font-semibold"
                >
                  <td className="py-3 px-4 text-gray-900 rounded-l-xl">Total</td>
                  <td className="py-3 px-4 text-right text-blue-800">{formatCurrency(bankTotals?.collections || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-800">{formatCurrency(bankTotals?.extra_income || 0)}</td>
                  <td className="py-3 px-4 text-right text-orange-800">{formatCurrency(bankTotals?.isp_payments || 0)}</td>
                  <td className="py-3 px-4 text-right text-red-800">{formatCurrency(bankTotals?.expenses || 0)}</td>
                  <td className={`py-3 px-4 text-right ${
                    (bankTotals?.net_flow || 0) >= 0 ? "text-emerald-800" : "text-red-800"
                  }`}>
                    {formatCurrency(bankTotals?.net_flow || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-800">{formatCurrency(bankTotals?.initial_balance || 0)}</td>
                  <td className={`py-3 px-4 text-right ${
                    (bankTotals?.adjusted_balance || 0) >= 0 ? "text-indigo-800" : "text-red-800"
                  }`}>
                    {formatCurrency(bankTotals?.adjusted_balance || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 rounded-r-xl">
                    {formatPercent(
                      data.length > 0 ? data.reduce((sum, row) => sum + (row.utilization_rate || 0), 0) / data.length : 0,
                    )}
                  </td>
                </motion.tr>
              )}

              {(!data || data.length === 0) && !cashPayments && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1m4 0h-4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">No bank performance data available</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}