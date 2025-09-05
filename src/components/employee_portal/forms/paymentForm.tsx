import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';

interface PaymentFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isEditing: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
}

export function PaymentForm({ formData, handleInputChange, handleSubmit, isEditing }: PaymentFormProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchInvoices();
    fetchEmployees();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('/invoices/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.map((invoice: any) => ({ 
        id: invoice.id, 
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        total_amount: invoice.total_amount
      })));
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('/employees/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.map((employee: any) => ({ 
        id: employee.id, 
        name: `${employee.first_name} ${employee.last_name}` 
      })));
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      handleInputChange({
        target: {
          name: 'payment_proof',
          value: file
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedInvoiceId = e.target.value;
    const selectedInvoice = invoices.find(invoice => invoice.id === selectedInvoiceId);
    
    handleInputChange(e);

    if (selectedInvoice) {
      handleInputChange({
        target: {
          name: 'amount',
          value: selectedInvoice.total_amount.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.invoice_id) newErrors.invoice_id = "Invoice is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    if (!formData.payment_date) newErrors.payment_date = "Payment date is required";
    if (!formData.payment_method) newErrors.payment_method = "Payment method is required";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.received_by) newErrors.received_by = "Receiver is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (validateForm()) {
        handleSubmit(e);
      }
    }} className="mt-2 space-y-4">
      <select
        name="invoice_id"
        value={formData.invoice_id || ''}
        onChange={handleInvoiceChange}
        className={`w-full p-2 border ${errors.invoice_id ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      >
        <option value="">Select Invoice</option>
        {invoices.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>{`${invoice.invoice_number} - ${invoice.customer_name}`}</option>
        ))}
      </select>
      {errors.invoice_id && <p className="text-red-500 text-sm mt-1">{errors.invoice_id}</p>}
      <input
        type="number"
        name="amount"
        value={formData.amount || ''}
        onChange={handleInputChange}
        placeholder="Amount"
        className={`w-full p-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      />
      {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
      <input
        type="date"
        name="payment_date"
        value={formData.payment_date || ''}
        onChange={handleInputChange}
        className={`w-full p-2 border ${errors.payment_date ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      />
      {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
      <select
        name="payment_method"
        value={formData.payment_method || ''}
        onChange={handleInputChange}
        className={`w-full p-2 border ${errors.payment_method ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      >
        <option value="">Select Payment Method</option>
        <option value="credit_card">Credit Card</option>
        <option value="debit_card">Debit Card</option>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="cash">Cash</option>
      </select>
      {errors.payment_method && <p className="text-red-500 text-sm mt-1">{errors.payment_method}</p>}
      <input
        type="text"
        name="transaction_id"
        value={formData.transaction_id || ''}
        onChange={handleInputChange}
        placeholder="Transaction ID"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <select
        name="status"
        value={formData.status || ''}
        onChange={handleInputChange}
        className={`w-full p-2 border ${errors.status ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      >
        <option value="">Select Status</option>
        <option value="partially_paid">Partially Paid</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>
      {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
      {formData.status === 'cancelled' && (
        <input
          type="text"
          name="failure_reason"
          value={formData.failure_reason || ''}
          onChange={handleInputChange}
          placeholder="Failure Reason"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      )}
      <input
        type="file"
        name="payment_proof"
        onChange={handleFileChange}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <select
        name="received_by"
        value={formData.received_by || ''}
        onChange={handleInputChange}
        className={`w-full p-2 border ${errors.received_by ? 'border-red-500' : 'border-gray-300'} rounded-md`}
        required
      >
        <option value="">Received By</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>{`${employee.name} (ID: ${employee.id})`}</option>
        ))}
      </select>
      {errors.received_by && <p className="text-red-500 text-sm mt-1">{errors.received_by}</p>}
    </form>
  );
}

