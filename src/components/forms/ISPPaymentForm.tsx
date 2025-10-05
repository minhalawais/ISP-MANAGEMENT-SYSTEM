"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { FileText, DollarSign, Building, Calendar, CreditCard, Hash, User, ChevronDown, MessageSquare, Wifi } from "lucide-react"

interface ISPPaymentFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isEditing: boolean
}

interface ISP {
  id: string
  name: string
  contact_person: string
  email: string
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string
}

export function ISPPaymentForm({ formData, handleInputChange, handleSubmit, isEditing }: ISPPaymentFormProps) {
  const [isps, setISPs] = useState<ISP[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!formData.payment_date) {
      handleInputChange({
        target: {
          name: "payment_date",
          value: new Date().toISOString().split("T")[0],
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    
    // Set default billing period to current month
    if (!formData.billing_period) {
      const now = new Date()
      const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      handleInputChange({
        target: {
          name: "billing_period",
          value: billingPeriod,
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    
    // Set default payment method
    if (!formData.payment_method) {
      handleInputChange({
        target: {
          name: "payment_method",
          value: "bank_transfer",
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
    
    fetchISPs()
    fetchBankAccounts()
  }, [])

  const fetchISPs = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/isps/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setISPs(response.data.filter((isp: any) => isp.is_active))
    } catch (error) {
      console.error("Failed to fetch ISPs", error)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/bank-accounts/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBankAccounts(response.data.filter((account: any) => account.is_active))
    } catch (error) {
      console.error("Failed to fetch bank accounts", error)
    }
  }

// Add this function to handle file uploads before form submission
const handleFileUpload = async (file: File, fileType: string): Promise<string | null> => {
  try {
    const token = getToken()
    const formData = new FormData()
    formData.append(fileType, file)

    const response = await axiosInstance.post(`/isp-payments/upload-file/${fileType}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })

    if (response.data.success) {
      return response.data.file_path
    }
    return null
  } catch (error) {
    console.error(`Error uploading ${fileType}:`, error)
    return null
  }
}

// Update the handleFileChange function
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0]
    
    // Upload file immediately and get file path
    const filePath = await handleFileUpload(file, "payment_proof")
    
    if (filePath) {
      handleInputChange({
        target: {
          name: "payment_proof",
          value: filePath, // Store file path string
        },
      } as React.ChangeEvent<HTMLInputElement>)
    } else {
      alert("Failed to upload payment proof")
    }
  }
}

  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e)
    // Clear usage fields when changing payment type
    if (e.target.value !== 'bandwidth_usage') {
      handleInputChange({
        target: { name: "bandwidth_usage_gb", value: "" },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleBankAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e)
    // Auto-set payment method to bank_transfer when bank account is selected
    if (e.target.value) {
      handleInputChange({
        target: {
          name: "payment_method",
          value: "bank_transfer",
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const calculateAmountFromUsage = () => {
    if (formData.bandwidth_usage_gb) {
      // For bandwidth usage, you can calculate based on your business logic
      // For now, we'll keep it manual or you can set a default rate
      // Remove this function if you don't need automatic calculation
    }
  }

  return (
    <div className="space-y-6">
      {/* ISP Selection */}
      <div className="space-y-2">
        <label htmlFor="isp_id" className="block text-sm font-medium text-deep-ocean">
          ISP *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="isp_id"
            name="isp_id"
            value={formData.isp_id || ""}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-10 py-2.5 border ${
              errors.isp_id ? "border-coral-red" : "border-slate-gray/20"
            } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
            required
          >
            <option value="">Select ISP *</option>
            {isps.map((isp) => (
              <option key={isp.id} value={isp.id}>
                {isp.name} - {isp.contact_person}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
        {errors.isp_id && <p className="text-coral-red text-xs mt-1">{errors.isp_id}</p>}
      </div>

      {/* Payment Type and Bank Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="payment_type" className="block text-sm font-medium text-deep-ocean">
            Payment Type *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="payment_type"
              name="payment_type"
              value={formData.payment_type || ""}
              onChange={handlePaymentTypeChange}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
              required
            >
              <option value="">Select Payment Type *</option>
              <option value="monthly_subscription">Monthly Subscription</option>
              <option value="bandwidth_usage">Bandwidth Usage</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-gray/60" />
            </div>
          </div>
        </div>

        {/* Bank Account - Conditionally Required */}
<div className="space-y-2">
  <label htmlFor="bank_account_id" className="block text-sm font-medium text-deep-ocean">
    Bank Account {formData.payment_method === "bank_transfer" ? "*" : "(Optional)"}
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <CreditCard className="h-5 w-5 text-slate-gray/60" />
    </div>
    <select
      id="bank_account_id"
      name="bank_account_id"
      value={formData.bank_account_id || ""}
      onChange={handleBankAccountChange}
      className={`w-full pl-10 pr-10 py-2.5 border ${
        errors.bank_account_id && formData.payment_method === "bank_transfer" 
          ? "border-coral-red" 
          : "border-slate-gray/20"
      } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
      required={formData.payment_method === "bank_transfer"}
    >
      <option value="">Select Bank Account {formData.payment_method === "bank_transfer" ? "*" : "(Optional)"}</option>
      {bankAccounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.bank_name} - {account.account_number}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <ChevronDown className="h-5 w-5 text-slate-gray/60" />
    </div>
  </div>
  {errors.bank_account_id && formData.payment_method === "bank_transfer" && (
    <p className="text-coral-red text-xs mt-1">{errors.bank_account_id}</p>
  )}
</div>
      </div>

      {/* Bandwidth Usage Field - Conditionally Shown */}
      {formData.payment_type === "bandwidth_usage" && (
        <div className="grid grid-cols-1 gap-6 p-4 bg-light-sky/20 rounded-lg border border-electric-blue/20">
          <div className="space-y-2">
            <label htmlFor="bandwidth_usage_gb" className="block text-sm font-medium text-deep-ocean">
              Bandwidth Usage (GB) - Optional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wifi className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input
                type="number"
                id="bandwidth_usage_gb"
                name="bandwidth_usage_gb"
                value={formData.bandwidth_usage_gb || ""}
                onChange={handleInputChange}
                placeholder="Enter GB usage (optional)"
                step="0.01"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-white text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Amount Field */}
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
            placeholder="Enter amount"
            step="0.01"
            className={`w-full pl-10 pr-4 py-2.5 border ${
              errors.amount ? "border-coral-red" : "border-slate-gray/20"
            } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200`}
            required
          />
        </div>
        {errors.amount && <p className="text-coral-red text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Date and Billing Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="payment_date" className="block text-sm font-medium text-deep-ocean">
            Payment Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="date"
              id="payment_date"
              name="payment_date"
              value={formData.payment_date || ""}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-2.5 border ${
                errors.payment_date ? "border-coral-red" : "border-slate-gray/20"
              } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200`}
              required
            />
          </div>
          {errors.payment_date && <p className="text-coral-red text-xs mt-1">{errors.payment_date}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="billing_period" className="block text-sm font-medium text-deep-ocean">
            Billing Period *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="month"
              id="billing_period"
              name="billing_period"
              value={formData.billing_period || ""}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-2.5 border ${
                errors.billing_period ? "border-coral-red" : "border-slate-gray/20"
              } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200`}
              required
            />
          </div>
          {errors.billing_period && <p className="text-coral-red text-xs mt-1">{errors.billing_period}</p>}
        </div>
      </div>

      {/* Description and Reference */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-deep-ocean">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          placeholder="Enter payment description (optional)"
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-vertical"
        />
      </div>

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

      {/* Payment Method and Transaction ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="payment_method" className="block text-sm font-medium text-deep-ocean">
            Payment Method *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method || "bank_transfer"}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-gray/60" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="transaction_id" className="block text-sm font-medium text-deep-ocean">
            Transaction ID (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="transaction_id"
              name="transaction_id"
              value={formData.transaction_id || ""}
              onChange={handleInputChange}
              placeholder="Enter transaction ID"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Payment Proof */}
      <div className="space-y-2">
        <label htmlFor="payment_proof" className="block text-sm font-medium text-deep-ocean">
          Payment Proof
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-gray/20 border-dashed rounded-lg hover:border-electric-blue/30 transition-colors bg-light-sky/30">
          <div className="space-y-1 text-center">
            <div className="flex text-sm text-slate-gray">
              <input
                id="payment_proof"
                name="payment_proof"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-gray file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-electric-blue file:text-white hover:file:bg-btn-hover transition-all duration-200"
                accept=".png,.jpg,.jpeg,.pdf"
              />
            </div>
            <p className="text-xs text-slate-gray">PNG, JPG, JPEG, or PDF up to 10MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}