import React from 'react';
import { Box, Barcode, ClipboardList, Truck, CheckCircle } from 'lucide-react';

interface InventoryFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isEditing: boolean;
  suppliers: { id: string; name: string }[];
}

export function InventoryForm({ formData, handleInputChange, isEditing, suppliers }: InventoryFormProps) {
  const statusColors = {
    available: 'text-green-600',
    assigned: 'text-blue-600',
    maintenance: 'text-orange-600'
  };

  return (
    <div className="space-y-6">
      {/* Item Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Item Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Box className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter item name"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <ClipboardList className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Enter item description"
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200 resize-y min-h-[120px]"
          />
        </div>
      </div>

      {/* Serial Number */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Serial Number</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Barcode className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="serial_number"
            value={formData.serial_number || ''}
            onChange={handleInputChange}
            placeholder="Enter serial number"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          />
        </div>
      </div>

      {/* Status and Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="status"
              value={formData.status || ''}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 appearance-none
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
              required
            >
              <option value="">Select Status</option>
              <option value="available" className={statusColors.available}>Available</option>
              <option value="assigned" className={statusColors.assigned}>Assigned</option>
              <option value="maintenance" className={statusColors.maintenance}>Maintenance</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Supplier */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Truck className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="supplier_id"
              value={formData.supplier_id || ''}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 appearance-none
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}