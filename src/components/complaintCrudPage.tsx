"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  ChevronRight,
  MessageSquare,
  Clock,
  FileDown,
  FileText,
} from "lucide-react"
import { Table } from "./table/table.tsx"
import { Modal } from "./modal.tsx"
import { Topbar } from "./topNavbar.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken } from "../utils/auth.ts"
import { toast } from "react-toastify"
import axiosInstance from "../utils/axiosConfig.ts"
import { CredentialsModal } from "./modals/CredentialsModal.tsx"
import { useNavigate } from "react-router-dom"
import { ComplaintForm } from "./forms/complaintForm.tsx" // Import ComplaintForm
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
  onAddNew?: () => void
}

export function CRUDPage<T extends { id: string; is_active?: boolean }>({
  title,
  endpoint,
  columns,
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
  onAddNew,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<{
    username: string
    password: string
    email: string
  } | null>(null)
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  })

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(response.data)

      // Calculate stats
      const total = response.data.length
      const open = response.data.filter((item: any) => item.status === "open").length
      const inProgress = response.data.filter((item: any) => item.status === "in_progress").length
      const resolved = response.data.filter((item: any) => item.status === "resolved").length
      const closed = response.data.filter((item: any) => item.status === "closed").length

      setStats({
        total,
        open,
        inProgress,
        resolved,
        closed,
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

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken()
      await axiosInstance.put(
        `/${endpoint}/update/${id}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(`${title} status updated successfully`, {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
      await fetchData()
    } catch (error) {
      console.error(`Failed to update ${title} status`, error)
      toast.error(`Failed to update ${title} status`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
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
        `${selectedRows.length} ${title.toLowerCase()}${selectedRows.length > 1 ? "s" : ""} ${
          newStatus ? "activated" : "deactivated"
        } successfully`,
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
    if (item) {
      setEditingItem(item)
      setFormData(item)
      setIsModalVisible(true)
    } else if (onAddNew) {
      onAddNew()
    } else {
      setEditingItem(null)
      setFormData({})
      setIsModalVisible(true)
    }
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
      const formDataToSend = new FormData()

      Object.keys(formData).forEach((key) => {
        if (formData[key] != null) {
          if (key === "attachment" && formData[key] instanceof File) {
            formDataToSend.append(key, formData[key], formData[key].name)
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      console.log("FormData contents:")
      for (const [key, value] of formDataToSend.entries()) {
        console.log(key, value)
      }

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
        await fetchData()
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

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open":
        return "bg-golden-amber/10 text-golden-amber"
      case "in_progress":
        return "bg-electric-blue/10 text-electric-blue"
      case "resolved":
        return "bg-emerald-green/10 text-emerald-green"
      case "closed":
        return "bg-slate-gray/10 text-slate-gray"
      default:
        return "bg-slate-gray/10 text-slate-gray"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-3.5 w-3.5" />
      case "in_progress":
        return <MessageSquare className="h-3.5 w-3.5" />
      case "resolved":
        return <CheckCircle2 className="h-3.5 w-3.5" />
      case "closed":
        return <XCircle className="h-3.5 w-3.5" />
      default:
        return <Clock className="h-3.5 w-3.5" />
    }
  }

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "Status",
        accessorKey: "status",
        cell: (info: any) => {
          const status = info.getValue()
          return (
            <div className="flex items-center">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${getStatusBadgeClass(
                  status,
                )}`}
              >
                {getStatusIcon(status)}
                {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          )
        },
      },
      {
        header: "Active",
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
              onClick={() => navigate(`/complaints/${info.row.original.id}`)}
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
  className={`flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 p-0 sm:p-6 pt-20 transition-all duration-300 ${
    isSidebarOpen ? "ml-64" : "ml-0 lg:ml-20"
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
                    <MessageSquare className="h-7 w-7 text-electric-blue" />
                    {title} Management
                  </h1>
                  <p className="text-slate-gray mt-1">Manage your {title.toLowerCase()} records efficiently</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const csvData = data.map((item: any) => ({
                        ...item,
                        is_active: item.is_active ? "Active" : "Inactive",
                      }))
                      const csvLink = document.createElement("a")
                      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(JSON.stringify(csvData))
                      csvLink.href = csvContent
                      csvLink.download = `${title.toLowerCase()}.csv`
                      csvLink.click()
                    }}
                    className="bg-golden-amber text-white px-4 py-2.5 rounded-lg hover:bg-golden-amber/90 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FileDown className="h-5 w-5" /> Export CSV
                  </button>
                  <button
                    onClick={() => showModal(null)}
                    className="bg-electric-blue text-white px-4 py-2.5 rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="h-5 w-5" /> Add New {title}
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-light-sky/50 rounded-lg p-4 border border-slate-gray/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Total {title}s</p>
                      <h3 className="text-2xl font-bold text-deep-ocean mt-1">{stats.total}</h3>
                    </div>
                    <div className="bg-deep-ocean/10 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-deep-ocean" />
                    </div>
                  </div>
                </div>

                <div className="bg-golden-amber/5 rounded-lg p-4 border border-golden-amber/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Open</p>
                      <h3 className="text-2xl font-bold text-golden-amber mt-1">{stats.open}</h3>
                    </div>
                    <div className="bg-golden-amber/10 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-golden-amber" />
                    </div>
                  </div>
                </div>

                <div className="bg-electric-blue/5 rounded-lg p-4 border border-electric-blue/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">In Progress</p>
                      <h3 className="text-2xl font-bold text-electric-blue mt-1">{stats.inProgress}</h3>
                    </div>
                    <div className="bg-electric-blue/10 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-electric-blue" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-green/5 rounded-lg p-4 border border-emerald-green/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Resolved</p>
                      <h3 className="text-2xl font-bold text-emerald-green mt-1">{stats.resolved}</h3>
                    </div>
                    <div className="bg-emerald-green/10 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-emerald-green" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-gray/5 rounded-lg p-4 border border-slate-gray/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Closed</p>
                      <h3 className="text-2xl font-bold text-slate-gray mt-1">{stats.closed}</h3>
                    </div>
                    <div className="bg-slate-gray/10 p-3 rounded-full">
                      <XCircle className="h-6 w-6 text-slate-gray" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedRows.length > 0 && (
                <div className="bg-electric-blue/5 border border-electric-blue/20 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-deep-ocean font-medium">
                      {selectedRows.length} {title.toLowerCase()}
                      {selectedRows.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleBulkStatusChange(true)}
                      disabled={selectedRows.length === 0 || isLoading}
                      className="px-4 py-2 text-sm font-medium bg-emerald-green text-white rounded-md hover:bg-emerald-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-green disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Activate
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange(false)}
                      disabled={selectedRows.length === 0 || isLoading}
                      className="px-4 py-2 text-sm font-medium bg-coral-red text-white rounded-md hover:bg-coral-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-red disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="h-4 w-4" /> Deactivate
                    </button>
                  </div>
                </div>
              )}
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
      {newEmployeeCredentials && (
        <CredentialsModal
          isVisible={showCredentialsModal}
          onClose={() => setShowCredentialsModal(false)}
          credentials={newEmployeeCredentials}
        />
      )}
    </div>
  )
}

interface Complaint {
  id: string
  customer_name: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to_name: string
  created_at: string
  response_due_date: string | null
  is_active: boolean
  remarks: string
  attachment_path: string | null
}

const ComplaintManagement: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "MBA NET - Complaint Management"
  }, [])

  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => [
      {
        header: "Customer Name",
        accessorKey: "customer_name",
      },
      {
        header: "Description",
        accessorKey: "description",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue() as string}>
            {info.getValue() as string}
          </div>
        ),
      },
      {
        header: "Assigned To",
        accessorKey: "assigned_to_name",
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
      },
      {
        header: "Response Due",
        accessorKey: "response_due_date",
        cell: (info) => {
          const date = info.getValue() as string
          return date ? new Date(date).toLocaleDateString() : "N/A"
        },
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue() as string}>
            {(info.getValue() as string) || "No remarks"}
          </div>
        ),
      },
      {
        header: "Attachment",
        accessorKey: "attachment_path",
        cell: (info: any) => (
          <button
          onClick={() => {
            if (info.getValue()) {
              axiosInstance
                .get(`/complaints/attachment/${info.row.original.id}`, {
                  responseType: 'blob', // Important for file downloads
                  params: {}
                })
                .then((response) => {
                  const blob = new Blob([response.data]);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `complaint_attachment_${info.row.original.id}`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                })
                .catch((error) => {
                  console.error('Error:', error);
                  toast.error('Failed to download file');
                });
            }
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            info.getValue()
              ? 'bg-electric-blue/10 text-electric-blue hover:bg-electric-blue/20'
              : 'bg-slate-gray/10 text-slate-gray cursor-not-allowed'
          }`}
          disabled={!info.getValue()}
        >
          <FileText className="h-3.5 w-3.5" />
          {info.getValue() ? 'Download' : 'No File'}
        </button>
        ),
      },
    ],
    [],
  )

  const handleAddNew = () => {
    navigate("/complaints/new")
  }

  return (
    <CRUDPage<Complaint>
      title="Complaint"
      endpoint="complaints"
      columns={columns}
      FormComponent={ComplaintForm}
      onAddNew={handleAddNew}
    />
  )
}

export default ComplaintManagement
