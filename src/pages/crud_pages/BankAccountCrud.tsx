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
  initial_balance: number  // NEW
  branch_address?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

import { useCompany } from '../../context/CompanyContext.tsx'

const BankAccountManagement: React.FC = () => {
  const { setPageTitle } = useCompany()

  useEffect(() => {
    setPageTitle("Bank Account Management")
  }, [setPageTitle])

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
        header: 'Initial Balance',
        accessorKey: 'initial_balance',
        cell: info => `PKR ${(info.getValue() as number)?.toLocaleString() || '0.00'}`,
      },
      {
        header: 'Branch Code',
        accessorKey: 'branch_code',
        cell: info => info.getValue() || 'N/A',
      },
      {
        header: 'Status',
        accessorKey: 'is_active',
        cell: info => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            info.getValue() ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
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