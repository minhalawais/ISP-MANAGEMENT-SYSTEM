import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4" /> {/* Title skeleton */}
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg bg-gray-100">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" /> {/* Stat title skeleton */}
          <div className="h-8 w-16 bg-gray-200 rounded" /> {/* Stat value skeleton */}
        </div>
      ))}
    </div>
  </div>
);

export const FinancialAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get('http://mbanet.com.pk/api/dashboard/financial-analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAnalyticsData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch analytics data');
        setLoading(false);
      }
    };

    fetchAnalyticsData();
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
  
  if (!analyticsData) return null;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Financial Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Monthly Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Revenue by Service Plans</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenue_by_plan}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-green-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Total Revenue</h4>
          <p className="text-2xl font-bold text-green-900">PKR{analyticsData.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Average Revenue per User</h4>
          <p className="text-2xl font-bold text-blue-900">PKR{analyticsData.avg_revenue_per_user.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800">Operating Expenses</h4>
          <p className="text-2xl font-bold text-yellow-900">PKR{analyticsData.operating_expenses.toFixed(2)}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-800">Net Profit Margin</h4>
          <p className="text-2xl font-bold text-purple-900">{analyticsData.net_profit_margin.toFixed(2)}%</p>
        </div>
      </div>
    </section>
  );
};