"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import axiosInstance from "../utils/axiosConfig.ts"
import MBALogo from "../assets/mba_logo.tsx"
import { PaidStamp } from "../components/PaidStamp.tsx"

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  discount_amount: number
  line_total: number
  item_type?: string
  inventory_item_id?: string
  inventory_item_type?: string
}

interface PendingInvoice {
  id: string
  invoice_number: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  invoice_type: string
}

interface PendingInvoicesData {
  count: number
  total_pending_amount: number
  invoices: PendingInvoice[]
}

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
  line_items?: LineItem[]
  pending_invoices?: PendingInvoicesData
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Bank Transfer',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    bank_account_id: '',
    payment_proof: null as File | null
  })

  useEffect(() => {
    if (invoiceData?.remaining_amount) {
      setPaymentForm(prev => ({ ...prev, amount: invoiceData.remaining_amount.toString() }))
    }
  }, [invoiceData])

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
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

  const getServiceDescription = (invoiceData: InvoiceData) => {
    const type = invoiceData.invoice_type?.toLowerCase()
    switch (type) {
      case "subscription": return `${invoiceData.service_plan_name} - Monthly Subscription`
      case "installation": return "Internet Installation Service"
      case "equipment": return "Network Equipment Purchase"
      case "add_on": return "Additional Service/Feature"
      case "refund": return "Payment Refund"
      case "deposit": return "Security Deposit"
      case "maintenance": return "Maintenance Service"
      case "late_fee": return "Late Payment Fee"
      case "upgrade": return "Service Upgrade"
      case "reconnection": return "Service Reconnection"
      default: return invoiceData.invoice_type ? invoiceData.invoice_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Invoice"
    }
  }

  const isSubscription = (invoiceData?.invoice_type || "").toLowerCase() === "subscription"

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setIsDownloading(true)
    setError(null)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff",
        width: printRef.current.scrollWidth, height: printRef.current.scrollHeight,
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

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓", label: "PAID" }
      case "pending": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⏳", label: "PENDING" }
      case "overdue": return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "!", label: "OVERDUE" }
      case "partially_paid": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "◐", label: "PARTIAL" }
      default: return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "•", label: status.toUpperCase() }
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid": return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200"
      case "failed": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentForm({ ...paymentForm, payment_proof: e.target.files[0] })
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    if (!paymentForm.payment_proof) {
      setError("Please upload a payment proof (screenshot/image)")
      setIsSubmitting(false)
      return
    }
    if (paymentForm.payment_method === 'Bank Transfer' && !paymentForm.bank_account_id) {
      setError("Please select a bank account")
      setIsSubmitting(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append('invoice_id', id!)
      formData.append('amount', paymentForm.amount)
      formData.append('payment_method', paymentForm.payment_method)
      if (paymentForm.bank_account_id) formData.append('bank_account_id', paymentForm.bank_account_id)
      formData.append('transaction_id', paymentForm.transaction_id)
      formData.append('payment_date', paymentForm.payment_date)
      formData.append('payment_proof', paymentForm.payment_proof)
      await axiosInstance.post('/public/payment/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmissionSuccess(true)
      fetchInvoiceData()
      setPaymentForm(prev => ({ ...prev, transaction_id: '', payment_proof: null }))
    } catch (err: any) {
      console.error("Payment submission failed:", err)
      setError(err.response?.data?.message || "Failed to submit payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading State
  if (!invoiceData && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error && !invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-red-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invoice Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={fetchInvoiceData} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(invoiceData?.status || "")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invoice Details</h1>
            <p className="text-slate-500 text-sm mt-1">View and manage your invoice payment</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className={`group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-200 ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg className="w-5 h-5 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isDownloading ? "Generating..." : "Download PDF"}
          </button>
        </div>

        {/* Main Invoice Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div ref={printRef} className="p-6 sm:p-10">

            {/* Header Section */}
            <div className="relative flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-100">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">INVOICE</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                    <span>{statusConfig.icon}</span>
                    {statusConfig.label}
                  </span>
                  {invoiceData?.invoice_type && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200 uppercase tracking-wide">
                      {invoiceData.invoice_type.split('_').join(' ')}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 font-mono text-sm">#{invoiceData?.invoice_number}</p>
                {invoiceData?.status === 'paid' && (
                  <div className="absolute top-2 right-1/3 transform translate-x-12 opacity-90 z-10 pointer-events-none">
                    <PaidStamp
                      date={invoiceData.payments?.[invoiceData.payments.length - 1]?.payment_date}
                      method={invoiceData.payments?.[invoiceData.payments.length - 1]?.payment_method}
                      className="w-28 h-28 sm:w-32 sm:h-32 text-emerald-600 border-emerald-600"
                    />
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="h-12 w-28 mb-3">
                  <MBALogo variant="landscape" />
                </div>
                <p className="text-slate-800 font-semibold text-sm">MBA Communications</p>
                <p className="text-slate-500 text-xs leading-relaxed">Kharak Stop Overhead Bridge<br />City, Lahore 54000</p>
              </div>
            </div>

            {/* Customer & Invoice Meta Grid */}
            <div className="grid md:grid-cols-2 gap-6 py-8 border-b border-slate-100">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
                  <p className="text-lg font-bold text-slate-800 mb-1">{invoiceData?.customer_name}</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><span className="text-slate-400">ID:</span> {invoiceData?.customer_internet_id}</p>
                    <p><span className="text-slate-400">Phone:</span> {invoiceData?.customer_phone}</p>
                    <p className="text-slate-500">{invoiceData?.customer_address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                      <p className="text-sm font-semibold text-slate-700">{invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-sm font-semibold text-slate-700">{invoiceData?.due_date && formatDate(invoiceData.due_date)}</p>
                    </div>
                  </div>
                  {isSubscription && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Period</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)} — {invoiceData?.billing_end_date && formatDate(invoiceData.billing_end_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-8 border-b border-slate-100">
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="text-left text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 w-[70%]">Description</th>
                      {invoiceData?.invoice_type === 'equipment' && (
                        <>
                          <th className="text-center text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-3 whitespace-nowrap w-[10%]">Qty</th>
                          <th className="text-right text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 whitespace-nowrap w-[20%]">Rate</th>
                        </>
                      )}
                      <th className="text-right text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 whitespace-nowrap w-[30%]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceData?.line_items && invoiceData.line_items.length > 0 ? (
                      invoiceData.line_items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5" style={{ width: "70%" }}>
                            <p className="font-semibold text-slate-800 whitespace-nowrap">{item.description}</p>
                            {invoiceData?.invoice_type !== 'equipment' && (
                              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                                Qty: {item.quantity}
                                {item.discount_amount > 0 && <span className="ml-2 text-emerald-600">(Discount: PKR {item.discount_amount.toFixed(2)})</span>}
                              </p>
                            )}
                          </td>
                          {invoiceData?.invoice_type === 'equipment' && (
                            <>
                              <td className="py-4 px-3 text-center text-slate-700">{item.quantity}</td>
                              <td className="py-4 px-5 text-right text-slate-600">PKR {item.unit_price.toLocaleString()}</td>
                            </>
                          )}
                          <td className="py-4 px-5 text-right font-bold text-slate-800">PKR {item.line_total.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                          <p className="font-semibold text-slate-800 whitespace-nowrap">{invoiceData && getServiceDescription(invoiceData)}</p>
                          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                            {isSubscription ? `Period: ${formatDate(invoiceData!.billing_start_date)} — ${formatDate(invoiceData!.billing_end_date)}` : `Date: ${formatDate(invoiceData?.billing_start_date || invoiceData?.due_date || "")}`}
                          </p>
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-slate-800 whitespace-nowrap">PKR {invoiceData?.subtotal.toLocaleString()}</td>
                      </tr>
                    )}
                    {isSubscription && invoiceData && invoiceData.discount_percentage > 0 && (
                      <tr className="bg-emerald-50/50">
                        <td className="py-3 px-5 text-slate-600" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                          Discount ({invoiceData.discount_percentage}%)
                        </td>
                        <td className="py-3 px-5 text-right font-semibold text-emerald-600">
                          -PKR {(invoiceData.subtotal * (invoiceData.discount_percentage / 100)).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <td className="py-4 px-5 text-right font-bold text-white uppercase tracking-wide" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                        Total Amount
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="text-2xl font-bold text-white">PKR {invoiceData?.total_amount.toLocaleString()}</span>
                      </td>
                    </tr>
                    {(invoiceData?.total_paid ?? 0) > 0 && (
                      <>
                        <tr className="bg-emerald-50/50">
                          <td className="py-3 px-5 text-right font-bold text-emerald-700 uppercase tracking-wide" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                            Amount Paid
                          </td>
                          <td className="py-3 px-5 text-right">
                            <span className="text-lg font-bold text-emerald-700">PKR {(invoiceData?.total_paid ?? 0).toLocaleString()}</span>
                          </td>
                        </tr>
                        <tr className={`${(invoiceData?.remaining_amount ?? 0) > 0 ? 'bg-red-50/50' : 'bg-slate-50/50'}`}>
                          <td className={`py-3 px-5 text-right font-bold uppercase tracking-wide ${(invoiceData?.remaining_amount ?? 0) > 0 ? 'text-red-700' : 'text-slate-700'}`} colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                            Balance Due
                          </td>
                          <td className="py-3 px-5 text-right">
                            <span className={`text-lg font-bold ${(invoiceData?.remaining_amount ?? 0) > 0 ? 'text-red-700' : 'text-slate-700'}`}>PKR {(invoiceData?.remaining_amount ?? 0).toLocaleString()}</span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Summary Cards */}
            <div className="py-8 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Invoice Total</p>
                  <p className="text-xl font-bold text-slate-800">PKR {invoiceData?.total_amount.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-emerald-700">PKR {invoiceData?.total_paid.toLocaleString()}</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${(invoiceData?.remaining_amount || 0) > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className={`text-xs mb-1 ${(invoiceData?.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Balance Due</p>
                  <p className={`text-xl font-bold ${(invoiceData?.remaining_amount || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>PKR {invoiceData?.remaining_amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {invoiceData?.payments && invoiceData.payments.length > 0 && (
              <div className="py-8 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment History</p>
                <div className="space-y-3">
                  {invoiceData.payments.map((payment, index) => (
                    <div key={payment.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800">Payment #{invoiceData.payments.length - index}</p>
                          <p className="text-xs text-slate-500">{formatDate(payment.payment_date)} • {payment.payment_method}</p>
                          {payment.transaction_id && <p className="text-xs text-slate-400 mt-1">Ref: {payment.transaction_id}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">PKR {payment.amount.toLocaleString()}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      {payment.failure_reason && payment.status === 'failed' && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 border border-red-100">⚠ {payment.failure_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Payment Alert */}
            {(invoiceData?.remaining_amount || 0) > 0 && (
              <div className="my-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-amber-800">Payment Required</p>
                    <p className="text-sm text-amber-700">Outstanding balance of <strong>PKR {invoiceData?.remaining_amount.toLocaleString()}</strong> is due. Please make payment to avoid service interruption.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Outstanding Invoices */}
            {invoiceData?.pending_invoices && invoiceData.pending_invoices.count > 0 && (
              <div className="my-6 bg-red-50 rounded-xl p-5 border border-red-200">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-red-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Other Outstanding Invoices ({invoiceData.pending_invoices.count})
                  </p>
                  <span className="text-sm font-bold text-red-700">Total: PKR {invoiceData.pending_invoices.total_pending_amount.toLocaleString()}</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {invoiceData.pending_invoices.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-slate-700">#{inv.invoice_number}</span>
                        <span className="text-xs text-slate-400">{formatDate(inv.billing_start_date)}</span>
                      </div>
                      <span className="font-bold text-red-600">PKR {inv.remaining_amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Accounts */}
            {bankAccounts.length > 0 && (
              <div className="py-8 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Methods</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {bankAccounts.map((account, index) => (
                    <div key={account.id} className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 text-white">
                      <p className="text-xs text-slate-300 uppercase tracking-wider mb-2">{account.bank_name}</p>
                      <p className="font-bold text-lg mb-3">{account.account_title}</p>
                      <div className="space-y-1 text-sm text-slate-200">
                        <p><span className="text-slate-400">A/C:</span> {account.account_number}</p>
                        {account.iban && <p><span className="text-slate-400">IBAN:</span> {account.iban}</p>}
                        {account.branch_code && <p><span className="text-slate-400">Branch:</span> {account.branch_code}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Payment Form */}
            {(() => {
              const hasPendingPayment = invoiceData?.payments?.some(p => p.status === 'pending');
              const showPaymentForm = (invoiceData?.remaining_amount || 0) > 0 && !submissionSuccess && !hasPendingPayment;
              const showPendingMessage = (invoiceData?.remaining_amount || 0) > 0 && hasPendingPayment && !submissionSuccess;

              if (showPendingMessage) {
                return (
                  <div className="py-8 border-b border-slate-100">
                    <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-amber-800">Payment Pending Verification</p>
                          <p className="text-amber-700">You have already submitted a payment that is awaiting verification. You will be notified once it is approved.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (showPaymentForm) {
                return (
                  <div className="py-8 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Submit Payment Proof</p>
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <form onSubmit={handlePaymentSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Amount (PKR)</label>
                            <input type="number" step="0.01" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Bank Account</label>
                            <select value={paymentForm.bank_account_id} onChange={(e) => setPaymentForm({ ...paymentForm, bank_account_id: e.target.value })} required
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                              <option value="">Select Bank Account</option>
                              {bankAccounts.map((account) => (
                                <option key={account.id} value={account.id}>{account.bank_name} - {account.account_number}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Transaction ID</label>
                            <input type="text" required placeholder="e.g. TRX-123456789" value={paymentForm.transaction_id} onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Payment Date</label>
                            <input type="date" required value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Payment Proof (Required)</label>
                          <input type="file" required accept="image/*,application/pdf" onChange={handleFileChange}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:transition-colors" />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">{error}</p>}
                        <div className="flex justify-end">
                          <button type="submit" disabled={isSubmitting}
                            className={`px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Success Message */}
            {submissionSuccess && (
              <div className="my-6 bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-800">Payment Submitted!</p>
                    <p className="text-emerald-700">Your payment is pending verification. Status will update once approved.</p>
                  </div>
                </div>
                <button onClick={() => setSubmissionSuccess(false)} className="mt-4 text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800">
                  Submit another payment
                </button>
              </div>
            )}

            {/* Notes */}
            {invoiceData?.notes && (
              <div className="py-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">{invoiceData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8 mt-8 border-t border-slate-100">
              <p className="text-lg font-bold text-slate-800 mb-1">Thank you for your business!</p>
              <p className="text-sm text-slate-500 mb-2">Questions? <a href="mailto:support@Mba.net92@gmail.com" className="text-blue-600 hover:underline">support@Mba.net92@gmail.com</a> • 0323 4689090</p>
              <p className="text-xs text-slate-400">Invoice generated on {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicInvoicePage