"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import axiosInstance from "../utils/axiosConfig.ts"
import MBALogo from "../assets/mba_logo.tsx"

interface InvoiceData {
  id: string
  invoice_number: string
  customer_name: string
  customer_address: string
  customer_internet_id: string
  customer_phone: string
  service_plan_name: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  subtotal: number
  discount_percentage: number
  total_amount: number
  invoice_type: string
  notes: string
  status: string
  payments: PaymentDetails[]
  total_paid: number
  remaining_amount: number
}

interface PaymentDetails {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  transaction_id?: string
  status: string
  failure_reason?: string
}

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string
  branch_code?: string
}

const PublicInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
    document.title = "MBA NET - Invoice"
    fetchInvoiceData()
    fetchBankAccounts()
  }, [id])

  const fetchInvoiceData = async () => {
    try {
      const response = await axiosInstance.get(`/public/invoice/${id}`)
      setInvoiceData(response.data)
      setError(null)
    } catch (error) {
      console.error("Failed to fetch invoice data", error)
      setError("Failed to load invoice data. Please check the link.")
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await axiosInstance.get("/public/bank-accounts/list")
      setBankAccounts(response.data)
    } catch (error) {
      console.error("Failed to fetch bank accounts", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.getMonth()]}/${date.getDate()}/${date.getFullYear()}`
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return

    setIsDownloading(true)
    setError(null)

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.8)
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`Invoice-${invoiceData?.invoice_number}.pdf`)
    } catch (error) {
      console.error("PDF generation failed:", error)
      setError("Failed to generate PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-[#D1FAE5] text-[#10B981] shadow-lg"
      case "pending":
        return "bg-[#FEF3C7] text-[#F59E0B]"
      case "overdue":
        return "bg-[#FEE2E2] text-[#EF4444]"
      case "partially_paid":
        return "bg-[#DBEAFE] text-[#1D4ED8]"
      default:
        return "bg-[#EBF5FF] text-[#4A5568]"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-[#D1FAE5] text-[#10B981]"
      case "pending":
        return "bg-[#FEF3C7] text-[#F59E0B]"
      case "failed":
        return "bg-[#FEE2E2] text-[#EF4444]"
      default:
        return "bg-[#EBF5FF] text-[#4A5568]"
    }
  }

  if (!invoiceData && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-blue-600 rounded mb-4"></div>
          <div className="text-gray-800">Loading invoice details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchInvoiceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-balance">Invoice Details</h1>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 ${
              isDownloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div ref={printRef} className="p-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">INVOICE</div>
                  <div className="text-gray-600">#{invoiceData?.invoice_number}</div>
                </div>
                <div className="text-right">
                  <div className="h-12 w-24 mb-2">
                    <MBALogo variant="landscape" />
                  </div>
                  <div className="text-gray-800 font-semibold text-sm">MBA Communications</div>
                  <div className="text-gray-600 text-xs">Kharak Stop Overhead Bridge</div>
                  <div className="text-gray-600 text-xs">City, Lahore 54000</div>
                </div>
              </div>
            </div>

            {/* Customer & Invoice Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <h2 className="text-xs font-semibold text-gray-700 uppercase mb-2">Bill To</h2>
                  <div className="text-gray-800 font-semibold mb-1">{invoiceData?.customer_name}</div>
                  <div className="text-gray-600 text-sm mb-1">Internet ID: {invoiceData?.customer_internet_id}</div>
                  <div className="text-gray-600 text-sm mb-1">Phone: {invoiceData?.customer_phone}</div>
                  <div className="text-gray-600 text-sm">{invoiceData?.customer_address}</div>
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-gray-700 uppercase mb-1">Status</h2>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      invoiceData?.status || "",
                    )}`}
                  >
                    {invoiceData?.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <h2 className="text-xs font-semibold text-gray-700 uppercase mb-1">Invoice Date</h2>
                      <div className="text-gray-600 text-sm">
                        {invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold text-gray-700 uppercase mb-1">Due Date</h2>
                      <div className="text-gray-600 text-sm">
                        {invoiceData?.due_date && formatDate(invoiceData.due_date)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-gray-700 uppercase mb-1">Billing Period</h2>
                    <div className="text-gray-600 text-sm">
                      {invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)} -{" "}
                      {invoiceData?.billing_end_date && formatDate(invoiceData.billing_end_date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service details table */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="text-left text-xs font-semibold text-white uppercase py-2 px-3">
                        Service Description
                      </th>
                      <th className="text-right text-xs font-semibold text-white uppercase py-2 px-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-3">
                        <div className="text-gray-800 font-semibold mb-1">
                          {invoiceData?.service_plan_name || invoiceData?.invoice_type}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Service Period:{" "}
                          {invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)} -{" "}
                          {invoiceData?.billing_end_date && formatDate(invoiceData.billing_end_date)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-800 font-semibold">
                        PKR {invoiceData?.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    {invoiceData?.discount_percentage > 0 && (
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-3 text-gray-700 text-sm">
                          Discount ({invoiceData.discount_percentage}%)
                        </td>
                        <td className="py-2 px-3 text-right text-green-600 font-semibold text-sm">
                          -PKR {(invoiceData.subtotal * (invoiceData.discount_percentage / 100)).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-800">
                      <td className="py-3 px-3 text-right font-semibold text-white uppercase text-sm">
                        Total Amount
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="text-xl font-bold text-white">
                          PKR {invoiceData?.total_amount.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Payment Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-gray-600 mb-1">Invoice Total</div>
                  <div className="text-xl font-bold text-gray-800">PKR {invoiceData?.total_amount.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-gray-600 mb-1">Total Paid</div>
                  <div className="text-xl font-bold text-green-600">PKR {invoiceData?.total_paid.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-gray-600 mb-1">Remaining Balance</div>
                  <div className={`text-xl font-bold ${(invoiceData?.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    PKR {invoiceData?.remaining_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {invoiceData?.payments && invoiceData.payments.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  Payment History
                </h2>
                <div className="space-y-3">
                  {invoiceData.payments.map((payment, index) => (
                    <div key={payment.id} className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">
                            Payment #{invoiceData.payments.length - index}
                          </div>
                          <div className="text-gray-600 text-sm">
                            Date: {formatDate(payment.payment_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800 text-lg">
                            PKR {payment.amount.toFixed(2)}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Method:</span> {payment.payment_method}
                        </div>
                        {payment.transaction_id && (
                          <div>
                            <span className="font-medium">Transaction ID:</span> {payment.transaction_id}
                          </div>
                        )}
                        {payment.failure_reason && payment.status === 'failed' && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-red-600">Failure Reason:</span> {payment.failure_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Payment Notice */}
            {(invoiceData?.remaining_amount || 0) > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                <h2 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pending Payment
                </h2>
                <p className="text-yellow-700 text-sm">
                  Outstanding balance of <strong>PKR {invoiceData?.remaining_amount.toFixed(2)}</strong> is due. 
                  Please make payment to avoid service interruption.
                </p>
              </div>
            )}

            {/* Bank accounts */}
            {bankAccounts.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Payment Information
                </h2>
                <p className="text-gray-600 mb-3 text-sm">
                  Payment can be made to any of the following bank accounts:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  {bankAccounts.map((account, index) => (
                    <div key={account.id} className="bg-white rounded-lg p-3 border-l-4 border-gray-800">
                      <div className="font-semibold text-gray-800 mb-2 text-sm">
                        {index + 1}. {account.bank_name}
                      </div>
                      <div className="space-y-1 text-gray-600 text-xs">
                        <div>
                          <span className="font-medium">Account Title:</span> {account.account_title}
                        </div>
                        <div>
                          <span className="font-medium">Account Number:</span> {account.account_number}
                        </div>
                        {account.iban && (
                          <div>
                            <span className="font-medium">IBAN:</span> {account.iban}
                          </div>
                        )}
                        {account.branch_code && (
                          <div>
                            <span className="font-medium">Branch Code:</span> {account.branch_code}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {invoiceData?.notes && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Additional Notes</h2>
                <div className="text-gray-600 text-sm">{invoiceData.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8 pt-4 border-t border-gray-200">
              <div className="text-gray-800 font-semibold mb-1">Thank you for your business!</div>
              <div className="text-gray-600 text-sm mb-1">
                Questions? Contact us at support@Mba.net92@gmail.com or call 0323 4689090
              </div>
              <div className="text-gray-500 text-xs">
                Invoice generated on {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicInvoicePage