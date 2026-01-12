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
  Area
} from "recharts"

interface TrendItem {
  month: string
  invoiced: number
  collected: number
  spent: number
}

interface Props {
  data: TrendItem[]
}

export const ThreeLineTrend: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number) => `PKR ${(val || 0).toLocaleString()}`

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-semibold text-gray-800 text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-xs text-gray-500 w-24">{entry.name}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col"
    >
      <div className="mb-6">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Financial Health Trend</h3>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg">Performance</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">Comparision: Invoiced (Potential) vs Collected (Real) vs Spent (Burn)</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(val) => `PKR ${(val/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} iconType="circle" />
            
            {/* Invoiced - The Potential */}
            <Line
              type="monotone"
              dataKey="invoiced"
              name="Invoiced"
              stroke="#818cf8" // Indigo-400
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4 }}
            />
            
            {/* Collected - The Reality */}
            <Line
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#10b981" // Emerald-500
              strokeWidth={3}
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: "#d1fae5", strokeWidth: 4 }}
            />
            
            {/* Spent - The Burn */}
            <Line
              type="monotone"
              dataKey="spent"
              name="Total Spent"
              stroke="#ef4444" // Red-500
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#fee2e2", strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <div>
            <p className="text-xs text-gray-500 leading-relaxed">
                The space between the <span className="text-emerald-600 font-bold">Green Line</span> (Collected) and <span className="text-red-500 font-bold">Red Line</span> (Spent) represents your <span className="font-semibold text-gray-900">Net Cash Flow</span>. Keep the Green line well above the Red line to ensure healthy operations.
            </p>
        </div>
      </div>
    </motion.div>
  )
}
