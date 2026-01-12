"use client"

import type React from "react"

interface PaymentTypeItem {
  type: string
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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">ISP Payment Analysis</h3>
      <p className="text-gray-600 text-sm mb-4">Overview of ISP payment types and bandwidth cost trends</p>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="text-xs font-medium text-orange-700">Total ISP Payments</div>
          <div className="text-lg font-bold text-orange-800">{formatCurrency(data.total_isp_payments || 0)}</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Payment Types</div>
          <div className="text-lg font-bold text-blue-800">{formatNumber(data.payment_types?.length || 0)}</div>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="text-xs font-medium text-purple-700">Bandwidth Months</div>
          <div className="text-lg font-bold text-purple-800">{formatNumber(data.bandwidth_analysis?.length || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Types */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Payments by Type</h4>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Average</th>
                  <th className="py-2 pl-3">Count</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.payment_types?.map((row, idx) => (
                  <tr key={`${row.type}-${idx}`} className="border-b border-gray-100">
                    <td className="py-2 pr-3 capitalize">{row.type?.replaceAll("_", " ")}</td>
                    <td className="py-2 px-3">{formatCurrency(row.total_amount || 0)}</td>
                    <td className="py-2 px-3">{formatCurrency(row.avg_amount || 0)}</td>
                    <td className="py-2 pl-3">{formatNumber(row.payment_count || 0)}</td>
                  </tr>
                ))}
                {(!data.payment_types || data.payment_types.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No ISP payment type data for the selected filters.
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
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-3">Month</th>
                  <th className="py-2 px-3">Total Cost</th>
                  <th className="py-2 px-3">Total Usage (GB)</th>
                  <th className="py-2 pl-3">Cost/GB (PKR)</th>
                </tr>
              </thead>
              <tbody className="text-gray-900">
                {data.bandwidth_analysis?.map((row, idx) => (
                  <tr key={`${row.month}-${idx}`} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{row.month}</td>
                    <td className="py-2 px-3">{formatCurrency(row.total_cost || 0)}</td>
                    <td className="py-2 px-3">{formatRate(row.total_usage || 0)}</td>
                    <td className="py-2 pl-3">{formatRate(row.cost_per_gb || 0)}</td>
                  </tr>
                ))}
                {(!data.bandwidth_analysis || data.bandwidth_analysis.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
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
