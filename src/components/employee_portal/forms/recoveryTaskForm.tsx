import React from 'react';

interface Invoice {
  id: string;
  invoice_number: string;
}

interface Employee {
  id: string;
  full_name: string;
}

interface RecoveryTaskFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isEditing: boolean;
  invoices: Invoice[];
  employees: Employee[];
}

export function RecoveryTaskForm({ formData, handleInputChange, isEditing, invoices, employees }: RecoveryTaskFormProps) {
  return (
    <div className="mt-2 space-y-4">
      <select
        name="invoice_id"
        value={formData.invoice_id || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Invoice</option>
        {invoices.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>
            {invoice.invoice_number}
          </option>
        ))}
      </select>
      <select
        name="assigned_to"
        value={formData.assigned_to || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Assign To</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.full_name}
          </option>
        ))}
      </select>
      <select
        name="status"
        value={formData.status || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Status</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <textarea
        name="notes"
        value={formData.notes || ''}
        onChange={handleInputChange}
        placeholder="Notes"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
    </div>
  );
}

