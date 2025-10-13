"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Loader,
  Edit3,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Database,
  Settings,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface EnhancedBulkAddModalProps {
  isVisible: boolean
  onClose: () => void
  endpoint: string
  entityName: string
  onSuccess: () => void
}

interface ValidationResult {
  success: boolean
  totalRecords: number
  successCount: number
  failedCount: number
  validRows: Array<Record<string, any>>
  errors: Array<{
    row: number
    errors: string[]
    fieldErrors: Record<string, string> // Add this field
    data: Record<string, any>
  }>
}

interface DropdownData {
  areas: Array<{ id: string; name: string }>
  servicePlans: Array<{ id: string; name: string }>
  isps: Array<{ id: string; name: string }>
}

export function EnhancedBulkAddModal({
  isVisible,
  onClose,
  endpoint,
  entityName,
  onSuccess,
}: EnhancedBulkAddModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [step, setStep] = useState<"initial" | "uploading" | "validation" | "processing" | "complete">("initial")
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set())
  const [editedData, setEditedData] = useState<Record<number, Record<string, any>>>({})
  const [dropdownData, setDropdownData] = useState<DropdownData>({ areas: [], servicePlans: [], isps: [] })
  const [showValidRowsOnly, setShowValidRowsOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (isVisible) {
      fetchDropdownData()
    }
  }, [isVisible])

  const fetchDropdownData = async () => {
    try {
      const token = getToken()
      const res = await axiosInstance.get("/customers/reference-data", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = typeof res.data === "string" ? JSON.parse(res.data) : res.data

      setDropdownData({
        areas: payload.areas || [],
        servicePlans: payload.servicePlans || [],
        isps: payload.isps || [],
      })
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error)
    }
  }
  const getFieldErrors = (rowIndex: number, field: string): string[] => {
    if (showValidRowsOnly) return []
    
    const errorRow = validationResult?.errors.find((error) => error.row === rowIndex)
    if (!errorRow || !errorRow.fieldErrors) return []
  
    // Directly get errors for the specific field
    const fieldError = errorRow.fieldErrors[field]
    return fieldError ? [fieldError] : []
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.type === "text/csv" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFile(selectedFile)
        setValidationResult(null)
        setStep("initial")
        setEditingRows(new Set())
        setEditedData({})
        setCurrentPage(1)
      } else {
        toast.error("Please select a CSV or Excel file", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }
    }
  }

  const downloadTemplate = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/${endpoint}/template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${entityName.toLowerCase()}_template.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`${entityName} template downloaded successfully`, {
        style: { background: "#D1FAE5", color: "#10B981" },
      })
    } catch (error) {
      console.error("Failed to download template", error)
      toast.error("Failed to download template", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    }
  }

  const validateFile = async () => {
    if (!file) return

    setIsUploading(true)
    setStep("uploading")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = getToken()
      const response = await axiosInstance.post(`/${endpoint}/validate-bulk`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(percentCompleted)
        },
      })
      const responseData = typeof response.data === "string" ? JSON.parse(response.data) : response.data

      setValidationResult(responseData)
      setStep("validation")

      if (responseData.failedCount > 0) {
        toast.warning(
          `Validation complete: ${responseData.successCount} valid, ${responseData.failedCount} errors found`,
          {
            style: { background: "#FEF3C7", color: "#D97706" },
          },
        )
      } else {
        toast.success(`All ${responseData.totalRecords} records are valid and ready for import`, {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      }
    } catch (error: any) {
      console.error("Failed to validate file", error)

      if (error.response?.data?.error) {
        toast.error(error.response.data.error, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else {
        toast.error("Failed to validate file", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }

      setStep("initial")
    } finally {
      setIsUploading(false)
    }
  }

  const processValidatedData = async () => {
    if (!validationResult) return

    setIsProcessing(true)
    setStep("processing")

    try {
      const token = getToken()

      const validRowsToProcess = validationResult.validRows.map((row, index) => {
        return editedData[index] ? { ...row, ...editedData[index] } : row
      })

      const requestData = {
        validatedData: validRowsToProcess,
      }

      const response = await axiosInstance.post(`/${endpoint}/bulk-add`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const responseData = typeof response.data === "string" ? JSON.parse(response.data) : response.data

      setValidationResult(responseData)
      setStep("complete")

      toast.success(
        `Successfully processed ${responseData.successCount} out of ${validRowsToProcess.length} ${entityName.toLowerCase()}s`,
        {
          style: { background: "#D1FAE5", color: "#10B981" },
        },
      )
      onSuccess()
    } catch (error: any) {
      console.error("Failed to process data", error)

      if (error.response?.data?.error) {
        toast.error(error.response.data.error, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else {
        toast.error("Failed to process validated data", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }

      setStep("validation")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditRow = (rowIndex: number) => {
    const newEditingRows = new Set(editingRows)
    if (newEditingRows.has(rowIndex)) {
      newEditingRows.delete(rowIndex)
    } else {
      newEditingRows.add(rowIndex)
    }
    setEditingRows(newEditingRows)
  }

  const handleFieldChange = (rowIndex: number, field: string, value: string) => {
    setEditedData((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }))
  }

  const validateRowClientSide = (rowData: Record<string, any>): string[] => {
    const errors: string[] = []

    const requiredFields = [
      "internet_id",
      "first_name",
      "last_name",
      "email",
      "phone_1",
      "area_id",
      "installation_address",
      "service_plan_id",
      "isp_id",
      "connection_type",
      "cnic",
      "installation_date",
    ]

    requiredFields.forEach((field) => {
      if (!rowData[field] || String(rowData[field]).trim() === "") {
        errors.push(`Missing required field: ${field}`)
      }
    })

    if (rowData.email) {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailPattern.test(rowData.email)) {
        errors.push("Invalid email format")
      }
    }

    const validatePhone = (label: string, value?: string) => {
      if (!value) return
      const digits = String(value).replace(/\D/g, "")
      const normalized = digits.startsWith("92") ? digits : `92${digits}`
      if (normalized.length < 10 || normalized.length > 13) {
        errors.push(`Invalid phone number format for ${label}`)
      }
    }
    validatePhone("phone_1", rowData.phone_1)
    if (rowData.phone_2) validatePhone("phone_2", rowData.phone_2)

    if (rowData.cnic) {
      const cnicClean = String(rowData.cnic).replace(/\D/g, "")
      if (cnicClean.length !== 13) {
        errors.push("CNIC must be exactly 13 digits")
      }
    }

    if (rowData.installation_date) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/
      if (!datePattern.test(String(rowData.installation_date))) {
        errors.push("installation_date must be in YYYY-MM-DD format")
      }
    }

    if (rowData.connection_type) {
      const validConnectionTypes = ["internet", "tv_cable", "both"]
      if (!validConnectionTypes.includes(String(rowData.connection_type).toLowerCase())) {
        errors.push("connection_type must be one of: internet, tv_cable, both")
      }
    }
    if (rowData.connection_type && ["internet", "both"].includes(String(rowData.connection_type).toLowerCase())) {
      if (!rowData.internet_connection_type)
        errors.push("internet_connection_type is required when connection_type is internet or both")
    }
    if (rowData.connection_type && ["tv_cable", "both"].includes(String(rowData.connection_type).toLowerCase())) {
      if (!rowData.tv_cable_connection_type)
        errors.push("tv_cable_connection_type is required when connection_type is tv_cable or both")
    }

    const isIdIn = (id: string, list: Array<{ id: string }>) => !!list.find((x) => x.id === id)
    if (rowData.area_id && !isIdIn(rowData.area_id, dropdownData.areas)) {
      errors.push("Invalid area_id selection")
    }
    if (rowData.service_plan_id && !isIdIn(rowData.service_plan_id, dropdownData.servicePlans)) {
      errors.push("Invalid service_plan_id selection")
    }
    if (rowData.isp_id && !isIdIn(rowData.isp_id, dropdownData.isps)) {
      errors.push("Invalid isp_id selection")
    }

    return errors
  }

  const updateValidationResultAfterEdit = (
    rowIndex: number,
    rowData: Record<string, any>,
    isValid: boolean,
    errors: string[] = [],
    fieldErrors: Record<string, string> = {},
  ) => {
    if (!validationResult) return
  
    setValidationResult((prev) => {
      if (!prev) return prev
  
      // Create deep copies to avoid mutation issues
      const newValidationResult = JSON.parse(JSON.stringify(prev))
      
      if (isValid) {
        // Find the error row and remove it from errors array
        const errorIndex = newValidationResult.errors.findIndex((error: any) => error.row === rowIndex)
        if (errorIndex !== -1) {
          const [movedRow] = newValidationResult.errors.splice(errorIndex, 1)
          
          // Add the row to validRows with updated data
          newValidationResult.validRows.push({
            ...movedRow.data,
            ...rowData,
          })
          
          // Update counts
          newValidationResult.successCount += 1
          newValidationResult.failedCount -= 1
        }
      } else {
        // Update the error row with new validation results
        const errorIndex = newValidationResult.errors.findIndex((error: any) => error.row === rowIndex)
        if (errorIndex !== -1) {
          newValidationResult.errors[errorIndex] = {
            ...newValidationResult.errors[errorIndex],
            errors: errors,
            fieldErrors: fieldErrors,
            data: {
              ...newValidationResult.errors[errorIndex].data,
              ...rowData,
            },
          }
        } else {
          // If this was previously a valid row, move it back to errors
          const validIndex = newValidationResult.validRows.findIndex((row: any, index: number) => index === rowIndex)
          if (validIndex !== -1) {
            const [movedRow] = newValidationResult.validRows.splice(validIndex, 1)
            newValidationResult.errors.push({
              row: rowIndex,
              errors: errors,
              fieldErrors: fieldErrors,
              data: {
                ...movedRow,
                ...rowData,
              },
            })
            newValidationResult.successCount -= 1
            newValidationResult.failedCount += 1
          }
        }
      }
  
      return newValidationResult
    })
  
    // Exit editing mode
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      newSet.delete(rowIndex)
      return newSet
    })
  }
  

  const saveRowChanges = async (rowIndex: number) => {
    const rowData = editedData[rowIndex]
    if (!rowData || !validationResult) return
  
    try {
      const originalRow = validationResult.errors.find((error) => error.row === rowIndex)
      if (!originalRow) return
  
      const completeRowData = {
        ...originalRow.data,
        ...rowData,
      }
  
      const clientErrors = validateRowClientSide(completeRowData)
  
      if (clientErrors.length === 0) {
        setIsUploading(true)
        const token = getToken()
  
        const response = await axiosInstance.post(
          `/${endpoint}/validate-single-row`,
          {
            rowData: completeRowData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )
  
        const responseData = typeof response.data === "string" ? JSON.parse(response.data) : response.data
  
        if (responseData.successCount === 1) {
          updateValidationResultAfterEdit(rowIndex, completeRowData, true)
          toast.success("Row validation passed", {
            style: { background: "#D1FAE5", color: "#10B981" },
          })
        } else {
          // Handle field-specific errors from backend
          const rowErrors = responseData.errors.find((error: any) => error.row === 0)
          if (rowErrors && rowErrors.fieldErrors) {
            // Convert fieldErrors object to array of error messages
            const errorMessages = Object.values(rowErrors.fieldErrors) as string[]
            updateValidationResultAfterEdit(rowIndex, completeRowData, false, errorMessages, rowErrors.fieldErrors)
          } else {
            updateValidationResultAfterEdit(rowIndex, completeRowData, false, rowErrors?.errors || [])
          }
          toast.warning("Row still has validation errors", {
            style: { background: "#FEF3C7", color: "#D97706" },
          })
        }
        setIsUploading(false)
      } else {
        updateValidationResultAfterEdit(rowIndex, completeRowData, false, clientErrors)
        toast.warning("Please fix validation errors", {
          style: { background: "#FEF3C7", color: "#D97706" },
        })
      }
    } catch (error) {
      console.error("Error saving row changes:", error)
      toast.error("Failed to save changes", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      setIsUploading(false)
    }
  }

  const resetRowChanges = (rowIndex: number) => {
    setEditedData((prev) => {
      const newData = { ...prev }
      delete newData[rowIndex]
      return newData
    })
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      newSet.delete(rowIndex)
      return newSet
    })
  }

  const resetForm = () => {
    setFile(null)
    setValidationResult(null)
    setUploadProgress(0)
    setStep("initial")
    setEditingRows(new Set())
    setEditedData({})
    setCurrentPage(1)
    setShowValidRowsOnly(false)
  }

  const renderDropdownField = (
    rowIndex: number,
    field: string,
    value: string,
    options: Array<{ id: string; name: string }>,
    label: string,
  ) => {
    const isEditing = editingRows.has(rowIndex)
    const currentValue = editedData[rowIndex]?.[field] || value
    const fieldErrors = getFieldErrors(rowIndex, field)
  
    if (!isEditing) {
      const option = options.find((opt) => opt.id === currentValue)
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">{option?.name || currentValue || "-"}</span>
          {fieldErrors.length > 0 && (
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
              <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
            </div>
          )}
        </div>
      )
    }
  
    return (
      <div className="flex flex-col gap-1">
        <select
          value={currentValue}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 ${
            fieldErrors.length > 0
              ? "border-coral-red focus:ring-coral-red"
              : "border-slate-gray/20 focus:ring-electric-blue"
          }`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {fieldErrors.length > 0 && (
          <div className="flex items-start gap-1">
            <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
            <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
          </div>
        )}
      </div>
    )
  }

  const renderEditableField = (rowIndex: number, field: string, value: string, type = "text", label = "") => {
    const isEditing = editingRows.has(rowIndex)
    const currentValue = editedData[rowIndex]?.[field] || value
    const fieldErrors = getFieldErrors(rowIndex, field)
  
    if (!isEditing) {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm break-words">{currentValue || "-"}</span>
          {fieldErrors.length > 0 && (
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
              <span className="text-xs text-coral-red leading-tight">{fieldErrors[0]}</span>
            </div>
          )}
        </div>
      )
    }

    if (field === "connection_type") {
      return (
        <div className="flex flex-col gap-1">
          <select
            value={currentValue}
            onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
            className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 ${
              fieldErrors.length > 0
                ? "border-coral-red focus:ring-coral-red"
                : "border-slate-gray/20 focus:ring-electric-blue"
            }`}
          >
            <option value="">Select...</option>
            <option value="internet">Internet</option>
            <option value="tv_cable">TV Cable</option>
            <option value="both">Both</option>
          </select>
          {fieldErrors.length > 0 && (
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
              <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
            </div>
          )}
        </div>
      )
    }

    if (field === "internet_connection_type") {
      return (
        <div className="flex flex-col gap-1">
          <select
            value={currentValue}
            onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
            className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 ${
              fieldErrors.length > 0
                ? "border-coral-red focus:ring-coral-red"
                : "border-slate-gray/20 focus:ring-electric-blue"
            }`}
          >
            <option value="">Select...</option>
            <option value="wire">Wire</option>
            <option value="wireless">Wireless</option>
          </select>
          {fieldErrors.length > 0 && (
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
              <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
            </div>
          )}
        </div>
      )
    }

    if (field === "tv_cable_connection_type") {
      return (
        <div className="flex flex-col gap-1">
          <select
            value={currentValue}
            onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
            className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 ${
              fieldErrors.length > 0
                ? "border-coral-red focus:ring-coral-red"
                : "border-slate-gray/20 focus:ring-electric-blue"
            }`}
          >
            <option value="">Select...</option>
            <option value="analog">Analog</option>
            <option value="digital">Digital</option>
          </select>
          {fieldErrors.length > 0 && (
            <div className="flex items-start gap-1">
              <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
              <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1">
        <input
          type={type}
          value={currentValue}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 ${
            fieldErrors.length > 0
              ? "border-coral-red focus:ring-coral-red"
              : "border-slate-gray/20 focus:ring-electric-blue"
          }`}
          placeholder={label}
        />
        {fieldErrors.length > 0 && (
          <div className="flex items-start gap-1">
            <AlertCircle className="h-3 w-3 text-coral-red mt-0.5 flex-shrink-0" />
            <span className="text-xs text-coral-red">{fieldErrors[0]}</span>
          </div>
        )}
      </div>
    )
  }

  const getDisplayData = () => {
    if (!validationResult) return []

    const validRows = validationResult.validRows || []
    const errors = validationResult.errors || []

    if (showValidRowsOnly) {
      return validRows.map((row, index) => ({
        ...row,
        _isValid: true,
        _originalIndex: index,
        _displayIndex: index + 1,
      }))
    } else {
      return errors.map((errorItem, index) => ({
        ...errorItem.data,
        _isValid: false,
        _originalIndex: errorItem.row,
        _displayIndex: errorItem.row + 1,
        _errors: errorItem.errors,
      }))
    }
  }

  const displayRows = getDisplayData()
  const totalPages = Math.ceil(displayRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = displayRows.slice(startIndex, endIndex)

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-gray/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-electric-blue/10 p-2 rounded-lg">
              <Database className="h-6 w-6 text-electric-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-deep-ocean">Enhanced Bulk Import</h2>
              <p className="text-sm text-slate-gray">Advanced {entityName} import with validation & editing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-gray hover:text-deep-ocean transition-colors rounded-full p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-light-sky/20 border-b border-slate-gray/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-2 ${step === "initial" ? "text-electric-blue" : step === "uploading" || step === "validation" || step === "processing" || step === "complete" ? "text-emerald-green" : "text-slate-gray"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "initial" ? "bg-electric-blue text-white" : step === "uploading" || step === "validation" || step === "processing" || step === "complete" ? "bg-emerald-green text-white" : "bg-slate-gray/20"}`}
              >
                1
              </div>
              <span className="font-medium">Upload File</span>
            </div>
            <div
              className={`flex items-center gap-2 ${step === "validation" ? "text-electric-blue" : step === "processing" || step === "complete" ? "text-emerald-green" : "text-slate-gray"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "validation" ? "bg-electric-blue text-white" : step === "processing" || step === "complete" ? "bg-emerald-green text-white" : "bg-slate-gray/20"}`}
              >
                2
              </div>
              <span className="font-medium">Validate & Edit</span>
            </div>
            <div
              className={`flex items-center gap-2 ${step === "processing" ? "text-electric-blue" : step === "complete" ? "text-emerald-green" : "text-slate-gray"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "processing" ? "bg-electric-blue text-white" : step === "complete" ? "bg-emerald-green text-white" : "bg-slate-gray/20"}`}
              >
                3
              </div>
              <span className="font-medium">Process Data</span>
            </div>
            <div
              className={`flex items-center gap-2 ${step === "complete" ? "text-emerald-green" : "text-slate-gray"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "complete" ? "bg-emerald-green text-white" : "bg-slate-gray/20"}`}
              >
                4
              </div>
              <span className="font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {step === "initial" && (
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-electric-blue/5 to-light-sky/30 rounded-lg p-6 border border-electric-blue/20">
                  <div className="flex items-start gap-4">
                    <div className="bg-electric-blue/10 p-3 rounded-full">
                      <Settings className="h-6 w-6 text-electric-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-deep-ocean mb-2">Advanced Import Features</h3>
                      <ul className="text-sm text-slate-gray space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-green" />
                          Dynamic Excel template with real-time dropdowns
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-green" />
                          Comprehensive validation with inline error display
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-green" />
                          Edit invalid rows directly in the interface
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-green" />
                          Real-time stats and batch processing
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-gray/20 rounded-xl p-6 hover:border-electric-blue/40 transition-all hover:shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-gradient-to-br from-electric-blue to-electric-blue/80 p-4 rounded-full mb-4">
                        <FileSpreadsheet className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-deep-ocean mb-2">Download Template</h3>
                      <p className="text-sm text-slate-gray mb-4">
                        Get an Excel template with dropdowns and validation
                      </p>
                      <button
                        onClick={downloadTemplate}
                        className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2 font-medium"
                      >
                        <Download className="h-4 w-4" /> Download Template
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-gray/20 rounded-xl p-6 hover:border-electric-blue/40 transition-all hover:shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-gradient-to-br from-deep-ocean to-deep-ocean/80 p-4 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-deep-ocean mb-2">Upload & Validate</h3>
                      <p className="text-sm text-slate-gray mb-4">
                        Upload your completed file for validation
                      </p>
                      <div className="w-full">
                        <label className="flex flex-col items-center px-6 py-3 bg-white text-deep-ocean rounded-lg border-2 border-dashed border-deep-ocean/30 cursor-pointer hover:border-deep-ocean/60 hover:bg-deep-ocean/5 transition-all">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span className="font-medium">{file ? file.name : "Choose file"}</span>
                          </div>
                          {file && (
                            <span className="text-xs text-slate-gray mt-1">{(file.size / 1024).toFixed(2)} KB</span>
                          )}
                          <input type="file" className="hidden" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-electric-blue/10 p-6 rounded-full mb-6">
                <Loader className="animate-spin h-12 w-12 text-electric-blue" />
              </div>
              <h3 className="text-xl font-semibold text-deep-ocean mb-2">Validating Your Data</h3>
              <p className="text-slate-gray mb-8 text-center max-w-md">
                Please wait while we analyze your file and validate all customer data...
              </p>
              <div className="w-full max-w-md bg-light-sky/30 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-electric-blue to-electric-blue/80 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-gray">{uploadProgress}% Complete</p>
            </div>
          )}

          {step === "validation" && validationResult && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Stats Cards */}
              <div className="px-6 py-4 bg-light-sky/20 border-b border-slate-gray/10 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-light-sky/50 rounded-lg p-4 border border-slate-gray/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-gray text-sm">Total Records</p>
                        <h3 className="text-2xl font-bold text-deep-ocean">{validationResult.totalRecords}</h3>
                      </div>
                      <FileText className="h-8 w-8 text-electric-blue" />
                    </div>
                  </div>
                  <div className="bg-emerald-green/5 rounded-lg p-4 border border-emerald-green/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-gray text-sm">Valid Records</p>
                        <h3 className="text-2xl font-bold text-emerald-green">{validationResult.successCount}</h3>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-green" />
                    </div>
                  </div>
                  <div className="bg-coral-red/5 rounded-lg p-4 border border-coral-red/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-gray text-sm">Errors Found</p>
                        <h3 className="text-2xl font-bold text-coral-red">{validationResult.failedCount}</h3>
                      </div>
                      <AlertCircle className="h-8 w-8 text-coral-red" />
                    </div>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="px-6 py-3 border-b border-slate-gray/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowValidRowsOnly(false)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      !showValidRowsOnly
                        ? "bg-coral-red text-white shadow-md"
                        : "bg-coral-red/10 text-coral-red hover:bg-coral-red/20"
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    Error Rows ({validationResult.failedCount})
                  </button>
                  <button
                    onClick={() => {
                      setShowValidRowsOnly(true)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      showValidRowsOnly
                        ? "bg-emerald-green text-white shadow-md"
                        : "bg-emerald-green/10 text-emerald-green hover:bg-emerald-green/20"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Valid Rows ({validationResult.successCount})
                  </button>
                </div>
                <div className="text-sm text-slate-gray">
                  {showValidRowsOnly ? "Review valid rows" : "Fix errors to proceed"}
                </div>
              </div>

              {/* Table Container with Sticky Header */}
              <div className="flex-1 overflow-auto">
                <div className="min-w-full">
                  <table className="w-full border-collapse">
                    {/* Sticky Header */}
                    <thead className="bg-deep-ocean text-white sticky top-0 z-10 shadow-md">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[80px]">
                          Row
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                          Internet ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                          First Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                          Last Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[180px]">
                          Email
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          Phone 1
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          Phone 2
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                          Area
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[200px]">
                          Address
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                          Service Plan
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                          ISP
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          Connection
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          Internet Type
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          TV Type
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[130px]">
                          Install Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                          CNIC
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[160px]">
                          GPS
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px] sticky right-0 bg-deep-ocean">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-gray/10 bg-white">
                      {currentRows.map((row) => {
                        const actualRowIndex = row._originalIndex
                        const isEditing = editingRows.has(actualRowIndex)
                        const rowData = row
                        const hasErrors = !row._isValid

                        return (
                          <tr
                            key={actualRowIndex}
                            className={`${
                              isEditing
                                ? "bg-electric-blue/10 border-l-4 border-electric-blue"
                                : hasErrors
                                ? "bg-coral-red/5"
                                : "hover:bg-light-sky/20"
                            } transition-colors`}
                          >
                            {/* Row Number */}
                            <td className="px-3 py-3 text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-deep-ocean">{row._displayIndex}</span>
                                {hasErrors && <AlertTriangle className="h-4 w-4 text-coral-red" />}
                              </div>
                            </td>

                            {/* Internet ID */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "internet_id", rowData.internet_id || "", "text", "Internet ID")}
                            </td>

                            {/* First Name */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "first_name", rowData.first_name || "", "text", "First Name")}
                            </td>

                            {/* Last Name */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "last_name", rowData.last_name || "", "text", "Last Name")}
                            </td>

                            {/* Email */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "email", rowData.email || "", "email", "Email")}
                            </td>

                            {/* Phone 1 */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "phone_1", rowData.phone_1 || "", "tel", "Phone 1")}
                            </td>

                            {/* Phone 2 */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "phone_2", rowData.phone_2 || "", "tel", "Phone 2")}
                            </td>

                            {/* Area */}
                            <td className="px-3 py-3">
                              {renderDropdownField(actualRowIndex, "area_id", rowData.area_id || "", dropdownData.areas, "Area")}
                            </td>

                            {/* Address */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "installation_address", rowData.installation_address || "", "text", "Address")}
                            </td>

                            {/* Service Plan */}
                            <td className="px-3 py-3">
                              {renderDropdownField(actualRowIndex, "service_plan_id", rowData.service_plan_id || "", dropdownData.servicePlans, "Plan")}
                            </td>

                            {/* ISP */}
                            <td className="px-3 py-3">
                              {renderDropdownField(actualRowIndex, "isp_id", rowData.isp_id || "", dropdownData.isps, "ISP")}
                            </td>

                            {/* Connection Type */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "connection_type", rowData.connection_type || "")}
                            </td>

                            {/* Internet Connection Type */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "internet_connection_type", rowData.internet_connection_type || "")}
                            </td>

                            {/* TV Cable Connection Type */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "tv_cable_connection_type", rowData.tv_cable_connection_type || "")}
                            </td>

                            {/* Installation Date */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "installation_date", rowData.installation_date || "", "date")}
                            </td>

                            {/* CNIC */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "cnic", rowData.cnic || "", "text", "CNIC")}
                            </td>

                            {/* GPS Coordinates */}
                            <td className="px-3 py-3">
                              {renderEditableField(actualRowIndex, "gps_coordinates", rowData.gps_coordinates || "", "text", "GPS")}
                            </td>

                            {/* Actions - Sticky */}
                            <td className="px-3 py-3 sticky right-0 bg-white">
                              <div className="flex items-center gap-2 justify-end">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveRowChanges(actualRowIndex)}
                                      className="p-2 text-white bg-emerald-green rounded-md hover:bg-emerald-green/90 transition-colors shadow-sm"
                                      title="Save changes"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => resetRowChanges(actualRowIndex)}
                                      className="p-2 text-white bg-slate-gray rounded-md hover:bg-slate-gray/90 transition-colors shadow-sm"
                                      title="Cancel"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleEditRow(actualRowIndex)}
                                    className="p-2 text-white bg-electric-blue rounded-md hover:bg-electric-blue/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Edit row"
                                    disabled={row._isValid}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Empty State */}
                  {displayRows.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-gray/10 mb-4">
                        {showValidRowsOnly ? (
                          <CheckCircle className="h-8 w-8 text-slate-gray/50" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-slate-gray/50" />
                        )}
                      </div>
                      <p className="text-lg font-medium text-deep-ocean mb-2">
                        {showValidRowsOnly ? "No Valid Rows Found" : "No Error Rows"}
                      </p>
                      <p className="text-sm text-slate-gray">
                        {showValidRowsOnly
                          ? "All rows contain validation errors. Switch to Error Rows to fix them."
                          : "All rows are valid and ready for processing!"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 bg-light-sky/10 border-t border-slate-gray/10 flex items-center justify-between flex-shrink-0">
                  <div className="text-sm text-slate-gray">
                    Showing {startIndex + 1} to {Math.min(endIndex, displayRows.length)} of {displayRows.length} rows
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-slate-gray hover:text-deep-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-slate-gray/10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-electric-blue text-white"
                                : "bg-slate-gray/10 text-slate-gray hover:bg-slate-gray/20"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-slate-gray hover:text-deep-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-slate-gray/10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-electric-blue/10 p-6 rounded-full mb-6">
                <Loader className="animate-spin h-12 w-12 text-electric-blue" />
              </div>
              <h3 className="text-xl font-semibold text-deep-ocean mb-2">Processing Validated Data</h3>
              <p className="text-slate-gray mb-8 text-center max-w-md">
                Saving validated customer records to the database...
              </p>
            </div>
          )}

          {step === "complete" && validationResult && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-emerald-green/10 p-6 rounded-full mb-6">
                <CheckCircle className="h-12 w-12 text-emerald-green" />
              </div>
              <h3 className="text-2xl font-semibold text-deep-ocean mb-2">Import Completed Successfully!</h3>
              <p className="text-center text-slate-gray mb-8 max-w-md">
                Successfully processed {validationResult.successCount} out of {validationResult.totalRecords}{" "}
                {entityName.toLowerCase()}s with advanced validation and error correction.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-light-sky/50 text-deep-ocean rounded-lg hover:bg-light-sky transition-colors font-medium"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === "initial" && (
          <div className="p-6 border-t border-slate-gray/10 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={validateFile}
              disabled={!file || isUploading}
              className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin h-5 w-5" /> Validating...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" /> Validate & Review
                </>
              )}
            </button>
          </div>
        )}

        {step === "validation" && (
          <div className="p-6 border-t border-slate-gray/10 flex justify-between items-center flex-shrink-0 bg-white">
            <div className="flex items-center gap-2 text-sm">
              {validationResult && validationResult.failedCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">
                    Fix {validationResult.failedCount} error{validationResult.failedCount !== 1 ? "s" : ""} to proceed
                  </span>
                </div>
              )}
              {validationResult && validationResult.successCount > 0 && validationResult.failedCount === 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">All records validated successfully!</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
              >
                Start Over
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={processValidatedData}
                disabled={isProcessing || !validationResult || validationResult.successCount === 0}
                className="px-6 py-3 bg-emerald-green text-white rounded-lg hover:bg-emerald-green/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" /> Processing...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5" /> Process {validationResult?.successCount || 0} Record
                    {validationResult && validationResult.successCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}