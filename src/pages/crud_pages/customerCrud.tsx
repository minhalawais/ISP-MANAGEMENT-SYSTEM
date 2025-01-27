import type React from "react"
import { useMemo, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/customerCrudPage.tsx"
import { CustomerForm } from "../../components/forms/customerForm.tsx"
import { getToken } from "../../utils/auth.ts"

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
  splitter: string
  equipment_owned_by: string
  connection_type: string
  installation_date: string | null
  is_active: boolean
  cnic: string
  cnic_front_image: string | null
  cnic_back_image: string | null
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
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Phone 1",
        accessorKey: "phone_1",
      },
      {
        header: "Phone 2",
        accessorKey: "phone_2",
      },
      {
        header: "Area",
        accessorKey: "area",
      },
      {
        header: "Installation Address",
        accessorKey: "installation_address",
      },
      {
        header: "Service Plan",
        accessorKey: "service_plan",
      },
      {
        header: "ISP",
        accessorKey: "isp",
      },
      {
        header: "Splitter",
        accessorKey: "splitter",
      },
      {
        header: "Equipment Owned By",
        accessorKey: "equipment_owned_by",
      },
      {
        header: "Connection Type",
        accessorKey: "connection_type",
      },
      {
        header: "Installation Date",
        accessorKey: "installation_date",
      },
      {
        header: "CNIC",
        accessorKey: "cnic",
      },
      {
        header: "CNIC Front Image",
        accessorKey: "cnic_front_image",
        cell: (info: any) => (
          <button
            onClick={() => {
              if (info.getValue()) {
                const token = getToken()
                fetch(`http://127.0.0.1:5000/customers/cnic-front-image/${info.row.original.id}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                })
                  .then((response) => response.blob())
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.style.display = "none"
                    a.href = url
                    a.target = "_blank"
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                  })
                  .catch((error) => console.error("Error:", error))
              }
            }}
            className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            disabled={!info.getValue()}
          >
            {info.getValue() ? "View Front CNIC" : "No Image"}
          </button>
        ),
      },
      {
        header: "CNIC Back Image",
        accessorKey: "cnic_back_image",
        cell: (info: any) => (
          <button
            onClick={() => {
              if (info.getValue()) {
                const token = getToken()
                fetch(`http://127.0.0.1:5000/customers/cnic-back-image/${info.row.original.id}`, {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                })
                  .then((response) => response.blob())
                  .then((blob) => {
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.style.display = "none"
                    a.href = url
                    a.target = "_blank"
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                  })
                  .catch((error) => console.error("Error:", error))
              }
            }}
            className="px-2 py-1 bg-[#89A8B2] text-white text-sm rounded-md shadow-md hover:bg-[#B3C8CF] transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            disabled={!info.getValue()}
          >
            {info.getValue() ? "View Back CNIC" : "No Image"}
          </button>
        ),
      }
    ],
    [],
  )

  return <CRUDPage<Customer> title="Customer" endpoint="customers" columns={columns} FormComponent={CustomerForm} />
}

export default CustomerManagement

