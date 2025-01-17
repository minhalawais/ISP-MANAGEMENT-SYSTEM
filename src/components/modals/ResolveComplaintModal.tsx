import React, { useState } from 'react';
import { Modal } from '../modal.tsx';
import { Button } from '../ui/Button.tsx';

interface ResolveComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { notes: string, resolutionProof: File | null }) => void;
}

export const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');
  const [resolutionProof, setResolutionProof] = useState<File | null>(null);

  const handleConfirm = () => {
    onConfirm({ notes, resolutionProof });
    setNotes('');
    setResolutionProof(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResolutionProof(e.target.files[0]);
    }
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Resolve Complaint">
      <div className="mt-6 space-y-4">
        <label 
          htmlFor="resolution-notes" 
          className="block text-base font-medium text-[#89A8B2]"
        >
          Resolution Notes
        </label>
        <div className="relative">
          <textarea
            id="resolution-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 text-gray-700 bg-white border-2 border-[#B3C8CF] rounded-lg focus:border-[#89A8B2] focus:ring-2 focus:ring-[#89A8B2] focus:ring-opacity-20 transition-colors duration-200 resize-none placeholder:text-[#B3C8CF]"
            placeholder="Enter the resolution details..."
          />
          <div className="absolute bottom-3 right-3 text-sm text-[#B3C8CF]">
            {notes.length}/500
          </div>
        </div>
        <p className="text-sm text-[#B3C8CF]">
          Please provide detailed notes about how the complaint was resolved
        </p>

        <div className="mt-4">
          <label 
            htmlFor="resolution-proof" 
            className="block text-base font-medium text-[#89A8B2]"
          >
            Resolution Proof
          </label>
          <input
            type="file"
            id="resolution-proof"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-[#89A8B2] file:text-white
              hover:file:bg-[#B3C8CF]"
          />
        </div>
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
          onClick={handleConfirm}
          disabled={!notes.trim()}
          className="px-6 py-2 bg-[#89A8B2] text-white hover:bg-[#B3C8CF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Resolve Complaint
        </Button>
      </div>
    </Modal>
  );
};

