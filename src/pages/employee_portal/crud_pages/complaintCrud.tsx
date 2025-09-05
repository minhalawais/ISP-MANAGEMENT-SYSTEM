"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../../components/employee_portal/ComplaintCrudPage.tsx"
import { ComplaintForm } from "../../../components/employee_portal/forms/complaintForm.tsx"
import { useNavigate } from "react-router-dom"
import { getToken } from "../../../utils/auth.ts"
import axiosInstance from "../../../utils/axiosConfig.ts"
interface Complaint {
  id: string
  customer_name: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to_name: string
  created_at: string
  response_due_date: string | null
  is_active: boolean
  remarks: string
  attachment_path: string | null
}

const ComplaintManagement: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "MBA NET - Complaint Management"
  }, [])

  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => [
      {
        header: "Ticket #",
        accessorKey: "ticket_number",
      },
      {
        header: "Internet ID",
        accessorKey: "internet_id",
      },
      {
        header: "Customer",
        accessorKey: "customer_name",
      },
      {
        header: "Phone No",
        accessorKey: "phone_number",
      },
      {
        header: "Description",
        accessorKey: "description",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (info) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${
              info.getValue() === "open"
                ? "bg-yellow-100 text-yellow-800"
                : info.getValue() === "in_progress"
                  ? "bg-blue-100 text-blue-800"
                  : info.getValue() === "resolved"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Assigned To",
        accessorKey: "assigned_to_name",
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        cell: (info) => new Date(info.getValue() as string).toLocaleString(),
      },
      {
        header: "Due Date",
        accessorKey: "response_due_date",
        cell: (info) => (info.getValue() ? new Date(info.getValue() as string).toLocaleString() : "N/A"),
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        cell: (info) => (
          <span className="truncate max-w-xs" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Attachment",
        accessorKey: "attachment_path",
        cell: (info: any) => (
          <button
          onClick={async () => {
            if (info.getValue()) {
              try {
                const response = await axiosInstance.get(
                  `/complaints/attachment/${info.row.original.id}`,
                  { responseType: "blob" } // 👈 ensures we get a blob
                );
        
                const url = window.URL.createObjectURL(response.data);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
        
                // cleanup
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error("Error fetching attachment:", error);
                alert("Failed to load attachment. Please try again.");
              }
            }
          }}
          className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          disabled={!info.getValue()}
        >
          {info.getValue() ? "View Attachment" : "No Attachment"}
        </button>
        
        ),
      },
    ],
    [],
  )

  const handleAddNew = () => {
    navigate("/complaints/new")
  }

  return (
    <CRUDPage<Complaint>
      title="Complaint"
      endpoint="complaints"
      columns={columns}
      FormComponent={ComplaintForm}
      onAddNew={handleAddNew}
    />
  )
}

export default ComplaintManagement

