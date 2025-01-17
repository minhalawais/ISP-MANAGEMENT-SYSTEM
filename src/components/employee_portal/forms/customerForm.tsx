import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';

interface CustomerFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isEditing: boolean;
}

interface Area {
  id: string;
  name: string;
}

interface ServicePlan {
  id: string;
  name: string;
}

export function CustomerForm({ formData, handleInputChange, handleFileChange, handleSubmit, isEditing }: CustomerFormProps) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      try {
        const [areasResponse, servicePlansResponse] = await Promise.all([
          axiosInstance.get('http://127.0.0.1:5000/areas/list', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axiosInstance.get('http://127.0.0.1:5000/service-plans/list', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAreas(areasResponse.data);
        setServicePlans(servicePlansResponse.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <input
        type="text"
        name="first_name"
        value={formData.first_name || ''}
        onChange={handleInputChange}
        placeholder="First Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="last_name"
        value={formData.last_name || ''}
        onChange={handleInputChange}
        placeholder="Last Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="email"
        name="email"
        value={formData.email || ''}
        onChange={handleInputChange}
        placeholder="Email"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="installation_address"
        value={formData.installation_address || ''}
        onChange={handleInputChange}
        placeholder="Installation Address"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="date"
        name="installation_date"
        value={formData.installation_date || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <select
        name="area_id"
        value={formData.area_id || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Area</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
      <select
        name="service_plan_id"
        value={formData.service_plan_id || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Service Plan</option>
        {servicePlans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="cnic"
        value={formData.cnic || ''}
        onChange={handleInputChange}
        placeholder="CNIC"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <div>
        <label htmlFor="cnic_image" className="block text-sm font-medium text-gray-700">
          CNIC Image
        </label>
        <input
          type="file"
          name="cnic_image"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          accept=".png,.jpg,.jpeg"
        />
      </div>
    </form>
  );
}