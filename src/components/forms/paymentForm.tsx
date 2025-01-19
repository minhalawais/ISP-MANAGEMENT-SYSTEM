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

  // Base styles
  const inputBaseStyles = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    text-gray-900
    placeholder-gray-400
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-500/20
    transition-colors
    duration-200
    text-sm
    disabled:bg-gray-50
    disabled:text-gray-500
  `;

  const selectBaseStyles = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    bg-white
    text-gray-900
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-500/20
    transition-colors
    duration-200
    text-sm
    appearance-none
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%236B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')]
    bg-right-4
    bg-center-y
  `;

  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";
  const errorStyles = "text-red-500 text-sm mt-1";

  useEffect(() => {
    fetchInvoices();
    fetchEmployees();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = getToken();
      const response = await axiosInstance.get('http://147.93.53.119/api/invoices/list', {
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
      const response = await axiosInstance.get('http://147.93.53.119/api/employees/list', {
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
    <div className="max-w-4xl mx-auto p-6 rounded-xl shadow-sm">
      
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (validateForm()) {
            handleSubmit(e);
          }
        }} 
        className="space-y-6"
      >
        <div>
          <label className={labelStyles}>Invoice</label>
          <select
            name="invoice_id"
            value={formData.invoice_id || ''}
            onChange={handleInvoiceChange}
            className={`${selectBaseStyles} ${errors.invoice_id ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="">Select Invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {`${invoice.invoice_number} - ${invoice.customer_name}`}
              </option>
            ))}
          </select>
          {errors.invoice_id && <p className={errorStyles}>{errors.invoice_id}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className={`${inputBaseStyles} ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.amount && <p className={errorStyles}>{errors.amount}</p>}
          </div>

          <div>
            <label className={labelStyles}>Payment Date</label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date || ''}
              onChange={handleInputChange}
              className={`${inputBaseStyles} ${errors.payment_date ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.payment_date && <p className={errorStyles}>{errors.payment_date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Payment Method</label>
            <select
              name="payment_method"
              value={formData.payment_method || ''}
              onChange={handleInputChange}
              className={`${selectBaseStyles} ${errors.payment_method ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
            {errors.payment_method && <p className={errorStyles}>{errors.payment_method}</p>}
          </div>

          <div>
            <label className={labelStyles}>Transaction ID</label>
            <input
              type="text"
              name="transaction_id"
              value={formData.transaction_id || ''}
              onChange={handleInputChange}
              placeholder="Enter transaction ID"
              className={`${inputBaseStyles} border-gray-300`}
            />
          </div>
        </div>

        <div>
          <label className={labelStyles}>Status</label>
          <select
            name="status"
            value={formData.status || ''}
            onChange={handleInputChange}
            className={`${selectBaseStyles} ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="">Select Status</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          {errors.status && <p className={errorStyles}>{errors.status}</p>}
        </div>

        {formData.status === 'cancelled' && (
          <div>
            <label className={labelStyles}>Failure Reason</label>
            <input
              type="text"
              name="failure_reason"
              value={formData.failure_reason || ''}
              onChange={handleInputChange}
              placeholder="Enter failure reason"
              className={`${inputBaseStyles} border-gray-300`}
            />
          </div>
        )}

        <div>
          <label className={labelStyles}>Payment Proof</label>
          <input
            type="file"
            name="payment_proof"
            onChange={handleFileChange}
            className={`${inputBaseStyles} border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
          />
        </div>

        <div>
          <label className={labelStyles}>Received By</label>
          <select
            name="received_by"
            value={formData.received_by || ''}
            onChange={handleInputChange}
            className={`${selectBaseStyles} ${errors.received_by ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          {errors.received_by && <p className={errorStyles}>{errors.received_by}</p>}
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;