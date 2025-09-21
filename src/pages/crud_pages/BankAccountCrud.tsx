import React, { useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { BankAccountForm } from '../../components/forms/BankAccountForm.tsx'

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string
  branch_code?: string
  branch_address?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const BankAccountManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Bank Account Management"
  }, [])

  const columns = React.useMemo<ColumnDef<BankAccount>[]>(
    () => [
      {
        header: 'Bank Name',
        accessorKey: 'bank_name',
      },
      {
        header: 'Account Title',
        accessorKey: 'account_title',
      },
      {
        header: 'Account Number',
        accessorKey: 'account_number',
      },
      {
        header: 'IBAN',
        accessorKey: 'iban',
        cell: info => info.getValue() || 'N/A',
      },
      {
        header: 'Branch Code',
        accessorKey: 'branch_code',
        cell: info => info.getValue() || 'N/A',
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: info => {
          const date = info.getValue<string>()
          return date ? new Date(date).toLocaleDateString() : 'N/A'
        },
      },
    ],
    []
  )

  return (
    <CRUDPage<BankAccount>
      title="Bank Account"
      endpoint="bank-accounts"
      columns={columns}
      FormComponent={BankAccountForm}
    />
  )
}

export default BankAccountManagement