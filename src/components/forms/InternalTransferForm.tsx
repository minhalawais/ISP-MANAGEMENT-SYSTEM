"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Building, Calendar, Hash, FileText, ChevronDown } from "lucide-react"

interface InternalTransferFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  isEditing: boolean
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  current_balance: number
}

const getPakistaniDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

export function InternalTransferForm({ formData, handleInputChange, isEditing }: InternalTransferFormProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const fetchBankAccounts = useCallback(async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/bank-accounts/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBankAccounts(response.data)
    } catch (error) {
      console.error("Failed to fetch bank accounts", error)
    }
  }, [])

  useEffect(() => {
    fetchBankAccounts()
  }, [fetchBankAccounts])

  useEffect(() => {
    if (!isEditing) {
      if (!formData.transfer_date) {
        handleInputChange({
          target: {
            name: "transfer_date",
            value: getPakistaniDate(),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }, [isEditing, formData.transfer_date, handleInputChange])

  // Validate that source and destination are different
  useEffect(() => {
    if (formData.from_account_id && formData.to_account_id) {
        if (formData.from_account_id === formData.to_account_id) {
            setErrors(prev => ({ ...prev, to_account_id: "Source and destination accounts must be different" }))
        } else {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.to_account_id
                return newErrors
            })
        }
    }
  }, [formData.from_account_id, formData.to_account_id])

  const getSourceBalance = () => {
      const account = bankAccounts.find(acc => acc.id === formData.from_account_id)
      return account ? account.current_balance : 0
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From Account */}
        <div className="space-y-2">
          <label htmlFor="from_account_id" className="block text-sm font-medium text-deep-ocean">
            From Account
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="from_account_id"
              name="from_account_id"
              value={formData.from_account_id || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
              required
            >
              <option value="">Select Source Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_number} ({account.current_balance?.toLocaleString()})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-gray/60" />
            </div>
          </div>
        </div>

        {/* To Account */}
        <div className="space-y-2">
          <label htmlFor="to_account_id" className="block text-sm font-medium text-deep-ocean">
            To Account
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="to_account_id"
              name="to_account_id"
              value={formData.to_account_id || ""}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-10 py-2.5 border ${errors.to_account_id ? "border-coral-red" : "border-slate-gray/20"} rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
              required
            >
              <option value="">Select Destination Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id} disabled={account.id === formData.from_account_id}>
                  {account.bank_name} - {account.account_number}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-gray/60" />
            </div>
          </div>
          {errors.to_account_id && <p className="text-coral-red text-xs mt-1">{errors.to_account_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-deep-ocean">
            Amount
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
              max={getSourceBalance()}
              placeholder="Enter amount"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          {formData.from_account_id && (
              <p className="text-xs text-slate-gray mt-1">
                  Available Balance: PKR {getSourceBalance()?.toLocaleString()}
              </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label htmlFor="transfer_date" className="block text-sm font-medium text-deep-ocean">
            Transfer Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="transfer_date"
              name="transfer_date"
              value={formData.transfer_date || ""}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>
      </div>

      {/* Description */}
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
            placeholder="Enter transfer description"
            rows={2}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>
      </div>

      {/* Reference Number */}
      <div className="space-y-2">
        <label htmlFor="reference_number" className="block text-sm font-medium text-deep-ocean">
          Reference Number (Optional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Hash className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            id="reference_number"
            name="reference_number"
            value={formData.reference_number || ""}
            onChange={handleInputChange}
            placeholder="Enter reference number"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
    </div>
  )
}
