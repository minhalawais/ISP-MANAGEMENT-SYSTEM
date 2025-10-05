"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { FileText, DollarSign, Building, Calendar, CreditCard, Hash, User, ChevronDown, MessageSquare } from "lucide-react"
import {SearchableSelect} from "../SearchableSelect.tsx"

interface PaymentFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isEditing: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  total_amount: number
  customer_internet_id: string
  due_date: string
  status: string
  billing_start_date: string
  billing_end_date: string
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string
}

export function PaymentForm({ formData, handleInputChange, handleSubmit, isEditing }: PaymentFormProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isLoadingBankAccounts, setIsLoadingBankAccounts] = useState(false)

  useEffect(() => {
    // Set default values only when adding new payment
    if (!isEditing) {
      if (!formData.payment_date) {
        handleInputChange({
          target: {
            name: "payment_date",
            value: new Date().toISOString().split("T")[0],
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
      
      // Set default status if not already set
      if (!formData.status) {
        handleInputChange({
          target: {
            name: "status",
            value: "paid",
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }
    
    fetchInvoices()
    fetchEmployees()
    fetchBankAccounts()
  }, [isEditing])

  // When editing, fetch the specific invoice data if invoice_id is present
  useEffect(() => {
    if (isEditing && formData.invoice_id && invoices.length > 0) {
      const selectedInvoice = invoices.find(invoice => invoice.id === formData.invoice_id)
      if (selectedInvoice && !formData.amount) {
        // Auto-fill amount from invoice if not already set
        handleInputChange({
          target: {
            name: "amount",
            value: selectedInvoice.total_amount.toString(),
          },
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }, [formData.invoice_id, invoices, isEditing])

  const fetchBankAccounts = async () => {
    try {
      setIsLoadingBankAccounts(true)
      const token = getToken()
      const response = await axiosInstance.get("/bank-accounts/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBankAccounts(response.data)
    } catch (error) {
      console.error("Failed to fetch bank accounts", error)
    } finally {
      setIsLoadingBankAccounts(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      setIsLoadingInvoices(true)
      const token = getToken()
      const response = await axiosInstance.get("/invoices/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // When editing, show all invoices (including the one being edited)
      // When adding, show only pending invoices
      const filteredInvoices = isEditing 
        ? response.data 
        : response.data.filter((invoice: any) => 
            invoice.status === 'pending' || invoice.status === 'Pending' || invoice.status === 'partially_paid' || invoice.status === 'Partially Paid'
          )
      
      setInvoices(
        filteredInvoices.map((invoice: any) => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          customer_internet_id: invoice.customer_internet_id || "N/A",
          total_amount: invoice.total_amount,
          due_date: invoice.due_date,
          status: invoice.status,
          billing_end_date: invoice.billing_end_date,
          billing_start_date: invoice.billing_start_date,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch invoices", error)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      const token = getToken()
      const response = await axiosInstance.get("/employees/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEmployees(
        response.data.map((employee: any) => ({
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch employees", error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0]
      handleInputChange({
        target: {
          name: "payment_proof",
          value: file,
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedInvoiceId = e.target.value
    const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId)

    handleInputChange(e)

    // Only auto-fill amount when adding new payment, not when editing
    if (selectedInvoice && !isEditing) {
      handleInputChange({
        target: {
          name: "amount",
          value: selectedInvoice.total_amount.toString(),
        },
      } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.invoice_id) newErrors.invoice_id = "Invoice is required"
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Valid amount is required"
    if (!formData.payment_date) newErrors.payment_date = "Payment date is required"
    if (!formData.payment_method) newErrors.payment_method = "Payment method is required"
    if (!formData.status) newErrors.status = "Status is required"
    if (!formData.received_by) newErrors.received_by = "Receiver is required"
    
    // Only require bank account if payment method is bank transfer
    if (formData.payment_method === "bank_transfer" && !formData.bank_account_id) {
      newErrors.bank_account_id = "Bank account is required for bank transfers"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="invoice_id" className="block text-sm font-medium text-deep-ocean">
          Invoice
        </label>
        {isLoadingInvoices ? (
          <div className="w-full pl-10 pr-10 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-electric-blue"></div>
              <span className="ml-2 text-slate-gray/60">Loading invoices...</span>
            </div>
          </div>
        ) : (
          <SearchableSelect
            options={invoices}
            value={formData.invoice_id || ""}
            onChange={handleInvoiceChange}
            error={errors.invoice_id}
            placeholder="Search and select invoice"
          />
        )}
        {errors.invoice_id && <p className="text-coral-red text-xs mt-1">{errors.invoice_id}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              placeholder="Enter amount"
              className={`w-full pl-10 pr-4 py-2.5 border ${
                errors.amount ? "border-coral-red" : "border-slate-gray/20"
              } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200`}
              required
            />
          </div>
          {errors.amount && <p className="text-coral-red text-xs mt-1">{errors.amount}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="payment_date" className="block text-sm font-medium text-deep-ocean">
            Payment Date
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="payment_method" className="block text-sm font-medium text-deep-ocean">
            Payment Method
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-slate-gray/60" />
            </div>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method || ""}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-10 py-2.5 border ${
                errors.payment_method ? "border-coral-red" : "border-slate-gray/20"
              } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-slate-gray/60" />
            </div>
          </div>
          {errors.payment_method && <p className="text-coral-red text-xs mt-1">{errors.payment_method}</p>}
        </div>
        {formData.payment_method === "bank_transfer" && (
          <div className="space-y-2">
            <label htmlFor="bank_account_id" className="block text-sm font-medium text-deep-ocean">
              Bank Account
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
                className={`w-full pl-10 pr-10 py-2.5 border ${
                  errors.bank_account_id ? "border-coral-red" : "border-slate-gray/20"
                } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
              >
                <option value="">Select Bank Account</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_number} ({account.account_title})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-slate-gray/60" />
              </div>
            </div>
            {errors.bank_account_id && <p className="text-coral-red text-xs mt-1">{errors.bank_account_id}</p>}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="transaction_id" className="block text-sm font-medium text-deep-ocean">
            Transaction ID
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

      <div className="space-y-2">
        <label htmlFor="status" className="block text-sm font-medium text-deep-ocean">
          Status
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="status"
            name="status"
            value={formData.status || ""}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-10 py-2.5 border ${
              errors.status ? "border-coral-red" : "border-slate-gray/20"
            } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
            required
          >
            <option value="">Select Status</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
        {errors.status && <p className="text-coral-red text-xs mt-1">{errors.status}</p>}
      </div>

      {formData.status === "cancelled" && (
        <div className="space-y-2">
          <label htmlFor="failure_reason" className="block text-sm font-medium text-deep-ocean">
            Failure Reason
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <MessageSquare className="h-5 w-5 text-slate-gray/60" />
            </div>
            <textarea
              id="failure_reason"
              name="failure_reason"
              value={formData.failure_reason || ""}
              onChange={handleInputChange}
              placeholder="Enter failure reason"
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 resize-y"
            />
          </div>
        </div>
      )}

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

      <div className="space-y-2">
        <label htmlFor="received_by" className="block text-sm font-medium text-deep-ocean">
          Received By
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="received_by"
            name="received_by"
            value={formData.received_by || ""}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-10 py-2.5 border ${
              errors.received_by ? "border-coral-red" : "border-slate-gray/20"
            } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
        {errors.received_by && <p className="text-coral-red text-xs mt-1">{errors.received_by}</p>}
      </div>
    </div>
  )
}
