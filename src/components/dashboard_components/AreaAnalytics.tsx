import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

export const AreaAnalysis: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get('http://127.0.0.1:5000/dashboard/area-analytics', {
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
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Area Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.areaPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="area" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="customers" fill="#8884d8" name="Customers" />
            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Service Plan Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analyticsData.servicePlanDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {analyticsData.servicePlanDistributionData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Area Performance Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Customers</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.totalCustomers.toLocaleString()}</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Revenue</h4>
            <p className="text-2xl font-bold">PKR{analyticsData.metrics.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Best Performing Area</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.bestPerformingArea}</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Avg. Revenue per Customer</h4>
            <p className="text-2xl font-bold">PKR{analyticsData.metrics.avgRevenuePerCustomer.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
      </div>
    </div>
  );
};