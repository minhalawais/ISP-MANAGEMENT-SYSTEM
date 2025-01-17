import React, { useState, useEffect } from 'react';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';
import { FaSpinner } from 'react-icons/fa';

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
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-purple-600 text-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="Enter email address"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Service Details Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Details</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="installation_address" className="block text-sm font-medium text-gray-700 mb-1">
              Installation Address
            </label>
            <input
              id="installation_address"
              type="text"
              name="installation_address"
              value={formData.installation_address || ''}
              onChange={handleInputChange}
              placeholder="Enter installation address"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700 mb-1">
                Installation Date
              </label>
              <input
                id="installation_date"
                type="date"
                name="installation_date"
                value={formData.installation_date || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="area_id" className="block text-sm font-medium text-gray-700 mb-1">
                Service Area
              </label>
              <select
                id="area_id"
                name="area_id"
                value={formData.area_id || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Area</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="service_plan_id" className="block text-sm font-medium text-gray-700 mb-1">
              Service Plan
            </label>
            <select
              id="service_plan_id"
              name="service_plan_id"
              value={formData.service_plan_id || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select Service Plan</option>
              {servicePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-1">
              CNIC Number
            </label>
            <input
              id="cnic"
              type="text"
              name="cnic"
              value={formData.cnic || ''}
              onChange={handleInputChange}
              placeholder="Enter CNIC number (e.g., 42201-1234567-1)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="cnic_image" className="block text-sm font-medium text-gray-700 mb-1">
              CNIC Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-500 transition-colors">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <input
                    id="cnic_image"
                    name="cnic_image"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
                    accept=".png,.jpg,.jpeg"
                  />
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, or JPEG up to 10MB</p>
              </div>
            </div>
          </div>

          {formData.cnic_image && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current CNIC Image</label>
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={`http://127.0.0.1:5000/customers/cnic-image/${formData.id}`}
                  alt="CNIC"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}