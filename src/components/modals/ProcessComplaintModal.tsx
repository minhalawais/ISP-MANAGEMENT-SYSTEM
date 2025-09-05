"use client"

import type React from "react"
import { Modal } from "../modal.tsx"

interface ProcessComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ProcessComplaintModal: React.FC<ProcessComplaintModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Process Complaint">
      <div className="mt-6">
        <p className="text-base text-[#4A5568] leading-relaxed">
          Are you sure you want to process this complaint? This will change the status to "In Progress".
        </p>
      </div>
      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-white text-[#4A5568] border border-[#EBF5FF] rounded-lg hover:bg-[#F8FAFC] transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-[#3A86FF] text-white rounded-lg hover:bg-[#2563EB] transition-colors duration-200"
        >
          Process Complaint
        </button>
      </div>
    </Modal>
  )
}
