import React from 'react';
import { Map, ClipboardList } from 'lucide-react';

interface AreaZoneFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export function AreaZoneForm({ formData, handleInputChange, isEditing }: AreaZoneFormProps) {
  return (
    <div className="space-y-6">
      {/* Area/Zone Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Area/Zone Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Map className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="Enter area or zone name"
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
            placeholder="Enter area/zone description"
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

export default AreaZoneForm;