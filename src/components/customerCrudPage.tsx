"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { CSVLink } from "react-csv"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileDown,
  LayoutDashboard,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  Upload,
} from "lucide-react"
import { Table } from "./table/table.tsx"
import { Modal } from "./customerModal.tsx"
import { Topbar } from "./topNavbar.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken } from "../utils/auth.ts"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import axiosInstance from "../utils/axiosConfig.ts"
import { EnhancedBulkAddModal } from "./modals/EnhancedBulkAddModal.tsx"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    isEditing: boolean
    validateBeforeSubmit?: (formData: Partial<T>) => string | null
    supportsBulkAdd?: boolean
    validationErrors?: Record<string, string>
  }>
  onDataChange?: () => void
  validateBeforeSubmit?: (formData: Partial<T>) => string | null
  supportsBulkAdd?: boolean
}

export function CRUDPage<T extends { id: string; is_active?: boolean }>({
  title,
  endpoint,
  columns,
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
  supportsBulkAdd = false,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isBulkAddModalVisible, setIsBulkAddModalVisible] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await axiosInstance.get(`/${endpoint}/list`)
      setData(response.data)

      // Calculate stats
      const total = response.data.length
      const active = response.data.filter((item: any) => item.is_active).length
      setStats({
        total,
        active,
        inactive: total - active,
      })

      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error)
      toast.error(`Failed to fetch ${title}`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }
  const handleBulkStatusChange = async (newStatus: boolean) => {
    if (selectedRows.length === 0) return

    try {
      setIsLoading(true)
      const token = getToken()
      await Promise.all(
        selectedRows.map((id) =>
          axiosInstance.put(
            `/${endpoint}/update/${id}`,
            { is_active: newStatus },
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ),
      )
      toast.success(
        `${selectedRows.length} ${title.toLowerCase()}${selectedRows.length > 1 ? "s" : ""} ${newStatus ? "activated" : "deactivated"} successfully`,
        {
          style: { background: "#D1FAE5", color: "#10B981" },
        },
      )
      await fetchData()
      setSelectedRows([])
    } catch (error) {
      console.error(`Failed to update ${title} status`, error)
      toast.error(`Failed to update ${title} status`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }
  const showModal = (item: T | null) => {
    setEditingItem(item)
    setFormData(item || {})
    setValidationErrors({})
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
    setValidationErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setValidationErrors({})

    try {
      const token = getToken()
      const formDataToSend = new FormData()

      // Add all form data to FormData object
      Object.keys(formData).forEach((key) => {
        if (formData[key] != null && formData[key] !== "") {
          // Skip file fields if they haven't been uploaded
          if (
            !["cnic_front_image", "cnic_back_image", "agreement_document"].includes(key) ||
            typeof formData[key] === "string"
          ) {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} updated successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      } else {
        await axiosInstance.post(`/${endpoint}/add`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} added successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      }
      fetchData()
      handleCancel()
    } catch (error: any) {
      console.error("Operation failed", error)

      if (error.response?.data?.errors) {
        // Field-specific validation errors
        setValidationErrors(error.response.data.errors)
        toast.error("Please fix the validation errors", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else if (error.response?.data?.message) {
        // General error message
        toast.error(error.response.data.message, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else if (error.response?.data?.error) {
        // Error object with message
        if (typeof error.response.data.error === "string") {
          toast.error(error.response.data.error, {
            style: { background: "#FEE2E2", color: "#EF4444" },
          })
        } else if (error.response.data.error.message) {
          toast.error(error.response.data.error.message, {
            style: { background: "#FEE2E2", color: "#EF4444" },
          })
        }
      } else {
        // Generic error
        toast.error("Operation failed. Please try again.", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }
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
        fetchData()
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

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setIsLoading(true)
      const token = getToken()
      await axiosInstance.patch(
        `/${endpoint}/toggle-status/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      toast.success(`${title} status updated successfully`, {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      fetchData()
    } catch (error) {
      console.error("Toggle status failed", error)
      toast.error(`Failed to update ${title} status`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "Status",
        accessorKey: "is_active",
        cell: (info: any) => (
          <div className="flex items-center">
            <button
              onClick={() => handleToggleStatus(info.row.original.id, info.getValue())}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                info.getValue()
                  ? "bg-emerald-green/10 text-emerald-green hover:bg-emerald-green/20"
                  : "bg-coral-red/10 text-coral-red hover:bg-coral-red/20"
              }`}
            >
              {info.getValue() ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Inactive
                </>
              )}
            </button>
          </div>
        ),
      },
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
            <button
              onClick={() => (window.location.href = `/customers/${info.row.original.id}`)}
              className="p-2 text-white bg-deep-ocean rounded-md hover:bg-deep-ocean/80 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ]
  }, [columns])

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
                  {supportsBulkAdd && (
                    <button
                      onClick={() => setIsBulkAddModalVisible(true)}
                      className="bg-deep-ocean text-white px-4 py-2.5 rounded-lg hover:bg-deep-ocean/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Upload className="h-5 w-5" /> Bulk Add
                    </button>
                  )}
                  <CSVLink
                    data={data}
                    filename={`${title.toLowerCase()}.csv`}
                    className="bg-golden-amber text-white px-4 py-2.5 rounded-lg hover:bg-golden-amber/90 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="h-5 w-5" /> Export CSV
                  </CSVLink>
                  <button
                    onClick={() => showModal(null)}
                    className="bg-electric-blue text-white px-4 py-2.5 rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="h-5 w-5" /> Add New {title}
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
                handleToggleStatus={handleToggleStatus}
                isLoading={isLoading}
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
          <FormComponent
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            isEditing={!!editingItem}
            validationErrors={validationErrors}
          />
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
      <EnhancedBulkAddModal
        isVisible={isBulkAddModalVisible}
        onClose={() => setIsBulkAddModalVisible(false)}
        endpoint={endpoint}
        entityName={title}
        onSuccess={fetchData}
      />
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
