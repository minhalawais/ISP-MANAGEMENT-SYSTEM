import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const CustomerAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get('http://127.0.0.1:5000/api/dashboard/customer-analytics', {
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
      <h2 className="text-2xl font-bold mb-4">Customer Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
        <div className="bg-purple-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-800">Customer Acquisition Rate</h4>
          <p className="text-2xl font-bold text-purple-900">{analyticsData.acquisition_rate}%</p>
        </div>
        <div className="bg-indigo-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-800">Customer Churn Rate</h4>
          <p className="text-2xl font-bold text-indigo-900">{analyticsData.churn_rate}%</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800">Average Customer Lifetime Value</h4>
          <p className="text-2xl font-bold text-blue-900">${analyticsData.avg_customer_lifetime_value}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800">Customer Satisfaction Score</h4>
          <p className="text-2xl font-bold text-green-900">{analyticsData.customer_satisfaction_score}/5</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Customer Distribution by Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.customer_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="customers" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Service Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.service_plan_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.service_plan_distribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};