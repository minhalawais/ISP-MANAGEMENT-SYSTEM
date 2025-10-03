import React,{useEffect} from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/paymentCrudPage.tsx';
import { PaymentForm } from '../../components/forms/paymentForm.tsx';
import axiosInstance from '../../utils/axiosConfig.ts';

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
  bank_account_id?: string
  bank_account_details?: string
}

const PaymentManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Payment Management";
  }, []);
  
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
        header: 'Bank Account',
        accessorKey: 'bank_account_details',
        cell: info => info.getValue() || 'N/A',
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
        header: 'Payment Proof',
        accessorKey: 'payment_proof',
        cell: (info: any) => {
          const paymentProof = info.getValue();
          
          // If no payment proof, display "No Image"
          if (!paymentProof) {
            return (
              <span className="text-slate-gray text-sm">No Image</span>
            );
          }
          
          // If payment proof exists, show the "View PROOF" button
          return (
            <button
              onClick={async () => {
                try {
                  const response = await axiosInstance.get(
                    `/payments/proof-image/${info.row.original.id}`,
                    {
                      responseType: "blob",
                      // Prevent the automatic timestamp parameter
                      params: {}
                    }
                  );
            
                  const url = window.URL.createObjectURL(response.data);
                  const a = document.createElement("a");
                  a.style.display = "none";
                  a.href = url;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();
                  
                  // Cleanup
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error("Error:", error);
                  alert("Failed to load payment proof. Please try again.");
                }
              }}
              className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
              View PROOF
            </button>
          );
        },
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