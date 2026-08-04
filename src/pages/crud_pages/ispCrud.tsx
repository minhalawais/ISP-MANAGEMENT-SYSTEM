import type React from "react"
import { useState, useEffect } from "react"
import { CRUDPage } from "../../components/crudPage.tsx"
import { ISPForm } from "../../components/forms/ispForm.tsx"
import type { ColumnDef } from "@tanstack/react-table"

interface ISP {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  is_active: boolean
}

import { useCompany } from "../../context/CompanyContext.tsx"

const ISPManagement: React.FC = () => {
  const { setPageTitle } = useCompany()

  useEffect(() => {
    setPageTitle("ISP Management")
  }, [setPageTitle])

  const columns: ColumnDef<ISP>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Contact Person",
      accessorKey: "contact_person",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Phone",
      accessorKey: "phone",
    },
    {
      header: "Address",
      accessorKey: "address",
    },
  ]

  return <CRUDPage<ISP> title="ISP" endpoint="isps" columns={columns} FormComponent={ISPForm} />
}

export default ISPManagement

