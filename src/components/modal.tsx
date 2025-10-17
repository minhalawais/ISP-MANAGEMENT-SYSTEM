"use client"

import React from "react"
import { X } from "lucide-react"

interface ModalProps {
  isVisible: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  isLoading?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isVisible, onClose, title, children, isLoading, size = "md" }: ModalProps) {
  if (!isVisible) return null

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-2xl",
    lg: "sm:max-w-4xl",
    xl: "sm:max-w-6xl",
  }

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-300`}
        >
          <div className="bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] px-6 sm:px-8 py-5 sm:py-6 border-b border-[#B3C8CF]/20 flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-bold text-white" id="modal-title">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="px-6 sm:px-8 py-6 sm:py-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar bg-[#F1F0E8]">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === "form") {
                return React.cloneElement(child, { isLoading })
              }
              return child
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
