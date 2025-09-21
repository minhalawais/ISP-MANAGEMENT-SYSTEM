"use client"

import React from "react"

import { useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/crudPage.tsx"
import { InvoiceForm } from "../../components/forms/invoiceForm.tsx"

interface Invoice {
  id: string
  invoice_number: string
  customer_id: string
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
  useEffect(() => {
    document.title = "MBA NET - Invoice Management"
  }, [])

  const columns = React.useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        header: "Invoice Number",
        accessorKey: "invoice_number",
      },
      {
        header: "Customer Name",
        accessorKey: "customer_name",
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
          let bgColor = ""
          let textColor = ""

          switch (status) {
            case "paid":
              bgColor = "bg-[#D1FAE5]"
              textColor = "text-[#10B981]"
              break
            case "pending":
              bgColor = "bg-[#FEF3C7]"
              textColor = "text-[#F59E0B]"
              break
            case "overdue":
              bgColor = "bg-[#FEE2E2]"
              textColor = "text-[#EF4444]"
              break
            default:
              bgColor = "bg-[#EBF5FF]"
              textColor = "text-[#3A86FF]"
          }

          return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>{status}</span>
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

    return formattedData
  }

  return (
    <CRUDPage<Invoice>
      title="Invoice"
      endpoint="invoices"
      columns={columns}
      FormComponent={InvoiceForm}
      onSubmit={handleSubmit}
    />
  )
}

export default InvoiceManagement
