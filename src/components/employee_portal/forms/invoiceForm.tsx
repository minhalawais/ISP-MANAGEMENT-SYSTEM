import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';

interface InvoiceFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
}

export function InvoiceForm({ formData, handleInputChange, isEditing }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('/customers/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data.map((customer: any) => ({ 
        id: customer.id, 
        name: `${customer.first_name} ${customer.last_name}`
      })));
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedDate = value ? new Date(value).toISOString() : '';
    handleInputChange({
      target: { name, value: formattedDate }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="mt-2 space-y-4">
      <select
        name="customer_id"
        value={formData.customer_id || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Customer</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} (ID: {customer.id})
          </option>
        ))}
      </select>
      <input
        type="date"
        name="billing_start_date"
        value={formData.billing_start_date ? new Date(formData.billing_start_date).toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="date"
        name="billing_end_date"
        value={formData.billing_end_date ? new Date(formData.billing_end_date).toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="date"
        name="due_date"
        value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="subtotal"
        value={formData.subtotal || ''}
        onChange={handleInputChange}
        placeholder="Subtotal"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="discount_percentage"
        value={formData.discount_percentage || ''}
        onChange={handleInputChange}
        placeholder="Discount Percentage"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <input
        type="number"
        name="total_amount"
        value={formData.total_amount || ''}
        onChange={handleInputChange}
        placeholder="Total Amount"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <select
        name="invoice_type"
        value={formData.invoice_type || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Invoice Type</option>
        <option value="subscription">Subscription</option>
        <option value="installation">Installation</option>
        <option value="equipment">Equipment</option>
        <option value="late_fee">Late Fee</option>
        <option value="upgrade">Upgrade</option>
        <option value="reconnection">Reconnection</option>
        <option value="add_on">Add-on</option>
        <option value="refund">Refund</option>
        <option value="deposit">Deposit</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <textarea
        name="notes"
        value={formData.notes || ''}
        onChange={handleInputChange}
        placeholder="Notes"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>
  );
}

