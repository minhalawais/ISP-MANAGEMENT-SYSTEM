"use client"

import type React from "react"
import { useState } from "react"
import { Modal } from "../modal.tsx"
import { Upload } from "lucide-react"

interface ResolveComplaintModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { notes: string; resolutionProof: File | null }) => void
}

export const ResolveComplaintModal: React.FC<ResolveComplaintModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [notes, setNotes] = useState("")
  const [resolutionProof, setResolutionProof] = useState<File | null>(null)

  const handleConfirm = () => {
    onConfirm({ notes, resolutionProof })
    setNotes("")
    setResolutionProof(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResolutionProof(e.target.files[0])
    }
  }

  return (
    <Modal isVisible={isOpen} onClose={onClose} title="Resolve Complaint">
      <div className="mt-6 space-y-4">
        <label htmlFor="resolution-notes" className="block text-base font-medium text-[#2A5C8A]">
          Resolution Notes
        </label>
        <div className="relative">
          <textarea
            id="resolution-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 text-[#4A5568] bg-white border border-[#EBF5FF] rounded-lg focus:border-[#3A86FF] focus:ring-2 focus:ring-[#3A86FF]/20 transition-colors duration-200 resize-none placeholder:text-[#4A5568]/60"
            placeholder="Enter the resolution details..."
          />
          <div className="absolute bottom-3 right-3 text-sm text-[#4A5568]/60">{notes.length}/500</div>
        </div>
        <p className="text-sm text-[#4A5568]/70">Please provide detailed notes about how the complaint was resolved</p>

        <div className="mt-4">
          <label htmlFor="resolution-proof" className="block text-base font-medium text-[#2A5C8A]">
            Resolution Proof
          </label>
          <div className="mt-2 flex items-center">
            <label
              htmlFor="resolution-proof"
              className="flex items-center justify-center px-4 py-2 border border-[#EBF5FF] rounded-lg cursor-pointer bg-white text-[#4A5568] hover:bg-[#EBF5FF] transition-colors"
            >
              <Upload className="h-5 w-5 mr-2 text-[#3A86FF]" />
              <span>{resolutionProof ? resolutionProof.name : "Choose file"}</span>
              <input type="file" id="resolution-proof" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          {resolutionProof && <p className="mt-2 text-sm text-[#10B981]">File selected: {resolutionProof.name}</p>}
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-white text-[#4A5568] border border-[#EBF5FF] rounded-lg hover:bg-[#F8FAFC] transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!notes.trim()}
          className="px-6 py-2 bg-[#3A86FF] text-white rounded-lg hover:bg-[#2563EB] disabled:bg-[#3A86FF]/50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Resolve Complaint
        </button>
      </div>
    </Modal>
  )
}
