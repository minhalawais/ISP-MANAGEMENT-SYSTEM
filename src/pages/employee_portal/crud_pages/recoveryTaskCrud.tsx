import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPageWithForm.tsx';
import { RecoveryTaskForm } from '../../../components/forms/recoveryTaskForm.tsx';
import { ProcessTaskModal } from '../../../components/modals/RecoveryProcessTaskModal.tsx';
import { CompleteTaskModal } from '../../../components/modals/RecoveryCompleteTaskModal.tsx';
import { getToken } from '../../../utils/auth.ts';
import axiosInstance from '../../../utils/axiosConfig.ts';

interface RecoveryTask {
  id: string;
  invoice_id: string;
  invoice_number: string;
  assigned_to: string;
  assigned_to_name: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Invoice {
  id: string;
  invoice_number: string;
}

interface Employee {
  id: string;
  full_name: string;
}

const RecoveryTaskManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RecoveryTask | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      try {
        const invoicesResponse = await axiosInstance.get('/invoices/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(invoicesResponse.data);

        const employeesResponse = await axiosInstance.get('/employees/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(employeesResponse.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    fetchData();
  }, []);

  const handleStatusClick = (task: RecoveryTask) => {
    setSelectedTask(task);
    if (task.status === 'pending') {
      setIsProcessModalOpen(true);
    } else if (task.status === 'in_progress') {
      setIsCompleteModalOpen(true);
    }
  };

  const handleProcessTask = async () => {
    if (selectedTask) {
      try {
        const token = getToken();
        await axiosInstance.put(
          `/recovery-tasks/update/${selectedTask.id}`,
          { status: 'in_progress' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Refresh the data after updating
        // You might want to implement a more efficient way to update the local state
        window.location.reload();
      } catch (error) {
        console.error('Failed to process task', error);
      }
    }
    setIsProcessModalOpen(false);
  };
  
  const handleCompleteTask = async (data: { notes: string }) => {
    if (selectedTask) {
      try {
        const token = getToken();
        await axiosInstance.put(
          `/recovery-tasks/update/${selectedTask.id}`,
          {
            status: 'completed',
            notes: data.notes,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Refresh the data after updating
        window.location.reload();
      } catch (error) {
        console.error('Failed to complete task', error);
      }
    }
    setIsCompleteModalOpen(false);
  };

  const columns = useMemo<ColumnDef<RecoveryTask>[]>(
    () => [
      {
        header: 'Invoice Number',
        accessorKey: 'invoice_number',
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => (
          <button
            onClick={() => handleStatusClick(info.row.original)}
            className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
              info.getValue() === 'pending'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : info.getValue() === 'in_progress'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {(info.getValue() as string).charAt(0).toUpperCase() + (info.getValue() as string).slice(1)}
          </button>
        ),
      },
      {
        header: 'Notes',
        accessorKey: 'notes',
        cell: info => (
          <div className="max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        header: 'Updated At',
        accessorKey: 'updated_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
    ],
    []
  );

  return (
    <>
      <CRUDPage<RecoveryTask>
        title="Recovery Task"
        endpoint="recovery-tasks"
        columns={columns}
        FormComponent={(props) => <RecoveryTaskForm {...props} invoices={invoices} employees={employees} />}
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

export default RecoveryTaskManagement;

