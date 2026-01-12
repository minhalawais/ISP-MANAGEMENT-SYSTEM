import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/paymentCrudPage.tsx';
import { PaymentForm } from '../../components/forms/paymentForm.tsx';
import { ImageViewerModal, useImageViewer } from '../../components/modals/ImageViewerModal.tsx';
import { PaymentVerificationModal } from '../../components/modals/PaymentVerificationModal.tsx'; // Import new modal
import axiosInstance from '../../utils/axiosConfig.ts';
import { Eye } from 'lucide-react';

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
    const imageViewer = useImageViewer();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    const handleVerificationComplete = () => {
        setRefreshTrigger(prev => prev + 1);
        setSelectedPayment(null);
    };

    const handleStatusClick = (payment: Payment) => {
        if (payment.status === 'pending') {
            setSelectedPayment(payment);
            setIsVerificationModalOpen(true);
        }
    };

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
        cell: (info: any) => {
            const status = info.getValue() as string;
            const isPending = status === 'pending';
            
            let bgColor = "";
            let textColor = "";
            let borderColor = "";

            switch (status) {
                case "paid":
                    bgColor = "bg-gradient-to-br from-emerald-50 to-emerald-100";
                    textColor = "text-emerald-700";
                    borderColor = "border-emerald-200";
                    break;
                case "pending":
                    bgColor = "bg-gradient-to-br from-amber-50 to-amber-100";
                    textColor = "text-amber-700";
                    borderColor = "border-amber-200";
                    break;
                case "failed": // specific to payment
                case "overdue":
                    bgColor = "bg-gradient-to-br from-red-50 to-red-100";
                    textColor = "text-red-700";
                    borderColor = "border-red-200";
                    break;
                default:
                    bgColor = "bg-gradient-to-br from-blue-50 to-blue-100";
                    textColor = "text-blue-700";
                    borderColor = "border-blue-200";
            }

            return (
                <button
                    onClick={isPending ? () => handleStatusClick(info.row.original) : undefined}
                    disabled={!isPending}
                    className={`
                        px-4 py-2 text-xs font-semibold border uppercase rounded-md
                        ${bgColor} ${textColor} ${borderColor}
                        transition-all duration-200 ease-out
                        ${isPending
                            ? 'cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 animate-pulse'
                            : 'cursor-default opacity-90'
                        }
                    `}
                    title={isPending ? "Click to verify payment" : status}
                >
                    {status === 'pending' ? 'Pending Validation' : status}
                </button>
            );
        }
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
          
          if (!paymentProof) {
            return (
              <span className="text-slate-gray text-sm">No Image</span>
            );
          }
          
          return (
            <button
              onClick={() => imageViewer.openViewer(
                `/payments/proof-image/${info.row.original.id}`,
                `Payment Proof - ${info.row.original.invoice_number}`,
                axiosInstance
              )}
              className="px-3 py-1.5 bg-[#89A8B2] text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-[#7A96A3] transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View Proof
            </button>
          );
        },
      },
      // Removed generic Verification column
    ],
    [imageViewer]
  );

  return (
    <>
      <CRUDPage<Payment>
        title="Payment"
        endpoint="payments"
        columns={columns}
        FormComponent={PaymentForm}
        refreshTrigger={refreshTrigger}
      />
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={imageViewer.closeViewer}
        imageUrl={imageViewer.imageUrl}
        title={imageViewer.title}
        isLoading={imageViewer.isLoading}
      />
      {selectedPayment && (
          <PaymentVerificationModal
              isOpen={isVerificationModalOpen}
              onClose={() => setIsVerificationModalOpen(false)}
              payment={selectedPayment}
              onVerify={handleVerificationComplete}
          />
      )}
    </>
  );
};

export default PaymentManagement;