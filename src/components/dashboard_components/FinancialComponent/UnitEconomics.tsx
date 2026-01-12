"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts"

interface UnitEconomicsData {
  monthly_economics: Array<{
    month: string
    active_users: number
    arpu: number
    acpu: number
    margin: number
  }>
  avg_arpu: number
  avg_acpu: number
}

interface Props {
  data: UnitEconomicsData
}

export const UnitEconomics: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number) => `PKR ${Math.round(val || 0)}`

  const avgMargin = (data.avg_arpu || 0) - (data.avg_acpu || 0)
  const marginPercent = data.avg_arpu ? (avgMargin / data.avg_arpu) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Unit Economics</h3>
          <p className="text-sm text-gray-500">ARPU vs Cost Per User</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 font-medium">Avg ARPU (Rev)</div>
            <div className="text-lg font-bold text-blue-700">{formatCurrency(data.avg_arpu)}</div>
          </div>
          <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-xs text-red-600 font-medium">Avg ACPU (Cost)</div>
            <div className="text-lg font-bold text-red-700">{formatCurrency(data.avg_acpu)}</div>
          </div>
          <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xs text-green-600 font-medium">Avg Margin</div>
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(avgMargin)} <span className="text-xs text-green-500">({marginPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full bg-gray-50 rounded-lg p-4 border border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data?.monthly_economics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            
            <Line
              type="monotone"
              dataKey="arpu"
              name="ARPU (Revenue)"
              stroke="#2563eb"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="acpu"
              name="ACPU (Cost)"
              stroke="#ef4444"
              strokeWidth={3}
            />
             <Line
              type="monotone"
              dataKey="margin"
              name="Net Margin"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
