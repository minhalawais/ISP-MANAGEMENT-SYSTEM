"use client"

import React from "react"

import { useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/invoiceCrudPage.tsx"
import { InvoiceForm } from "../../components/forms/invoiceForm.tsx"
import { BulkInvoiceModal } from "../../components/modals/BulkInvoiceModal.tsx"
import { Modal } from "../../components/modal.tsx"
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_PRIMARY_BTN } from "../../components/ui/modalStyles.ts"
import { PaymentForm } from "../../components/forms/paymentForm.tsx"
import { getToken } from "../../utils/auth.ts"
import { useCompany } from "../../context/CompanyContext.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import {
  FileText,
  Plus,
  Check
} from "lucide-react"
import { formatShortDisplayDate } from "../../utils/formatShortDisplayDate.ts"

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
  charge_types?: string[]
  notes: string
  status: string
  is_active: boolean
}

const InvoiceManagement: React.FC = () => {
  const { setPageTitle } = useCompany()
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentFormData, setPaymentFormData] = useState<any>({})
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  useEffect(() => {
    setPageTitle("Invoice Management")
  }, [setPageTitle])
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

      toast.success("Payment added successfully")

      setShowPaymentModal(false)
      setPaymentFormData({})
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("Failed to add payment", error)
      toast.error("Failed to add payment")
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
        header: "Billing Start",
        accessorKey: "billing_start_date",
        cell: (info) => (
          <span className="whitespace-nowrap text-sm">
            {formatShortDisplayDate(info.getValue<string>())}
          </span>
        ),
      },
      {
        header: "Billing End",
        accessorKey: "billing_end_date",
        cell: (info) => (
          <span className="whitespace-nowrap text-sm">
            {formatShortDisplayDate(info.getValue<string>())}
          </span>
        ),
      },
      {
        header: "Due Date",
        accessorKey: "due_date",
        cell: (info) => new Date(info.getValue<string>()).toLocaleDateString(),
      },
      {
        header: "Type",
        accessorKey: "invoice_type",
        cell: (info) => {
          const invoice = info.row.original
          const label =
            invoice.invoice_type === "mixed" && invoice.charge_types?.length
              ? invoice.charge_types.join(" + ")
              : (info.getValue<string>() || "—")
          return (
            <span className="text-xs font-medium capitalize text-slate-700 whitespace-nowrap">
              {label.replace(/_/g, " ")}
            </span>
          )
        },
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
                px-2 py-0.5 text-xs font-medium border uppercase rounded
                ${bgColor} ${textColor} ${borderColor}
                transition-colors duration-150
                ${isPending
                  ? 'cursor-pointer hover:opacity-90'
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
    const formattedData = { ...formData }
    if (formattedData.due_date) {
      formattedData.due_date = new Date(formattedData.due_date).toISOString().split("T")[0]
    }
    if (Array.isArray(formattedData.lines)) {
      formattedData.lines = formattedData.lines.map((l: any) => ({
        ...l,
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
        discount_amount: Number(l.discount_amount) || 0,
        billing_start_date: l.billing_start_date
          ? new Date(l.billing_start_date).toISOString().split("T")[0]
          : undefined,
        billing_end_date: l.billing_end_date
          ? new Date(l.billing_end_date).toISOString().split("T")[0]
          : undefined,
      }))
    }
    // Prefer lines-driven create; drop legacy-only fields that confuse totals
    delete formattedData.inventory_items
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
        validateBeforeSubmit={(formData) => {
          if (!formData.customer_id) return "Customer is required"
          if (!formData.due_date) return "Due date is required"
          const lines = (formData as any).lines
          if (!Array.isArray(lines) || lines.length === 0) return "Add at least one charge line"
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (!line.charge_type) return `Line ${i + 1}: charge type is required`
            if (line.charge_type === "subscription" && (!line.billing_start_date || !line.billing_end_date)) {
              return `Line ${i + 1}: subscription requires billing dates`
            }
            if (line.charge_type === "equipment" && !line.inventory_item_id) {
              return `Line ${i + 1}: equipment requires an inventory item`
            }
          }
          return null
        }}
        customHeaderButton={
          <button
            onClick={() => setShowBulkModal(true)}
            className="h-9 bg-emerald-green text-white px-3 text-sm rounded-lg hover:bg-emerald-green/90 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
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
        <form onSubmit={handlePaymentSubmit}>
          <PaymentForm
            formData={paymentFormData}
            handleInputChange={handlePaymentInputChange}
            isEditing={false}
          />
          <div className={MODAL_FOOTER}>
            <button
              type="button"
              onClick={handlePaymentCancel}
              className={MODAL_CANCEL_BTN}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPaymentLoading}
              className={MODAL_PRIMARY_BTN}
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
