"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar
} from "recharts"

interface ProfitabilityData {
  monthly_trends: Array<{
    month: string
    potential_profit: number
    realized_profit: number
    leakage: number
  }>
  total_potential_profit: number
  total_realized_profit: number
  total_leakage: number
}

interface Props {
  data: ProfitabilityData
}

export const ProfitabilityAnalysis: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number) => `PKR ${(val || 0).toLocaleString()}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Profitability & Leakage</h3>
          <p className="text-sm text-gray-500">Realized vs Potential Profit</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Total Leakage</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(data?.total_leakage)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Realized Profit</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(data?.total_realized_profit)}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full bg-gray-50 rounded-lg p-4 border border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data?.monthly_trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            
            {/* Leakage Area (Behind) */}
            <Area
              type="monotone"
              dataKey="leakage"
              name="Leakage (Lost)"
              fill="#fecaca"
              stroke="none"
              fillOpacity={0.6}
            />

            {/* Lines */}
            <Line
              type="monotone"
              dataKey="potential_profit"
              name="Potential Profit"
              stroke="#9333ea"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#9333ea" }}
            />
            <Line
              type="monotone"
              dataKey="realized_profit"
              name="Realized Profit"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4, fill: "#16a34a" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex items-start gap-3">
        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-yellow-800">
          <strong>Insight:</strong> You have lost <strong>{formatCurrency(data?.total_leakage)}</strong> in potential profit this period due to uncollected invoices. Focus on recovery to close the gap between the purple and green lines.
        </p>
      </div>
    </motion.div>
  )
}
