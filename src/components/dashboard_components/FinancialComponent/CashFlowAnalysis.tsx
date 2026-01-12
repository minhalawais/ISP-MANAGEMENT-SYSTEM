"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"

interface CashFlowData {
  monthly_trends: Array<{
    month: string
    inflow: number
    outflow: number
    isp_outflow: number
    expense_outflow: number
    net_flow: number
    adjusted_flow: number
  }>
  inflow_breakdown: Array<{
    method: string
    amount: number
  }>
  outflow_breakdown: Array<{
    type: string
    amount: number
  }>
  initial_balance?: number
  total_adjusted_flow?: number
}

interface CashFlowAnalysisProps {
  data: CashFlowData
}

export const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({ data }) => {
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

  const totalInflow = data.inflow_breakdown.reduce((sum, item) => sum + item.amount, 0)
  const totalOutflow = data.monthly_trends.reduce((sum, item) => sum + item.outflow, 0)
  const totalISPOutflow = data.monthly_trends.reduce((sum, item) => sum + item.isp_outflow, 0)
  const totalExpenseOutflow = data.monthly_trends.reduce((sum, item) => sum + item.expense_outflow, 0)

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Cash Flow Analysis</h3>
        <p className="text-gray-600">
          Monthly cash inflows, outflows, and net position including initial balances
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { 
            label: "Total Inflow", 
            value: totalInflow, 
            color: "green",
            subtitle: null
          },
          { 
            label: "Total Outflow", 
            value: totalOutflow, 
            color: "red",
            subtitle: [
              { label: "ISP", value: totalISPOutflow, color: "red" },
              { label: "Expenses", value: totalExpenseOutflow, color: "orange" }
            ]
          },
          { 
            label: "Initial Balance", 
            value: data.initial_balance || 0, 
            color: "purple",
            subtitle: null
          },
          { 
            label: "Adjusted Flow", 
            value: data.total_adjusted_flow || 0, 
            color: "blue",
            subtitle: null
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-4 backdrop-blur-sm bg-white/90 hover:shadow-lg transition-all duration-300`}
          >
            <p className={`text-sm font-semibold text-${stat.color}-700 mb-2`}>{stat.label}</p>
            <p className={`text-xl font-bold text-${stat.color}-800 mb-2`}>
              PKR {stat.value.toLocaleString()}
            </p>
            {stat.subtitle && (
              <div className="space-y-1">
                {stat.subtitle.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className={`text-${sub.color}-600`}>{sub.label}:</span>
                    <span className={`font-semibold text-${sub.color}-700`}>
                      PKR {sub.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Cash Flow Trends */}
      <motion.div variants={itemVariants} className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow Trends</h4>
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
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
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="isp_outflow"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="ISP Payments"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="expense_outflow"
                stackId="2"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.6}
                name="Business Expenses"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="net_flow" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                name="Net Flow" 
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="adjusted_flow" 
                stroke="#7c3aed" 
                strokeWidth={3} 
                name="Adjusted Flow" 
                strokeDasharray="5 5"
                dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Breakdown Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflow Breakdown */}
        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Inflow by Method</h4>
          <div className="space-y-3">
            {data.inflow_breakdown.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <span className="text-sm font-medium text-gray-700">{item.method}</span>
                <span className="text-sm font-bold text-green-700">
                  PKR {item.amount.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Outflow Breakdown */}
        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Outflow by Type</h4>
          <div className="space-y-3">
            {data.outflow_breakdown.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <span className="text-sm font-medium text-gray-700">{item.type}</span>
                <span className="text-sm font-bold text-red-700">
                  PKR {item.amount.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}