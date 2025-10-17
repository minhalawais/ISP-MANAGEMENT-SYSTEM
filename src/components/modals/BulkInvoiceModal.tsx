"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, CheckCircle, Loader, AlertCircle, X, FileText } from "lucide-react"
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
    { value: "12", label: "December" },
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
      const response = await axiosInstance.post(
        "/invoices/bulk-monthly/preview",
        {
          target_month: selectedMonth,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setCustomers(response.data.customers)

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
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    )
  }

  const toggleSelectAll = () => {
    const selectableCustomers = customers.filter((c) => !c.has_existing_invoice)

    if (selectedCustomers.length === selectableCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(selectableCustomers.map((c) => c.id))
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
      const response = await axiosInstance.post(
        "/invoices/bulk-monthly/generate",
        {
          customer_ids: selectedCustomers,
          target_month: selectedMonth,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 sm:p-8 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] border-b border-[#B3C8CF]/20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Generate Monthly Invoices</h2>
            <p className="text-white/80 text-sm mt-1">Bulk invoice generation with customer preview</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-all duration-200 p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F1F0E8]">
          {step === "month" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-xl p-6 border-l-4 border-[#89A8B2] shadow-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-[#89A8B2] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#2C3E50] mb-3">Monthly Invoice Generation</h3>
                    <ul className="text-sm text-[#5A6C7D] space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#89A8B2] rounded-full" />
                        Select the month for which you want to generate invoices
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#89A8B2] rounded-full" />
                        System will auto-deselect customers who already have invoices
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#89A8B2] rounded-full" />
                        You can manually select/deselect customers as needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-semibold text-[#2C3E50]">Select Month</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {months.map((month) => (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all duration-200 font-medium ${
                        selectedMonth === month.value
                          ? "border-[#89A8B2] bg-[#89A8B2]/10 text-[#89A8B2] shadow-md"
                          : "border-[#B3C8CF]/30 bg-white text-[#2C3E50] hover:border-[#89A8B2]/50 hover:shadow-md"
                      }`}
                    >
                      <Calendar className="h-5 w-5 mx-auto mb-2" />
                      <span className="text-sm">{month.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-[#2C3E50]">
                  Preview - {months.find((m) => m.value === selectedMonth)?.label} {new Date().getFullYear()}
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <span className="text-sm text-[#5A6C7D] bg-white px-4 py-2 rounded-lg">
                    {selectedCustomers.length} of {customers.filter((c) => !c.has_existing_invoice).length} selected
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-2 text-sm bg-[#89A8B2]/10 text-[#89A8B2] rounded-lg hover:bg-[#89A8B2]/20 transition-all duration-200 font-medium"
                  >
                    {selectedCustomers.length === customers.filter((c) => !c.has_existing_invoice).length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#B3C8CF]/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#89A8B2]/10 to-[#B3C8CF]/10 border-b border-[#B3C8CF]/20">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Service Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C3E50] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B3C8CF]/20">
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`transition-colors duration-200 ${
                            customer.has_existing_invoice ? "bg-yellow-50" : "hover:bg-[#F1F0E8]"
                          }`}
                        >
                          <td className="px-4 py-3">
                            {!customer.has_existing_invoice && (
                              <input
                                type="checkbox"
                                checked={selectedCustomers.includes(customer.id)}
                                onChange={() => toggleCustomerSelection(customer.id)}
                                className="h-4 w-4 text-[#89A8B2] focus:ring-[#89A8B2] border-[#B3C8CF] rounded cursor-pointer"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#2C3E50]">{customer.name}</div>
                            <div className="text-xs text-[#5A6C7D]">{customer.internet_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[#2C3E50]">{customer.service_plan_name}</div>
                            <div className="text-xs text-[#5A6C7D]">PKR {customer.service_plan_price.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#2C3E50]">PKR {customer.total_amount.toFixed(2)}</div>
                            {customer.discount_amount > 0 && (
                              <div className="text-xs text-red-600">-PKR {customer.discount_amount.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#5A6C7D]">
                            {new Date(customer.due_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {customer.has_existing_invoice ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <FileText className="h-3 w-3 mr-1" />
                                Already Generated
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {customers.filter((c) => c.has_existing_invoice).length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Auto-deselected Customers</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        {customers.filter((c) => c.has_existing_invoice).length} customers already have invoices for
                        this month.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
              <div className="bg-[#89A8B2]/10 p-6 rounded-full mb-6">
                <Loader className="animate-spin h-12 w-12 text-[#89A8B2]" />
              </div>
              <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">Generating Invoices</h3>
              <p className="text-sm text-[#5A6C7D] text-center max-w-md">
                Please wait while we generate invoices for {selectedCustomers.length} customers...
              </p>
            </div>
          )}

          {step === "results" && generationResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div
                className={`rounded-xl p-6 border-l-4 ${
                  generationResult.total_failed === 0
                    ? "bg-green-50 border-green-500"
                    : "bg-yellow-50 border-yellow-500"
                }`}
              >
                <div className="flex items-start gap-4">
                  {generationResult.total_failed === 0 ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold text-[#2C3E50]">Generation Complete</h3>
                    <p className="mt-1 text-sm text-[#5A6C7D]">
                      Successfully generated {generationResult.total_generated} invoices.
                      {generationResult.total_failed > 0 &&
                        ` ${generationResult.total_failed} invoices failed to generate.`}
                    </p>
                  </div>
                </div>
              </div>

              {generationResult.failed.length > 0 && (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#B3C8CF]/20">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                    <h4 className="font-semibold text-red-900">Failed Invoices</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {generationResult.failed.map((failed: any, index: number) => (
                      <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="font-medium text-[#2C3E50]">{failed.customer_name}</div>
                        <div className="text-sm text-red-600 mt-1">{failed.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generationResult.generated.length > 0 && (
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#B3C8CF]/20">
                  <div className="bg-green-50 px-6 py-4 border-b border-green-200">
                    <h4 className="font-semibold text-green-900">Generated Invoices</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {generationResult.generated.map((invoice: any, index: number) => (
                      <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="font-medium text-[#2C3E50]">{invoice.customer_name}</div>
                        <div className="text-sm text-[#5A6C7D] mt-1">
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

        <div className="p-6 sm:p-8 border-t border-[#B3C8CF]/20 bg-white flex flex-col-reverse sm:flex-row justify-between gap-3">
          {step === "month" && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-[#B3C8CF] text-[#89A8B2] rounded-lg hover:bg-[#F1F0E8] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30"
              >
                Cancel
              </button>
              <button
                onClick={getMonthPreview}
                disabled={!selectedMonth || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-[#89A8B2] to-[#7A96A3] text-white rounded-lg hover:shadow-lg hover:shadow-[#89A8B2]/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/50 flex items-center justify-center gap-2"
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
                className="px-6 py-3 border-2 border-[#B3C8CF] text-[#89A8B2] rounded-lg hover:bg-[#F1F0E8] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30"
              >
                Back
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-[#B3C8CF] text-[#89A8B2] rounded-lg hover:bg-[#F1F0E8] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30"
                >
                  Cancel
                </button>
                <button
                  onClick={generateInvoices}
                  disabled={selectedCustomers.length === 0 || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-[#89A8B2] to-[#7A96A3] text-white rounded-lg hover:shadow-lg hover:shadow-[#89A8B2]/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader className="animate-spin h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  Generate {selectedCustomers.length} Invoices
                </button>
              </div>
            </>
          )}

          {step === "results" && (
            <div className="flex flex-col-reverse sm:flex-row w-full justify-end gap-3">
              <button
                onClick={() => resetForm()}
                className="px-6 py-3 border-2 border-[#B3C8CF] text-[#89A8B2] rounded-lg hover:bg-[#F1F0E8] transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/30"
              >
                Generate More
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-[#89A8B2] to-[#7A96A3] text-white rounded-lg hover:shadow-lg hover:shadow-[#89A8B2]/30 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#89A8B2]/50"
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
