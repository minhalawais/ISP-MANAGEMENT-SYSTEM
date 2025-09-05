import React from 'react';

interface ServicePlanFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
}

export function ServicePlanForm({ formData, handleInputChange, isEditing }: ServicePlanFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name || ''}
        onChange={handleInputChange}
        placeholder="Plan Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
        placeholder="Description"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="speed_mbps"
        value={formData.speed_mbps || ''}
        onChange={handleInputChange}
        placeholder="Speed (Mbps)"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="data_cap_gb"
        value={formData.data_cap_gb || ''}
        onChange={handleInputChange}
        placeholder="Data Cap (GB)"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="price"
        value={formData.price || ''}
        onChange={handleInputChange}
        placeholder="Price"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
    </div>
  );
}
