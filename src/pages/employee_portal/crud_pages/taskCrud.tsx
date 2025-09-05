import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPageWithForm.tsx';
import { TaskForm } from '../../../components/forms/taskForm.tsx';
import { ProcessTaskModal } from '../../../components/modals/ProcessTaskModal.tsx';
import { CompleteTaskModal } from '../../../components/modals/CompleteTaskModal.tsx';
import { getToken } from '../../../utils/auth.ts';
import axiosInstance from '../../../utils/axiosConfig.ts';
import { Button } from '../../../components/ui/Button.tsx';
import { toast } from 'react-toastify';

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
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

  const handleStatusClick = (task: Task) => {
    setSelectedTask(task);
    if (task.status === 'pending') {
      setIsProcessModalOpen(true);
    } else if (task.status === 'in_progress') {
      setIsCompleteModalOpen(true);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProcessTask = async () => {
    try {
      const token = getToken();
      await axiosInstance.put(`/tasks/update/${selectedTask?.id}`, 
        { status: 'in_progress' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task status updated to In Progress');
      setIsProcessModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to process task', error);
      toast.error('Failed to process task');
    }
  };

  const handleCompleteTask = async (completionData: { notes: string }) => {
    try {
      const token = getToken();
      await axiosInstance.put(`/tasks/update/${selectedTask?.id}`, 
        { 
          status: 'completed',
          notes: completionData.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task completed successfully');
      setIsCompleteModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to complete task', error);
      toast.error('Failed to complete task');
    }
  };

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
          return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A';
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
        cell: info => {
          const status = info.getValue() as string;
          
          const getStatusStyles = (status: string) => {
            switch(status) {
              case 'pending':
                return 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300';
              case 'in_progress':
                return 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300';
              case 'completed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              case 'cancelled':
                return 'bg-gray-50 text-gray-700 border border-gray-200';
              default:
                return 'bg-gray-50 text-gray-700 border border-gray-200';
            }
          };
      
          const getStatusIcon = (status: string) => {
            switch(status) {
              case 'pending':
                return '⏳';
              case 'in_progress':
                return '▶️';
              case 'completed':
                return '✓';
              case 'cancelled':
                return '×';
              default:
                return '•';
            }
          };
      
          return (
            <Button
              onClick={() => handleStatusClick(info.row.original)}
              disabled={['completed', 'cancelled'].includes(status)}
              className={`
                px-3 
                py-1 
                text-xs 
                font-medium 
                rounded-full 
                shadow-sm
                transition-all 
                duration-200
                whitespace-nowrap
                ${getStatusStyles(status)}
                ${['completed', 'cancelled'].includes(status) 
                  ? 'cursor-not-allowed opacity-75' 
                  : 'hover:shadow-md hover:scale-105 active:scale-100'}
              `}
            >
              <span className="flex items-center gap-1.5">
                <span>{getStatusIcon(status)}</span>
                <span>{status.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}</span>
              </span>
            </Button>
          );
        },
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
    <>
      <CRUDPage<Task>
        title="Task"
        endpoint="tasks"
        columns={columns}
        FormComponent={(props) => <TaskForm {...props} employees={employees} />}
        key={refreshTrigger}
      />
      <ProcessTaskModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onConfirm={handleProcessTask}
      />
      <CompleteTaskModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={handleCompleteTask}
      />
    </>
  );
};

export default TaskManagement;