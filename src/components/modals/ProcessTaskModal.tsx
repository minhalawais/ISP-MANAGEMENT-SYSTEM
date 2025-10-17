"use client"

import type React from "react"
import { Modal } from "../modal.tsx"
import { CheckCircle, AlertCircle } from "lucide-react"

interface ProcessTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export const ProcessTaskModal: React.FC<ProcessTaskModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Process Task" size="sm">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#89A8B2]/10">
              <AlertCircle className="h-6 w-6 text-[#89A8B2]" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#2C3E50] mb-2">Confirm Action</h3>
            <p className="text-sm text-[#5A6C7D] leading-relaxed">
              Are you sure you want to start processing this task? This will change the status to "In Progress" and
              cannot be undone immediately.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-[#B3C8CF]/20">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-white text-[#89A8B2] border-2 border-[#B3C8CF] rounded-lg hover:bg-[#F1F0E8] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#89A8B2] to-[#7A96A3] text-white rounded-lg hover:shadow-lg hover:shadow-[#89A8B2]/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Start Processing
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
