"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/crudPage.tsx"
import { EmployeeForm } from "../../components/forms/employeeForm.tsx"

interface Employee {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  contact_number: string
  cnic: string
}

const EmployeeManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Employee Management"
  }, [])

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        header: "Name",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      },
      {
        header: "Username",
        accessorKey: "username",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Contact Number",
        accessorKey: "contact_number",
      },
      {
        header: "CNIC",
        accessorKey: "cnic",
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: (info) => (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-violet-100 text-violet-800 border border-violet-200">
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <CRUDPage<Employee>
      title="Employee"
      endpoint="employees"
      columns={columns}
      FormComponent={EmployeeForm}
      validateBeforeSubmit={(formData) => {
        if (!formData.username || !formData.email) {
          return "Username and email are required"
        }
        return null
      }}
    />
  )
}

export default EmployeeManagement
