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
  billing_start_date: string
  billing_end_date: string
  due_date: string
  subtotal: number
  discount_percentage: number
  total_amount: number
  invoice_type: string
  notes: string
  status: string
}

const InvoiceGenerationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.title = "MBA NET - Invoice Details"
    fetchInvoiceData()
  }, [id])

  useEffect(() => {
    if (error) {
      console.error("Print error:", error)
    }
  }, [error])

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

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
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
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF("p", "mm", "a4")
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight)

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
        return "bg-[#D1FAE5] text-[#10B981]"
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
      <div className="flex items-center justify-center min-h-screen bg-[#EBF5FF]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-[#3A86FF] rounded mb-4"></div>
          <div className="text-[#2A5C8A]">Loading invoice details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#EBF5FF]">
        <div className="text-center">
          <div className="text-[#EF4444] mb-4">{error}</div>
          <button
            onClick={fetchInvoiceData}
            className="px-4 py-2 bg-[#3A86FF] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#EBF5FF]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#EBF5FF] p-6 pt-20 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}
        >
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-[#2A5C8A]">Invoice Details</h1>
              <div className="flex gap-4">
                <button
                  onClick={printInvoice}
                  disabled={isPrinting}
                  className={`flex items-center gap-2 px-6 py-3 bg-white text-[#2A5C8A] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-[#EBF5FF] ${isPrinting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  className={`flex items-center gap-2 px-6 py-3 bg-[#3A86FF] text-white rounded-lg shadow-sm hover:bg-[#2563EB] transition-all duration-200 ${isDownloading ? "opacity-50 cursor-not-allowed" : ""}`}
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
            </div>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-[#EBF5FF]">
              <div ref={printRef} className="p-8">
                {/* Header with Logo */}
                <div className="relative border-b border-[#EBF5FF] pb-8">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2A5C8A] to-[#3A86FF]"></div>
                  <div className="flex justify-between items-start pt-4">
                    <div>
                      <div className="text-5xl font-extrabold text-[#2A5C8A] tracking-tight">INVOICE</div>
                      <div className="text-[#4A5568] mt-2 text-lg">#{invoiceData?.invoice_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="h-24 w-48">
                        <MBALogo variant="landscape" />
                      </div>
                      <div className="text-[#2A5C8A]">MBA Communications</div>
                      <div className="text-[#4A5568] text-sm">123 Business Street</div>
                      <div className="text-[#4A5568] text-sm">City, State 12345</div>
                    </div>
                  </div>
                </div>

                {/* Client & Invoice Info Section */}
                <div className="grid md:grid-cols-2 gap-12 py-10">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-3">Bill To</h2>
                      <div className="text-[#3A86FF] font-semibold text-xl">{invoiceData?.customer_name}</div>
                      <div className="text-[#4A5568] mt-2 leading-relaxed">{invoiceData?.customer_address}</div>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-3">Status</h2>
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(invoiceData?.status || "")}`}
                      >
                        {invoiceData?.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-3">Invoice Date</h2>
                        <div className="text-[#4A5568]">
                          {invoiceData?.billing_start_date &&
                            new Date(invoiceData.billing_start_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-3">Due Date</h2>
                        <div className="text-[#4A5568]">
                          {invoiceData?.due_date && new Date(invoiceData.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-3">Billing Period</h2>
                      <div className="text-[#4A5568]">
                        {invoiceData?.billing_start_date &&
                          new Date(invoiceData.billing_start_date).toLocaleDateString()}{" "}
                        - {invoiceData?.billing_end_date && new Date(invoiceData.billing_end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="py-10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#EBF5FF]">
                        <th className="text-left text-sm font-bold text-[#2A5C8A] uppercase tracking-wider pb-6">
                          Description
                        </th>
                        <th className="text-right text-sm font-bold text-[#2A5C8A] uppercase tracking-wider pb-6">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBF5FF]">
                      <tr>
                        <td className="py-6">
                          <div className="text-[#3A86FF] font-medium">{invoiceData?.invoice_type}</div>
                          <div className="text-[#4A5568] mt-1">
                            Service Period:{" "}
                            {invoiceData?.billing_start_date &&
                              new Date(invoiceData.billing_start_date).toLocaleDateString()}{" "}
                            -
                            {invoiceData?.billing_end_date &&
                              new Date(invoiceData.billing_end_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-6 text-right text-[#3A86FF] font-medium">
                          PKR{invoiceData?.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      {invoiceData?.discount_percentage > 0 && (
                        <tr>
                          <td className="py-6 text-[#3A86FF]">Discount</td>
                          <td className="py-6 text-right text-[#10B981] font-medium">
                            -PKR{(invoiceData.subtotal * (invoiceData.discount_percentage / 100)).toFixed(2)}
                            <span className="text-sm text-[#4A5568] ml-1">({invoiceData.discount_percentage}%)</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#EBF5FF]">
                        <td className="pt-6 text-right font-bold text-[#2A5C8A] uppercase tracking-wider">
                          Total Amount
                        </td>
                        <td className="pt-6 text-right">
                          <div className="text-3xl font-bold text-[#3A86FF]">
                            PKR{invoiceData?.total_amount.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Notes Section */}
                {invoiceData?.notes && (
                  <div className="bg-[#EBF5FF] rounded-lg p-6 mt-8">
                    <h2 className="text-sm font-bold text-[#2A5C8A] uppercase tracking-wider mb-4">Additional Notes</h2>
                    <div className="text-[#4A5568] leading-relaxed">{invoiceData.notes}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-16 pt-8 border-t border-[#EBF5FF]">
                  <div className="text-[#3A86FF] font-medium">Thank you for your business!</div>
                  <div className="mt-2 text-[#4A5568]">
                    Questions? Contact us at support@mbacommunications.com or call (555) 123-4567
                  </div>
                  <div className="mt-6 text-[#4A5568] text-sm">
                    Invoice generated on {new Date().toLocaleDateString()}
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
