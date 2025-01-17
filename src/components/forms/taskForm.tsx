import React from 'react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

interface TaskFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isEditing: boolean;
  employees: Employee[];
}

export function TaskForm({ formData, handleInputChange, isEditing, employees }: TaskFormProps) {
  const inputBaseStyles = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    border-gray-300
    bg-white
    text-gray-900
    placeholder-gray-400
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-500/20
    transition-colors
    duration-200
    text-sm
  `;

  const selectBaseStyles = `
    w-full
    px-4
    py-2.5
    rounded-lg
    border
    border-gray-300
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

  return (
    <div className="space-y-6">
      <div>
        <label className={labelStyles}>Task Title</label>
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleInputChange}
          placeholder="Enter task title"
          required
          className={inputBaseStyles}
        />
      </div>

      <div>
        <label className={labelStyles}>Description</label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Enter task description"
          rows={3}
          className={`${inputBaseStyles} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelStyles}>Task Type</label>
          <select
            name="task_type"
            value={formData.task_type || ''}
            onChange={handleInputChange}
            required
            className={selectBaseStyles}
          >
            <option value="">Select Type</option>
            <option value="installation">Installation</option>
            <option value="maintenance">Maintenance</option>
            <option value="troubleshooting">Troubleshooting</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelStyles}>Priority</label>
          <select
            name="priority"
            value={formData.priority || ''}
            onChange={handleInputChange}
            required
            className={selectBaseStyles}
          >
            <option value="">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelStyles}>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date || ''}
            onChange={handleInputChange}
            className={inputBaseStyles}
          />
        </div>

        <div>
          <label className={labelStyles}>Status</label>
          <select
            name="status"
            value={formData.status || ''}
            onChange={handleInputChange}
            required
            className={selectBaseStyles}
          >
            <option value="">Select Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelStyles}>Assign To</label>
        <select
          name="assigned_to"
          value={formData.assigned_to || ''}
          onChange={handleInputChange}
          required
          className={selectBaseStyles}
        >
          <option value="">Select Employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {`${employee.first_name} ${employee.last_name}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelStyles}>Related Complaint ID</label>
        <input
          type="text"
          name="related_complaint_id"
          value={formData.related_complaint_id || ''}
          onChange={handleInputChange}
          placeholder="Optional"
          className={inputBaseStyles}
        />
      </div>

      <div>
        <label className={labelStyles}>Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Enter any additional notes"
          rows={3}
          className={`${inputBaseStyles} resize-none`}
        />
      </div>
    </div>
  );
}