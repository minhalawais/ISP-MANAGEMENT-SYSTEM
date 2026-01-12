"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface ExpenseItem {
  category: string
  amount: number
  type: 'isp' | 'expense'
}

interface ExpenseCompositionData {
  composition: ExpenseItem[]
  total_expenses: number
}

interface Props {
  data: ExpenseCompositionData
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e']

export const ExpenseComposition: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number) => `PKR ${(val || 0).toLocaleString()}`
  
  // Group small items into "Other" if there are too many segments
  const processData = () => {
    if (!data?.composition) return []
    const sorted = [...data.composition].sort((a, b) => b.amount - a.amount)
    if (sorted.length <= 8) return sorted
    
    const top8 = sorted.slice(0, 8)
    const others = sorted.slice(8).reduce((sum, item) => sum + item.amount, 0)
    
    return [...top8, { category: 'Other Small Expenses', amount: others, type: 'expense' }]
  }

  const chartData = processData()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-2">Expense Composition</h3>
      <p className="text-sm text-gray-500 mb-6">Breakdown of all operational costs</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="amount"
                nameKey="category"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8 text-xs text-gray-400 font-medium">
             TOTAL
          </div>
        </div>

        <div className="overflow-y-auto max-h-[300px] pr-2">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 text-right font-medium">Amount</th>
                        <th className="pb-2 text-right font-medium">%</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700">
                    {data?.composition?.map((item, idx) => {
                         const pct = data.total_expenses > 0 ? (item.amount / data.total_expenses) * 100 : 0
                         return (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.type === 'isp' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                                        <span className={item.type === 'isp' ? 'font-medium text-red-700' : ''}>{item.category}</span>
                                    </div>
                                </td>
                                <td className="py-2.5 text-right font-medium">{formatCurrency(item.amount)}</td>
                                <td className="py-2.5 text-right text-gray-500">{pct.toFixed(1)}%</td>
                            </tr>
                         )
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </motion.div>
  )
}
