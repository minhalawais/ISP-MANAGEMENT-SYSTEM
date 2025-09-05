import React from 'react';

interface SupplierFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
}

export function SupplierForm({ formData, handleInputChange, isEditing }: SupplierFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name || ''}
        onChange={handleInputChange}
        placeholder="Supplier Name"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="contact_person"
        value={formData.contact_person || ''}
        onChange={handleInputChange}
        placeholder="Contact Person"
        className="w-full p-2 border border-gray-300 rounded-md"
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
        type="tel"
        name="phone"
        value={formData.phone || ''}
        onChange={handleInputChange}
        placeholder="Phone"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <textarea
        name="address"
        value={formData.address || ''}
        onChange={handleInputChange}
        placeholder="Address"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
    </div>
  );
}

