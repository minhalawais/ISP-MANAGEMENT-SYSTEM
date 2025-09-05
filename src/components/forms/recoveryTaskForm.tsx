"use client"

import type React from "react"
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
  ToggleLeft,
} from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
}

interface Employee {
  id: string
  full_name: string
}

interface RecoveryTaskFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isEditing: boolean
  invoices: Invoice[]
  employees: Employee[]
}

export function RecoveryTaskForm({
  formData,
  handleInputChange,
  isEditing,
  invoices,
  employees,
}: RecoveryTaskFormProps) {
  const inputClasses = `
    w-full 
    pl-10 
    pr-4 
    py-3 
    border 
    border-[#EBF5FF] 
    rounded-lg 
    shadow-sm 
    bg-white 
    text-[#4A5568] 
    placeholder-[#4A5568]/60
    focus:ring-2 
    focus:ring-[#3A86FF]/30 
    focus:border-[#3A86FF] 
    transition-all 
    duration-200
  `

  const selectClasses = `
    w-full 
    pl-10 
    pr-10 
    py-3 
    border 
    border-[#EBF5FF] 
    rounded-lg 
    shadow-sm 
    bg-white 
    text-[#4A5568]
    appearance-none
    focus:ring-2 
    focus:ring-[#3A86FF]/30 
    focus:border-[#3A86FF] 
    transition-all 
    duration-200
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4
    bg-center-y
  `

  const labelClasses = "block text-sm font-medium text-[#2A5C8A] mb-1"
  const iconClasses = "h-5 w-5 text-[#4A5568]/60"

  const statusColors = {
    pending: "text-[#F59E0B]",
    in_progress: "text-[#3A86FF]",
    completed: "text-[#10B981]",
    cancelled: "text-[#EF4444]",
  }

  return (
    <div className="space-y-6">
      {/* Invoice Selection */}
      <div className="space-y-2">
        <label className={labelClasses}>Invoice</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Receipt className={iconClasses} />
          </div>
          <select
            name="invoice_id"
            value={formData.invoice_id || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoice_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Assignment */}
      <div className="space-y-2">
        <label className={labelClasses}>Assign To</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Users className={iconClasses} />
          </div>
          <select
            name="assigned_to"
            value={formData.assigned_to || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Assign To</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recovery Type */}
      <div className="space-y-2">
        <label className={labelClasses}>Recovery Type</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <RefreshCw className={iconClasses} />
          </div>
          <select
            name="recovery_type"
            value={formData.recovery_type || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Recovery Type</option>
            <option value="payment">Payment</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className={labelClasses}>Status</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AlertCircle className={iconClasses} />
          </div>
          <select
            name="status"
            value={formData.status || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Status</option>
            <option value="pending" className={statusColors.pending}>
              Pending
            </option>
            <option value="in_progress" className={statusColors.in_progress}>
              In Progress
            </option>
            <option value="completed" className={statusColors.completed}>
              Completed
            </option>
            <option value="cancelled" className={statusColors.cancelled}>
              Cancelled
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attempts Count */}
        <div className="space-y-2">
          <label className={labelClasses}>Attempts Count</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className={iconClasses} />
            </div>
            <input
              type="number"
              name="attempts_count"
              value={formData.attempts_count || 0}
              onChange={handleInputChange}
              placeholder="Enter number of attempts"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Last Attempt Date */}
        <div className="space-y-2">
          <label className={labelClasses}>Last Attempt Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className={iconClasses} />
            </div>
            <input
              type="date"
              name="last_attempt_date"
              value={formData.last_attempt_date || ""}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Recovered Amount */}
      <div className="space-y-2">
        <label className={labelClasses}>Recovered Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className={iconClasses} />
          </div>
          <input
            type="number"
            name="recovered_amount"
            value={formData.recovered_amount || ""}
            onChange={handleInputChange}
            placeholder="Enter recovered amount"
            step="0.01"
            className={inputClasses}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className={labelClasses}>Notes</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <ClipboardList className={iconClasses} />
          </div>
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleInputChange}
            placeholder="Enter any relevant notes"
            rows={3}
            className={`${inputClasses} resize-y min-h-[120px]`}
          />
        </div>
      </div>

      {/* Reason */}
      <div className="space-y-2">
        <label className={labelClasses}>Reason (if unsuccessful)</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <AlertOctagon className={iconClasses} />
          </div>
          <textarea
            name="reason"
            value={formData.reason || ""}
            onChange={handleInputChange}
            placeholder="Enter reason if recovery was unsuccessful"
            rows={3}
            className={`${inputClasses} resize-y min-h-[120px]`}
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
            onChange={(e) =>
              handleInputChange({
                ...e,
                target: { ...e.target, name: "is_active", value: e.target.checked },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            className="w-4 h-4 text-[#3A86FF] rounded border-[#EBF5FF] 
                     focus:ring-[#3A86FF] transition-colors duration-200"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-[#4A5568] select-none">
            Is Active
          </label>
        </div>
        <ToggleLeft className="h-5 w-5 text-[#4A5568]/60" />
      </div>
    </div>
  )
}

export default RecoveryTaskForm
