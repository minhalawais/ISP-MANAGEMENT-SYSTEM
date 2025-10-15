import React, { useEffect, useState, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { CRUDPage } from '../../components/crudPage.tsx'
import { ExtraIncomeForm } from '../../components/forms/ExtraIncomeForm.tsx'
import { Modal } from '../../components/modal.tsx'
import { getToken } from '../../utils/auth.ts'
import axiosInstance from '../../utils/axiosConfig.ts'
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react'

interface ExtraIncome {
  id: string
  income_type_id: string
  income_type_name?: string
  description: string
  amount: number
  income_date: string
  payment_method: string
  payer: string
  bank_account_id?: string
  is_active: boolean
  created_at?: string
}

interface IncomeType {
  id: string
  name: string
  description: string
  is_active: boolean
}

const ExtraIncomeManagement: React.FC = () => {
  const [showIncomeTypesModal, setShowIncomeTypesModal] = useState(false)
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([])
  const [newIncomeType, setNewIncomeType] = useState({ name: '', description: '' })
  const [editingType, setEditingType] = useState<IncomeType | null>(null)
  const [editTypeData, setEditTypeData] = useState({ name: '', description: '' })
  
  // Ref for the modal content container
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = "MBA NET - Extra Income Management"
    fetchIncomeTypes()
  }, [])

  const fetchIncomeTypes = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get('/extra-income-types/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setIncomeTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch income types', error)
    }
  }

  const handleAddIncomeType = async () => {
    if (!newIncomeType.name.trim()) return

    try {
      const token = getToken()
      await axiosInstance.post('/extra-income-types/add', newIncomeType, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewIncomeType({ name: '', description: '' })
      await fetchIncomeTypes()
    } catch (error) {
      console.error('Failed to add income type', error)
    }
  }

  const handleEditIncomeType = (type: IncomeType) => {
    setEditingType(type)
    setEditTypeData({ name: type.name, description: type.description || '' })
    
    // Scroll to top of modal content when editing starts
    setTimeout(() => {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 100)
  }

  const handleUpdateIncomeType = async () => {
    if (!editingType || !editTypeData.name.trim()) return

    try {
      const token = getToken()
      await axiosInstance.put(`/extra-income-types/update/${editingType.id}`, editTypeData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingType(null)
      setEditTypeData({ name: '', description: '' })
      await fetchIncomeTypes()
    } catch (error) {
      console.error('Failed to update income type', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingType(null)
    setEditTypeData({ name: '', description: '' })
  }

  const handleDeleteIncomeType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this income type?')) {
      try {
        const token = getToken()
        await axiosInstance.delete(`/extra-income-types/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        await fetchIncomeTypes()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete income type')
      }
    }
  }

  const columns = React.useMemo<ColumnDef<ExtraIncome>[]>(
    () => [
      {
        header: 'Type',
        accessorKey: 'income_type_name',
        cell: info => info.getValue() || 'N/A',
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: info => `PKR ${(info.getValue() as number)?.toLocaleString() || '0.00'}`,
      },
      {
        header: 'Date',
        accessorKey: 'income_date',
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
        header: 'Payer',
        accessorKey: 'payer',
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
      <CRUDPage<ExtraIncome>
        title="Extra Income"
        endpoint="extra-incomes"
        columns={columns}
        FormComponent={(props) => (
          <ExtraIncomeForm 
            {...props} 
            onManageIncomeTypes={() => setShowIncomeTypesModal(true)}
          />
        )}
      />

      {/* Income Types Management Modal */}
      <Modal
        isVisible={showIncomeTypesModal}
        onClose={() => {
          setShowIncomeTypesModal(false)
          setEditingType(null)
          setEditTypeData({ name: '', description: '' })
        }}
        title="Manage Income Types"
        size="md"
      >
        <div 
          ref={modalContentRef}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Add New Income Type */}
          <div className="bg-light-sky/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-deep-ocean mb-3">
              {editingType ? 'Edit Income Type' : 'Add New Income Type'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-deep-ocean mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={editingType ? editTypeData.name : newIncomeType.name}
                  onChange={(e) => editingType 
                    ? setEditTypeData(prev => ({ ...prev, name: e.target.value }))
                    : setNewIncomeType(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter income type name"
                  className="w-full px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-deep-ocean mb-1">
                  Description
                </label>
                <textarea
                  value={editingType ? editTypeData.description : newIncomeType.description}
                  onChange={(e) => editingType
                    ? setEditTypeData(prev => ({ ...prev, description: e.target.value }))
                    : setNewIncomeType(prev => ({ ...prev, description: e.target.value }))
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
                      onClick={handleUpdateIncomeType}
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
                    onClick={handleAddIncomeType}
                    disabled={!newIncomeType.name.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                    Add Type
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Income Types List */}
          <div>
            <h3 className="text-lg font-medium text-deep-ocean mb-3">Existing Income Types</h3>
            <div className="space-y-2">
              {incomeTypes.length === 0 ? (
                <p className="text-center text-slate-gray py-4">No income types found</p>
              ) : (
                incomeTypes.map((type) => (
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
                        onClick={() => handleEditIncomeType(type)}
                        className="p-1 text-electric-blue hover:bg-electric-blue/10 rounded transition-colors"
                        title="Edit income type"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteIncomeType(type.id)}
                        className="p-1 text-crimson-red hover:bg-crimson-red/10 rounded transition-colors"
                        title="Delete income type"
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

export default ExtraIncomeManagement