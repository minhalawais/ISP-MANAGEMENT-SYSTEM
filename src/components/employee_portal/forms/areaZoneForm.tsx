import React from 'react';

interface AreaZoneFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export function AreaZoneForm({ formData, handleInputChange, isEditing }: AreaZoneFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name || ''}
        onChange={handleInputChange}
        placeholder="Area/Zone Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
        placeholder="Description"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
    </div>
  );
}

