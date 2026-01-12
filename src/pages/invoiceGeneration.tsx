"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams } from "react-router-dom"
import { getToken } from "../utils/auth.ts"
import { useReactToPrint } from "react-to-print"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import MBALogo from "../assets/mba_logo.tsx"

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
  line_items: LineItem[]
  payments: PaymentDetails[]
  total_paid: number
  remaining_amount: number
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

const InvoiceGenerationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.title = "MBA NET - Invoice Details"
    fetchInvoiceData()
    fetchBankAccounts()
  }, [id])

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  const fetchInvoiceData = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setInvoiceData(response.data)
      setError(null)
    } catch (error) {
      console.error("Failed to fetch invoice data", error)
      setError("Failed to load invoice data. Please try again.")
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/bank-accounts/list", { headers: { Authorization: `Bearer ${token}` } })
      setBankAccounts(response.data)
    } catch (error) {
      console.error("Failed to fetch bank accounts", error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
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
      default: return invoiceData.service_plan_name || invoiceData.invoice_type
    }
  }

  const isSubscription = (invoiceData?.invoice_type || "").toLowerCase() === "subscription"
  const invoiceDateToShow = isSubscription ? invoiceData?.billing_start_date : invoiceData?.due_date || invoiceData?.billing_start_date

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoiceData?.invoice_number}`,
    onBeforeGetContent: () => { setIsPrinting(true); return new Promise((resolve) => { setTimeout(resolve, 100) }) },
    onAfterPrint: () => setIsPrinting(false),
    removeAfterPrint: true,
    onPrintError: (error) => { console.error("Print failed:", error); setError("Failed to print. Please try again."); setIsPrinting(false) },
  })

  const printInvoice = () => { try { handlePrint() } catch (error) { console.error("Error during print:", error); setError("An unexpected error occurred while printing. Please try again."); setIsPrinting(false) } }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setIsDownloading(true)
    setError(null)
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", width: printRef.current.scrollWidth, height: printRef.current.scrollHeight })
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
      while (heightLeft >= 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight); heightLeft -= pdfHeight }
      pdf.save(`Invoice-${invoiceData?.invoice_number}.pdf`)
    } catch (error) { console.error("PDF generation failed:", error); setError("Failed to generate PDF. Please try again.") } finally { setIsDownloading(false) }
  }

  const handleShareWhatsApp = async () => {
    if (!invoiceData?.customer_phone || !printRef.current) return
    try {
      setError(null)
      let phoneNumber = invoiceData.customer_phone.replace(/\D/g, "")
      if (phoneNumber.startsWith("92") && phoneNumber.length === 12) { }
      else if (phoneNumber.startsWith("03") && phoneNumber.length === 11) { phoneNumber = "92" + phoneNumber.substring(1) }
      else if (phoneNumber.startsWith("3") && phoneNumber.length === 10) { phoneNumber = "92" + phoneNumber }
      else if (phoneNumber.startsWith("0092") && phoneNumber.length === 14) { phoneNumber = phoneNumber.substring(2) }
      else if (phoneNumber.startsWith("+92") && phoneNumber.length === 13) { phoneNumber = phoneNumber.substring(1) }
      const publicInvoiceUrl = `${window.location.origin}/public/invoice/${invoiceData.id}`
      const message = `Hello ${invoiceData.customer_name},\n\nYour invoice #${invoiceData.invoice_number} is ready.\n\n📋 Invoice Details:\n• Amount: PKR ${invoiceData.total_amount.toFixed(2)}\n• Due Date: ${formatDate(invoiceData.due_date)}\n• Status: ${invoiceData.status}\n\n📄 View your complete invoice here:\n${publicInvoiceUrl}\n\nPlease review your invoice and make the payment if pending.\n\nThank you for choosing MBA Communications!`
      const whatsappAppUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
      const whatsappWebUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.location.href = whatsappAppUrl
      setTimeout(() => { window.open(whatsappWebUrl, "_blank") }, 1000)
    } catch (error) { console.error("WhatsApp share failed:", error); setError("Failed to share via WhatsApp. Please try again.") }
  }

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-red-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Invoice</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={fetchInvoiceData} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25">Try Again</button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(invoiceData?.status || "")

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className={`flex-1 overflow-x-hidden overflow-y-auto p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-0 md:ml-20"}`}>
          <div className="max-w-4xl mx-auto">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Invoice Details</h1>
                <p className="text-slate-500 text-sm mt-1">View, print, or share this invoice</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={printInvoice} disabled={isPrinting}
                  className={`group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-200 ${isPrinting ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  {isPrinting ? "Printing..." : "Print"}
                </button>
                <button onClick={handleDownloadPDF} disabled={isDownloading}
                  className={`group flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl transition-all duration-200 ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {isDownloading ? "Generating..." : "Download PDF"}
                </button>
                <button onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl font-medium shadow-lg shadow-green-500/25 hover:bg-[#128C7E] transition-all duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z" /></svg>
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Main Invoice Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              <div ref={printRef} className="p-6 sm:p-10">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">INVOICE</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        <span>{statusConfig.icon}</span>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-sm">#{invoiceData?.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <div className="h-12 w-28 mb-3"><MBALogo variant="landscape" /></div>
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
                          <p className="text-sm font-semibold text-slate-700">{invoiceDateToShow && formatDate(invoiceDateToShow)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                          <p className="text-sm font-semibold text-slate-700">{invoiceData?.due_date && formatDate(invoiceData.due_date)}</p>
                        </div>
                      </div>
                      {isSubscription && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing Period</p>
                          <p className="text-sm font-semibold text-slate-700">{invoiceData?.billing_start_date && formatDate(invoiceData.billing_start_date)} — {invoiceData?.billing_end_date && formatDate(invoiceData.billing_end_date)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-8 border-b border-slate-100">
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                          <th className="text-left text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 w-3/4">{invoiceData?.invoice_type === 'equipment' ? 'Item Description' : 'Service Description'}</th>
                          {invoiceData?.invoice_type === 'equipment' && (
                            <>
                              <th className="text-center text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-3 whitespace-nowrap">Qty</th>
                              <th className="text-right text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 whitespace-nowrap">Unit Price</th>
                            </>
                          )}
                          <th className="text-right text-xs font-bold text-white/90 uppercase tracking-wider py-4 px-5 whitespace-nowrap w-1/4">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceData?.line_items && invoiceData.line_items.length > 0 ? (
                          invoiceData.line_items.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-5">
                                <p className="font-semibold text-slate-800">{item.description}</p>
                                {index === 0 && isSubscription && (
                                  <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">Period: {formatDate(invoiceData.billing_start_date)} — {formatDate(invoiceData.billing_end_date)}</p>
                                )}
                                {item.item_type === 'equipment' && item.inventory_item_type && (
                                  <p className="text-xs text-slate-400 mt-0.5">Type: {item.inventory_item_type}</p>
                                )}
                              </td>
                              {invoiceData?.invoice_type === 'equipment' && (
                                <>
                                  <td className="py-4 px-3 text-center text-slate-700">{item.quantity}</td>
                                  <td className="py-4 px-5 text-right text-slate-600 whitespace-nowrap">PKR {item.unit_price.toLocaleString()}</td>
                                </>
                              )}
                              <td className="py-4 px-5 text-right font-bold text-slate-800 whitespace-nowrap">PKR {item.line_total.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-5" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>
                              <p className="font-semibold text-slate-800">{invoiceData && getServiceDescription(invoiceData)}</p>
                              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                                {isSubscription ? `Period: ${formatDate(invoiceData!.billing_start_date)} — ${formatDate(invoiceData!.billing_end_date)}` : `Date: ${formatDate(invoiceDateToShow || "")}`}
                              </p>
                              {invoiceData?.notes && <p className="text-xs text-slate-400 mt-1">Note: {invoiceData.notes}</p>}
                            </td>
                            <td className="py-4 px-5 text-right font-bold text-slate-800 whitespace-nowrap">PKR {invoiceData?.subtotal.toLocaleString()}</td>
                          </tr>
                        )}
                        {isSubscription && invoiceData && invoiceData.discount_percentage > 0 && (
                          <tr className="bg-emerald-50/50">
                            <td className="py-3 px-5 text-slate-600" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>Discount ({invoiceData.discount_percentage}%)</td>
                            <td className="py-3 px-5 text-right font-semibold text-emerald-600 whitespace-nowrap">-PKR {(invoiceData.subtotal * (invoiceData.discount_percentage / 100)).toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                          <td className="py-4 px-5 text-right font-bold text-white uppercase tracking-wide" colSpan={invoiceData?.invoice_type === 'equipment' ? 3 : 1}>Total Amount</td>
                          <td className="py-4 px-5 text-right"><span className="text-2xl font-bold text-white">PKR {invoiceData?.total_amount.toLocaleString()}</span></td>
                        </tr>
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
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPaymentStatusColor(payment.status)}`}>{payment.status}</span>
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
                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
                      {bankAccounts.map((account) => (
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
      </div>
    </div>
  )
}

export default InvoiceGenerationPage
