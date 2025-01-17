import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';

const networkPerformanceData = [
  { month: 'Jan', uptime: 99.9, latency: 20 },
  { month: 'Feb', uptime: 99.8, latency: 22 },
  { month: 'Mar', uptime: 99.95, latency: 18 },
  { month: 'Apr', uptime: 99.7, latency: 25 },
  { month: 'May', uptime: 99.85, latency: 21 },
  { month: 'Jun', uptime: 99.9, latency: 19 },
];

const serviceRequestsData = [
  { type: 'Installation', count: 150 },
  { type: 'Repair', count: 100 },
  { type: 'Upgrade', count: 80 },
  { type: 'Cancellation', count: 30 },
  { type: 'Billing Inquiry', count: 120 },
];

export const OperationalMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Network Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={networkPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#8884d8" name="Uptime %" />
            <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#82ca9d" name="Latency (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Service Requests</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={serviceRequestsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="col-span-2 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Operational Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#89A8B2] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Average Uptime</h4>
            <p className="text-2xl font-bold">99.85%</p>
          </div>
          <div className="bg-[#B3C8CF] p-4 rounded-lg text-white">
            <h4 className="text-sm font-medium">Average Latency</h4>
            <p className="text-2xl font-bold">20.8 ms</p>
          </div>
          <div className="bg-[#E5E1DA] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Total Service Requests</h4>
            <p className="text-2xl font-bold">480</p>
          </div>
          <div className="bg-[#F1F0E8] p-4 rounded-lg">
            <h4 className="text-sm font-medium">Avg. Resolution Time</h4>
            <p className="text-2xl font-bold">4.5 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

