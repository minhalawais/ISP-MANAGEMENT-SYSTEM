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
  DollarSign,
  FileDown,
  Clock,
} from "lucide-react"
import { Table } from "./table/PaymentTable.tsx"
import { Modal } from "./modal.tsx"
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_PRIMARY_BTN } from "./ui/modalStyles.ts"
import { Topbar } from "./topNavbar.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken } from "../utils/auth.ts"
import { toast } from "../utils/notify.ts";
import axiosInstance from "../utils/axiosConfig.ts"
import { CRUD_FILTER_CONFIGS } from "../config/crudFilterConfigs.ts"
import { useCrudTableFilters } from "../hooks/useCrudTableFilters.ts"
import { useCrudPeriodFilter } from "../hooks/useCrudPeriodFilter.ts"
import { getCrudPeriodConfig } from "../config/crudPeriodConfigs.ts"
import { CrudStatsSection } from "./crud/CrudStatsSection.tsx"
import { periodQueryParamsForTextSearch } from "../utils/crudPeriodUtils.ts"
import type { StatCardDef } from "../types/crudFilters.ts"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    isEditing: boolean
    validateBeforeSubmit?: (formData: Partial<T>) => string | null
  }>
  onDataChange?: () => void
  validateBeforeSubmit?: (formData: Partial<T>) => string | null
  refreshTrigger?: number
}

type Summary = { total: number; active: number; pending: number; totalAmount: number }

