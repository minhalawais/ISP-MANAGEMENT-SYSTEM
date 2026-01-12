"use client"

import type React from "react"
import { X, Receipt, Calendar, CreditCard, DollarSign } from "lucide-react"

interface LineItem {
  id: string
  item_type: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
}

interface PaymentSummary {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
}

interface InvoiceData {
  id: string
  invoice_number: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  subtotal: number
  discount_percentage: number
  total_amount: number
  total_paid: number
  remaining: number
  invoice_type: string
  status: string
  notes?: string
  line_items: LineItem[]
  payments: PaymentSummary[]
}

interface Props {
  invoice: InvoiceData
  onClose: () => void
}

export const InvoiceDetailModal: React.FC<Props> = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ backgroundColor: '#89A8B2' }}>
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Invoice Details</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Status Banner */}
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Invoice #{invoice.invoice_number}</p>
              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                <span>Issued: {new Date(invoice.billing_start_date).toLocaleDateString()}</span>
                <span>•</span>
                <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize
              ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                invoice.status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {invoice.status}
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Usage & Charges</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#E5E1DA]/30">
                  <tr className="text-left">
                    <th className="py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 text-right">Qty</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 text-right">Rate</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1DA]/50">
                  {invoice.line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 text-gray-800">
                        <div className="font-medium">{item.item_type}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{item.line_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="py-2 px-4 text-right text-gray-600">Subtotal</td>
                    <td className="py-2 px-4 text-right font-medium">{invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  {invoice.discount_percentage > 0 && (
                     <tr>
                      <td colSpan={3} className="py-2 px-4 text-right text-emerald-600">Discount ({invoice.discount_percentage}%)</td>
                      <td className="py-2 px-4 text-right font-medium text-emerald-600">
                        -{((invoice.subtotal * invoice.discount_percentage) / 100).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="py-3 px-4 text-right font-bold text-gray-900">Total Due</td>
                    <td className="py-3 px-4 text-right font-bold text-[#2A5C8A] text-lg">
                      PKR {invoice.total_amount.toFixed(0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Payment History</h4>
              <div className="space-y-2">
                {invoice.payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900">Payment via {payment.payment_method}</p>
                        <p className="text-xs text-emerald-600">{new Date(payment.payment_date).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700">PKR {payment.amount.toFixed(0)}</span>
                  </div>
                ))}
                
                {invoice.remaining > 0 && (
                   <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 mt-2">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-red-900">Remaining Balance</span>
                    </div>
                    <span className="font-bold text-red-700">PKR {invoice.remaining.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {invoice.notes && (
             <div className="px-6 pb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{invoice.notes}</p>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
            Close
          </button>
           <button className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-colors flex items-center gap-2" style={{ backgroundColor: '#2A5C8A' }}>
             Download PDF
           </button>
        </div>
      </div>
    </div>
  )
}
