import React, { useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { BankAccountForm } from '../../components/forms/BankAccountForm.tsx'
import { useCompany } from '../../context/CompanyContext.tsx'

interface BankAccount {
  id: string
  bank_name: string
  account_title: string
  account_number: string
  iban?: string
  branch_code?: string
  initial_balance: number
  branch_address?: string
  qr_code_image?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

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
        header: 'QR',
        id: 'qr_code_image',
        accessorKey: 'qr_code_image',
        cell: info => (info.getValue() ? 'Yes' : '—'),
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
      filterModuleKey="bank-account"
      columns={columns}
      FormComponent={BankAccountForm}
      useFormData={true}
    />
  )
}

export default BankAccountManagement