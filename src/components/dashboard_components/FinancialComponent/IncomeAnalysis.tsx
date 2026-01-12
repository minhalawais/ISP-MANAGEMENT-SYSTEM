"use client"

import type React from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface IncomeMethodItem {
  method: string
  amount: number
  count: number
}

interface IncomeBankItem {
  bank: string
  account: string
  amount: number
  count: number
}

interface IncomePlanItem {
  plan: string
  amount: number
  count: number
}

interface IncomeAnalysisData {
  income_by_method: IncomeMethodItem[]
  income_by_bank: IncomeBankItem[]
  income_by_plan: IncomePlanItem[]
  total_income: number
}

interface Props {
  data: IncomeAnalysisData
}

const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatNumber = (v: number) => (v ?? 0).toLocaleString()

export const IncomeAnalysis: React.FC<Props> = ({ data }) => {
  const totalIncome = data?.total_income || 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Income Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">Breakdown of incoming payments by method, bank account, and service plan source</p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="text-xs font-medium text-green-700">Total Income</div>
          <div className="text-lg font-bold text-green-800">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Payment Methods</div>
          <div className="text-lg font-bold text-blue-800">{formatNumber(data?.income_by_method?.length || 0)}</div>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="text-xs font-medium text-purple-700">Bank Accounts</div>
          <div className="text-lg font-bold text-purple-800">{formatNumber(data?.income_by_bank?.length || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income by Method */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">By Payment Method</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data?.income_by_method?.map((row, idx) => {
                  const percentage = totalIncome > 0 ? (row.amount / totalIncome) * 100 : 0
                  return (
                    <tr key={`${row.method}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="capitalize font-medium">{row.method?.replaceAll("_", " ")}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.amount || 0)}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </td>
                      <td className="py-2 pl-3">{formatNumber(row.count || 0)}</td>
                    </tr>
                  )
                })}
                {(!data?.income_by_method || data.income_by_method.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No income data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Income by Bank Account */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">By Bank Account</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Bank</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data?.income_by_bank?.map((row, idx) => {
                  const percentage = totalIncome > 0 ? (row.amount / totalIncome) * 100 : 0
                  return (
                    <tr key={`${row.bank}-${row.account}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium truncate max-w-[120px]" title={row.bank}>{row.bank}</div>
                        <div className="text-xs text-gray-500">{row.account}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.amount || 0)}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </td>
                      <td className="py-2 pl-3">{formatNumber(row.count || 0)}</td>
                    </tr>
                  )
                })}
                {(!data?.income_by_bank || data.income_by_bank.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No bank data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Income by Service Plan */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Income by Plan</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 px-3">Revenue</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data?.income_by_plan?.map((row, idx) => {
                  const maxAmount = Math.max(...(data.income_by_plan?.map(p => p.amount) || [1]))
                  const percentage = maxAmount > 0 ? (row.amount / maxAmount) * 100 : 0
                  return (
                    <tr key={`${row.plan}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium truncate max-w-[120px]" title={row.plan}>{row.plan}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.amount || 0)}</div>
                      </td>
                      <td className="py-2 pl-3">{formatNumber(row.count || 0)}</td>
                    </tr>
                  )
                })}
                {(!data?.income_by_plan || data.income_by_plan.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No plan data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
