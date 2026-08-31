"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Link } from "react-router-dom"
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
  Share2,
} from "lucide-react"
import { Table } from "./table/invoiceTable.tsx"
import { Modal } from "./modal.tsx"
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_PRIMARY_BTN } from "./ui/modalStyles.ts"
import { Topbar } from "./topNavbar.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { UnifiedPaymentModal } from "./modals/UnifiedPaymentModal.tsx"
import { getToken, getRole } from "../utils/auth.ts"
import { toast } from "../utils/notify.ts";
import axiosInstance from "../utils/axiosConfig.ts"
import { useCompany } from "../context/CompanyContext.tsx"
import { getOperationErrorMessage } from "../utils/crudSubmit.ts"
import { formatCompactPkr } from "../utils/formatCompactPkr.ts"
import { CRUD_FILTER_CONFIGS } from "../config/crudFilterConfigs.ts"
import { useCrudTableFilters } from "../hooks/useCrudTableFilters.ts"
import { useCrudPeriodFilter } from "../hooks/useCrudPeriodFilter.ts"
import { getCrudPeriodConfig } from "../config/crudPeriodConfigs.ts"
import { CrudStatsSection } from "./crud/CrudStatsSection.tsx"
import { ConfirmBulkDeleteModal } from "./modals/ConfirmBulkDeleteModal.tsx"
import { periodQueryParamsForTextSearch } from "../utils/crudPeriodUtils.ts"
import type { StatCardDef } from "../types/crudFilters.ts"

const BULK_DELETE_ROLES = new Set(["super_admin", "company_owner", "manager"])

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: any } }
    ) => void
    isEditing: boolean
  }>
  customHeaderButton?: React.ReactNode
  refreshTrigger?: number
  onSubmit?: (formData: any, isEditing: boolean) => Promise<any> | any
  validateBeforeSubmit?: (formData: Partial<T>) => string | null
}

