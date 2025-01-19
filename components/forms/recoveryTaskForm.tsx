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
        name="recovery_type"
        value={formData.recovery_type || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      >
        <option value="">Select Recovery Type</option>
        <option value="payment">Payment</option>
        <option value="equipment">Equipment</option>
        <option value="other">Other</option>
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
      <input
        type="number"
        name="attempts_count"
        value={formData.attempts_count || 0}
        onChange={handleInputChange}
        placeholder="Attempts Count"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <input
        type="date"
        name="last_attempt_date"
        value={formData.last_attempt_date || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <input
        type="number"
        name="recovered_amount"
        value={formData.recovered_amount || ''}
        onChange={handleInputChange}
        placeholder="Recovered Amount"
        step="0.01"
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <textarea
        name="notes"
        value={formData.notes || ''}
        onChange={handleInputChange}
        placeholder="Notes"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <textarea
        name="reason"
        value={formData.reason || ''}
        onChange={handleInputChange}
        placeholder="Reason (if unsuccessful)"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active || false}
          onChange={(e) => handleInputChange({
            ...e,
            target: { ...e.target, value: e.target.checked }
          } as React.ChangeEvent<HTMLInputElement>)}
          className="mr-2"
        />
        <label htmlFor="is_active">Is Active</label>
      </div>
    </div>
  );
}

