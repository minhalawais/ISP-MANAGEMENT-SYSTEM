import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { RecoveryTaskForm } from '../../components/forms/recoveryTaskForm.tsx';
import axios from 'axios';
import { getToken } from '../../utils/auth.ts';
import axiosInstance from '../../utils/axiosConfig.ts';
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

  useEffect(() => {
    document.title = "MBA NET - Recovery Task Management";
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
        cell: info => info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1),
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
    <CRUDPage<RecoveryTask>
      title="Recovery Task"
      endpoint="recovery-tasks"
      columns={columns}
      FormComponent={(props) => <RecoveryTaskForm {...props} invoices={invoices} employees={employees} />}
    />
  );
};

export default RecoveryTaskManagement;

