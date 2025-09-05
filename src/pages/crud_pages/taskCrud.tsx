import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { TaskForm } from '../../components/forms/taskForm.tsx';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Button } from '../../components/ui/Button.tsx';

interface Task {
  id: string;
  title: string;
  description: string;
  task_type: 'installation' | 'maintenance' | 'troubleshooting' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_to_name: string;
  related_complaint_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  notes: string | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const TaskManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    document.title = "MBA NET - Task Management";
    const fetchEmployees = async () => {
      try {
        const token = getToken();
        const response = await axiosInstance.get('/employees/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(response.data);
      } catch (error) {
        console.error('Failed to fetch employees', error);
      }
    };

    fetchEmployees();
  }, []);

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        header: 'Title',
        accessorKey: 'title',
      },
      {
        header: 'Type',
        accessorKey: 'task_type',
        cell: info => {
          const value = info.getValue();
          return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'; // Default to 'N/A' if value is null or undefined
        },
      },      
      {
        header: 'Priority',
        accessorKey: 'priority',
        cell: info => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${info.getValue() === 'low' ? 'bg-green-100 text-green-800' : 
              info.getValue() === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
              info.getValue() === 'high' ? 'bg-orange-100 text-orange-800' : 
              'bg-red-100 text-red-800'}`}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: 'Due Date',
        accessorKey: 'due_date',
        cell: info => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${info.getValue() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              info.getValue() === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
              info.getValue() === 'completed' ? 'bg-green-100 text-green-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {(info.getValue() as string).replace('_', ' ')}
          </span>
        ),
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  return (
    <CRUDPage<Task>
      title="Task"
      endpoint="tasks"
      columns={columns}
      FormComponent={(props) => <TaskForm {...props} employees={employees} />}
    />
  );
};

export default TaskManagement;

