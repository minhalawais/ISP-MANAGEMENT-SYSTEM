"use client"

import type React from "react"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"

interface CashFlowData {
  monthly_trends: Array<{
    month: string
    inflow: number
    outflow: number
    net_flow: number
  }>
  inflow_breakdown: Array<{
    method: string
    amount: number
  }>
  outflow_breakdown: Array<{
    type: string
    amount: number
  }>
}

interface CashFlowAnalysisProps {
  data: CashFlowData
}

export const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ data }) => {
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
      <h3 className="text-xl font-bold text-gray-900 mb-2">Cash Flow Analysis</h3>
      <p className="text-gray-600 text-sm mb-6">Monthly cash inflows, outflows, and net position</p>

      {/* Cash Flow Trends */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow Trends</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.monthly_trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="inflow"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              name="Inflow"
            />
            <Area
              type="monotone"
              dataKey="outflow"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Outflow"
            />
            <Line type="monotone" dataKey="net_flow" stroke="#3b82f6" strokeWidth={2} name="Net Flow" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inflow Breakdown */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Inflow by Method</h4>
          <div className="space-y-3">
            {data.inflow_breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.method}</span>
                <span className="text-sm font-bold text-green-600">PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outflow Breakdown */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Outflow by Type</h4>
          <div className="space-y-3">
            {data.outflow_breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.type}</span>
                <span className="text-sm font-bold text-red-600">PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
