import React, { useState } from 'react';
import { Modal } from '../modal.tsx';
import { Button } from '../ui/Button.tsx';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { notes: string }) => void;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm({ notes });
    setNotes('');
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Complete Task">
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Please provide any final notes or comments about the task completion.
          </p>
          <p className="text-xs text-gray-500">
            Include any important details about the resolution or any follow-up actions required.
          </p>
        </div>
        
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter completion notes..."
            rows={4}
            className="
              w-full
              px-4
              py-3
              text-sm
              border
              border-gray-300
              rounded-lg
              placeholder-gray-400
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-500/20
              transition-colors
              duration-200
              resize-none
              disabled:bg-gray-50
              disabled:text-gray-500
              disabled:cursor-not-allowed
            "
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {notes.length}/500
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <Button 
          onClick={onClose} 
          variant="outline"
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={!notes.trim()}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Complete Task
        </Button>
      </div>
    </Modal>
  );
};

