import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LineChart, Line } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

interface ServicePlanData {
  servicePlanPerformanceData: Array<{
    plan: string;
    subscribers: number;
    revenue: number;
  }>;
  planAdoptionTrendData: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  metrics: {
    totalSubscribers: number;
    totalRevenue: number;
    mostPopularPlan: string;
    highestRevenuePlan: string;
  };
}

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

export const ServicePlanAnalytics: React.FC = () => {
  const [data, setData] = useState<ServicePlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<ServicePlanData>('https://mbanet.com.pk/api/dashboard/service-plan-analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch service plan analytics data');
        setLoading(false);
      }
    };

    fetchData();
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
  
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Service Plan Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.servicePlanPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="plan" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="subscribers" fill="#8884d8" name="Subscribers" />
            <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Plan Adoption Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.planAdoptionTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data.planAdoptionTrendData[0]).filter(key => key !== 'month').map((plan, index) => (
              <Line key={plan} type="monotone" dataKey={plan} stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Service Plan Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Subscribers</h4>
            <p className="text-2xl font-bold">{data.metrics.totalSubscribers.toLocaleString()}</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Revenue</h4>
            <p className="text-2xl font-bold">${data.metrics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Most Popular Plan</h4>
            <p className="text-2xl font-bold">{data.metrics.mostPopularPlan}</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Highest Revenue Plan</h4>
            <p className="text-2xl font-bold">{data.metrics.highestRevenuePlan}</p>
          </div>
        </div>
      </div>
    </div>
  );
};