export function CRUDPage<T extends { id: string; is_active?: boolean }>({
  title,
  endpoint,
  columns,
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
  refreshTrigger = 0,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const hasChrome = useOptionalAdminChrome()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [pageCount, setPageCount] = useState<number>(0)
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([
    { id: "created_at", desc: true },
  ])
  const [globalSearch, setGlobalSearch] = useState("")
  const [stats, setStats] = useState<Summary>({ total: 0, active: 0, pending: 0, totalAmount: 0 })

  const filterConfig = CRUD_FILTER_CONFIGS.payment
  const periodConfig = getCrudPeriodConfig("payment")
  const tableFilters = useCrudTableFilters({
    config: filterConfig,
    onFilterChange: () => setPagination((p) => ({ ...p, pageIndex: 0 })),
  })
  const periodFilter = useCrudPeriodFilter({
    config: periodConfig,
    onPeriodChange: () => setPagination((p) => ({ ...p, pageIndex: 0 })),
  })

  const statCards: StatCardDef[] = useMemo(
    () =>
      filterConfig.statCards.map((card) => {
        if (card.id === "total") return { ...card, value: stats.total }
        if (card.id === "active") return { ...card, value: stats.active }
        if (card.id === "pending") return { ...card, value: stats.pending }
        if (card.id === "amount") return { ...card, value: `PKR ${stats.totalAmount.toLocaleString()}`, clickable: false }
        return { ...card, value: 0 }
      }),
    [filterConfig.statCards, stats],
  )

  const fetchSummary = useCallback(async () => {
    try {
      const token = getToken()
      const res = await axiosInstance.get(`/${endpoint}/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: periodFilter.queryParams,
      })
      const s = res.data as Summary
      setStats({
        total: s.total || 0,
        active: s.active || 0,
        pending: s.pending || 0,
        totalAmount: s.totalAmount || 0,
      })
    } catch (e) {
      // Fallback silently; don't block page
      console.warn("Failed to fetch summary", e)
    }
  }, [endpoint, refreshTrigger, periodFilter.queryParams])

  const fetchPage = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const sort = sorting[0]
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1, // backend 1-based
        page_size: pagination.pageSize,
        sort_by: sort?.id,
        sort_dir: sort?.desc ? "desc" : "asc",
        q: globalSearch || undefined,
      }
      // column filters to query params (key=value)
      tableFilters.mergedColumnFilters.forEach((f) => {
        if (f.value) params[`filter_${f.id}`] = f.value
      })
      Object.assign(params, periodQueryParamsForTextSearch(periodFilter.period, globalSearch))

      const res = await axiosInstance.get(`/${endpoint}/page`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })
      // Expected shape: { items: T[], total: number }
      setData(res.data.items || [])
      const total = res.data.total || 0
      setPageCount(Math.ceil(total / pagination.pageSize))
      if (!stats.total || refreshTrigger > 0) {
        // try lazy summary fill if backend doesn't provide /summary
        setStats((prev) => ({ ...prev, total }))
      }
      if (onDataChange) onDataChange()
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error)
      toast.error(`Failed to fetch ${title}`)
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, title, sorting, globalSearch, tableFilters.mergedColumnFilters, pagination, onDataChange, stats.total, refreshTrigger, periodFilter.period])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = getToken()
      await axiosInstance.put(
        `/${endpoint}/update/${id}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(`${title} status updated successfully`)
      await fetchPage()
    } catch (error) {
      console.error(`Failed to update ${title} status`, error)
      toast.error(`Failed to update ${title} status`)
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
      )
      await fetchPage()
      setSelectedRows([])
    } catch (error) {
      console.error(`Failed to update ${title} status`, error)
      toast.error(`Failed to update ${title} status`)
    } finally {
      setIsLoading(false)
    }
  }

  const showModal = (item: T | null) => {
    console.log("showModal", item)
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

      // Create FormData for file uploads — only editable payment fields
      const formDataToSend = new FormData()
      const editableKeys = [
        "invoice_id",
        "amount",
        "payment_date",
        "payment_time",
        "payment_method",
        "transaction_id",
        "status",
        "failure_reason",
        "received_by",
        "bank_account_id",
        "is_active",
        "payment_proof",
      ]

      editableKeys.forEach((key) => {
        const value = formData[key as keyof typeof formData]
        if (value === undefined || value === null || value === "") {
          // bank_account_id may be cleared intentionally
          if (key === "bank_account_id" && value === "") {
            formDataToSend.append(key, "")
          }
          return
        }

        if (key === "payment_proof") {
          // Only upload a newly selected file; keep existing path server-side
          if (value instanceof File) {
            formDataToSend.append(key, value)
          }
          return
        }

        if (key === "is_active") {
          if (typeof value === "string") {
            formDataToSend.append(key, value.toLowerCase() === "true" ? "true" : "false")
          } else {
            formDataToSend.append(key, value ? "true" : "false")
          }
          return
        }

        formDataToSend.append(key, String(value))
      })

      let response
      if (editingItem) {
        response = await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} updated successfully`)
      } else {
        response = await axiosInstance.post(`/${endpoint}/add`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} added successfully`)
      }
      fetchPage()
      handleCancel()
    } catch (error) {
      console.error("Operation failed", error)
      toast.error("Operation failed:" + error.toString())
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
        toast.success(`${title} deleted successfully`)
        await fetchPage()
      } catch (error) {
        console.error("Delete operation failed", error)
        toast.error("Delete operation failed")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      tableFilters.mergedColumnFilters.forEach((f) => {
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
      toast.error("Export failed")
    }
  }

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
      : `flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 px-3 py-3 sm:px-4 pt-16 transition-all duration-300 ${
    isSidebarOpen ? "ml-64" : "ml-0 lg:ml-20"
  }`
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
                  <DollarSign className="h-5 w-5 text-electric-blue" />
                  {title} Management
                </h1>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExport}
                    className="h-9 bg-golden-amber text-white px-3 text-sm rounded-lg hover:bg-golden-amber/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <FileDown className="h-4 w-4" /> Export CSV
                  </button>
                  <button
                    onClick={() => showModal(null)}
                    className="h-9 bg-electric-blue text-white px-3 text-sm rounded-lg hover:bg-btn-hover transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add New {title}
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

              {/* Bulk Actions */}
              {selectedRows.length > 0 && (
                <div className="bg-electric-blue/5 border border-electric-blue/20 rounded-lg p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
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
            <div className="mb-4">
            <Table
  data={data}
  columns={memoizedColumns}
  selectedRows={selectedRows}
  setSelectedRows={setSelectedRows}
  handleToggleStatus={handleToggleStatus}
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
        <form onSubmit={handleSubmit}>
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
    </div>
  )
}
