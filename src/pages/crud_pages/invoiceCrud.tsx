"use client"

import React from "react"

import { useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/invoiceCrudPage.tsx"
import { InvoiceForm } from "../../components/forms/invoiceForm.tsx"
import { BulkInvoiceModal } from "../../components/modals/BulkInvoiceModal.tsx"
import { Modal } from "../../components/modal.tsx"
import { PaymentForm } from "../../components/forms/paymentForm.tsx"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  FileText,
  Plus,
  Check
} from "lucide-react"
interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
  internet_id: string
  customer_name: string
  billing_start_date: string
  billing_end_date: string
  due_date: string
  subtotal: string | number
  discount_percentage: string | number
  total_amount: string | number
  invoice_type: string
  notes: string
  status: string
  is_active: boolean
}

const InvoiceManagement = () => {
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState<any>({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  useEffect(() => {
    document.title = "MBA NET - Invoice Management"
  }, [])
  const handleBulkSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    setShowBulkModal(false)
  }

  const handlePendingClick = (invoice: any) => {
    // Pre-fill payment form with invoice data
    setPaymentFormData({
      invoice_id: invoice.id,
      amount: invoice.total_amount,
      status: "paid"
    })
    setShowPaymentModal(true)
  }

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPaymentFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPaymentLoading(true)
    try {
      const token = getToken()

      // Format the payment data
      const formattedData = { ...paymentFormData }

      // Handle file upload if payment_proof exists
      if (formattedData.payment_proof instanceof File) {
        const formDataToSend = new FormData()
        Object.keys(formattedData).forEach((key) => {
          formDataToSend.append(key, formattedData[key])
        })

        await axiosInstance.post("/payments/add", formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      } else {
        await axiosInstance.post("/payments/add", formattedData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      toast.success("Payment added successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })

      setShowPaymentModal(false)
      setPaymentFormData({})
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("Failed to add payment", error)
      toast.error("Failed to add payment", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsPaymentLoading(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setPaymentFormData({})
  }
  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        header: "Invoice Number",
        accessorKey: "invoice_number",
      },
      {
        header: "Internet ID",
        accessorKey: "internet_id",
      },
      {
        header: "Billing Start",
        accessorKey: "billing_start_date",
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: "Billing End",
        accessorKey: "billing_end_date",
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: "Due Date",
        accessorKey: "due_date",
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: "Subtotal",
        accessorKey: "subtotal",
        cell: (info) => {
          const value = Number.parseFloat(info.getValue<string | number>() as string)
          return !isNaN(value) ? `PKR${value.toFixed(2)}` : "N/A"
        },
      },
      {
        header: "Discount %",
        accessorKey: "discount_percentage",
        cell: (info) => {
          const value = Number.parseFloat(info.getValue<string | number>() as string)
          return !isNaN(value) ? `${value.toFixed(2)}%` : "N/A"
        },
      },
      {
        header: "Total Amount",
        accessorKey: "total_amount",
        cell: (info) => {
          const value = Number.parseFloat(info.getValue<string | number>() as string)
          return !isNaN(value) ? `PKR${value.toFixed(2)}` : "N/A"
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => {
          const status = info.getValue<string>()
          const invoice = info.row.original
          const isPending = status === "pending"

          let bgColor = ""
          let textColor = ""
          let borderColor = ""

          switch (status) {
            case "paid":
              bgColor = "bg-gradient-to-br from-emerald-50 to-emerald-100"
              textColor = "text-emerald-700"
              borderColor = "border-emerald-200"
              break
            case "pending":
              bgColor = "bg-gradient-to-br from-amber-50 to-amber-100"
              textColor = "text-amber-700"
              borderColor = "border-amber-200"
              break
            case "overdue":
              bgColor = "bg-gradient-to-br from-red-50 to-red-100"
              textColor = "text-red-700"
              borderColor = "border-red-200"
              break
            default:
              bgColor = "bg-gradient-to-br from-blue-50 to-blue-100"
              textColor = "text-blue-700"
              borderColor = "border-blue-200"
          }

          return (
            <button
              onClick={isPending ? () => handlePendingClick(invoice) : undefined}
              disabled={!isPending}
              className={`
                px-4 py-2 text-xs font-semibold border uppercase
                ${bgColor} ${textColor} ${borderColor}
                transition-all duration-200 ease-out
                ${isPending
                  ? 'cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed opacity-60'
                }
              `}
              title={isPending ? "Click to add payment" : status}
            >
              {status}
            </button>
          )
        },
      },
    ],
    [],
  )

  const handleSubmit = async (formData: any, isEditing: boolean) => {
    const dateFields = ["billing_start_date", "billing_end_date", "due_date"]
    const numberFields = ["subtotal", "discount_percentage", "total_amount"]
    const formattedData = { ...formData }

    dateFields.forEach((field) => {
      if (formattedData[field]) {
        formattedData[field] = new Date(formattedData[field]).toISOString().split("T")[0]
      }
    })

    numberFields.forEach((field) => {
      if (formattedData[field]) {
        formattedData[field] = Number.parseFloat(formattedData[field])
      }
    })

    // Parse inventory_items JSON for equipment invoices
    if (formattedData.inventory_items && typeof formattedData.inventory_items === 'string') {
      try {
        formattedData.inventory_items = JSON.parse(formattedData.inventory_items)
      } catch (e) {
        console.error("Failed to parse inventory_items", e)
        formattedData.inventory_items = []
      }
    }

    return formattedData
  }

  return (
    <>

      <CRUDPage<Invoice>
        title="Invoice"
        endpoint="invoices"
        columns={columns}
        FormComponent={InvoiceForm}
        onSubmit={handleSubmit}
        customHeaderButton={
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-emerald-green text-white px-4 py-2.5 rounded-lg hover:bg-emerald-green/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FileText className="h-5 w-5" />
            Generate Monthly Invoices
          </button>
        }
        refreshTrigger={refreshTrigger}
      />
      <BulkInvoiceModal
        isVisible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={handleBulkSuccess}
      />
      {/* Payment Modal */}
      <Modal
        isVisible={showPaymentModal}
        onClose={handlePaymentCancel}
        title="Add Payment"
        isLoading={isPaymentLoading}
      >
        <form onSubmit={handlePaymentSubmit} className="bg-white">
          <PaymentForm
            formData={paymentFormData}
            handleInputChange={handlePaymentInputChange}
            isEditing={false}
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handlePaymentCancel}
              className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPaymentLoading}
              className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isPaymentLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add Payment
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>

  )
}

export default InvoiceManagement