export function CRUDPage<T extends { id: string }>({
  title,
  endpoint,
  columns,
  FormComponent,
  customHeaderButton,
  refreshTrigger,
  onSubmit,
  validateBeforeSubmit,
}: CRUDPageProps<T>) {
  const { company } = useCompany()
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const hasChrome = useOptionalAdminChrome()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const canBulkDelete = BULK_DELETE_ROLES.has(getRole() || "")
  const [stats, setStats] = useState({
    total: 0,
    total_amount: 0,
    paid: 0,
    paid_amount: 0,
    pending: 0,
    pending_amount: 0,
  })
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState<string>("")
  const filterConfig = CRUD_FILTER_CONFIGS.invoice
  const periodConfig = getCrudPeriodConfig("invoice")
  const tableFilters = useCrudTableFilters({
    config: filterConfig,
    onFilterChange: () => setPageIndex(0),
  })
  const periodFilter = useCrudPeriodFilter({
    config: periodConfig,
    onPeriodChange: () => setPageIndex(0),
  })

  const statCards: StatCardDef[] = useMemo(
    () =>
      filterConfig.statCards.map((card) => {
        if (card.id === "total") {
          return { ...card, value: stats.total, subValue: formatCompactPkr(stats.total_amount) }
        }
        if (card.id === "paid") {
          return { ...card, value: stats.paid, subValue: formatCompactPkr(stats.paid_amount) }
        }
        if (card.id === "pending") {
          return { ...card, value: stats.pending, subValue: formatCompactPkr(stats.pending_amount) }
        }
        return { ...card, value: 0 }
      }),
    [filterConfig.statCards, stats],
  )
  // Add loading states for view and share operations
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null)
  const [loadingShareId, setLoadingShareId] = useState<string | null>(null)
  // Unified payment modal state
  const [isUnifiedPaymentModalVisible, setIsUnifiedPaymentModalVisible] = useState(false)

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [refreshTrigger, pageIndex, pageSize, JSON.stringify(sorting), search, JSON.stringify(tableFilters.mergedColumnFilters), periodFilter.period])

  const buildSortQuery = (s: SortingState) => s.map((x) => `${x.id}:${x.desc ? "desc" : "asc"}`).join(",")

  const fetchStats = async () => {
    try {
      const token = getToken()
      const res = await axiosInstance.get(`/${endpoint}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: periodFilter.queryParams,
      })
      setStats({
        total: res.data.total ?? 0,
        total_amount: res.data.total_amount ?? 0,
        paid: res.data.paid ?? 0,
        paid_amount: res.data.paid_amount ?? 0,
        pending: res.data.pending ?? 0,
        pending_amount: res.data.pending_amount ?? 0,
      })
    } catch {
      // best-effort fallback using loaded page (may be incomplete)
      setStats((prev) => ({
        total: totalCount || prev.total,
        total_amount: prev.total_amount,
        paid: data.filter((item: any) => item.status === "paid").length,
        paid_amount: prev.paid_amount,
        pending: data.filter((item: any) => item.status === "pending").length,
        pending_amount: prev.pending_amount,
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
          ...tableFilters.invoicePageParams,
          ...periodQueryParamsForTextSearch(periodFilter.period, search),
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
        toast.error(`Failed to fetch ${title}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const showModal = async (item: T | null) => {
    setEditingItem(item)
    if (item?.id) {
      try {
        const token = getToken()
        const res = await axiosInstance.get(`/${endpoint}/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const detail = res.data || {}
        setFormData({
          ...item,
          ...detail,
          lines: detail.line_items || detail.lines || [],
          due_date: (detail.due_date || (item as any).due_date || "").toString().slice(0, 10),
        } as Partial<T>)
      } catch {
        setFormData(item || {})
      }
    } else {
      setFormData({})
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateBeforeSubmit) {
      const validationError = validateBeforeSubmit(formData)
      if (validationError) {
        toast.error(validationError)
        return
      }
    }
    setIsLoading(true)
    try {
      const token = getToken()
      let payload: any = formData
      if (onSubmit) {
        payload = await onSubmit(formData, !!editingItem)
      }
      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} updated successfully`)
      } else {
        await axiosInstance.post(`/${endpoint}/add`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success(`${title} added successfully`)
      }
      await fetchData()
      await fetchStats()
      handleCancel()
    } catch (error: any) {
      console.error("Operation failed", error)
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Operation failed")
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
      toast.success(`${title} deleted successfully`)
      await fetchData()
      await fetchStats()
    } catch (error: any) {
      console.error("Delete operation failed", error)
      const errorMessage = getOperationErrorMessage(error, title, "delete")
      toast.error(errorMessage || `Failed to delete ${title.toLowerCase()}`)
    } finally {
      setIsLoading(false)
    }
  }

  const paidSelectedCount = useMemo(() => {
    const selected = new Set(selectedRows)
    return data.filter((row: any) => {
      if (!selected.has(row.id)) return false
      const status = String(row.status || "").toLowerCase()
      return status === "paid" || status === "partially_paid"
    }).length
  }, [data, selectedRows])

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0 || !canBulkDelete) return
    try {
      setIsLoading(true)
      const token = getToken()
      const res = await axiosInstance.post(
        `/${endpoint}/bulk-delete`,
        { ids: selectedRows },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const body = res.data || {}
      const deleted = body.total_deleted ?? 0
      const failed = body.total_failed ?? 0
      if (failed > 0 && deleted > 0) {
        toast.success(`Deleted ${deleted} of ${deleted + failed}. ${failed} failed.`)
      } else if (failed > 0) {
        toast.error(`Failed to delete ${failed} ${title.toLowerCase()}(s)`)
      } else {
        toast.success(`${deleted} ${title.toLowerCase()}${deleted === 1 ? "" : "s"} deleted`)
      }
      setBulkDeleteOpen(false)
      setSelectedRows([])
      await fetchData()
      await fetchStats()
    } catch (error: any) {
      console.error("Bulk delete failed", error)
      toast.error(
        error?.response?.data?.message ||
          getOperationErrorMessage(error, title, "delete") ||
          `Failed to delete ${title.toLowerCase()}s`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  // Enhanced handleViewInvoice with loading and timeout
  const handleViewInvoice = useCallback(async (invoice: any) => {
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
      toast.success("Invoice opened successfully")
    } catch (error: any) {
      console.error("Failed to view invoice", error)
      const errorMessage = error.message === 'Request timeout after 50 seconds'
        ? "Request timeout. Please try again."
        : "Failed to load invoice. Please try again."

      toast.error(errorMessage)
    } finally {
      setLoadingViewId(null)
    }
  }, [endpoint])

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

        const compName = company?.name || 'our service'
        const message = `Hello ${invoice.customer_name},
  
Your invoice #${invoice.invoice_number} is now available.

📋 Invoice Details:
• Amount: PKR ${Number.parseFloat(invoice.total_amount).toFixed(2)}
• Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
• Status: ${invoice.status}

📄 View your complete invoice here:
${publicInvoiceUrl}

Please review your invoice and make the payment if pending.

Thank you for choosing ${compName}!`

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

      toast.success("Invoice shared via WhatsApp")
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

      toast.error(errorMessage)
    } finally {
      setLoadingShareId(null)
    }
  }

  const memoizedColumns = useMemo(() => {
    const dataColumns = columns.filter((col) => {
      const key = "accessorKey" in col ? col.accessorKey : col.id
      return key !== "invoice_number" && key !== "internet_id"
    })

    const rowSpinner = (
      <svg
        className="animate-spin h-3.5 w-3.5 text-electric-blue inline-block ml-1"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    return [
      {
        header: "Invoice Number",
        accessorKey: "invoice_number",
        cell: (info: any) => {
          const invoice = info.row.original
          const isLoading = loadingViewId === invoice.id
          return (
            <button
              type="button"
              onClick={() => handleViewInvoice(invoice)}
              disabled={isLoading}
              className="text-electric-blue font-medium hover:underline text-sm whitespace-nowrap disabled:opacity-60 inline-flex items-center"
              title={`View invoice ${invoice.invoice_number}`}
            >
              {invoice.invoice_number}
              {isLoading && rowSpinner}
            </button>
          )
        },
      },
      {
        header: "Internet ID",
        accessorKey: "internet_id",
        cell: (info: any) => {
          const invoice = info.row.original
          if (!invoice.customer_id) {
            return <span className="text-sm text-slate-gray">{invoice.internet_id}</span>
          }
          return (
            <Link
              to={`/customers/${invoice.customer_id}`}
              className="text-electric-blue font-medium hover:underline text-sm whitespace-nowrap"
              title="View customer profile"
            >
              {invoice.internet_id}
            </Link>
          )
        },
      },
      ...dataColumns,
      {
        header: "Share",
        cell: (info: any) => {
          const invoice = info.row.original
          const isLoading = loadingShareId === invoice.id

          const phoneNumber1 = invoice.customer_phone || invoice.phone_1
          const phoneNumber2 = invoice.phone_2
          const hasPhoneNumber = !!(phoneNumber1 || phoneNumber2)

          return (
            <div className="flex justify-center">
              <button
                onClick={() => handleWhatsAppShare(invoice)}
                disabled={isLoading || !hasPhoneNumber}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  !hasPhoneNumber
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : isLoading
                      ? "bg-emerald-green/50 text-white cursor-not-allowed"
                      : "bg-emerald-green text-white hover:bg-emerald-green/90"
                }`}
                title={!hasPhoneNumber ? "Phone number not available" : "Share via WhatsApp"}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <Share2 className="w-4 h-4" />
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
              className="h-8 w-8 inline-flex items-center justify-center text-white bg-electric-blue rounded-md hover:bg-btn-hover transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="h-8 w-8 inline-flex items-center justify-center text-white bg-coral-red rounded-md hover:bg-coral-red/80 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ]
  }, [columns, loadingViewId, loadingShareId, handleViewInvoice])

  return (
    <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-light-sky/50"}>
      {!hasChrome && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      )}
      <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col overflow-hidden"}>
        {!hasChrome && <Topbar toggleSidebar={toggleSidebar} />}
        <main
          className={
            hasChrome
              ? "px-3 py-3 sm:px-4"
              : `flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 px-3 py-3 sm:px-4 pt-16 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0 lg:ml-20"}`
          }
        >

          <div className="container mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-slate-gray mb-2">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
              <span>Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5 mx-1" />
              <span className="text-deep-ocean font-medium">{title} Management</span>
            </div>

            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <h1 className="text-xl font-semibold text-deep-ocean flex items-center gap-2">
                  <FileText className="h-5 w-5 text-electric-blue" />
                  {title} Management
                </h1>
                <div className="flex flex-wrap gap-2 self-start md:self-center">
                  <CSVLink
                    data={data}
                    filename={`${title.toLowerCase()}.csv`}
                    className="h-9 bg-slate-gray text-white px-3 text-sm rounded-lg hover:bg-slate-gray/80 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </CSVLink>
                  {customHeaderButton}

                  <button
                    onClick={() => setIsUnifiedPaymentModalVisible(true)}
                    className="h-9 bg-emerald-green text-white px-3 text-sm rounded-lg hover:bg-emerald-green/90 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Payment
                  </button>

                  <button
                    onClick={() => showModal(null)}
                    className="h-9 bg-electric-blue text-white px-3 text-sm rounded-lg hover:bg-btn-hover transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add New {title}
                  </button>
                </div>
              </div>

              <CrudStatsSection
                cards={statCards}
                activeStatId={tableFilters.activeStatId}
                onStatClick={tableFilters.applyStatFilter}
                period={periodFilter.period}
                periodLabel={periodFilter.label}
                periodActive={periodFilter.isActive}
                onSetPeriod={periodFilter.setPeriod}
                onSetPeriodAll={periodFilter.setAll}
              />

              {selectedRows.length > 0 && canBulkDelete && (
                <div className="bg-electric-blue/5 border border-electric-blue/20 rounded-lg p-3 mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-deep-ocean font-medium">
                    {selectedRows.length} {title.toLowerCase()}
                    {selectedRows.length > 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    disabled={isLoading}
                    className="h-9 px-3 text-sm font-medium bg-coral-red text-white rounded-md hover:bg-coral-red/90 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedRows.length})
                  </button>
                </div>
              )}
            </div>

            {/* Table Section */}
            <div className="mb-4">
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
                onColumnFiltersChangeExternal={tableFilters.handleColumnFiltersChange}
                quickFilters={filterConfig.quickFilters}
                filterState={tableFilters.filterState}
                onQuickFilterChange={tableFilters.setQuickFilter}
                onClearFilters={tableFilters.clearAllFilters}
                hasActiveFilters={tableFilters.hasAnyActiveFilters}
                inlineFilterFields={tableFilters.inlineFields}
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
        <form onSubmit={handleSubmit} className="bg-transparent">
          <FormComponent formData={formData} handleInputChange={handleInputChange} isEditing={!!editingItem} />
          <div className={MODAL_FOOTER}>
            <button
              type="button"
              onClick={handleCancel}
              className={MODAL_CANCEL_BTN}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={MODAL_PRIMARY_BTN}
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
                  Saving…
                </>
              ) : editingItem ? (
                <>
                  <Check className="h-4 w-4" />
                  Update {title}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create {title}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unified Payment Modal */}
      <UnifiedPaymentModal
        isOpen={isUnifiedPaymentModalVisible}
        onClose={() => setIsUnifiedPaymentModalVisible(false)}
        onPaymentAdded={() => {
          fetchData()
          fetchStats()
        }}
      />

      <ConfirmBulkDeleteModal
        isVisible={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        count={selectedRows.length}
        entityLabel={title.toLowerCase()}
        warning={
          paidSelectedCount > 0
            ? `${paidSelectedCount} selected invoice(s) are paid or partially paid. Linked payments will also be removed.`
            : null
        }
        isLoading={isLoading}
      />
    </div>
  )
}
