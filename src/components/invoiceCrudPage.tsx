"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { CSVLink } from "react-csv"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  ChevronRight,
  FileText,
  Eye,
  Share2,
} from "lucide-react"
import { Table } from "./table/invoiceTable.tsx"
import { Modal } from "./modal.tsx"
import { Topbar } from "./topNavbar.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken } from "../utils/auth.ts"
import { toast } from "react-toastify"
import axiosInstance from "../utils/axiosConfig.ts"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    isEditing: boolean
  }>
  customHeaderButton?: React.ReactNode
  refreshTrigger?: number
}

export function CRUDPage<T extends { id: string }>({
  title,
  endpoint,
  columns,
  FormComponent,
  customHeaderButton,
  refreshTrigger,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  })
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState<string>("")
  // Add loading states for view and share operations
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null)
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [refreshTrigger, pageIndex, pageSize, JSON.stringify(sorting), search])

  const buildSortQuery = (s: SortingState) => s.map((x) => `${x.id}:${x.desc ? "desc" : "asc"}`).join(",")

  const fetchStats = async () => {
    try {
      const token = getToken()
      const res = await axiosInstance.get(`/${endpoint}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats({
        total: res.data.total ?? 0,
        paid: res.data.paid ?? 0,
        pending: res.data.pending ?? 0,
      })
    } catch {
      // best-effort fallback using loaded page (may be incomplete)
      setStats((prev) => ({
        total: totalCount || prev.total,
        paid: data.filter((item: any) => item.status === "paid").length,
        pending: data.filter((item: any) => item.status === "pending").length,
      }))
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      // try server page endpoint first
      const res = await axiosInstance.get(`/${endpoint}/page`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pageIndex + 1,
          page_size: pageSize,
          sort: buildSortQuery(sorting),
          q: search || undefined,
        },
      })
      const items = res.data.items ?? []
      setData(items)
      setTotalCount(Number(res.data.total ?? items.length))
    } catch (err: any) {
      // fallback: legacy list endpoint
      try {
        const token = getToken()
        const response = await axiosInstance.get(`/${endpoint}/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const all = response.data ?? []
        // emulate pagination on client as a fallback
        setTotalCount(all.length)
        const start = pageIndex * pageSize
        const slice = all.slice(start, start + pageSize)
        setData(slice)
      } catch (error) {
        console.error(`Failed to fetch ${title}`, error)
        toast.error(`Failed to fetch ${title}`, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} updated successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      } else {
        await axiosInstance.post(`/${endpoint}/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} added successfully`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      }
      await fetchData()
      await fetchStats()
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
    if (!window.confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) return
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
      await fetchStats()
    } catch (error) {
      console.error("Delete operation failed", error)
      toast.error("Delete operation failed", {
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

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  // Enhanced handleViewInvoice with loading and timeout
  const handleViewInvoice = async (invoice: any) => {
    setLoadingViewId(invoice.id)
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 50 seconds')), 50000)
    });
    
    // Create the actual request promise
    const viewPromise = new Promise(async (resolve, reject) => {
      try {
        const token = getToken()
        // Verify the invoice exists and is accessible
        await axiosInstance.get(`/${endpoint}/${invoice.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 50000
        })
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })

    try {
      // Race between the request and timeout
      await Promise.race([viewPromise, timeoutPromise])
      
      // If we get here, the request was successful within timeout
      window.open(`/${endpoint}/${invoice.id}`, "_blank")
      toast.success("Invoice opened successfully", {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
    } catch (error: any) {
      console.error("Failed to view invoice", error)
      const errorMessage = error.message === 'Request timeout after 50 seconds' 
        ? "Request timeout. Please try again."
        : "Failed to load invoice. Please try again."
      
      toast.error(errorMessage, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setLoadingViewId(null)
    }
  }

  // Enhanced handleWhatsAppShare with loading and timeout
 // Enhanced handleWhatsAppShare with loading and timeout
const handleWhatsAppShare = async (invoice: any) => {
  setLoadingShareId(invoice.id)
  
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout after 50 seconds')), 50000)
  });

  // Create the actual request promise
  const sharePromise = new Promise(async (resolve, reject) => {
    try {
      // Check both phone numbers
      const phoneNumber1 = invoice.customer_phone || invoice.phone_1;
      const phoneNumber2 = invoice.phone_2;
      
      if (!phoneNumber1 && !phoneNumber2) {
        reject(new Error("Customer phone number not available"))
        return
      }

      // Use phone number 1 if available, otherwise use phone number 2
      const phoneNumberToUse = phoneNumber1 || phoneNumber2;

      // Normalize phone number
      let phoneNumber = phoneNumberToUse.replace(/\D/g, "") // remove all non-digits

      if (phoneNumber.startsWith("00")) {
        phoneNumber = phoneNumber.substring(2) // remove leading 00
      }

      if (phoneNumber.startsWith("+92")) {
        phoneNumber = phoneNumber.substring(1) // +92XXXXXXXXXX → 92XXXXXXXXXX
      } else if (phoneNumber.startsWith("92")) {
        // already correct
      } else if (phoneNumber.startsWith("0")) {
        phoneNumber = "92" + phoneNumber.substring(1) // 03XXXXXXXXX → 92XXXXXXXXXX
      } else if (phoneNumber.startsWith("3")) {
        phoneNumber = "92" + phoneNumber // 3XXXXXXXXX → 92XXXXXXXXXX
      }

      // Verify invoice is accessible first
      const token = getToken()
      await axiosInstance.get(`/${endpoint}/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 50000
      })

      // Public invoice link
      const publicInvoiceUrl = `${window.location.origin}/public/invoice/${invoice.id}`

      // Formatted English-only message
      const message = `Hello ${invoice.customer_name},
  
Your invoice #${invoice.invoice_number} is now available.

📋 Invoice Details:
• Amount: PKR ${Number.parseFloat(invoice.total_amount).toFixed(2)}
• Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
• Status: ${invoice.status}

📄 View your complete invoice here:
${publicInvoiceUrl}

Please review your invoice and make the payment if pending.

Thank you for choosing MBA Communications!`

      // WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

      // Open in new tab
      window.open(whatsappUrl, "_blank")
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })

  try {
    // Race between the request and timeout
    await Promise.race([sharePromise, timeoutPromise])
    
    toast.success("Invoice shared via WhatsApp", {
      style: { background: "#D1FAE5", color: "#10B981" },
    })
  } catch (error: any) {
    console.error("Failed to share invoice", error)
    
    let errorMessage = "Failed to share invoice. Please try again."
    
    if (error?.message === 'Request timeout after 50 seconds') {
      errorMessage = "Request timeout. Please try again."
    } else if (error?.message === "Customer phone number not available") {
      errorMessage = "Customer phone number not available"
    } else if (error?.response?.status === 404) {
      errorMessage = "Invoice not found or not accessible"
    } else if (error?.response?.status === 401) {
      errorMessage = "Authentication failed. Please login again."
    }
    
    toast.error(errorMessage, {
      style: { background: "#FEE2E2", color: "#EF4444" },
    })
  } finally {
    setLoadingShareId(null)
  }
}

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "View",
        cell: (info: any) => {
          const invoice = info.row.original
          const isLoading = loadingViewId === invoice.id
          
          return (
            <div className="flex justify-center">
              <button
                onClick={() => handleViewInvoice(invoice)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors duration-200 text-sm shadow-sm ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="View Invoice"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    View Invoice
                  </>
                )}
              </button>
            </div>
          )
        },
      },
      {
        header: "Share",
        cell: (info: any) => {
          const invoice = info.row.original
          console.log('Invoice: ',invoice)
          const isLoading = loadingShareId === invoice.id
          
          // Check both phone numbers
          const phoneNumber1 = invoice.customer_phone || invoice.phone_1;
          const phoneNumber2 = invoice.phone_2;
          const hasPhoneNumber = !!(phoneNumber1 || phoneNumber2);
          
          return (
            <div className="flex justify-center">
              <button
                onClick={() => handleWhatsAppShare(invoice)}
                disabled={isLoading || !hasPhoneNumber}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm shadow-sm ${
                  !hasPhoneNumber 
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-50" 
                    : isLoading 
                      ? "bg-emerald-green/50 text-white cursor-not-allowed" 
                      : "bg-emerald-green text-white hover:bg-emerald-green/90"
                }`}
                title={!hasPhoneNumber ? "Phone number not available" : "Share via WhatsApp"}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Loading...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </div>
          )
        },
      },
      {
        header: "Actions",
        cell: (info: any) => (
          <div className="flex items-center gap-2 justify-center">
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
  }, [columns, loadingViewId, loadingShareId])

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
                    <FileText className="h-7 w-7 text-electric-blue" />
                    {title} Management
                  </h1>
                  <p className="text-slate-gray mt-1">Manage your {title.toLowerCase()} records efficiently</p>
                </div>
                <div className="flex flex-wrap gap-3 self-start md:self-center">
                  <CSVLink
                    data={data}
                    filename={`${title.toLowerCase()}.csv`}
                    className="bg-slate-gray text-white px-4 py-2.5 rounded-lg hover:bg-slate-gray/80 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText className="h-5 w-5" />
                    Export CSV
                  </CSVLink>
                  {customHeaderButton}

                  <button
                    onClick={() => showModal(null)}
                    className="bg-electric-blue text-white px-4 py-2.5 rounded-lg hover:bg-btn-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Add New {title}
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
                      <FileText className="h-6 w-6 text-deep-ocean" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-green/5 rounded-lg p-4 border border-emerald-green/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Paid {title}s</p>
                      <h3 className="text-2xl font-bold text-emerald-green mt-1">{stats.paid}</h3>
                    </div>
                    <div className="bg-emerald-green/10 p-3 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-emerald-green" />
                    </div>
                  </div>
                </div>

                <div className="bg-coral-red/5 rounded-lg p-4 border border-coral-red/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Pending {title}s</p>
                      <h3 className="text-2xl font-bold text-coral-red mt-1">{stats.pending}</h3>
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
                serverMode={true}
                totalCount={totalCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                sorting={sorting}
                onSortingChange={setSorting}
                onGlobalSearch={setSearch}
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
        <form onSubmit={handleSubmit} className="bg-white">
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
                  <Check className="h-5 w-5" />
                  Update {title}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create {title}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}