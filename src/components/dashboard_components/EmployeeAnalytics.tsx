import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
      </div>
    </div>
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" /> {/* Chart title skeleton */}
        <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
      </div>
    </div>
    <div className="col-span-2 bg-white p-4 rounded-lg shadow">
      <div className="animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" /> {/* Metrics title skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-100">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" /> {/* Metric title skeleton */}
              <div className="h-8 w-16 bg-gray-200 rounded" /> {/* Metric value skeleton */}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const EmployeePerformance: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axiosInstance.get('http://147.93.53.119/api/dashboard/employee-analytics', {
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

  if (loading) return <LoadingSkeleton />;
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      Error: {error}
    </div>
  );
  
  if (!analyticsData) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Employee Performance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="employee" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="tasks" fill="#8884d8" name="Tasks Completed" />
            <Bar yAxisId="right" dataKey="satisfaction" fill="#82ca9d" name="Satisfaction Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Productivity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.productivityTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="productivity" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Employee Performance Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Average Tasks Completed</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.avgTasksCompleted}</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Average Satisfaction Score</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.avgSatisfactionScore}</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Top Performer</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.topPerformer}</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Training Completion Rate</h4>
            <p className="text-2xl font-bold">{analyticsData.metrics.trainingCompletionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};