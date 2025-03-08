import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

interface RecoveryPerformanceData {
  month: string;
  recovered: number;
  outstanding: number;
}

interface OutstandingByAgeData {
  name: string;
  value: number;
}

interface RecoveryMetrics {
  totalRecovered: number;
  totalOutstanding: number;
  recoveryRate: number;
  avgCollectionTime: number;
}

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

export const RecoveryCollections: React.FC = () => {
  const [recoveryPerformanceData, setRecoveryPerformanceData] = useState<RecoveryPerformanceData[]>([]);
  const [outstandingByAgeData, setOutstandingByAgeData] = useState<OutstandingByAgeData[]>([]);
  const [metrics, setMetrics] = useState<RecoveryMetrics>({
    totalRecovered: 0,
    totalOutstanding: 0,
    recoveryRate: 0,
    avgCollectionTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('http://127.0.0.1:5000/dashboard/recovery-collections', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setRecoveryPerformanceData(response.data.recoveryPerformanceData);
        setOutstandingByAgeData(response.data.outstandingByAgeData);
        setMetrics(response.data.metrics);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch recovery and collections data');
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

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recovery Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={recoveryPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="recovered" fill="#8884d8" name="Recovered Amount" />
            <Bar dataKey="outstanding" fill="#82ca9d" name="Outstanding Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Outstanding by Age</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={outstandingByAgeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {outstandingByAgeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recovery & Collections Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Recovered</h4>
            <p className="text-2xl font-bold">PKR{metrics.totalRecovered.toLocaleString()}</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Total Outstanding</h4>
            <p className="text-2xl font-bold">PKR{metrics.totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Recovery Rate</h4>
            <p className="text-2xl font-bold">{metrics.recoveryRate.toFixed(2)}%</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Avg. Collection Time</h4>
            <p className="text-2xl font-bold">{metrics.avgCollectionTime} days</p>
          </div>
        </div>
      </div>
    </div>
  );
};