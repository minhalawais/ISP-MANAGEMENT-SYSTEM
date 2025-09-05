"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./Card.tsx"
import { ChartContainer, ChartTooltipContent } from "./Chart.tsx"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import axios from "axios"
import axiosInstance from "../../utils/axiosConfig.ts"

interface CustomersData {
  servicePlanDistribution: Array<{
    name: string
    value: number
  }>
  complaints: Array<{
    month: string
    complaints: number
    resolved: number
  }>
}

const COLORS = ["#3A86FF", "#10B981", "#F59E0B", "#7C3AED"]

export default function CustomersTab() {
  const [data, setData] = useState<CustomersData | null>(null)

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/customers")
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch customers", error)
      }
    }
  
    getData()
  }, [])
  

  if (!data) return <div className="p-4 text-[#4A5568]">Loading...</div>

  return (
    <div className="space-y-4 mb-6">
      <Card className="border border-[#EBF5FF] shadow-sm">
        <CardHeader className="border-b border-[#EBF5FF] bg-[#F8FAFC]">
          <CardTitle className="text-[#2A5C8A]">Customer Distribution by Service Plan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer
            config={{
              Basic: {
                label: "Basic Plan",
                color: "#3A86FF",
              },
              Standard: {
                label: "Standard Plan",
                color: "#10B981",
              },
              Premium: {
                label: "Premium Plan",
                color: "#7C3AED",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.servicePlanDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.servicePlanDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border border-[#EBF5FF] shadow-sm">
        <CardHeader className="border-b border-[#EBF5FF] bg-[#F8FAFC]">
          <CardTitle className="text-[#2A5C8A]">Customer Complaints</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer
            config={{
              complaints: {
                label: "Total Complaints",
                color: "#EF4444",
              },
              resolved: {
                label: "Resolved Complaints",
                color: "#10B981",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.complaints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF5FF" />
                <XAxis dataKey="month" tick={{ fill: "#4A5568" }} />
                <YAxis tick={{ fill: "#4A5568" }} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="complaints"
                  stroke="#EF4444"
                  name="Total Complaints"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10B981"
                  name="Resolved Complaints"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
