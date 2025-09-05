import React from 'react';

interface PaymentInvoiceFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
}

export function PaymentInvoiceForm({ formData, handleInputChange, isEditing }: PaymentInvoiceFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <select
        name="payment_type"
        value={formData.payment_type || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Payment Type</option>
        <option value="subscription">Subscription</option>
        <option value="installation">Installation</option>
        <option value="equipment">Equipment</option>
        <option value="late_fee">Late Fee</option>
        <option value="other">Other</option>
      </select>
      <input
        type="number"
        name="amount"
        value={formData.amount || ''}
        onChange={handleInputChange}
        placeholder="Amount"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="date"
        name="payment_date"
        value={formData.payment_date || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <select
        name="payment_method"
        value={formData.payment_method || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Payment Method</option>
        <option value="cash">Cash</option>
        <option value="online">Online</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="credit_card">Credit Card</option>
      </select>
      <input
        type="text"
        name="customer_id"
        value={formData.customer_id || ''}
        onChange={handleInputChange}
        placeholder="Customer ID"
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

