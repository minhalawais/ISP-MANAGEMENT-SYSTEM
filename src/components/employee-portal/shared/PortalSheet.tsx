"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"

interface PortalSheetProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidthClassName?: string
  /** Hide entirely at the lg breakpoint — use when a persistent desktop side panel replaces the dialog. */
  hideOnDesktop?: boolean
}

/**
 * Modal that renders as a bottom sheet (slide up, rounded top, drag handle)
 * on mobile and a centered dialog on large screens.
 */
export function PortalSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClassName = "lg:max-w-md",
  hideOnDesktop = false,
}: PortalSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center ${
        hideOnDesktop ? "lg:hidden" : ""
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full ${maxWidthClassName} max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl animate-sheetUp lg:max-h-[90vh] lg:animate-none lg:rounded-2xl`}
      >
        <div className="flex justify-center pt-2 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
