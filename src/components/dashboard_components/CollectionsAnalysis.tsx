"use client"

import type React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CollectionsData {
  aging_analysis: Array<{
    bucket: string
    amount: number
  }>
  collection_trends: Array<{
    month: string
    payment_count: number
    collection_amount: number
  }>
  total_outstanding: number
}

interface CollectionsAnalysisProps {
  data: CollectionsData
}

export const CollectionsAnalysis: React.FC<CollectionsAnalysisProps> = ({ data }) => {
  const COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes("Count") ? entry.value : `PKR ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Collections Analysis</h3>
      <p className="text-gray-600 text-sm mb-6">Aging analysis and collection performance</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aging Analysis */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Aging Analysis</h4>
          <div className="space-y-3">
            {data.aging_analysis.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.bucket} days</span>
                <span className="text-sm font-bold text-gray-900">PKR {item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-sm font-medium text-red-700">Total Outstanding</span>
              <span className="text-sm font-bold text-red-800">PKR {data.total_outstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Collection Trends */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Collection Trends</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.collection_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="collection_amount" fill="#3b82f6" name="Collection Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
