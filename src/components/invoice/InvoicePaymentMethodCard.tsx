import React from "react"
import { getAssetUrl } from "../../utils/auth.ts"

export type InvoicePaymentBankAccount = {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string | null
  branch_code?: string | null
  qr_code_image?: string | null
}

type InvoicePaymentMethodCardProps = {
  account: InvoicePaymentBankAccount
}

/**
 * Dark payment-method card used on authenticated + public invoice views.
 * Shows optional bank QR on the right when uploaded.
 */
export function InvoicePaymentMethodCard({ account }: InvoicePaymentMethodCardProps) {
  const qrUrl = getAssetUrl(account.qr_code_image)

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 text-white">
      <div className={`flex gap-4 ${qrUrl ? "items-start" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-300 uppercase tracking-wider mb-2">{account.bank_name}</p>
          <p className="font-bold text-lg mb-3 leading-snug">{account.account_title}</p>
          <div className="space-y-1 text-sm text-slate-200">
            <p>
              <span className="text-slate-400">A/C:</span> {account.account_number}
            </p>
            {account.iban ? (
              <p className="break-all">
                <span className="text-slate-400">IBAN:</span> {account.iban}
              </p>
            ) : null}
            {account.branch_code ? (
              <p>
                <span className="text-slate-400">Branch:</span> {account.branch_code}
              </p>
            ) : null}
          </div>
        </div>

        {qrUrl ? (
          <div className="shrink-0 text-center">
            <div className="bg-white rounded-lg p-1.5 shadow-sm border border-white/20">
              <img
                src={qrUrl}
                alt={`${account.bank_name} payment QR`}
                className="h-24 w-24 object-contain"
              />
            </div>
            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-300">Scan to pay</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
