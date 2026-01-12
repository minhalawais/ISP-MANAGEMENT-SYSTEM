"use client"

import type React from "react"
import { Building, Hash, MapPin, User, CreditCard,DollarSign } from "lucide-react"

interface BankAccountFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function BankAccountForm({ formData, handleInputChange, isEditing }: BankAccountFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="bank_name" className="block text-sm font-medium text-deep-ocean">
            Bank Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="bank_name"
              name="bank_name"
              value={formData.bank_name || ""}
              onChange={handleInputChange}
              placeholder="Enter bank name"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="account_title" className="block text-sm font-medium text-deep-ocean">
            Account Title
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="account_title"
              name="account_title"
              value={formData.account_title || ""}
              onChange={handleInputChange}
              placeholder="Enter account title"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="account_number" className="block text-sm font-medium text-deep-ocean">
            Account Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="account_number"
              name="account_number"
              value={formData.account_number || ""}
              onChange={handleInputChange}
              placeholder="Enter account number"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="iban" className="block text-sm font-medium text-deep-ocean">
            IBAN (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="iban"
              name="iban"
              value={formData.iban || ""}
              onChange={handleInputChange}
              placeholder="Enter IBAN"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="initial_balance" className="block text-sm font-medium text-deep-ocean">
            Initial Balance
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
              type="number"
              id="initial_balance"
              name="initial_balance"
              value={formData.initial_balance || "0.00"}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="branch_code" className="block text-sm font-medium text-deep-ocean">
            Branch Code (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="branch_code"
              name="branch_code"
              value={formData.branch_code || ""}
              onChange={handleInputChange}
              placeholder="Enter branch code"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="is_active" className="block text-sm font-medium text-deep-ocean">
            Status
          </label>
          <select
            id="is_active"
            name="is_active"
            value={formData.is_active === undefined ? "true" : formData.is_active.toString()}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="branch_address" className="block text-sm font-medium text-deep-ocean">
          Branch Address (Optional)
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <MapPin className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="branch_address"
            name="branch_address"
            value={formData.branch_address || ""}
            onChange={handleInputChange}
            placeholder="Enter branch address"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>
    </div>
  )
}