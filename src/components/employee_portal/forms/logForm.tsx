import React from 'react';

interface LogFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export function LogForm({ formData, handleInputChange, isEditing }: LogFormProps) {
  return (
    <div className="mt-2 space-y-6">
      <input
        type="text"
        name="user_name"
        value={formData.user_name || ''}
        onChange={handleInputChange}
        placeholder="User Name"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
      
      <input
        type="text"
        name="action"
        value={formData.action || ''}
        onChange={handleInputChange}
        placeholder="Action"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
      
      <input
        type="text"
        name="table_name"
        value={formData.table_name || ''}
        onChange={handleInputChange}
        placeholder="Table Name"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
      
      <input
        type="text"
        name="record_id"
        value={formData.record_id || ''}
        onChange={handleInputChange}
        placeholder="Record ID"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
      
      <textarea
        name="old_values"
        value={formData.old_values || ''}
        onChange={handleInputChange}
        placeholder="Old Values"
        className="w-full p-3 min-h-[120px] border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-y"
        disabled={isEditing}
      />
      
      <textarea
        name="new_values"
        value={formData.new_values || ''}
        onChange={handleInputChange}
        placeholder="New Values"
        className="w-full p-3 min-h-[120px] border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-y"
        disabled={isEditing}
      />
      
      <input
        type="text"
        name="ip_address"
        value={formData.ip_address || ''}
        onChange={handleInputChange}
        placeholder="IP Address"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
      
      <input
        type="text"
        name="user_agent"
        value={formData.user_agent || ''}
        onChange={handleInputChange}
        placeholder="User Agent"
        className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
        disabled={isEditing}
      />
    </div>
  );
}

