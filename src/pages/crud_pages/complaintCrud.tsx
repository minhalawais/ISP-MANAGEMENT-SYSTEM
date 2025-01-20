import React, { useMemo,useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { ComplaintForm } from '../../components/forms/complaintForm.tsx';

interface Complaint {
  id: string;
  customer_name: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to_name: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  response_due_date: string | null;
  satisfaction_rating: number | null;
  resolution_attempts: number;
  attachment_path: string | null;
  feedback_comments: string | null;
  is_active: boolean;
}

const ComplaintManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Complaint Management";
  }, []);
  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => [
      {
        header: 'Customer',
        accessorKey: 'customer_name',
      },
      {
        header: 'Title',
        accessorKey: 'title',
      },
      {
        header: 'Category',
        accessorKey: 'category',
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: info => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${info.getValue() === 'open' ? 'bg-yellow-100 text-yellow-800' : 
              info.getValue() === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
              info.getValue() === 'resolved' ? 'bg-green-100 text-green-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {info.getValue() as string}
          </span>
        ),
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
        header: 'Assigned To',
        accessorKey: 'assigned_to_name',
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        header: 'Due Date',
        accessorKey: 'response_due_date',
        cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : 'N/A',
      },
    ],
    []
  );

  return (
    <CRUDPage<Complaint>
      title="Complaint"
      endpoint="complaints"
      columns={columns}
      FormComponent={ComplaintForm}
    />
  );
};

export default ComplaintManagement;

