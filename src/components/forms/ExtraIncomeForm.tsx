"use client"

import type React from "react"
import { Building, Calendar, FileText, User, CreditCard, Settings, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface ExtraIncomeFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
  onManageIncomeTypes?: () => void
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
}

interface ExtraIncomeType {
  id: string
  name: string
  description: string
  is_active: boolean
}

export function ExtraIncomeForm({ formData, handleInputChange, isEditing, onManageIncomeTypes }: ExtraIncomeFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [incomeTypes, setIncomeTypes] = useState<ExtraIncomeType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Payment' }
  ]

  // Fetch bank accounts and income types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken()
        
        // Fetch bank accounts
        const bankResponse = await axiosInstance.get('/bank-accounts/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBankAccounts(bankResponse.data)

        // Fetch income types
        const incomeTypesResponse = await axiosInstance.get('/extra-income-types/list', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIncomeTypes(incomeTypesResponse.data.filter((type: ExtraIncomeType) => type.is_active))
      } catch (error) {
        console.error('Failed to fetch data', error)
      }
    }

    fetchData()
  }, [])

  // Check if bank account field should be shown
  const showBankAccountField = formData.payment_method === 'online' || formData.payment_method === 'bank_transfer'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="income_type_id" className="block text-sm font-medium text-deep-ocean">
              Income Type *
            </label>
            <button
              type="button"
              onClick={onManageIncomeTypes}
              className="text-xs text-electric-blue hover:text-btn-hover flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Manage Types
            </button>
          </div>
          <select
            id="income_type_id"
            name="income_type_id"
            value={formData.income_type_id || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select Income Type</option>
            {incomeTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
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
          <label htmlFor="income_date" className="block text-sm font-medium text-deep-ocean">
            Income Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="income_date"
              name="income_date"
              value={formData.income_date || ""}
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
        <label htmlFor="payer" className="block text-sm font-medium text-deep-ocean">
          Payer
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            id="payer"
            name="payer"
            value={formData.payer || ""}
            onChange={handleInputChange}
            placeholder="Enter payer name"
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
            placeholder="Enter income description"
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