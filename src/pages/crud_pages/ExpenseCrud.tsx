import React, { useEffect, useState, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { ExpenseForm } from '../../components/forms/ExpenseForm.tsx'
import { Modal } from '../../components/modal.tsx'
import { getToken } from '../../utils/auth.ts'
import axiosInstance from '../../utils/axiosConfig.ts'
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react'

interface Expense {
  id: string
  expense_type_id: string
  expense_type_name?: string
  description: string
  amount: number
  expense_date: string
  payment_method: string
  vendor_payee: string
  bank_account_id?: string
  is_active: boolean
  created_at?: string
}

interface ExpenseType {
  id: string
  name: string
  description: string
  is_active: boolean
}

const ExpenseManagement: React.FC = () => {
  const [showExpenseTypesModal, setShowExpenseTypesModal] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [newExpenseType, setNewExpenseType] = useState({ name: '', description: '' })
  const [editingType, setEditingType] = useState<ExpenseType | null>(null)
  const [editTypeData, setEditTypeData] = useState({ name: '', description: '' })
  
  // Ref for the modal content container
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = "MBA NET - Expense Management"
    fetchExpenseTypes()
  }, [])

  const fetchExpenseTypes = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get('/expense-types/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setExpenseTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch expense types', error)
    }
  }

  const handleAddExpenseType = async () => {
    if (!newExpenseType.name.trim()) return

    try {
      const token = getToken()
      await axiosInstance.post('/expense-types/add', newExpenseType, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewExpenseType({ name: '', description: '' })
      await fetchExpenseTypes()
    } catch (error) {
      console.error('Failed to add expense type', error)
    }
  }

  const handleEditExpenseType = (type: ExpenseType) => {
    setEditingType(type)
    setEditTypeData({ name: type.name, description: type.description || '' })
    
    // Scroll to top of modal content when editing starts
    setTimeout(() => {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 100)
  }

  const handleUpdateExpenseType = async () => {
    if (!editingType || !editTypeData.name.trim()) return

    try {
      const token = getToken()
      await axiosInstance.put(`/expense-types/update/${editingType.id}`, editTypeData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingType(null)
      setEditTypeData({ name: '', description: '' })
      await fetchExpenseTypes()
    } catch (error) {
      console.error('Failed to update expense type', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingType(null)
    setEditTypeData({ name: '', description: '' })
  }

  const handleDeleteExpenseType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense type?')) {
      try {
        const token = getToken()
        await axiosInstance.delete(`/expense-types/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        await fetchExpenseTypes()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete expense type')
      }
    }
  }

  const columns = React.useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        header: 'Type',
        accessorKey: 'expense_type_name',
        cell: info => info.getValue() || 'N/A',
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
    <>
      <CRUDPage<Expense>
        title="Expense"
        endpoint="expenses"
        columns={columns}
        FormComponent={(props) => (
          <ExpenseForm 
            {...props} 
            onManageExpenseTypes={() => setShowExpenseTypesModal(true)}
          />
        )}
      />

      {/* Expense Types Management Modal */}
      <Modal
        isVisible={showExpenseTypesModal}
        onClose={() => {
          setShowExpenseTypesModal(false)
          setEditingType(null)
          setEditTypeData({ name: '', description: '' })
        }}
        title="Manage Expense Types"
        size="md"
      >
        <div 
          ref={modalContentRef}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Add New Expense Type */}
          <div className="bg-light-sky/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-deep-ocean mb-3">
              {editingType ? 'Edit Expense Type' : 'Add New Expense Type'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-deep-ocean mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={editingType ? editTypeData.name : newExpenseType.name}
                  onChange={(e) => editingType 
                    ? setEditTypeData(prev => ({ ...prev, name: e.target.value }))
                    : setNewExpenseType(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter expense type name"
                  className="w-full px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-ocean mb-1">
                  Description
                </label>
                <textarea
                  value={editingType ? editTypeData.description : newExpenseType.description}
                  onChange={(e) => editingType
                    ? setEditTypeData(prev => ({ ...prev, description: e.target.value }))
                    : setNewExpenseType(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter description"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue/30"
                />
              </div>
              <div className="flex gap-2">
                {editingType ? (
                  <>
                    <button
                      onClick={handleUpdateExpenseType}
                      disabled={!editTypeData.name.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Update Type
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-gray text-white rounded-lg hover:bg-slate-gray/90"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddExpenseType}
                    disabled={!newExpenseType.name.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    Add Type
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expense Types List */}
          <div>
            <h3 className="text-lg font-medium text-deep-ocean mb-3">Existing Expense Types</h3>
            <div className="space-y-2">
              {expenseTypes.length === 0 ? (
                <p className="text-center text-slate-gray py-4">No expense types found</p>
              ) : (
                expenseTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-gray/20 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-deep-ocean">{type.name}</h4>
                      {type.description && (
                        <p className="text-sm text-slate-gray">{type.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditExpenseType(type)}
                        className="p-1 text-electric-blue hover:bg-electric-blue/10 rounded transition-colors"
                        title="Edit expense type"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpenseType(type.id)}
                        className="p-1 text-crimson-red hover:bg-crimson-red/10 rounded transition-colors"
                        title="Delete expense type"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ExpenseManagement