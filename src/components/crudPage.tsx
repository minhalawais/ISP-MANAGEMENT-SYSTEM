"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CheckCircle2,
  XCircle,
  Users,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react"
import { Table } from "./table/table.tsx"
import { Modal } from "./modal.tsx"
import { MODAL_CANCEL_BTN, MODAL_FOOTER, MODAL_PRIMARY_BTN } from "./ui/modalStyles.ts"
import { Topbar } from "./topNavbar.tsx"
import { Sidebar } from "./sideNavbar.tsx"
import { useOptionalAdminChrome } from "../context/AdminLayoutContext.tsx"
import { getToken } from "../utils/auth.ts"
import { toast } from "../utils/notify.ts";
import axiosInstance from "../utils/axiosConfig.ts"
import { CredentialsModal } from "./modals/CredentialsModal.tsx"
import { createFormDataRequestConfig, getOperationErrorMessage } from "../utils/crudSubmit.ts"
import type { CrudFilterConfig } from "../types/crudFilters.ts"
import { getCrudFilterConfig } from "../config/crudFilterConfigs.ts"
import { getCrudPeriodConfig } from "../config/crudPeriodConfigs.ts"
import { useCrudTableFilters } from "../hooks/useCrudTableFilters.ts"
import { useCrudPeriodFilter } from "../hooks/useCrudPeriodFilter.ts"
import { CrudStatsSection } from "./crud/CrudStatsSection.tsx"
import { computeCrudStats } from "../utils/crudFilterParams.ts"
import { filterRowsByPktPeriod, periodForTextSearch } from "../utils/crudPeriodUtils.ts"
import type { StatCardDef } from "../types/crudFilters.ts"

interface CRUDPageProps<T> {
  title: string
  endpoint: string
  columns: ColumnDef<T>[]
  filterModuleKey?: string
  filterConfig?: CrudFilterConfig
  FormComponent: React.ComponentType<{
    formData: Partial<T>
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    handleFileChange?: (name: string, file: File | null) => void
    setFormField?: (name: string, value: unknown) => void
    isEditing: boolean
    validateBeforeSubmit?: (formData: Partial<T>) => string | null
    onValidationStateChange?: (state: AsyncValidationState) => void
  }>
  onDataChange?: () => void
  validateBeforeSubmit?: (formData: Partial<T>) => string | null
  /** Return true if create was handled (skip default POST /endpoint/add). */
  onCreateSubmit?: (formData: Partial<T>) => Promise<boolean>
  validateFiles?: (files: Record<string, File>) => string | null
  requireAsyncValidation?: boolean
  useFormData?: boolean  // Enable multipart/form-data for file uploads
}

type AsyncValidationStatus = "idle" | "loading" | "valid" | "invalid"
type AsyncValidationState = {
  username: AsyncValidationStatus
  email: AsyncValidationStatus
  cnic?: AsyncValidationStatus
}

