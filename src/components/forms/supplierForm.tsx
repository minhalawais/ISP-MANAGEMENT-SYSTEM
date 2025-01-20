import React from 'react';
import { Building2, User, Mail, Phone, MapPin } from 'lucide-react';

interface SupplierFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export function SupplierForm({ formData, handleInputChange, isEditing }: SupplierFormProps) {
  return (
    <div className="space-y-6">
      {/* Supplier Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter supplier name"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          />
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Contact Person</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="contact_person"
            value={formData.contact_person || ''}
            onChange={handleInputChange}
            placeholder="Enter contact person name"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder="Enter email address"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="address"
            value={formData.address || ''}
            onChange={handleInputChange}
            placeholder="Enter complete address"
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200 resize-y min-h-[120px]"
          />
        </div>
      </div>
    </div>
  );
}

export default SupplierForm;