import React, { useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { ExpenseForm } from '../../components/forms/ExpenseForm.tsx'

interface Expense {
  id: string
  expense_type: string
  description: string
  amount: number
  expense_date: string
  payment_method: string
  vendor_payee: string
  bank_account_id?: string
  is_active: boolean
  created_at?: string
}

const ExpenseManagement: React.FC = () => {
  useEffect(() => {
    document.title = "MBA NET - Expense Management"
  }, [])

  const columns = React.useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        header: 'Type',
        accessorKey: 'expense_type',
        cell: info => {
          const type = info.getValue() as string
          const typeLabels: { [key: string]: string } = {
            operational: 'Operational',
            salaries: 'Salaries',
            equipment: 'Equipment',
            utilities: 'Utilities',
            maintenance: 'Maintenance',
            other: 'Other'
          }
          return typeLabels[type] || type
        },
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: info => `PKR ${(info.getValue() as number)?.toLocaleString() || '0.00'}`,
      },
      {
        header: 'Date',
        accessorKey: 'expense_date',
        cell: info => {
          const date = info.getValue<string>()
          return date ? new Date(date).toLocaleDateString() : 'N/A'
        },
      },
      {
        header: 'Payment Method',
        accessorKey: 'payment_method',
        cell: info => info.getValue() || 'Cash',
      },
      {
        header: 'Vendor/Payee',
        accessorKey: 'vendor_payee',
        cell: info => info.getValue() || 'N/A',
      },
      {
        header: 'Description',
        accessorKey: 'description',
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
    <CRUDPage<Expense>
      title="Expense"
      endpoint="expenses"
      columns={columns}
      FormComponent={ExpenseForm}
    />
  )
}

export default ExpenseManagement