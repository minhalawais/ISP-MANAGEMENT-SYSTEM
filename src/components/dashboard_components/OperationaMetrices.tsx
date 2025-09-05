"use client"

import type React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BarChart, Bar } from "recharts"

const networkPerformanceData = [
  { month: "Jan", uptime: 99.9, latency: 20 },
  { month: "Feb", uptime: 99.8, latency: 22 },
  { month: "Mar", uptime: 99.95, latency: 18 },
  { month: "Apr", uptime: 99.7, latency: 25 },
  { month: "May", uptime: 99.85, latency: 21 },
  { month: "Jun", uptime: 99.9, latency: 19 },
]

const serviceRequestsData = [
  { type: "Installation", count: 150 },
  { type: "Repair", count: 100 },
  { type: "Upgrade", count: 80 },
  { type: "Cancellation", count: 30 },
  { type: "Billing Inquiry", count: 120 },
]

export const OperationalMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Network Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={networkPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
            <XAxis dataKey="month" tick={{ fill: "#4A5568" }} />
            <YAxis yAxisId="left" orientation="left" stroke="#10B981" tick={{ fill: "#4A5568" }} />
            <YAxis yAxisId="right" orientation="right" stroke="#3A86FF" tick={{ fill: "#4A5568" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderColor: "#EBF5FF",
                borderRadius: "0.375rem",
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="uptime"
              stroke="#10B981"
              name="Uptime %"
              strokeWidth={2}
              dot={{ fill: "#10B981", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="latency"
              stroke="#3A86FF"
              name="Latency (ms)"
              strokeWidth={2}
              dot={{ fill: "#3A86FF", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Service Requests</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={serviceRequestsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
            <XAxis dataKey="type" tick={{ fill: "#4A5568" }} />
            <YAxis tick={{ fill: "#4A5568" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderColor: "#EBF5FF",
                borderRadius: "0.375rem",
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#7C3AED" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-[#2A5C8A]">Operational Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Average Uptime</h4>
            <p className="text-2xl font-bold text-[#10B981]">99.85%</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Average Latency</h4>
            <p className="text-2xl font-bold text-[#3A86FF]">20.8 ms</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Total Service Requests</h4>
            <p className="text-2xl font-bold text-[#7C3AED]">480</p>
          </div>
          <div className="bg-[#EBF5FF] p-4 rounded-lg">
            <h4 className="text-sm font-medium text-[#2A5C8A]">Avg. Resolution Time</h4>
            <p className="text-2xl font-bold text-[#F59E0B]">4.5 hours</p>
          </div>
        </div>
      </div>
    </div>
  )
}
