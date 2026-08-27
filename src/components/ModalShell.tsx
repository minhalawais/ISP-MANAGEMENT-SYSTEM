"use client"

import React from "react"
import { X } from "lucide-react"
import { MODAL_BODY, MODAL_HEADER, MODAL_OVERLAY, MODAL_SHELL } from "./ui/modalStyles.ts"

interface ModalShellProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  isLoading?: boolean
  sizeClassName?: string
  footer?: React.ReactNode
}

/** Standalone shell for custom (non-Modal) company-owner dialogs. */
export function ModalShell({
  title,
  onClose,
  children,
  isLoading,
  sizeClassName = "sm:max-w-2xl",
  footer,
}: ModalShellProps) {
  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className={MODAL_OVERLAY} aria-hidden="true" onClick={isLoading ? undefined : onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div
          className={`inline-block align-bottom text-left transform transition-all sm:my-8 sm:align-middle sm:w-full ${sizeClassName} ${MODAL_SHELL}`}
        >
          <div className={`flex items-center justify-between px-5 sm:px-6 py-3.5 border-b ${MODAL_HEADER}`}>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-colors p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={MODAL_BODY}>{children}</div>
          {footer ? (
            <div className="px-5 sm:px-6 py-3.5 bg-slate-100 border-t border-slate-200/80">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
