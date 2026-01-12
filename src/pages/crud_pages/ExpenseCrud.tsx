import React, { useEffect, useState, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { ExpenseForm } from '../../components/forms/ExpenseForm.tsx'
import { Modal } from '../../components/modal.tsx'
import { ImageViewerModal, useImageViewer } from '../../components/modals/ImageViewerModal.tsx'
import { getToken } from '../../utils/auth.ts'
import axiosInstance from '../../utils/axiosConfig.ts'
import { Plus, Trash2, Pencil, Save, X, Eye } from 'lucide-react'

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
  payment_proof?: string
}

interface ExpenseType {
  id: string
  name: string
  description: string
  is_employee_payment: boolean
  is_active: boolean
}

const ExpenseManagement: React.FC = () => {
  const [showExpenseTypesModal, setShowExpenseTypesModal] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [newExpenseType, setNewExpenseType] = useState({ name: '', description: '', is_employee_payment: false })
  const [editingType, setEditingType] = useState<ExpenseType | null>(null)
  const [editTypeData, setEditTypeData] = useState({ name: '', description: '', is_employee_payment: false })
  const imageViewer = useImageViewer()

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
      setNewExpenseType({ name: '', description: '', is_employee_payment: false })
      await fetchExpenseTypes()
    } catch (error) {
      console.error('Failed to add expense type', error)
    }
  }

  const handleEditExpenseType = (type: ExpenseType) => {
    setEditingType(type)
    setEditTypeData({ name: type.name, description: type.description || '', is_employee_payment: type.is_employee_payment || false })

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
      setEditTypeData({ name: '', description: '', is_employee_payment: false })
      await fetchExpenseTypes()
    } catch (error) {
      console.error('Failed to update expense type', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingType(null)
    setEditTypeData({ name: '', description: '', is_employee_payment: false })
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
      {
        header: 'Proof',
        accessorKey: 'payment_proof',
        cell: (info: any) => {
          const proof = info.getValue<string>()
          return proof ? (
            <button
              onClick={() => imageViewer.openViewer(
                `/expenses/proof-image/${info.row.original.id}`,
                `Expense Proof - ${info.row.original.expense_type_name || 'Expense'}`,
                axiosInstance
              )}
              className="px-3 py-1.5 bg-electric-blue text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-btn-hover transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
          ) : (
            <span className="text-slate-gray/50 text-xs">-</span>
          )
        },
      },
    ],
    [imageViewer]
  )

  return (
    <>
      <CRUDPage<Expense>
        title="Expense"
        endpoint="expenses"
        columns={columns}
        useFormData={true}
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
          setEditTypeData({ name: '', description: '', is_employee_payment: false })
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
              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="is_employee_payment"
                  checked={editingType ? editTypeData.is_employee_payment : newExpenseType.is_employee_payment}
                  onChange={(e) => editingType
                    ? setEditTypeData(prev => ({ ...prev, is_employee_payment: e.target.checked }))
                    : setNewExpenseType(prev => ({ ...prev, is_employee_payment: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-slate-gray/30 text-electric-blue focus:ring-electric-blue/30"
                />
                <label htmlFor="is_employee_payment" className="text-sm font-medium text-deep-ocean cursor-pointer">
                  Employee Payment Type
                  <span className="block text-xs text-slate-gray font-normal">
                    Check this for Salary, Commission, Bonus, etc. to enable employee selection
                  </span>
                </label>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-deep-ocean">{type.name}</h4>
                        {type.is_employee_payment && (
                          <span className="text-xs px-2 py-0.5 bg-electric-blue/10 text-electric-blue rounded-full">
                            👤 Employee
                          </span>
                        )}
                      </div>
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

      {/* Image Viewer Modal */}
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

export default ExpenseManagement