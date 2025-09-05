import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPage.tsx';
import { InvoiceForm } from '../../../components/forms/invoiceForm.tsx';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  billing_start_date: string;
  billing_end_date: string;
  due_date: string;
  subtotal: string | number;
  discount_percentage: string | number;
  total_amount: string | number;
  invoice_type: string;
  notes: string;
  status: string;
  is_active: boolean;
}

const EmployeeInvoiceManagement: React.FC = () => {
  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        header: 'Invoice Number',
        accessorKey: 'invoice_number',
      },
      {
        header: 'Customer Name',
        accessorKey: 'customer_name',
      },
      {
        header: 'Billing Start',
        accessorKey: 'billing_start_date',
        cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Billing End',
        accessorKey: 'billing_end_date',
        cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Due Date',
        accessorKey: 'due_date',
        cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Subtotal',
        accessorKey: 'subtotal',
        cell: info => {
          const value = parseFloat(info.getValue<string | number>() as string);
          return !isNaN(value) ? `PKR${value.toFixed(2)}` : 'N/A';
        },
      },
      {
        header: 'Discount %',
        accessorKey: 'discount_percentage',
        cell: info => {
          const value = parseFloat(info.getValue<string | number>() as string);
          return !isNaN(value) ? `${value.toFixed(2)}%` : 'N/A';
        },
      },
      {
        header: 'Total Amount',
        accessorKey: 'total_amount',
        cell: info => {
          const value = parseFloat(info.getValue<string | number>() as string);
          return !isNaN(value) ? `PKR${value.toFixed(2)}` : 'N/A';
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
      },
    ],
    []
  );

  const handleSubmit = async (formData: any, isEditing: boolean) => {
    const dateFields = ['billing_start_date', 'billing_end_date', 'due_date'];
    const numberFields = ['subtotal', 'discount_percentage', 'total_amount'];
    const formattedData = { ...formData };

    dateFields.forEach(field => {
      if (formattedData[field]) {
        formattedData[field] = new Date(formattedData[field]).toISOString().split('T')[0];
      }
    });

    numberFields.forEach(field => {
      if (formattedData[field]) {
        formattedData[field] = parseFloat(formattedData[field]);
      }
    });

    return formattedData;
  };

  return (
    <CRUDPage<Invoice>
      title="Invoice"
      endpoint="invoices"
      columns={columns}
      FormComponent={InvoiceForm}
      onSubmit={handleSubmit}
    />
  );
};

export default EmployeeInvoiceManagement;

