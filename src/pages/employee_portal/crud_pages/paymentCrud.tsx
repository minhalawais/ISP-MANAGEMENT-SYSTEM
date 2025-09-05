import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPage.tsx';
import { PaymentForm } from '../../../components/forms/paymentForm.tsx';

interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: string;
  failure_reason?: string;
  payment_proof: string;
  received_by: string;
  is_active: boolean;
}

const EmployeePaymentManagement: React.FC = () => {
  const columns = React.useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        header: 'Invoice',
        accessorKey: 'invoice_number',
        cell: info => `${info.getValue<string>()} - ${info.row.original.customer_name}`,
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: info => `PKR${info.getValue<number>().toFixed(2)}`,
      },
      {
        header: 'Payment Date',
        accessorKey: 'payment_date',
      },
      {
        header: 'Payment Method',
        accessorKey: 'payment_method',
      },
      {
        header: 'Status',
        accessorKey: 'status',
      },
      {
        header: 'Received By',
        accessorKey: 'received_by',
      },
    ],
    []
  );

  return (
    <CRUDPage<Payment>
      title="Payment"
      endpoint="payments"
      columns={columns}
      FormComponent={PaymentForm}
    />
  );
};

export default EmployeePaymentManagement;

