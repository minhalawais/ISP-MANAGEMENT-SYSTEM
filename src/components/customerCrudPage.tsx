"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { CSVLink } from "react-csv"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  FileDown,
  LayoutDashboard,
  ChevronRight,
  Users,
  CheckCircle2,  // Make sure this is imported
  XCircle,       // Make sure this is imported
  Upload,
  Key,
} from "lucide-react"
import { Table } from "./table/table.tsx"
import { Modal } from "./customerModal.tsx"
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_PRIMARY_BTN } from "./ui/modalStyles.ts"
import { Topbar } from "./topNavbar.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { getToken, getRole } from "../utils/auth.ts"
import { toast } from "../utils/notify.ts";
import axiosInstance from "../utils/axiosConfig.ts"
import { EnhancedBulkAddModal } from "./modals/EnhancedBulkAddModal.tsx"
import { CRUD_FILTER_CONFIGS, mergeQuickFilterOptions } from "../config/crudFilterConfigs.ts"
import { useCrudTableFilters } from "../hooks/useCrudTableFilters.ts"
import { useCrudPeriodFilter } from "../hooks/useCrudPeriodFilter.ts"
import { getCrudPeriodConfig } from "../config/crudPeriodConfigs.ts"
import { CrudStatsSection } from "./crud/CrudStatsSection.tsx"
import { computeCrudStats } from "../utils/crudFilterParams.ts"
import { filterRowsByPktPeriod, periodForTextSearch } from "../utils/crudPeriodUtils.ts"
import type { StatCardDef } from "../types/crudFilters.ts"
import { CustomerPortalCredentialsModal } from "./modals/CustomerPortalCredentialsModal.tsx"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleFileRemove?: (fieldName: string) => void // Add this
    isEditing: boolean
    validateBeforeSubmit?: (formData: Partial<T>) => string | null
    supportsBulkAdd?: boolean
    validationErrors?: Record<string, string>
    loadingStates?: Record<string, boolean>
    setLoadingStates?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
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
  const hasChrome = useOptionalAdminChrome()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isBulkAddModalVisible, setIsBulkAddModalVisible] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [computedStats, setComputedStats] = useState<Record<string, number>>({ total: 0 })
  const [credentialsCustomerId, setCredentialsCustomerId] = useState<string | null>(null)
  const isCompanyOwner = getRole() === "company_owner"
  const filterConfig = CRUD_FILTER_CONFIGS.customer
  const periodConfig = getCrudPeriodConfig("customer")
  const tableFilters = useCrudTableFilters({ config: filterConfig })
  const periodFilter = useCrudPeriodFilter({ config: periodConfig })
  const [tableSearchText, setTableSearchText] = useState("")

  const periodScopedData = useMemo(
    () =>
      filterRowsByPktPeriod(
        data as unknown as Record<string, unknown>[],
        periodFilter.period,
        periodConfig.dateField,
      ) as T[],
    [data, periodFilter.period, periodConfig.dateField],
  )

  const displayData = useMemo(
    () =>
      filterRowsByPktPeriod(
        data as unknown as Record<string, unknown>[],
        periodForTextSearch(periodFilter.period, tableSearchText),
        periodConfig.dateField,
      ) as T[],
    [data, periodFilter.period, periodConfig.dateField, tableSearchText],
  )

  useEffect(() => {
    setComputedStats(computeCrudStats(periodScopedData, filterConfig.statCards))
  }, [periodScopedData, filterConfig.statCards])

  const quickFilters = useMemo(() => {
    const areas = [...new Set(data.map((row: any) => row.area).filter(Boolean))] as string[]
    const plans = [...new Set(data.map((row: any) => row.service_plan).filter(Boolean))] as string[]
    return mergeQuickFilterOptions(filterConfig, {
      area: areas.map((a) => ({ value: a, label: a })),
      service_plan: plans.flatMap((p) =>
        String(p)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ).filter((v, i, arr) => arr.indexOf(v) === i).map((p) => ({ value: p, label: p })),
    })
  }, [data, filterConfig])

  const statCards: StatCardDef[] = useMemo(
    () =>
      filterConfig.statCards.map((card) => ({
        ...card,
        value: computedStats[card.id] ?? computedStats.total ?? 0,
      })),
    [filterConfig.statCards, computedStats],
  )
  // Add loading states for file uploads
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    cnic_front_image: false,
    cnic_back_image: false,
    agreement_document: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await axiosInstance.get(`/${endpoint}/list`)
      setData(response.data)

      if (onDataChange) {
        onDataChange()
      }
    } catch (error) {
      console.error(`Failed to fetch ${title}`, error)
      toast.error(`Failed to fetch ${title}`)
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
      )
      await fetchData()
      setSelectedRows([])
    } catch (error) {
      console.error(`Failed to update ${title} status`, error)
      toast.error(`Failed to update ${title} status`)
    } finally {
      setIsLoading(false)
    }
  }

  const showModal = (item: T | null) => {
    setEditingItem(item)
    setFormData(item || {})
    setValidationErrors({})
    // Reset loading states when opening modal
    setLoadingStates({
      cnic_front_image: false,
      cnic_back_image: false,
      agreement_document: false,
    })
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
    setValidationErrors({})
    // Reset loading states when closing modal
    setLoadingStates({
      cnic_front_image: false,
      cnic_back_image: false,
      agreement_document: false,
    })
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
        const value = formData[key]

        if (value == null || value === "") {
          return
        }
        if (key === "packages" && Array.isArray(value)) {
          formDataToSend.append("packages_json", JSON.stringify(value.map((row: any) => ({
            id: row.id || undefined,
            service_plan_id: row.service_plan_id,
            discount_amount: Number(row.discount_amount) || 0,
          }))))
          return
        }
        if (key === "technicians" && Array.isArray(value)) {
          formDataToSend.append("technicians_json", JSON.stringify(value.map((row: any) => ({
            technician_id: row.technician_id || row.id,
            commission_amount: Number(row.commission_amount) || 0,
          }))))
          return
        }
        if (["service_plan_ids", "technician_id", "connection_commission_amount", "discount_amount", "patch_cord_count", "patch_cord_ethernet_count"].includes(key)) {
          return
        }
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item != null && item !== "") {
              formDataToSend.append(key, item)
            }
          })
        } else if (["cnic_front_image", "cnic_back_image", "agreement_document"].includes(key)) {
          formDataToSend.append(key, value)
        } else {
          formDataToSend.append(key, value)
        }
      })

      // Debug: Log what's being sent
      console.log('FormData contents:')
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value)
      }

      if (editingItem) {
        await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} updated successfully`)
      } else {
        await axiosInstance.post(`/${endpoint}/add`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        toast.success(`${title} added successfully`)
      }
      fetchData()
      handleCancel()
    } catch (error: any) {
      console.error("Operation failed", error)

      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors)
        toast.error(error.response.data.errors)
      } else if (error.response?.data) {
        toast.error(error.response.data)
      } else {
        toast.error("Operation failed. Please try again.")
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
        toast.success(`${title} deleted successfully`)
        fetchData()
      } catch (error) {
        console.error("Delete operation failed", error)
        toast.error("Delete operation failed")
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
      toast.success(`${title} status updated successfully`)
      fetchData()
    } catch (error) {
      console.error("Toggle status failed", error)
      toast.error(`Failed to update ${title} status`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target

    if (value) {
      // This is a file path string from FileUploadField
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else if (files && files.length > 0) {
      // This is a direct file input (fallback)
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    }
  }
  const handleFileRemove = useCallback((fieldName: string) => {
    // Update form data to remove the file reference
    setFormData((prev) => ({
      ...prev,
      [fieldName]: ""
    }))
  }, [])
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const memoizedColumns = useMemo(() => {
    return [
      ...columns,
      {
        header: "Status",
        accessorKey: "is_active",
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          return String(row.getValue(columnId)) === String(filterValue)
        },
        cell: (info: any) => (
          <div className="flex items-center">
            <button
              onClick={() => handleToggleStatus(info.row.original.id, info.getValue())}
              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${info.getValue()
                  ? "bg-emerald-green/10 text-emerald-green hover:bg-emerald-green/20"
                  : "bg-coral-red/10 text-coral-red hover:bg-coral-red/20"
                }`}
            >
              {info.getValue() ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Active
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" /> Inactive
                </>
              )}
            </button>
          </div>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: (info: any) => (
          <div className="flex items-center gap-1">
            {isCompanyOwner && (
              <button
                onClick={() => setCredentialsCustomerId(info.row.original.id)}
                className="h-8 w-8 inline-flex items-center justify-center text-white bg-deep-ocean rounded-md hover:bg-deep-ocean/90 transition-colors"
                title="Portal Credentials"
              >
                <Key className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => showModal(info.row.original)}
              className="h-8 w-8 inline-flex items-center justify-center text-white bg-electric-blue rounded-md hover:bg-btn-hover transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="h-8 w-8 inline-flex items-center justify-center text-white bg-coral-red rounded-md hover:bg-coral-red/80 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ]
  }, [columns, isCompanyOwner])

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
                  <Users className="h-5 w-5 text-electric-blue" />
                  {title} Management
                </h1>
                <div className="flex flex-wrap gap-2">
                  {supportsBulkAdd && (
                    <button
                      onClick={() => setIsBulkAddModalVisible(true)}
                      className="h-9 bg-deep-ocean text-white px-3 text-sm rounded-lg hover:bg-deep-ocean/90 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-4 w-4" /> Bulk Add
                    </button>
                  )}
                  <CSVLink
                    data={displayData}
                    filename={`${title.toLowerCase()}.csv`}
                    className="h-9 bg-golden-amber text-white px-3 text-sm rounded-lg hover:bg-golden-amber/90 transition-colors inline-flex items-center gap-1.5"
                  >
                    <FileDown className="h-4 w-4" /> Export CSV
                  </CSVLink>
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
            </div>
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
            {/* Table Section */}
            <div className="mb-4">
              <Table
                data={displayData}
                columns={memoizedColumns}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                handleToggleStatus={handleToggleStatus}
                isLoading={isLoading}
                quickFilters={quickFilters}
                filterState={tableFilters.filterState}
                onQuickFilterChange={tableFilters.setQuickFilter}
                onClearFilters={tableFilters.clearAllFilters}
                hasActiveFilters={tableFilters.hasAnyActiveFilters}
                inlineFilterFields={tableFilters.inlineFields}
                controlledColumnFilters={tableFilters.mergedColumnFilters}
                onControlledColumnFiltersChange={tableFilters.handleColumnFiltersChange}
                onSearchTextChange={setTableSearchText}
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
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <FormComponent
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            handleFileRemove={handleFileRemove} // Add this prop
            isEditing={!!editingItem}
            validationErrors={validationErrors}
            loadingStates={loadingStates}
            setLoadingStates={setLoadingStates}
          />
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
      <EnhancedBulkAddModal
        isVisible={isBulkAddModalVisible}
        onClose={() => setIsBulkAddModalVisible(false)}
        endpoint={endpoint}
        entityName={title}
        onSuccess={fetchData}
      />
      {credentialsCustomerId && (
        <CustomerPortalCredentialsModal
          customerId={credentialsCustomerId}
          onClose={() => setCredentialsCustomerId(null)}
        />
      )}
    </div>
  )
}
