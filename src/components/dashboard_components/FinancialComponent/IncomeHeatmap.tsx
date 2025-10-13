"use client"

import React from "react"

interface HeatmapData {
  month: string
  week: string
  value: number
}

interface IncomeHeatmapProps {
  data: HeatmapData[]
  title: string
}

export const IncomeHeatmap: React.FC<IncomeHeatmapProps> = ({ data, title }) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]

  const getColorIntensity = (value: number, maxValue: number) => {
    if (value === 0) return "bg-gray-100"
    const intensity = Math.min(1, value / maxValue)
    if (intensity > 0.7) return "bg-green-600"
    if (intensity > 0.5) return "bg-green-500"
    if (intensity > 0.3) return "bg-green-400"
    if (intensity > 0.1) return "bg-green-300"
    return "bg-green-200"
  }

  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">Income seasonality by month and week</p>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-sm font-medium text-gray-600 text-left">Month/Week</th>
              {weeks.map(week => (
                <th key={week} className="p-2 text-sm font-medium text-gray-600 text-center">{week}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map(month => (
              <tr key={month}>
                <td className="p-2 text-sm font-medium text-gray-700 border-r">{month}</td>
                {weeks.map(week => {
                  const cellData = data.find(d => d.month === month && d.week === week)
                  const value = cellData?.value || 0
                  return (
                    <td key={`${month}-${week}`} className="p-2 border">
                      <div className={`h-8 rounded ${getColorIntensity(value, maxValue)} flex items-center justify-center`}>
                        <span className="text-xs font-medium text-white mix-blend-difference">
                          {value > 0 ? `PKR ${(value/1000).toFixed(0)}K` : ''}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Lower</span>
        <div className="flex space-x-1">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <div className="w-4 h-4 bg-green-300 rounded"></div>
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <div className="w-4 h-4 bg-green-600 rounded"></div>
        </div>
        <span>Higher</span>
      </div>
    </div>
  )
}