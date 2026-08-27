"use client"

import { Copy } from "lucide-react"
import { MODAL_PRIMARY_BTN, MODAL_INPUT, MODAL_LABEL } from "../ui/modalStyles.ts"
import { ModalShell } from "../ModalShell.tsx"

interface CredentialsModalProps {
  isVisible: boolean
  onClose: () => void
  title?: string
  credentials: {
    username: string
    password: string
    email: string
  }
}

export function CredentialsModal({ isVisible, onClose, credentials, title }: CredentialsModalProps) {
  if (!isVisible) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <ModalShell title={title || "Account Credentials"} onClose={onClose} sizeClassName="sm:max-w-md">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
        {[
          { label: "Username", value: credentials.username },
          { label: "Password", value: credentials.password },
          { label: "Email", value: credentials.email },
        ].map((row) => (
          <div key={row.label}>
            <label className={MODAL_LABEL}>{row.label}</label>
            <div className="flex rounded-md shadow-sm">
              <input type="text" readOnly value={row.value} className={`${MODAL_INPUT} rounded-r-none`} />
              <button
                type="button"
                onClick={() => copyToClipboard(row.value)}
                className="inline-flex items-center px-3 border border-l-0 border-slate-300 rounded-r-md bg-[#E8EEF1] text-[#2A5C8A] hover:bg-[#dce6ea]"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="pt-2 flex justify-end">
          <button type="button" onClick={onClose} className={MODAL_PRIMARY_BTN}>
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
