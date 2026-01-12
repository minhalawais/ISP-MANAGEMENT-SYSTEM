import React, { useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { RecoveryTaskForm } from '../../components/forms/recoveryTaskForm.tsx';

interface RecoveryTask {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_internet_id: string;
  total_amount: number;
  assigned_to: string;
  assigned_to_name: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const RecoveryTaskManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Recovery Task Management";
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = useMemo<ColumnDef<RecoveryTask>[]>(
    () => [
      {
        header: 'Invoice',
        accessorKey: 'invoice_number',
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-deep-ocean">{row.invoice_number || '-'}</span>
              <span className="text-xs text-slate-gray">{row.customer_name}</span>
              <span className="text-xs text-electric-blue">{row.customer_internet_id}</span>
            </div>
          );
        },
      },
      {
        header: 'Amount',
        accessorKey: 'total_amount',
        cell: info => {
          const value = info.getValue() as number | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <span className="font-semibold text-emerald-green">
              PKR {value.toLocaleString()}
            </span>
          );
        },
      },
      {
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
        cell: info => info.getValue() || '-',
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
        header: 'Notes',
        accessorKey: 'notes',
        cell: info => {
          const value = info.getValue() as string | null;
          if (!value) return <span className="text-gray-400">-</span>;
          return (
            <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={value}>
              {value}
            </div>
          );
        },
      },
      {
        header: 'Created At',
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
    <CRUDPage<RecoveryTask>
      title="Recovery Task"
      endpoint="recovery-tasks"
      columns={columns}
      FormComponent={RecoveryTaskForm}
    />
  );
};

export default RecoveryTaskManagement;
