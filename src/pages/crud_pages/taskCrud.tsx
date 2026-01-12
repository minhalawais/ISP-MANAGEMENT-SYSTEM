import React, { useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { TaskForm } from '../../components/forms/taskForm.tsx';
import { Users, Calendar, AlertCircle } from 'lucide-react';

interface Assignee {
  id: string;
  name: string;
}

interface Task {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  task_type: 'installation' | 'maintenance' | 'complaint' | 'recovery';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  assignees: Assignee[];
  assigned_to: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

const TaskManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Task Management";
  }, []);

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'installation': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'complaint': return 'bg-orange-100 text-orange-800';
      case 'recovery': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        header: 'Task Type',
        accessorKey: 'task_type',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeColor(value)}`}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </span>
          );
        },
      },
      {
        header: 'Customer',
        accessorKey: 'customer_name',
        cell: info => (
          <span className="text-deep-ocean">
            {(info.getValue() as string) || '-'}
          </span>
        ),
      },
      {
        header: 'Priority',
        accessorKey: 'priority',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(value)}`}>
              <AlertCircle className="h-3 w-3 mr-1" />
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </span>
          );
        },
      },
      {
        header: 'Due Date',
        accessorKey: 'due_date',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          const date = new Date(value);
          return (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3 text-slate-gray" />
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          );
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(value)}`}>
              {value.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          );
        },
      },
      {
        header: 'Assigned To',
        accessorKey: 'assignees',
        cell: info => {
          const assignees = info.getValue() as Assignee[] | null;
          if (!assignees || assignees.length === 0) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-slate-gray" />
              <span className="text-sm">
                {assignees.length === 1 
                  ? assignees[0].name 
                  : `${assignees[0].name} +${assignees.length - 1}`}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return new Date(value).toLocaleDateString();
        },
      },
    ],
    []
  );

  return (
    <CRUDPage<Task>
      title="Task"
      endpoint="tasks"
      columns={columns}
      FormComponent={TaskForm}
    />
  );
};

export default TaskManagement;
