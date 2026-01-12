import React, { useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../components/crudPage.tsx';
import { ISPPaymentForm } from '../../components/forms/ISPPaymentForm.tsx';
import { ImageViewerModal, useImageViewer } from '../../components/modals/ImageViewerModal.tsx';
import axiosInstance from '../../utils/axiosConfig.ts';
import { Eye } from 'lucide-react';

interface ISPPayment {
  id: string;
  isp_id: string;
  isp_name: string;
  bank_account_id: string;
  bank_account_details: string;
  payment_type: string;
  reference_number?: string;
  description: string;
  amount: number;
  payment_date: string;
  billing_period: string;
  bandwidth_usage_gb?: number;
  rate_per_gb?: number;
  payment_method: string;
  transaction_id?: string;
  status: string;
  payment_proof: string;
  processed_by: string;
  processor_name: string;
  is_active: boolean;
  created_at: string;
}

const ISPPaymentManagement: React.FC = () => {
  const imageViewer = useImageViewer();

  useEffect(() => {
    document.title = "MBA NET - ISP Payment Management";
  }, []);

  const columns = React.useMemo<ColumnDef<ISPPayment>[]>(
    () => [
      {
        header: 'ISP',
        accessorKey: 'isp_name',
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: info => `PKR ${info.getValue<number>().toLocaleString()}`,
      },
      {
        header: 'Payment Date',
        accessorKey: 'payment_date',
        cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: 'Billing Period',
        accessorKey: 'billing_period',
      },
      {
        header: 'Payment Type',
        accessorKey: 'payment_type',
        cell: info => {
          const type = info.getValue<string>();
          const typeMap: { [key: string]: string } = {
            'monthly_subscription': 'Monthly Subscription',
            'bandwidth_usage': 'Bandwidth Usage',
            'infrastructure': 'Infrastructure',
            'other': 'Other'
          };
          return typeMap[type] || type;
        },
      },
      {
        header: 'Payment Method',
        accessorKey: 'payment_method',
      },
      {
        header: 'Bank Account',
        accessorKey: 'bank_account_details',
      },
      {
        header: 'Processed By',
        accessorKey: 'processor_name',
      },
      {
        header: 'Payment Proof',
        accessorKey: 'payment_proof',
        cell: (info: any) => (
          info.getValue() ? (
            <button
              onClick={() => imageViewer.openViewer(
                `/isp-payments/proof-image/${info.row.original.id}`,
                `ISP Payment Proof - ${info.row.original.isp_name}`,
                axiosInstance
              )}
              className="px-3 py-1.5 bg-[#89A8B2] text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-[#7A96A3] transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View Proof
            </button>
          ) : (
            <span className="text-slate-gray text-sm">No proof</span>
          )
        ),
      },
    ],
    [imageViewer]
  );

  return (
    <>
      <CRUDPage<ISPPayment>
        title="ISP Payment"
        endpoint="isp-payments"
        columns={columns}
        FormComponent={ISPPaymentForm}
      />
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={imageViewer.closeViewer}
        imageUrl={imageViewer.imageUrl}
        title={imageViewer.title}
        isLoading={imageViewer.isLoading}
      />
    </>
  );
};

export default ISPPaymentManagement;