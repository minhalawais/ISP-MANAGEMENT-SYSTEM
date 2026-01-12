"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"

interface RevenueExpenseData {
  monthly_comparison: Array<{
    month: string
    revenue: number
    extra_income: number
    expenses: number
    isp_expenses: number
    business_expenses: number
    ratio: number
  }>
  total_revenue: number
  total_extra_income: number
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
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg backdrop-blur-sm">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  PKR {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  }

  const netProfit = data.total_revenue + data.total_extra_income - data.total_expenses

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Revenue vs Expenses</h3>
        <p className="text-gray-600">
          Monthly comparison of revenue generated versus operational costs
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
      >
        {[
          { label: "Total Revenue", value: data.total_revenue, color: "green" },
          { label: "Total Extra Income", value: data.total_extra_income, color: "emerald" },
          { 
            label: "Total Expenses", 
            value: data.total_expenses, 
            color: "red",
            breakdown: [
              { label: "ISP", value: data.total_isp_expenses, color: "red" },
              { label: "Business", value: data.total_business_expenses, color: "orange" }
            ]
          },
          { label: "Net Profit", value: netProfit, color: "blue" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4 backdrop-blur-sm bg-white/90 hover:shadow-lg transition-all duration-300`}
          >
            <p className={`text-sm font-semibold text-${stat.color}-700 mb-2`}>{stat.label}</p>
            <p className={`text-lg font-bold text-${stat.color}-800 mb-2`}>
              {stat.isPercentage ? `${stat.value.toFixed(1)}%` : `PKR ${stat.value.toLocaleString()}`}
            </p>
            {stat.breakdown && (
              <div className="space-y-1">
                {stat.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className={`text-${item.color}-600`}>{item.label}:</span>
                    <span className={`font-semibold text-${item.color}-700`}>
                      PKR {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data.monthly_comparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="revenue" 
                fill="#10b981" 
                name="Revenue" 
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar 
                yAxisId="left" 
                dataKey="extra_income" 
                fill="#34d399" 
                name="Extra Income" 
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar 
                yAxisId="left" 
                dataKey="isp_expenses" 
                fill="#ef4444" 
                name="ISP Expenses" 
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                yAxisId="left"
                dataKey="business_expenses"
                fill="#f97316"
                name="Business Expenses"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ratio"
                stroke="#7c3aed"
                strokeWidth={3}
                name="Expense Ratio (%)"
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Breakdown */}
      <motion.div variants={itemVariants}>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Monthly Breakdown</h4>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-l-xl">Month</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Extra Income</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">ISP Expenses</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Business Expenses</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Expenses</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Net</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-r-xl">Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.monthly_comparison.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 rounded-l-xl">{item.month}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                      PKR {item.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">
                      PKR {item.extra_income.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-700">
                      PKR {item.isp_expenses.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-700">
                      PKR {item.business_expenses.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-700">
                      PKR {item.expenses.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                      PKR {(item.revenue + item.extra_income - item.expenses).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-purple-700 rounded-r-xl">
                      {item.ratio.toFixed(1)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}