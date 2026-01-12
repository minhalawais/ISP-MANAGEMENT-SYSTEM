"use client"

import type React from "react"

interface PaymentTypeItem {
  type: string
  total_amount: number
  avg_amount: number
  payment_count: number
}

interface BankAccountBreakdownItem {
  bank_name: string
  account_number: string
  total_amount: number
  avg_amount: number
  payment_count: number
}

interface BandwidthItem {
  month: string
  total_cost: number
  total_usage: number
  cost_per_gb: number
}

interface ISPPaymentAnalysisData {
  payment_types: PaymentTypeItem[]
  bank_account_breakdown: BankAccountBreakdownItem[]
  bandwidth_analysis: BandwidthItem[]
  total_isp_payments: number
}

interface Props {
  data: ISPPaymentAnalysisData
}

const formatCurrency = (v: number) => `PKR ${Math.round(v).toLocaleString()}`
const formatNumber = (v: number) => (v ?? 0).toLocaleString()
const formatRate = (v: number) => `${(v ?? 0).toFixed(2)}`

export const ISPPaymentAnalysis: React.FC<Props> = ({ data }) => {
  const totalPayments = data.total_isp_payments || 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">ISP Payment Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">Overview of ISP payment types, bank accounts, and bandwidth cost trends</p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-xs font-medium text-orange-700">Total ISP Payments</div>
          <div className="text-lg font-bold text-orange-800">{formatCurrency(totalPayments)}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Payment Types</div>
          <div className="text-lg font-bold text-blue-800">{formatNumber(data.payment_types?.length || 0)}</div>
        </div>
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="text-xs font-medium text-green-700">Bank Accounts</div>
          <div className="text-lg font-bold text-green-800">{formatNumber(data.bank_account_breakdown?.length || 0)}</div>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="text-xs font-medium text-purple-700">Bandwidth Months</div>
          <div className="text-lg font-bold text-purple-800">{formatNumber(data.bandwidth_analysis?.length || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Types */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Payments by Type</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.payment_types?.map((row, idx) => {
                  const percentage = totalPayments > 0 ? (row.total_amount / totalPayments) * 100 : 0
                  return (
                    <tr key={`${row.type}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="capitalize text-sm font-medium">{row.type?.replaceAll("_", " ")}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.total_amount || 0)}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </td>
                      <td className="py-2 pl-3">{formatNumber(row.payment_count || 0)}</td>
                    </tr>
                  )
                })}
                {(!data.payment_types || data.payment_types.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No ISP payment type data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Account Breakdown */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">By Bank Account</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Bank</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.bank_account_breakdown?.map((row, idx) => {
                  const bankTotal = data.bank_account_breakdown?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 1
                  const percentage = (row.total_amount / bankTotal) * 100
                  return (
                    <tr key={`${row.bank_name}-${row.account_number}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{row.bank_name}</div>
                        <div className="text-xs text-gray-500">{row.account_number}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.total_amount || 0)}</div>
                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                      </td>
                      <td className="py-2 pl-3">{formatNumber(row.payment_count || 0)}</td>
                    </tr>
                  )
                })}
                {(!data.bank_account_breakdown || data.bank_account_breakdown.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No bank account data for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bandwidth Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Bandwidth Cost Analysis</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600 sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 px-3">Cost</th>
                  <th className="py-2 pl-3">PKR/GB</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.bandwidth_analysis?.map((row, idx) => {
                  const maxCost = Math.max(...(data.bandwidth_analysis?.map(b => b.total_cost) || [1]))
                  const percentage = maxCost > 0 ? (row.total_cost / maxCost) * 100 : 0
                  return (
                    <tr key={`${row.month}-${idx}`} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div>{row.month}</div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div>{formatCurrency(row.total_cost || 0)}</div>
                        <div className="text-xs text-gray-500">{formatRate(row.total_usage || 0)} GB</div>
                      </td>
                      <td className="py-2 pl-3">{formatRate(row.cost_per_gb || 0)}</td>
                    </tr>
                  )
                })}
                {(!data.bandwidth_analysis || data.bandwidth_analysis.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No bandwidth analysis data for the selected filters.
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
