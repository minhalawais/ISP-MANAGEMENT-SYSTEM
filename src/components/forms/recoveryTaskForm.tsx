import React from 'react';
import { 
  Receipt, 
  Users, 
  RefreshCw, 
  AlertCircle, 
  Hash, 
  Calendar, 
  DollarSign,
  ClipboardList,
  AlertOctagon,
  ToggleLeft
} from 'lucide-react';

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
  const statusColors = {
    pending: 'text-yellow-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600'
  };

  return (
    <div className="space-y-6">
      {/* Invoice Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Invoice</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Receipt className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="invoice_id"
            value={formData.invoice_id || ''}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Select Invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoice_number}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Employee Assignment */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Assign To</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="assigned_to"
            value={formData.assigned_to || ''}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Assign To</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recovery Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Recovery Type</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="recovery_type"
            value={formData.recovery_type || ''}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Select Recovery Type</option>
            <option value="payment">Payment</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-gray-400" />
          </div>
          <select
            name="status"
            value={formData.status || ''}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 appearance-none
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
            required
          >
            <option value="">Select Status</option>
            <option value="pending" className={statusColors.pending}>Pending</option>
            <option value="in_progress" className={statusColors.in_progress}>In Progress</option>
            <option value="completed" className={statusColors.completed}>Completed</option>
            <option value="cancelled" className={statusColors.cancelled}>Cancelled</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attempts Count */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Attempts Count</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="attempts_count"
              value={formData.attempts_count || 0}
              onChange={handleInputChange}
              placeholder="Enter number of attempts"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 placeholder-gray-400 
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
            />
          </div>
        </div>

        {/* Last Attempt Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Last Attempt Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="last_attempt_date"
              value={formData.last_attempt_date || ''}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                       text-gray-900 placeholder-gray-400 
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                       transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Recovered Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Recovered Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            name="recovered_amount"
            value={formData.recovered_amount || ''}
            onChange={handleInputChange}
            placeholder="Enter recovered amount"
            step="0.01"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <ClipboardList className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            placeholder="Enter any relevant notes"
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200 resize-y min-h-[120px]"
          />
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Reason (if unsuccessful)</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <AlertOctagon className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="reason"
            value={formData.reason || ''}
            onChange={handleInputChange}
            placeholder="Enter reason if recovery was unsuccessful"
            rows={3}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm bg-white/50 
                     text-gray-900 placeholder-gray-400 
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                     transition-all duration-200 resize-y min-h-[120px]"
          />
        </div>
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center space-x-3 pt-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active || false}
            onChange={(e) => handleInputChange({
              ...e,
              target: { ...e.target, value: e.target.checked }
            } as React.ChangeEvent<HTMLInputElement>)}
            className="w-4 h-4 text-purple-600 rounded border-gray-300 
                     focus:ring-purple-500 transition-colors duration-200"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 select-none">
            Is Active
          </label>
        </div>
        <ToggleLeft className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
}

export default RecoveryTaskForm;