import React from 'react';
import { Modal } from '../modal.tsx';
import { Button } from '../ui/Button.tsx';

interface ProcessComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ProcessComplaintModal: React.FC<ProcessComplaintModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Process Complaint">
      <div className="mt-6">
        <p className="text-base text-gray-600 leading-relaxed">
          Are you sure you want to process this complaint? This will change the status to "In Progress".
        </p>
      </div>
      <div className="mt-8 flex justify-end space-x-3">
        <Button 
          onClick={onClose} 
          className="px-6 py-2 bg-[#E5E1DA] text-[#89A8B2] hover:bg-[#F1F0E8] transition-colors duration-200"
          variant="outline"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          className="px-6 py-2 bg-[#89A8B2] text-white hover:bg-[#B3C8CF] transition-colors duration-200"
        >
          Process Complaint
        </Button>
      </div>
    </Modal>
  );
};
