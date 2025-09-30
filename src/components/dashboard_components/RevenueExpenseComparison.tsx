"use client"

import type React from "react"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"

interface RevenueExpenseData {
  monthly_comparison: Array<{
    month: string
    revenue: number
    expenses: number
    ratio: number
  }>
  total_revenue: number
  total_expenses: number
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
              {entry.name}:{" "}
              {entry.name.includes("Ratio") ? `${entry.value.toFixed(1)}%` : `PKR ${entry.value.toLocaleString()}`}
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
      <p className="text-gray-600 text-sm mb-6">Monthly comparison and expense ratio analysis</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-lg font-bold text-green-800">PKR {data.total_revenue.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-lg font-bold text-red-800">PKR {data.total_expenses.toLocaleString()}</p>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Avg Expense Ratio</p>
          <p className="text-lg font-bold text-blue-800">{data.average_ratio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Comparison Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data.monthly_comparison}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
          <Bar yAxisId="left" dataKey="expenses" fill="#ef4444" name="Expenses" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="ratio"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Expense Ratio %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
