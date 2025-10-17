"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/customerCrudPage.tsx"
import { CustomerForm } from "../../components/forms/customerForm.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"

interface Customer {
  id: string
  internet_id: string
  first_name: string
  last_name: string
  email: string
  phone_1: string
  phone_2: string | null
  area: string
  installation_address: string
  service_plan: string
  isp: string
  connection_type: string
  internet_connection_type: string | null
  tv_cable_connection_type: string | null
  installation_date: string | null
  is_active: boolean
  cnic: string
  cnic_front_image: string | null
  cnic_back_image: string | null
  gps_coordinates: string | null
  agreement_document: string | null
}

const CustomerManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Customer Management"
  }, [])

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        header: "Internet ID",
        accessorKey: "internet_id",
      },
      {
        header: "Name",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      },
      {
        header: "Phone 1",
        accessorKey: "phone_1",
      },
      {
        header: "Area",
        accessorKey: "area",
      },
      {
        header: "Service Plan",
        accessorKey: "service_plan",
      },
      {
        header: "CNIC Front Image",
        accessorKey: "cnic_front_image",
        cell: (info: any) => (
          <div className="flex justify-center">
            {info.getValue() ? (
              <button
                onClick={async () => {
                  if (info.getValue()) {
                    try {
                      const response = await axiosInstance.get(
                        `/customers/cnic-front-image/${info.row.original.id}`,
                        { responseType: "blob" }, // 👈 important for images
                      )

                      const url = window.URL.createObjectURL(response.data)
                      window.open(url, "_blank")

                      // Revoke after 1 minute to allow viewing
                      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
                    } catch (error) {
                      console.error("Error:", error)
                      alert("Failed to load image. Please try again.")
                    }
                  }
                }}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View
              </button>
            ) : (
              <span className="text-slate-gray text-xs">No Image</span>
            )}
          </div>
        ),
      },
      {
        header: "CNIC Back Image",
        accessorKey: "cnic_back_image",
        cell: (info: any) => (
          <div className="flex justify-center">
            {info.getValue() ? (
              <button
                onClick={async () => {
                  if (info.getValue()) {
                    try {
                      const response = await axiosInstance.get(
                        `/customers/cnic-back-image/${info.row.original.id}`,
                        { responseType: "blob" }, // 👈 handle binary image
                      )

                      const url = window.URL.createObjectURL(response.data)
                      window.open(url, "_blank")

                      // Revoke after 1 minute to allow proper viewing
                      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
                    } catch (error) {
                      console.error("Error:", error)
                      alert("Failed to load image. Please try again.")
                    }
                  }
                }}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                View
              </button>
            ) : (
              <span className="text-slate-gray text-xs">No Image</span>
            )}
          </div>
        ),
      },
      {
        header: "Agreement Document",
        accessorKey: "agreement_document",
        cell: (info: any) => (
          <div className="flex justify-center">
            {info.getValue() ? (
              <button
                onClick={async () => {
                  if (info.getValue()) {
                    try {
                      const response = await axiosInstance.get(
                        `/customers/agreement-document/${info.row.original.id}`,
                        { responseType: "blob" }, // 👈 handle PDF/Doc blob
                      )

                      const url = window.URL.createObjectURL(response.data)
                      window.open(url, "_blank")

                      // revoke after 1 minute
                      setTimeout(() => window.URL.revokeObjectURL(url), 60000)
                    } catch (error) {
                      console.error("Error:", error)
                      alert("Failed to load document. Please try again.")
                    }
                  }
                }}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                View
              </button>
            ) : (
              <span className="text-slate-gray text-xs">No Document</span>
            )}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <CRUDPage<Customer>
      title="Customer"
      endpoint="customers"
      columns={columns}
      FormComponent={CustomerForm}
      supportsBulkAdd={true}
    />
  )
}

export default CustomerManagement
