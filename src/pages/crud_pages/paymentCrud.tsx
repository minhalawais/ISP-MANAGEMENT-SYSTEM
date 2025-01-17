import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/paymentCrudPage.tsx';
import { PaymentForm } from '../../components/forms/paymentForm.tsx';
import { getToken } from '../../utils/auth.ts';

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

const PaymentManagement: React.FC = () => {
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
      {
        header: 'CNIC Image',
        accessorKey: 'cnic_image',
        cell: (info: any) => (
          <button
            onClick={() => {
              const token = getToken(); // Assuming getToken() retrieves the Bearer token
              fetch(`http://127.0.0.1:5000/payments/proof-image/${info.row.original.id}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              .then(response => response.blob())
              .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              })
              .catch(error => console.error('Error:', error));
            }}
            className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            View PROOF
          </button>
        ),
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

export default PaymentManagement;

