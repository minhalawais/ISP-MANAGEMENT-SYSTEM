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
  return (
    <div className="mt-2 space-y-4">
      <input
        type="text"
        name="title"
        value={formData.title || ''}
        onChange={handleInputChange}
        placeholder="Task Title"
        className="w-full p-2 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
        placeholder="Task Description"
        className="w-full p-2 border border-gray-300 rounded-md"
        rows={3}
      />
      <input
        type="date"
        name="due_date"
        value={formData.due_date || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
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
            {`${employee.first_name} ${employee.last_name}`}
          </option>
        ))}
      </select>
    </div>
  );
}

