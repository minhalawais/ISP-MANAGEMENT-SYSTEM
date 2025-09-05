"use client"

import type React from "react"
import { Calendar, AlertCircle, ClipboardList, User, Tag, Clock } from "lucide-react"

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface TaskFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  isEditing: boolean
  employees: Employee[]
}

export function TaskForm({ formData, handleInputChange, isEditing, employees }: TaskFormProps) {
  const inputClasses = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    border-[#EBF5FF]
    bg-white
    text-[#4A5568]
    placeholder-[#4A5568]/60
    focus:border-[#3A86FF]
    focus:ring-2
    focus:ring-[#3A86FF]/20
    transition-colors
    duration-200
    text-sm
  `

  const iconInputClasses = `
    w-full
    pl-10
    pr-4
    py-2.5
    rounded-lg
    border
    border-[#EBF5FF]
    bg-white
    text-[#4A5568]
    placeholder-[#4A5568]/60
    focus:border-[#3A86FF]
    focus:ring-2
    focus:ring-[#3A86FF]/20
    transition-colors
    duration-200
    text-sm
  `

  const selectClasses = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    border-[#EBF5FF]
    bg-white
    text-[#4A5568]
    focus:border-[#3A86FF]
    focus:ring-2
    focus:ring-[#3A86FF]/20
    transition-colors
    duration-200
    text-sm
    appearance-none
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4
    bg-center-y
  `

  const iconSelectClasses = `
    w-full
    pl-10
    pr-10
    py-2.5
    rounded-lg
    border
    border-[#EBF5FF]
    bg-white
    text-[#4A5568]
    focus:border-[#3A86FF]
    focus:ring-2
    focus:ring-[#3A86FF]/20
    transition-colors
    duration-200
    text-sm
    appearance-none
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4
    bg-center-y
  `

  const labelClasses = "block text-sm font-medium text-[#2A5C8A] mb-1"
  const iconClasses = "h-5 w-5 text-[#4A5568]/60"

  return (
    <div className="space-y-6">
      <div>
        <label className={labelClasses}>Task Title</label>
        <input
          type="text"
          name="title"
          value={formData.title || ""}
          onChange={handleInputChange}
          placeholder="Enter task title"
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <ClipboardList className={iconClasses} />
          </div>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter task description"
            rows={3}
            className={`${iconInputClasses} pt-2.5 resize-none min-h-[100px]`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Task Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className={iconClasses} />
            </div>
            <select
              name="task_type"
              value={formData.task_type || ""}
              onChange={handleInputChange}
              required
              className={iconSelectClasses}
            >
              <option value="">Select Type</option>
              <option value="installation">Installation</option>
              <option value="maintenance">Maintenance</option>
              <option value="troubleshooting">Troubleshooting</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses}>Priority</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlertCircle className={iconClasses} />
            </div>
            <select
              name="priority"
              value={formData.priority || ""}
              onChange={handleInputChange}
              required
              className={iconSelectClasses}
            >
              <option value="">Select Priority</option>
              <option value="low" className="text-[#10B981]">
                Low
              </option>
              <option value="medium" className="text-[#3A86FF]">
                Medium
              </option>
              <option value="high" className="text-[#F59E0B]">
                High
              </option>
              <option value="critical" className="text-[#EF4444]">
                Critical
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Due Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className={iconClasses} />
            </div>
            <input
              type="date"
              name="due_date"
              value={formData.due_date || ""}
              onChange={handleInputChange}
              className={iconInputClasses}
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Status</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className={iconClasses} />
            </div>
            <select
              name="status"
              value={formData.status || ""}
              onChange={handleInputChange}
              required
              className={iconSelectClasses}
            >
              <option value="">Select Status</option>
              <option value="pending" className="text-[#F59E0B]">
                Pending
              </option>
              <option value="in_progress" className="text-[#3A86FF]">
                In Progress
              </option>
              <option value="completed" className="text-[#10B981]">
                Completed
              </option>
              <option value="cancelled" className="text-[#EF4444]">
                Cancelled
              </option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Assign To</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className={iconClasses} />
          </div>
          <select
            name="assigned_to"
            value={formData.assigned_to || ""}
            onChange={handleInputChange}
            required
            className={iconSelectClasses}
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {`${employee.first_name} ${employee.last_name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Related Complaint ID</label>
        <input
          type="text"
          name="related_complaint_id"
          value={formData.related_complaint_id || ""}
          onChange={handleInputChange}
          placeholder="Optional"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes || ""}
          onChange={handleInputChange}
          placeholder="Enter any additional notes"
          rows={3}
          className={`${inputClasses} resize-none min-h-[100px]`}
        />
      </div>
    </div>
  )
}