export function CRUDPage<T extends { id: string; is_active?: boolean }>({
  title,
  endpoint,
  columns,
  filterModuleKey,
  filterConfig: filterConfigProp,
  FormComponent,
  onDataChange,
  validateBeforeSubmit,
  onCreateSubmit,
  validateFiles,
  requireAsyncValidation = false,
  useFormData = false,
}: CRUDPageProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<Partial<T>>({})
  const hasChrome = useOptionalAdminChrome()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState<{
    username: string
    password: string
    email: string
  } | null>(null)
  const [fileData, setFileData] = useState<Record<string, File>>({})  // File storage for uploads
  const [asyncValidation, setAsyncValidation] = useState<AsyncValidationState>({ username: "idle", email: "idle" })
  const submitLockRef = useRef(false)

  const filterConfig = filterConfigProp ?? getCrudFilterConfig(filterModuleKey ?? endpoint)
  const periodConfig = getCrudPeriodConfig(filterModuleKey ?? endpoint)

  const tableFilters = useCrudTableFilters({ config: filterConfig })
  const periodFilter = useCrudPeriodFilter({ config: periodConfig })
  const [searchText, setSearchText] = useState("")

  const [computedStats, setComputedStats] = useState<Record<string, number>>({ total: 0 })

  const periodScopedData = useMemo(
    () =>
      filterRowsByPktPeriod(
        data as unknown as Record<string, unknown>[],
        periodFilter.period,
        periodConfig.dateField,
      ) as T[],
    [data, periodFilter.period, periodConfig.dateField],
  )

  // Text search ignores month filter and scans the full loaded list
  const displayData = useMemo(
    () =>
      filterRowsByPktPeriod(
        data as unknown as Record<string, unknown>[],
        periodForTextSearch(periodFilter.period, searchText),
        periodConfig.dateField,
      ) as T[],
    [data, periodFilter.period, periodConfig.dateField, searchText],
  )

  useEffect(() => {
    setComputedStats(computeCrudStats(periodScopedData, filterConfig.statCards))
  }, [periodScopedData, filterConfig.statCards])

  const statCards: StatCardDef[] = useMemo(
    () =>
      filterConfig.statCards.map((card) => ({
        ...card,
        value: computedStats[card.id] ?? computedStats.total ?? 0,
        clickable: card.clickable !== false && !!card.filter,
      })),
    [filterConfig.statCards, computedStats],
  )

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/${endpoint}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      toast.success(`${title} status updated successfully`)
      await fetchData()
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
    setFileData({})  // Clear file data when opening modal
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingItem(null)
    setFormData({})
    setFileData({})  // Clear file data
    setAsyncValidation({ username: "idle", email: "idle" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (submitLockRef.current || isLoading) return
    submitLockRef.current = true

    try {
      if (validateBeforeSubmit) {
        const validationError = validateBeforeSubmit(formData)
        if (validationError) {
          toast.error(validationError)
          return
        }
      }

      if (validateFiles) {
        const fileValidationError = validateFiles(fileData)
        if (fileValidationError) {
          toast.error(fileValidationError)
          return
        }
      }

      if (requireAsyncValidation && !editingItem) {
        if (asyncValidation.username !== "valid") {
          toast.error("Please wait for username availability to be confirmed.")
          return
        }
        if (asyncValidation.email !== "valid") {
          toast.error("Please wait for email availability to be confirmed.")
          return
        }
        if (asyncValidation.cnic && asyncValidation.cnic !== "valid") {
          const message = asyncValidation.cnic === "invalid"
            ? "CNIC is already in use."
            : "Please wait for CNIC availability to be confirmed."
          toast.error(message)
          return
        }
      }

      setIsLoading(true)
      const token = getToken()
      let response

      // Prepare data - use FormData if files are present or useFormData is true
      const hasFiles = Object.keys(fileData).length > 0
      let submitData: any = formData
      let headers: Record<string, string> = { Authorization: `Bearer ${token}` }
      let requestConfig: any = { headers }

      if (useFormData || hasFiles) {
        const formDataObj = new FormData()
        // Append regular form fields
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            // Handle arrays (iterate and append primitives)
            if (Array.isArray(value)) {
              value.forEach((item) => {
                // Only append primitives from arrays (skip objects)
                if (typeof item !== 'object') {
                  formDataObj.append(key, String(item));
                }
              });
            }
            // Handle Files/Blobs (if they somehow ended up in formData, though usually in fileData)
            else if (value instanceof File || value instanceof Blob) {
              formDataObj.append(key, value);
            }
            // Handle primitives
            else if (typeof value !== 'object') {
              formDataObj.append(key, String(value));
            }
            // Plain nested objects (e.g. website_content) — JSON-encode so the
            // backend can parse them back out of the multipart form fields.
            else {
              formDataObj.append(key, JSON.stringify(value));
            }
          }
        })
        // Append files
        Object.entries(fileData).forEach(([key, file]) => {
          console.log("Appending file:", key, file);  // Debug
          formDataObj.append(key, file)
        })
        submitData = formDataObj
        // Do not set Content-Type here. The browser must add the multipart boundary.
        requestConfig = createFormDataRequestConfig(token)
      } else {
        headers['Content-Type'] = 'application/json'
      }

      if (editingItem) {
        response = await axiosInstance.put(`/${endpoint}/update/${editingItem.id}`, submitData, requestConfig)
        toast.success(`${title} updated successfully`)
      } else if (onCreateSubmit) {
        const handled = await onCreateSubmit(formData)
        if (!handled) {
          response = await axiosInstance.post(`/${endpoint}/add`, submitData, requestConfig)
          toast.success(`${title} added successfully`)
          if (response.data.credentials) {
            setNewEmployeeCredentials(response.data.credentials)
            setShowCredentialsModal(true)
          }
        }
      } else {
        response = await axiosInstance.post(`/${endpoint}/add`, submitData, requestConfig)
        toast.success(`${title} added successfully`)
        if (response.data.credentials) {
          setNewEmployeeCredentials(response.data.credentials)
          setShowCredentialsModal(true)
        }
      }
      await fetchData()
      handleCancel()
    } catch (error: any) {
      console.error("Operation failed", error)
      const errorMsg = getOperationErrorMessage(error, title)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
      submitLockRef.current = false
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
        await fetchData()
      } catch (error) {
        console.error("Delete operation failed", error)
        toast.error("Delete operation failed")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const setFormField = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setFileData((prev) => ({ ...prev, [name]: file }))
    } else {
      setFileData((prev) => {
        const newData = { ...prev }
        delete newData[name]
        return newData
      })
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
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          return String(row.getValue(columnId)) === String(filterValue)
        },
        cell: (info: any) => (
          <div className="flex items-center">
            <button
              onClick={() => handleToggleStatus(info.row.original.id, info.getValue())}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${info.getValue()
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
  }, [columns])

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
                <button
                  onClick={() => showModal(null)}
                  className="h-9 bg-electric-blue text-white px-3 text-sm rounded-lg hover:bg-btn-hover transition-colors inline-flex items-center justify-center gap-1.5 self-start md:self-center"
                >
                  <Plus className="h-4 w-4" /> Add New {title}
                </button>
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
                      <Check className="h-4 w-4" /> Activate
                    </button>
                    <button
                      onClick={() => handleBulkStatusChange(false)}
                      disabled={selectedRows.length === 0 || isLoading}
                      className="px-4 py-2 text-sm font-medium bg-coral-red text-white rounded-md hover:bg-coral-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-red disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <X className="h-4 w-4" /> Deactivate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table Section */}
            <div className="mb-4">
              <Table
                data={displayData}
                columns={memoizedColumns}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                handleToggleStatus={handleToggleStatus}
                isLoading={isLoading}
                quickFilters={filterConfig.quickFilters}
                filterState={tableFilters.filterState}
                onQuickFilterChange={tableFilters.setQuickFilter}
                onClearFilters={tableFilters.clearAllFilters}
                hasActiveFilters={tableFilters.hasAnyActiveFilters}
                onSearchTextChange={setSearchText}
                inlineFilterFields={tableFilters.inlineFields}
                controlledColumnFilters={tableFilters.mergedColumnFilters}
                onControlledColumnFiltersChange={tableFilters.handleColumnFiltersChange}
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
          <FormComponent
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChange}
            setFormField={setFormField}
            isEditing={!!editingItem}
            onValidationStateChange={setAsyncValidation}
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
                  <Check className="h-5 w-5" /> Update {title}
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

      {/* Credentials Modal */}
      {newEmployeeCredentials && (
        <CredentialsModal
          isVisible={showCredentialsModal}
          onClose={() => setShowCredentialsModal(false)}
          credentials={newEmployeeCredentials}
          title={`${title} Credentials`}
        />
      )}
    </div>
  )
}
