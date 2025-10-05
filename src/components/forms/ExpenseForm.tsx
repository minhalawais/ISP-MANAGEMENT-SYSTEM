"use client"

import type React from "react"
import { Building, Calendar, FileText, User, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface ExpenseFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

export function ExpenseForm({ formData, handleInputChange, isEditing }: ExpenseFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const expenseTypes = [
    { value: 'operational', label: 'Operational' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' }
  ]

  // Fetch bank accounts on component mount
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const token = getToken()
        const response = await axiosInstance.get('/bank-accounts/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBankAccounts(response.data)
      } catch (error) {
        console.error('Failed to fetch bank accounts', error)
      }
    }

    fetchBankAccounts()
  }, [])

  // Check if bank account field should be shown
  const showBankAccountField = formData.payment_method === 'online' || formData.payment_method === 'bank_transfer'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="expense_type" className="block text-sm font-medium text-deep-ocean">
            Expense Type *
          </label>
          <select
            id="expense_type"
            name="expense_type"
            value={formData.expense_type || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select Expense Type</option>
            {expenseTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-deep-ocean">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-gray/60 font-medium">PKR</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ""}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-12 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="expense_date" className="block text-sm font-medium text-deep-ocean">
            Expense Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="expense_date"
              name="expense_date"
              value={formData.expense_date || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="payment_method" className="block text-sm font-medium text-deep-ocean">
            Payment Method
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="vendor_payee" className="block text-sm font-medium text-deep-ocean">
          Vendor/Payee
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            id="vendor_payee"
            name="vendor_payee"
            value={formData.vendor_payee || ""}
            onChange={handleInputChange}
            placeholder="Enter vendor or payee name"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-deep-ocean">
          Description
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 flex items-start pointer-events-none">
            <FileText className="h-5 w-5 text-slate-gray/60" />
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter expense description"
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>

      {showBankAccountField && (
        <div className="space-y-2">
          <label htmlFor="bank_account_id" className="block text-sm font-medium text-deep-ocean">
            Bank Account *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="bank_account_id"
              name="bank_account_id"
              value={formData.bank_account_id || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required={showBankAccountField}
            >
              <option value="">Select Bank Account</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_title} (****{account.account_number.slice(-4)})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-gray/70 mt-1">
            Required for {formData.payment_method === 'online' ? 'online payments' : 'bank transfers'}
          </p>
        </div>
      )}
    </div>
  )
}