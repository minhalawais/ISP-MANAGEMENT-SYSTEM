"use client"

import type React from "react"
import { useState } from "react"
import { Modal } from "../modal.tsx"

interface CompleteTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { notes: string }) => void
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState("")

  const handleConfirm = () => {
    onConfirm({ notes })
    setNotes("")
  }

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Complete Recovery Task">
      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#4A5568]">
            Please provide any final notes or comments about the recovery task completion.
          </p>
          <p className="text-xs text-[#4A5568]/70">
            Include any important details about the recovery process or any follow-up actions required.
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
              border-[#EBF5FF]
              rounded-lg
              placeholder-[#4A5568]/60
              text-[#4A5568]
              focus:border-[#3A86FF]
              focus:ring-2
              focus:ring-[#3A86FF]/20
              transition-colors
              duration-200
              resize-none
              disabled:bg-[#F8FAFC]
              disabled:text-[#4A5568]/50
              disabled:cursor-not-allowed
            "
          />
          <div className="absolute bottom-3 right-3 text-xs text-[#4A5568]/60">{notes.length}/500</div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-medium text-[#4A5568] bg-white border border-[#EBF5FF] rounded-lg hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A86FF] transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!notes.trim()}
          className="px-5 py-2 text-sm font-medium text-white bg-[#3A86FF] rounded-lg hover:bg-[#2563EB] disabled:bg-[#3A86FF]/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A86FF] transition-colors duration-200"
        >
          Complete Recovery Task
        </button>
      </div>
    </Modal>
  )
}
