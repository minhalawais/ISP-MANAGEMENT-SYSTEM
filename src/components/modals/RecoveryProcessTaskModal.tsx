"use client"

import type React from "react"
import { Modal } from "../modal.tsx"

interface ProcessTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const ProcessTaskModal: React.FC<ProcessTaskModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Process Recovery Task">
      <div className="mt-4">
        <p className="text-sm text-[#4A5568]">
          Are you sure you want to start processing this recovery task? This will change the status to "In Progress".
        </p>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-[#4A5568] border border-[#EBF5FF] rounded-lg hover:bg-[#F8FAFC] transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-[#3A86FF] text-white rounded-lg hover:bg-[#2563EB] transition-colors duration-200"
        >
          Start Processing
        </button>
      </div>
    </Modal>
  )
}
