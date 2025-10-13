"use client"

import type React from "react"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"

interface RevenueExpenseData {
  monthly_comparison: Array<{
    month: string
    revenue: number
    extra_income: number // NEW
    expenses: number
    isp_expenses: number
    business_expenses: number
    ratio: number
  }>
  total_revenue: number
  total_extra_income: number // NEW
  total_expenses: number
  total_isp_expenses: number
  total_business_expenses: number
  average_ratio: number
}

interface RevenueExpenseComparisonProps {
  data: RevenueExpenseData
}

export const RevenueExpenseComparison: React.FC<RevenueExpenseComparisonProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: PKR {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Revenue vs Expenses</h3>
      <p className="text-gray-600 text-sm mb-6">Monthly comparison of revenue generated versus operational costs</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-lg font-bold text-green-800">PKR {data.total_revenue.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 bg-emerald-50 rounded-lg">
          <p className="text-sm text-emerald-700 font-medium">Total Extra Income</p>
          <p className="text-lg font-bold text-emerald-800">PKR {data.total_extra_income.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-lg font-bold text-red-800">PKR {data.total_expenses.toLocaleString()}</p>
          <div className="text-xs text-red-600 mt-1">ISP: PKR {data.total_isp_expenses.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">
            Business: PKR {data.total_business_expenses.toLocaleString()}
          </div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Net Profit</p>
          <p className="text-lg font-bold text-blue-800">
            PKR {(data.total_revenue + data.total_extra_income - data.total_expenses).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">Avg Expense Ratio</p>
          <p className="text-lg font-bold text-purple-800">{data.average_ratio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data.monthly_comparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="extra_income" fill="#34d399" name="Extra Income" radius={[4, 4, 0, 0]} />{" "}
            {/* NEW */}
            <Bar yAxisId="left" dataKey="isp_expenses" fill="#ef4444" name="ISP Expenses" radius={[4, 4, 0, 0]} />
            <Bar
              yAxisId="left"
              dataKey="business_expenses"
              fill="#f97316"
              name="Business Expenses"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ratio"
              stroke="#7c3aed"
              strokeWidth={2}
              name="Expense Ratio (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Month</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Revenue</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Extra Income</th> {/* NEW */}
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">ISP Expenses</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Business Expenses</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total Expenses</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Net</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.monthly_comparison.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">{item.month}</td>
                  <td className="px-4 py-2 text-sm text-right text-green-700">PKR {item.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right text-emerald-700">
                    PKR {item.extra_income.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-red-700">
                    PKR {item.isp_expenses.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-orange-700">
                    PKR {item.business_expenses.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-red-700">PKR {item.expenses.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right text-blue-700">
                    PKR {(item.revenue + item.extra_income - item.expenses).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-purple-700">{item.ratio.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
