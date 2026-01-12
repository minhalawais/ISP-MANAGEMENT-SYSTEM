"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts"

interface WaterfallItem {
  category: string
  amount: number
  type: 'positive' | 'negative' | 'subtotal' | 'total'
}

interface Props {
  data: WaterfallItem[]
}

export const FinancialWaterfall: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number) => `PKR ${(val || 0).toLocaleString()}`

  const chartData = data.map(item => {
    // Coloring logic
    let fill = '#9ca3af' // Default gray
    if (item.category.includes('Invoiced')) fill = '#6366f1' // Indigo-500
    else if (item.category.includes('Leakage')) fill = '#ef4444' // Red-500
    else if (item.category.includes('Collected')) fill = '#10b981' // Emerald-500
    else if (item.category.includes('Extra')) fill = '#06b6d4' // Cyan-500
    else if (item.category.includes('ISP')) fill = '#f97316' // Orange-500
    else if (item.category.includes('OpEx')) fill = '#f43f5e' // Rose-500
    else if (item.category.includes('Net')) fill = '#f59e0b' // Amber-500
    
    return { ...item, fill }
  })

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Financial Waterfall</h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">Cash Flow</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">From Potential Revenue to Final Net Cash</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis 
                dataKey="category" 
                tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }} 
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
                tick={{ fontSize: 11, fill: "#9ca3af" }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `PKR ${(val/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', opacity: 0.5 }} />
            <ReferenceLine y={0} stroke="#d1d5db" />
            <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
