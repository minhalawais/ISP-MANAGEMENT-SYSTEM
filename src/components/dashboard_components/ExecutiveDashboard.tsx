import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4" /> {/* Title skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg bg-gray-100">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" /> {/* Stat title skeleton */}
          <div className="h-8 w-16 bg-gray-200 rounded" /> {/* Stat value skeleton */}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
      </div>
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded mb-2" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
      </div>
    </div>
  </div>
);

export const ExecutiveSummary: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('http://mbanet.com.pk/api/dashboard/executive-summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <LoadingSkeleton />
    </section>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      Error: {error}
    </div>
  );
  
  if (!dashboardData) return null;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Customer Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.customer_growth_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Active Service Plans Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.service_plan_data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.service_plan_data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Total Active Customers</h4>
          <p className="text-2xl font-bold text-blue-900">{dashboardData.total_active_customers}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Monthly Recurring Revenue</h4>
          <p className="text-2xl font-bold text-green-900">PKR{dashboardData.monthly_recurring_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800">Outstanding Payments</h4>
          <p className="text-2xl font-bold text-yellow-900">PKR{dashboardData.outstanding_payments.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-red-800">Active Complaints</h4>
          <p className="text-2xl font-bold text-red-900">{dashboardData.active_complaints}</p>
        </div>
      </div>
    </section>
  );
};