import React from 'react';
import { Modal } from '../modal.tsx';
import { Button } from '../ui/Button.tsx';

interface ProcessTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ProcessTaskModal: React.FC<ProcessTaskModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Process Task">
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          Are you sure you want to start processing this task? This will change the status to "In Progress".
        </p>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button onClick={onClose} variant="outline">Cancel</Button>
        <Button onClick={onConfirm}>Start Processing</Button>
      </div>
    </Modal>
  );
};

