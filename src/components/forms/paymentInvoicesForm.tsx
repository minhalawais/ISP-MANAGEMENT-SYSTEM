"use client"

import type React from "react"
import { CreditCard, Calendar, DollarSign, FileText, User, Tag } from "lucide-react"

interface PaymentInvoiceFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function PaymentInvoiceForm({ formData, handleInputChange, isEditing }: PaymentInvoiceFormProps) {
  const inputClasses = `
    w-full 
    pl-10 
    pr-4 
    py-3 
    border 
    border-[#EBF5FF] 
    rounded-lg 
    shadow-sm 
    bg-white 
    text-[#4A5568] 
    placeholder-[#4A5568]/60
    focus:ring-2 
    focus:ring-[#3A86FF]/30 
    focus:border-[#3A86FF] 
    transition-all 
    duration-200
  `

  const selectClasses = `
    w-full 
    pl-10 
    pr-10 
    py-3 
    border 
    border-[#EBF5FF] 
    rounded-lg 
    shadow-sm 
    bg-white 
    text-[#4A5568]
    appearance-none
    focus:ring-2 
    focus:ring-[#3A86FF]/30 
    focus:border-[#3A86FF] 
    transition-all 
    duration-200
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="%234A5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>')]
    bg-right-4
    bg-center-y
  `

  const labelClasses = "block text-sm font-medium text-[#2A5C8A] mb-1"
  const iconClasses = "h-5 w-5 text-[#4A5568]/60"

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className={labelClasses}>Payment Type</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className={iconClasses} />
          </div>
          <select
            name="payment_type"
            value={formData.payment_type || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Payment Type</option>
            <option value="subscription">Subscription</option>
            <option value="installation">Installation</option>
            <option value="equipment">Equipment</option>
            <option value="late_fee">Late Fee</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className={iconClasses} />
          </div>
          <input
            type="number"
            name="amount"
            value={formData.amount || ""}
            onChange={handleInputChange}
            placeholder="Enter amount"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Payment Date</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className={iconClasses} />
          </div>
          <input
            type="date"
            name="payment_date"
            value={formData.payment_date || ""}
            onChange={handleInputChange}
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Payment Method</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className={iconClasses} />
          </div>
          <select
            name="payment_method"
            value={formData.payment_method || ""}
            onChange={handleInputChange}
            className={selectClasses}
            required
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Customer ID</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className={iconClasses} />
          </div>
          <input
            type="text"
            name="customer_id"
            value={formData.customer_id || ""}
            onChange={handleInputChange}
            placeholder="Enter customer ID"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <FileText className={iconClasses} />
          </div>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter payment description"
            className={`${inputClasses} resize-y min-h-[120px]`}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
