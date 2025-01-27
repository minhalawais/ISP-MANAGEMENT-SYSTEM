import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axiosInstance from '../../utils/axiosConfig.ts';

const LoadingSkeleton = () => (
  <div className="animate-pulse grid grid-cols-2 gap-4 mb-6">
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" /> {/* Chart title skeleton */}
      <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
    </div>
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4" /> {/* Chart title skeleton */}
      <div className="h-[300px] bg-gray-200 rounded" /> {/* Chart skeleton */}
    </div>
    <div className="col-span-2 bg-white p-4 rounded-lg shadow">
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
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ServiceSupport: React.FC = () => {
  const [data, setData] = useState<any>({
    status_distribution: {},
    category_distribution: [],
    priority_distribution: [],
    average_resolution_time: 0,
    customer_satisfaction_rate: 0,
    first_contact_resolution_rate: 0,
    support_ticket_volume: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('http://127.0.0.1:5000/dashboard/service-support', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data && !response.data.error) {
          setData(response.data);
          setLoading(false);
        } else {
          setError(response.data.error || 'Unknown error');
          setLoading(false);
        }
      } catch (error) {
        setError('Failed to fetch service support data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSkeleton />;
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      Error: {error}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Complaint Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={Object.entries(data.status_distribution || {}).map(([name, value]) => ({ name, value }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {Object.entries(data.status_distribution || {}).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Complaints by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.category_distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Service & Support Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Average Resolution Time</h4>
            <p className="text-2xl font-bold">{data.average_resolution_time} hours</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Customer Satisfaction Rate</h4>
            <p className="text-2xl font-bold">{data.customer_satisfaction_rate}%</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">First Contact Resolution Rate</h4>
            <p className="text-2xl font-bold">{data.first_contact_resolution_rate}%</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Support Ticket Volume</h4>
            <p className="text-2xl font-bold">{data.support_ticket_volume}</p>
          </div>
        </div>
      </div>
    </div>
  );
};