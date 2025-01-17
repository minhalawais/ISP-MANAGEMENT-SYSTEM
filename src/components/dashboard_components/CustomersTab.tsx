import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./Card.tsx"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./Chart.tsx"
import { ResponsiveContainer, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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

export default function CustomersTab() {
  const [data, setData] = useState<CustomersData | null>(null)

  useEffect(() => {
    fetch('http://localhost:5000/apidashboard/customers')
      .then(response => response.json())
      .then(data => setData(data))
  }, [])

  if (!data) return <div>Loading...</div>

  return (
    <div className="space-y-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Distribution by Service Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            Basic: {
              label: "Basic Plan",
              color: "hsl(var(--chart-1))",
            },
            Standard: {
              label: "Standard Plan",
              color: "hsl(var(--chart-2))",
            },
            Premium: {
              label: "Premium Plan",
              color: "hsl(var(--chart-3))",
            },
          }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.servicePlanDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Customer Complaints</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            complaints: {
              label: "Total Complaints",
              color: "hsl(var(--chart-1))",
            },
            resolved: {
              label: "Resolved Complaints",
              color: "hsl(var(--chart-2))",
            },
          }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.complaints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="complaints" stroke="#8884d8" name="Total Complaints" />
                <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved Complaints" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

