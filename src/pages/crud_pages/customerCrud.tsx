"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/customerCrudPage.tsx"
import { CustomerForm } from "../../components/forms/customerForm.tsx"
import { ImageViewerModal, useImageViewer } from "../../components/modals/ImageViewerModal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Eye, FileText } from "lucide-react"

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
  const imageViewer = useImageViewer()

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
        cell: (info) => {
           const planRaw = info.getValue() as string;
           if (!planRaw) return <span className="text-gray-400 italic text-xs">No Plan</span>;

           const plans = planRaw.includes(',') 
             ? planRaw.split(',').map(p => p.trim()) 
             : [planRaw];
           
           return (
             <div className="flex flex-wrap gap-1.5">
               {plans.map((plan, index) => {
                 // Generate a deterministic color based on plan name length or char code
                 const colors = [
                   "bg-blue-50 text-blue-700 border-blue-200",
                   "bg-purple-50 text-purple-700 border-purple-200",
                   "bg-indigo-50 text-indigo-700 border-indigo-200",
                   "bg-cyan-50 text-cyan-700 border-cyan-200",
                   "bg-teal-50 text-teal-700 border-teal-200"
                 ];
                 const colorClass = colors[plan.length % colors.length];

                 return (
                   <span key={index} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass} shadow-sm whitespace-nowrap`}>
                     {plan}
                   </span>
                 );
               })}
             </div>
           );
        }
      },
      {
        header: "CNIC Front Image",
        accessorKey: "cnic_front_image",
        cell: (info: any) => (
          <div className="flex justify-center">
            {info.getValue() ? (
              <button
                onClick={() => imageViewer.openViewer(
                  `/customers/cnic-front-image/${info.row.original.id}`,
                  `CNIC Front - ${info.row.original.first_name} ${info.row.original.last_name}`,
                  axiosInstance
                )}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={() => imageViewer.openViewer(
                  `/customers/cnic-back-image/${info.row.original.id}`,
                  `CNIC Back - ${info.row.original.first_name} ${info.row.original.last_name}`,
                  axiosInstance
                )}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={() => imageViewer.openViewer(
                  `/customers/agreement-document/${info.row.original.id}`,
                  `Agreement - ${info.row.original.first_name} ${info.row.original.last_name}`,
                  axiosInstance
                )}
                className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                View
              </button>
            ) : (
              <span className="text-slate-gray text-xs">No Document</span>
            )}
          </div>
        ),
      },
    ],
    [imageViewer],
  )

  return (
    <>
      <CRUDPage<Customer>
        title="Customer"
        endpoint="customers"
        columns={columns}
        FormComponent={CustomerForm}
        supportsBulkAdd={true}
      />
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        onClose={imageViewer.closeViewer}
        imageUrl={imageViewer.imageUrl}
        title={imageViewer.title}
        isLoading={imageViewer.isLoading}
      />
    </>
  )
}

export default CustomerManagement
