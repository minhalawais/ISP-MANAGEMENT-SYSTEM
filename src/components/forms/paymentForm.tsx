"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { FileText, DollarSign, Calendar, CreditCard, Hash, User, ChevronDown, MessageSquare } from "lucide-react"

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
}

export function PaymentForm({ formData, handleInputChange, handleSubmit, isEditing }: PaymentFormProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchInvoices()
    fetchEmployees()
  }, [])

  const fetchInvoices = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/invoices/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInvoices(
        response.data.map((invoice: any) => ({
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customer_name,
          total_amount: invoice.total_amount,
        })),
      )
    } catch (error) {
      console.error("Failed to fetch invoices", error)
    }
  }

  const fetchEmployees = async () => {
    try {
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

    if (selectedInvoice) {
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
    if (!formData.amount) newErrors.amount = "Amount is required"
    if (!formData.payment_date) newErrors.payment_date = "Payment date is required"
    if (!formData.payment_method) newErrors.payment_method = "Payment method is required"
    if (!formData.status) newErrors.status = "Status is required"
    if (!formData.received_by) newErrors.received_by = "Receiver is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="invoice_id" className="block text-sm font-medium text-deep-ocean">
          Invoice
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="invoice_id"
            name="invoice_id"
            value={formData.invoice_id || ""}
            onChange={handleInvoiceChange}
            className={`w-full pl-10 pr-10 py-2.5 border ${
              errors.invoice_id ? "border-coral-red" : "border-slate-gray/20"
            } rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none`}
            required
          >
            <option value="">Select Invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {`${invoice.invoice_number} - ${invoice.customer_name}`}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
        {errors.invoice_id && <p className="text-coral-red text-xs mt-1">{errors.invoice_id}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="amount" className="block text-sm font-medium text-deep-ocean">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-slate-gray/60" />
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
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
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
