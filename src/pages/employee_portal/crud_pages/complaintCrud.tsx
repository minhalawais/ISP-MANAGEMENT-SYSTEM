import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CRUDPage } from '../../../components/employee_portal/crudPageWithForm.tsx';
import { ComplaintForm } from '../../../components/forms/complaintForm.tsx';
import { ProcessComplaintModal } from '../../../components/modals/ProcessComplaintModal.tsx';
import { ResolveComplaintModal } from '../../../components/modals/ResolveComplaintModal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axiosConfig.ts';
import { getToken } from '../../../utils/auth.ts';
 
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
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStatusClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    if (complaint.status === 'open') {
      setIsProcessModalOpen(true);
    } else if (complaint.status === 'in_progress') {
      setIsResolveModalOpen(true);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProcessComplaint = async () => {
    try {
      const token = getToken();
      await axiosInstance.put(
        `https://mbanet.com.pk/api/complaints/update/${selectedComplaint?.id}`,
        { status: 'in_progress' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Complaint status updated to In Progress');
      setIsProcessModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to process complaint', error);
      toast.error('Failed to process complaint');
    }
  };
  
  const handleResolveComplaint = async (resolutionData: { notes: string }) => {
    try {
      const token = getToken();
      await axiosInstance.put(
        `https://mbanet.com.pk/api/complaints/update/${selectedComplaint?.id}`,
        {
          status: 'resolved',
          resolution_proof: resolutionData.notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Complaint resolved successfully');
      setIsResolveModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Failed to resolve complaint', error);
      toast.error('Failed to resolve complaint');
    }
  };

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
        cell: info => {
          const status = info.getValue() as string;
          
          const getStatusStyles = (status: string) => {
            switch(status) {
              case 'open':
                return 'bg-[#E5E1DA] text-[#89A8B2] hover:bg-[#F1F0E8]';
              case 'in_progress':
                return 'bg-[#B3C8CF] text-[#89A8B2] hover:bg-[#89A8B2] hover:text-white';
              case 'resolved':
                return 'bg-[#89A8B2]/20 text-[#89A8B2]';
              case 'closed':
                return 'bg-gray-100 text-gray-400';
              default:
                return 'bg-[#F1F0E8] text-[#89A8B2]';
            }
          };
      
          const getStatusLabel = (status: string) => {
            return status.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          };
      
          return (
            <Button
              onClick={() => handleStatusClick(info.row.original)}
              disabled={['resolved', 'closed'].includes(status)}
              className={`
                px-3 py-1.5 
                text-xs 
                font-medium 
                rounded-full 
                transition-all 
                duration-200 
                shadow-sm 
                border border-transparent
                whitespace-nowrap
                ${getStatusStyles(status)}
                ${['resolved', 'closed'].includes(status) 
                  ? 'cursor-not-allowed opacity-75' 
                  : 'hover:scale-105 active:scale-100 hover:shadow-md'}
              `}
            >
              {getStatusLabel(status)}
            </Button>
          );
        },
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
    <>
      <CRUDPage<Complaint>
        title="Complaint"
        endpoint="complaints"
        columns={columns}
        FormComponent={ComplaintForm}
        key={refreshTrigger}
      />
      <ProcessComplaintModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onConfirm={handleProcessComplaint}
      />
      <ResolveComplaintModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onConfirm={handleResolveComplaint}
      />
    </>
  );
};

export default ComplaintManagement;