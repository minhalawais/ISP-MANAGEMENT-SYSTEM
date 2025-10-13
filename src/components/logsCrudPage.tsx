// logsCrudPage.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  ChevronRight,
  FileDown,
  Users,
} from "lucide-react"
import { Table } from "./table/PaymentTable.tsx"
import { Modal } from "./modal.tsx"
import { Topbar } from "./topNavbar.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken } from "../utils/auth.ts"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import axiosInstance from "../utils/axiosConfig.ts"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    isEditing: boolean
    validateBeforeSubmit?: (formData: Partial<T>) => string | null
  }>
  onDataChange?: () => void
  validateBeforeSubmit?: (formData: Partial<T>) => string | null
}

type Summary = { total: number; active: number; inactive: number }

export function LogsCRUDPage<T extends { id: string }>({
  title,
  endpoint,
  columns,
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [pageCount, setPageCount] = useState<number>(0)
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([])
  const [globalSearch, setGlobalSearch] = useState("")
  const [columnFilters, setColumnFilters] = useState<{ id: string; value: string }[]>([])
  const [stats, setStats] = useState<Summary>({ total: 0, active: 0, inactive: 0 })

  const fetchSummary = useCallback(async () => {
    try {
      const token = getToken()
      const res = await axiosInstance.get(`/${endpoint}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const s = res.data as Summary
      setStats({
        total: s.total || 0,
        active: s.active || 0,
        inactive: s.inactive || 0,
      })
    } catch (e) {
      console.warn("Failed to fetch summary", e)
    }
  }, [endpoint])

  const fetchPage = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const sort = sorting[0]
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        sort_by: sort?.id,
        sort_dir: sort?.desc ? "desc" : "asc",
        q: globalSearch || undefined,
      }
      
      columnFilters.forEach((f) => {
        if (f.value) params[`filter_${f.id}`] = f.value
      })

      const res = await axiosInstance.get(`/${endpoint}/page`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      
      setData(res.data.items || [])
      const total = res.data.total || 0
      setPageCount(Math.ceil(total / pagination.pageSize))
      
      if (onDataChange) onDataChange()
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error)
      toast.error(`Failed to fetch ${title}`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, title, sorting, globalSearch, columnFilters, pagination, onDataChange])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const showModal = (item: T | null) => {
    setEditingItem(item)
    setFormData(item || {})
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = getToken()
      let response
      
      if (editingItem) {
        response = await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} updated successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      } else {
        response = await axiosInstance.post(`/${endpoint}/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} added successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      }
      
      fetchPage()
      handleCancel()
    } catch (error) {
      console.error("Operation failed", error)
      toast.error("Operation failed", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      try {
        setIsLoading(true)
        const token = getToken()
        await axiosInstance.delete(`/${endpoint}/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} deleted successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
        await fetchPage()
      } catch (error) {
        console.error("Delete operation failed", error)
        toast.error("Delete operation failed", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "Actions",
        cell: (info: any) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => showModal(info.row.original)}
              className="p-2 text-white bg-electric-blue rounded-md hover:bg-btn-hover transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-2 text-white bg-coral-red rounded-md hover:bg-coral-red/80 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ]
  }, [columns])

  const handleExport = async () => {
    try {
      const token = getToken()
      const sort = sorting[0]
      const params: Record<string, any> = {
        sort_by: sort?.id,
        sort_dir: sort?.desc ? "desc" : "asc",
        q: globalSearch || undefined,
      }
      columnFilters.forEach((f) => {
        if (f.value) params[`filter_${f.id}`] = f.value
      })
      
      const res = await axiosInstance.get(`/${endpoint}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: "blob",
      })
      
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.toLowerCase()}-export.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error("Export failed", { style: { background: "#FEE2E2", color: "#EF4444" } })
    }
  }

  return (
    <div className="flex h-screen bg-light-sky/50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 p-6 pt-20 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="container mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-gray mb-6">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              <span>Dashboard</span>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span className="text-deep-ocean font-medium">{title} Management</span>
            </div>

            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-deep-ocean flex items-center gap-2">
                    <Users className="h-7 w-7 text-electric-blue" />
                    {title} Management
                  </h1>
                  <p className="text-slate-gray mt-1">Manage your {title.toLowerCase()} records efficiently</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExport}
                    className="bg-golden-amber text-white px-4 py-2.5 rounded-lg hover:bg-golden-amber/90 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="h-5 w-5" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-light-sky/50 rounded-lg p-4 border border-slate-gray/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Total {title}s</p>
                      <h3 className="text-2xl font-bold text-deep-ocean mt-1">{stats.total}</h3>
                    </div>
                    <div className="bg-deep-ocean/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-deep-ocean" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-green/5 rounded-lg p-4 border border-emerald-green/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Active {title}s</p>
                      <h3 className="text-2xl font-bold text-emerald-green mt-1">{stats.active}</h3>
                    </div>
                    <div className="bg-emerald-green/10 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-emerald-green" />
                    </div>
                  </div>
                </div>

                <div className="bg-coral-red/5 rounded-lg p-4 border border-coral-red/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Inactive {title}s</p>
                      <h3 className="text-2xl font-bold text-coral-red mt-1">{stats.inactive}</h3>
                    </div>
                    <div className="bg-coral-red/10 p-3 rounded-full">
                      <XCircle className="h-6 w-6 text-coral-red" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="mb-8">
              <Table
                data={data}
                columns={memoizedColumns}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                isLoading={isLoading}
                manualPagination={true}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={(p) => {
                  setPagination(p)
                }}
                sorting={sorting}
                onSortingChange={(s) => setSorting(s as any)}
                onGlobalFilterChangeExternal={(value) => {
                  setGlobalSearch(value)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
                onColumnFiltersChangeExternal={(filters) => {
                  setColumnFilters(filters as any)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      <Modal
        isVisible={isModalVisible}
        onClose={handleCancel}
        title={editingItem ? `Edit ${title}` : `Add New ${title}`}
        isLoading={isLoading}
      >
        <form onSubmit={handleSubmit}>
          <FormComponent formData={formData} handleInputChange={handleInputChange} isEditing={!!editingItem} />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : editingItem ? (
                <>
                  <Pencil className="h-5 w-5" /> Update {title}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> Create {title}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}