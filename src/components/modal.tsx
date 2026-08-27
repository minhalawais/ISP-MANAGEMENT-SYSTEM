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
  /** Override header background/border classes */
  headerClassName?: string
  /** Title/close color. Defaults to dark when headerClassName is set, else light (white on brand). */
  headerTone?: "light" | "dark"
}

export function Modal({
  isVisible,
  onClose,
  title,
  children,
  isLoading,
  size = "md",
  headerClassName,
  headerTone,
}: ModalProps) {
  if (!isVisible) return null

  const sizeClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-2xl",
    lg: "sm:max-w-4xl",
    xl: "sm:max-w-6xl",
  }

  const resolvedTone =
    headerTone ||
    (headerClassName &&
    (headerClassName.includes("bg-white") ||
      headerClassName.includes("bg-slate") ||
      headerClassName.includes("E8EEF1") ||
      headerClassName.includes("F1F0E8") ||
      headerClassName.includes("bg-gray"))
      ? "dark"
      : "light")

  const isDarkText = resolvedTone === "dark"

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out"
          aria-hidden="true"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-slate-100 rounded-xl text-left overflow-hidden shadow-2xl border border-slate-300/70 transform transition-all duration-300 ease-out sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-300`}
        >
          <div
            className={`flex items-center justify-between px-5 sm:px-6 py-3.5 border-b ${
              headerClassName || "bg-[#2A5C8A] border-[#1e4568]"
            }`}
          >
            <h3
              className={`text-base sm:text-lg font-semibold tracking-tight ${
                isDarkText ? "text-slate-800" : "text-white"
              }`}
              id="modal-title"
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`transition-colors duration-150 p-1.5 rounded-md focus:outline-none focus:ring-2 ${
                isDarkText
                  ? "text-slate-500 hover:text-slate-800 hover:bg-black/5 focus:ring-slate-200"
                  : "text-white/80 hover:text-white hover:bg-white/10 focus:ring-white/30"
              }`}
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar bg-slate-100">
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
