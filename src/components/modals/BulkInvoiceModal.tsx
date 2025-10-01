"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Users, CheckCircle, XCircle, Loader, AlertCircle, Check, X, FileText } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface CustomerPreview {
  id: string
  name: string
  internet_id: string
  service_plan_name: string
  service_plan_price: number
  discount_amount: number
  discount_percentage: number
  total_amount: number
  billing_start_date: string
  billing_end_date: string
  due_date: string
  has_existing_invoice: boolean
  existing_invoice_number?: string
}

interface BulkInvoiceModalProps {
  isVisible: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkInvoiceModal({ isVisible, onClose, onSuccess }: BulkInvoiceModalProps) {
  const [step, setStep] = useState<"month" | "preview" | "generating" | "results">("month")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [customers, setCustomers] = useState<CustomerPreview[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [generationResult, setGenerationResult] = useState<any>(null)

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ]

  useEffect(() => {
    if (isVisible) {
      resetForm()
    }
  }, [isVisible])

  const resetForm = () => {
    setStep("month")
    setSelectedMonth("")
    setCustomers([])
    setSelectedCustomers([])
    setGenerationResult(null)
  }

  const getMonthPreview = async () => {
    if (!selectedMonth) {
      toast.error("Please select a month", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      return
    }

    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axiosInstance.post("/invoices/bulk-monthly/preview", {
        target_month: selectedMonth
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setCustomers(response.data.customers)
      
      // Auto-select customers without existing invoices
      const autoSelected = response.data.customers
        .filter((customer: CustomerPreview) => !customer.has_existing_invoice)
        .map((customer: CustomerPreview) => customer.id)
      
      setSelectedCustomers(autoSelected)
      setStep("preview")
    } catch (error) {
      console.error("Failed to get monthly preview", error)
      toast.error("Failed to load customers for selected month", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const toggleSelectAll = () => {
    const selectableCustomers = customers.filter(c => !c.has_existing_invoice)
    
    if (selectedCustomers.length === selectableCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(selectableCustomers.map(c => c.id))
    }
  }

  const generateInvoices = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      return
    }

    setIsLoading(true)
    setStep("generating")
    
    try {
      const token = getToken()
      const response = await axiosInstance.post("/invoices/bulk-monthly/generate", {
        customer_ids: selectedCustomers,
        target_month: selectedMonth
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setGenerationResult(response.data)
      setStep("results")
      
      if (response.data.total_generated > 0) {
        toast.success(`Generated ${response.data.total_generated} invoices successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
        onSuccess()
      }
      
      if (response.data.total_failed > 0) {
        toast.warning(`${response.data.total_failed} invoices failed to generate`, {
          style: { background: "#FEF3C7", color: "#D97706" },
        })
      }
    } catch (error) {
      console.error("Failed to generate invoices", error)
      toast.error("Failed to generate invoices", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      setStep("preview")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-gray/10">
          <h2 className="text-2xl font-bold text-deep-ocean">Generate Monthly Invoices</h2>
          <button
            onClick={onClose}
            className="text-slate-gray hover:text-deep-ocean transition-colors rounded-full p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "month" && (
            <div className="space-y-6">
              <div className="bg-light-sky/30 rounded-lg p-4 border border-electric-blue/20">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-electric-blue mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-deep-ocean">Monthly Invoice Generation</h3>
                    <ul className="mt-2 text-sm text-slate-gray space-y-1 list-disc pl-5">
                      <li>Select the month for which you want to generate invoices</li>
                      <li>System will auto-deselect customers who already have invoices for the selected month</li>
                      <li>You can manually select/deselect customers as needed</li>
                      <li>Invoices will be generated with automatic billing dates and amounts</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label htmlFor="month" className="block text-lg font-medium text-deep-ocean">
                  Select Month
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {months.map(month => (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedMonth === month.value
                          ? "border-electric-blue bg-electric-blue/10 text-electric-blue"
                          : "border-slate-gray/20 bg-white text-deep-ocean hover:border-electric-blue/40"
                      }`}
                    >
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <span className="font-medium">{month.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-deep-ocean">
                  Preview - {months.find(m => m.value === selectedMonth)?.label} {new Date().getFullYear()}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-gray">
                    {selectedCustomers.length} of {customers.filter(c => !c.has_existing_invoice).length} selected
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 text-sm bg-light-sky/50 text-deep-ocean rounded-lg hover:bg-light-sky transition-colors"
                  >
                    {selectedCustomers.length === customers.filter(c => !c.has_existing_invoice).length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="border border-slate-gray/20 rounded-lg overflow-hidden">
                <div className="bg-light-sky/20 px-4 py-3 border-b border-slate-gray/10 grid grid-cols-12 gap-4 font-medium text-deep-ocean text-sm">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Customer</div>
                  <div className="col-span-2">Service Plan</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-2">Status</div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className={`px-4 py-3 border-b border-slate-gray/10 grid grid-cols-12 gap-4 items-center text-sm ${
                        customer.has_existing_invoice ? 'bg-amber-50' : 'hover:bg-light-sky/30'
                      }`}
                    >
                      <div className="col-span-1">
                        {!customer.has_existing_invoice && (
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => toggleCustomerSelection(customer.id)}
                            className="h-4 w-4 text-electric-blue focus:ring-electric-blue border-slate-gray/20 rounded"
                          />
                        )}
                      </div>
                      <div className="col-span-3">
                        <div className="font-medium text-deep-ocean">{customer.name}</div>
                        <div className="text-xs text-slate-gray">{customer.internet_id}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-deep-ocean">{customer.service_plan_name}</div>
                        <div className="text-xs text-slate-gray">PKR {customer.service_plan_price.toFixed(2)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-medium text-deep-ocean">PKR {customer.total_amount.toFixed(2)}</div>
                        {customer.discount_amount > 0 && (
                          <div className="text-xs text-coral-red">-PKR {customer.discount_amount.toFixed(2)}</div>
                        )}
                      </div>
                      <div className="col-span-2 text-slate-gray">
                        {new Date(customer.due_date).toLocaleDateString()}
                      </div>
                      <div className="col-span-2">
                        {customer.has_existing_invoice ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Already Generated
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {customers.filter(c => c.has_existing_invoice).length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">Auto-deselected Customers</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        {customers.filter(c => c.has_existing_invoice).length} customers already have invoices for this month and were automatically deselected.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="animate-spin h-12 w-12 text-electric-blue mb-4" />
              <h3 className="text-lg font-semibold text-deep-ocean mb-2">Generating Invoices</h3>
              <p className="text-sm text-slate-gray text-center">
                Please wait while we generate invoices for {selectedCustomers.length} customers...
              </p>
            </div>
          )}

          {step === "results" && generationResult && (
            <div className="space-y-6">
              <div className={`rounded-lg p-4 border ${
                generationResult.total_failed === 0 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex items-start">
                  {generationResult.total_failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-medium text-deep-ocean">Generation Complete</h3>
                    <p className="mt-1 text-sm text-slate-700">
                      Successfully generated {generationResult.total_generated} invoices. 
                      {generationResult.total_failed > 0 && ` ${generationResult.total_failed} invoices failed to generate.`}
                    </p>
                  </div>
                </div>
              </div>

              {generationResult.failed.length > 0 && (
                <div className="border border-slate-gray/20 rounded-lg overflow-hidden">
                  <div className="bg-light-sky/20 px-4 py-3 border-b border-slate-gray/10">
                    <h4 className="font-medium text-deep-ocean">Failed Invoices</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4">
                    {generationResult.failed.map((failed: any, index: number) => (
                      <div key={index} className="mb-3 last:mb-0 bg-coral-red/5 p-3 rounded-lg border border-coral-red/20">
                        <div className="font-medium text-deep-ocean">{failed.customer_name}</div>
                        <div className="text-sm text-coral-red mt-1">{failed.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generationResult.generated.length > 0 && (
                <div className="border border-slate-gray/20 rounded-lg overflow-hidden">
                  <div className="bg-light-sky/20 px-4 py-3 border-b border-slate-gray/10">
                    <h4 className="font-medium text-deep-ocean">Generated Invoices</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4">
                    {generationResult.generated.map((invoice: any, index: number) => (
                      <div key={index} className="mb-3 last:mb-0 bg-emerald-green/5 p-3 rounded-lg border border-emerald-green/20">
                        <div className="font-medium text-deep-ocean">{invoice.customer_name}</div>
                        <div className="text-sm text-slate-gray mt-1">
                          Invoice: {invoice.invoice_number} • Amount: PKR {invoice.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-gray/10 flex justify-between gap-3">
          {step === "month" && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={getMonthPreview}
                disabled={!selectedMonth || isLoading}
                className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? <Loader className="animate-spin h-5 w-5" /> : <Users className="h-5 w-5" />}
                Continue to Preview
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={() => setStep("month")}
                className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateInvoices}
                  disabled={selectedCustomers.length === 0 || isLoading}
                  className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isLoading ? <Loader className="animate-spin h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  Generate {selectedCustomers.length} Invoices
                </button>
              </div>
            </>
          )}

          {step === "results" && (
            <div className="flex w-full justify-end gap-3">
              <button
                onClick={() => resetForm()}
                className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
              >
                Generate More
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}