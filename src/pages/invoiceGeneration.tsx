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

const InvoiceGenerationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
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

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const fetchInvoiceData = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      const response = await axiosInstance.get("/bank-accounts/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoiceData?.invoice_number}`,
    onBeforeGetContent: () => {
      setIsPrinting(true)
      return new Promise((resolve) => {
        setTimeout(resolve, 100)
      })
    },
    onAfterPrint: () => {
      setIsPrinting(false)
    },
    removeAfterPrint: true,
    onPrintError: (error) => {
      console.error("Print failed:", error)
      setError("Failed to print. Please try again.")
      setIsPrinting(false)
    },
  })

  const printInvoice = () => {
    try {
      handlePrint()
    } catch (error) {
      console.error("Error during print:", error)
      setError("An unexpected error occurred while printing. Please try again.")
      setIsPrinting(false)
    }
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
  const handleShareWhatsApp = async () => {
    if (!invoiceData?.customer_phone || !printRef.current) return;
  
    try {
      setError(null);
  
      // ✅ Normalize phone number
      let phoneNumber = invoiceData.customer_phone.replace(/\D/g, ""); // remove non-digits
  
      if (phoneNumber.startsWith("92") && phoneNumber.length === 12) {
        // Already in correct format
      } else if (phoneNumber.startsWith("03") && phoneNumber.length === 11) {
        // Convert local 03XXXXXXXXX → 92XXXXXXXXXX
        phoneNumber = "92" + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith("3") && phoneNumber.length === 10) {
        // Convert local 3XXXXXXXXX → 92XXXXXXXXXX
        phoneNumber = "92" + phoneNumber;
      } else if (phoneNumber.startsWith("0092") && phoneNumber.length === 14) {
        // Convert 0092XXXXXXXXXX → 92XXXXXXXXXX
        phoneNumber = phoneNumber.substring(2);
      } else if (phoneNumber.startsWith("+92") && phoneNumber.length === 13) {
        // Convert +92XXXXXXXXXX → 92XXXXXXXXXX
        phoneNumber = phoneNumber.substring(1);
      }
  
      // ✅ Generate public invoice link
      const publicInvoiceUrl = `${window.location.origin}/public/invoice/${invoiceData.id}`;
  
      // ✅ Build English-only message
      const message = `Hello ${invoiceData.customer_name},
  
  Your invoice #${invoiceData.invoice_number} is ready.
  
  📋 Invoice Details:
  • Amount: PKR ${invoiceData.total_amount.toFixed(2)}
  • Due Date: ${formatDate(invoiceData.due_date)}
  • Status: ${invoiceData.status}
  
  📄 View your complete invoice here:
  ${publicInvoiceUrl}
  
  Please review your invoice and make the payment if pending.
  
  Thank you for choosing MBA Communications!`;
  
      // ✅ Build URLs
      const whatsappAppUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      const whatsappWebUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
      // ✅ Try to open WhatsApp App first
      window.location.href = whatsappAppUrl;
  
      // ✅ Fallback to WhatsApp Web if app not available
      setTimeout(() => {
        window.open(whatsappWebUrl, "_blank");
      }, 1000);
    } catch (error) {
      console.error("WhatsApp share failed:", error);
      setError("Failed to share via WhatsApp. Please try again.");
    }
  };
  

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-[#D1FAE5] text-[#10B981] shadow-lg"
      case "pending":
        return "bg-[#FEF3C7] text-[#F59E0B]"
      case "overdue":
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 text-balance">Invoice Details</h1>
              <div className="flex gap-4">
                <button
                  onClick={printInvoice}
                  disabled={isPrinting}
                  className={`flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-blue-200 hover:border-blue-400 ${isPrinting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  {isPrinting ? "Printing..." : "Print"}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-lg shadow-md hover:bg-[#128C7E] hover:shadow-lg transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z" />
                  </svg>
                  Share via WhatsApp
                </button>
              </div>
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
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoiceData?.status || "")}`}
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

                {/* Payment details if paid */}
                
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
      </div>
    </div>
  )
}

export default InvoiceGenerationPage
