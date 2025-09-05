import React from 'react';

interface InventoryFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isEditing: boolean;
  suppliers: { id: string; name: string }[];
}

export function InventoryForm({ formData, handleInputChange, isEditing, suppliers }: InventoryFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name || ''}
        onChange={handleInputChange}
        placeholder="Item Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
        placeholder="Item Description"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <input
        type="text"
        name="serial_number"
        value={formData.serial_number || ''}
        onChange={handleInputChange}
        placeholder="Serial Number"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <select
        name="status"
        value={formData.status || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Status</option>
        <option value="available">Available</option>
        <option value="assigned">Assigned</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <select
        name="supplier_id"
        value={formData.supplier_id || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Supplier</option>
        {suppliers.map(supplier => (
          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
        ))}
      </select>
    </div>
  );
}

