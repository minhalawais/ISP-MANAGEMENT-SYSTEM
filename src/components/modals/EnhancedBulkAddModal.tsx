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
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Database,
  Settings,
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
      const [areasRes, plansRes, ispsRes] = await Promise.all([
        axiosInstance.get("/areas/list", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/service-plans/list", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/isps/list", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      setDropdownData({
        areas: areasRes.data,
        servicePlans: plansRes.data,
        isps: ispsRes.data,
      })
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      // Check if file is CSV or Excel
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

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${entityName.toLowerCase()}_template.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`Enhanced ${entityName} template downloaded successfully`, {
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
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data

      // Set the validation result directly from the response
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

      // Handle specific error cases
      if (error.response?.data?.error) {
        toast.error(error.responseData.error, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else if (error.response?.data?.errors) {
        toast.error("Validation failed. Please check your file format.", {
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

      // Prepare data for backend - only send valid rows and any edited data
      const validRowsToProcess = validationResult.validRows.map((row, index) => {
        // Apply any edits made in the UI
        return editedData[index] ? { ...row, ...editedData[index] } : row
      })

      const requestData = {
        validatedData: validRowsToProcess,
      }

      console.log("Sending to backend:", requestData)

      const response = await axiosInstance.post(`/${endpoint}/bulk-add`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const responseData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data

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
        toast.error(error.responseData.error, {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      } else if (error.response?.data?.errors) {
        toast.error("Processing failed with validation errors", {
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

  const saveRowChanges = (rowIndex: number) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev)
      newSet.delete(rowIndex)
      return newSet
    })
    toast.success("Row changes saved", {
      style: { background: "#D1FAE5", color: "#10B981" },
    })
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
  ) => {
    const isEditing = editingRows.has(rowIndex)
    const currentValue = editedData[rowIndex]?.[field] || value

    if (!isEditing) {
      const option = options.find((opt) => opt.id === currentValue)
      return <span className="text-sm">{option?.name || currentValue}</span>
    }

    return (
      <select
        value={currentValue}
        onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-slate-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-electric-blue"
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    )
  }

  const renderEditableField = (rowIndex: number, field: string, value: string, type = "text") => {
    const isEditing = editingRows.has(rowIndex)
    const currentValue = editedData[rowIndex]?.[field] || value

    if (!isEditing) {
      return <span className="text-sm">{currentValue}</span>
    }

    if (field === "connection_type") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-slate-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="">Select...</option>
          <option value="internet">Internet</option>
          <option value="tv_cable">TV Cable</option>
          <option value="both">Both</option>
        </select>
      )
    }

    if (field === "internet_connection_type") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-slate-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="">Select...</option>
          <option value="wire">Wire</option>
          <option value="wireless">Wireless</option>
        </select>
      )
    }

    if (field === "tv_cable_connection_type") {
      return (
        <select
          value={currentValue}
          onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-slate-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="">Select...</option>
          <option value="analog">Analog</option>
          <option value="digital">Digital</option>
        </select>
      )
    }

    return (
      <input
        type={type}
        value={currentValue}
        onChange={(e) => handleFieldChange(rowIndex, field, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-slate-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-electric-blue"
      />
    )
  }

  if (!isVisible) return null

  // Get the appropriate data to display based on current view
  const getDisplayData = () => {
    if (!validationResult) return []

    // Handle cases where validRows or errors might be undefined
    const validRows = validationResult.validRows || []
    const errors = validationResult.errors || []

    if (showValidRowsOnly) {
      // Show valid rows - these are complete row objects
      return validRows.map((row, index) => ({
        ...row,
        _isValid: true,
        _originalIndex: index,
        _displayIndex: index + 1,
      }))
    } else {
      // Show error rows - these have a different structure with data and errors properties
      return errors.map((errorItem, index) => ({
        ...errorItem, // This includes data, errors, and row properties
        _isValid: false,
        _originalIndex: index,
        _displayIndex: errorItem.row + 1, // Use the actual row number from the API
      }))
    }
  }

  const displayRows = getDisplayData()
  const totalPages = Math.ceil(displayRows.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = displayRows.slice(startIndex, endIndex)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-gray/10">
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
        <div className="px-6 py-4 bg-light-sky/20 border-b border-slate-gray/10">
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
        <div className="flex-1 overflow-y-auto p-6">
          {step === "initial" && (
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
                        Dynamic Excel template with real-time dropdowns for foreign keys
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-green" />
                        Comprehensive data validation with field-level error reporting
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-green" />
                        Inline editing of invalid rows with proper dropdowns
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-green" />
                        Real-time validation feedback and batch processing
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
                    <h3 className="text-lg font-semibold text-deep-ocean mb-2">Download Enhanced Template</h3>
                    <p className="text-sm text-slate-gray mb-4">
                      Get an Excel template with dropdowns, validation rules, and helpful examples
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
                      Upload your completed file for validation and editing
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
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-light-sky/20 rounded-lg p-4 border border-electric-blue/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Total Records</p>
                      <h3 className="text-2xl font-bold text-deep-ocean">{validationResult.totalRecords}</h3>
                    </div>
                    <FileText className="h-8 w-8 text-electric-blue" />
                  </div>
                </div>
                <div className="bg-emerald-green/5 rounded-lg p-4 border border-emerald-green/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Valid Records</p>
                      <h3 className="text-2xl font-bold text-emerald-green">{validationResult.successCount}</h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-green" />
                  </div>
                </div>
                <div className="bg-coral-red/5 rounded-lg p-4 border border-coral-red/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-gray text-sm">Errors Found</p>
                      <h3 className="text-2xl font-bold text-coral-red">{validationResult.failedCount}</h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-coral-red" />
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setShowValidRowsOnly(false)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !showValidRowsOnly
                        ? "bg-coral-red text-white"
                        : "bg-coral-red/10 text-coral-red hover:bg-coral-red/20"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Error Rows ({validationResult.failedCount})
                  </button>
                  <button
                    onClick={() => {
                      setShowValidRowsOnly(true)
                      setCurrentPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showValidRowsOnly
                        ? "bg-emerald-green text-white"
                        : "bg-emerald-green/10 text-emerald-green hover:bg-emerald-green/20"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Valid Rows ({validationResult.successCount})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowValidRowsOnly(!showValidRowsOnly)}
                    className="p-2 text-slate-gray hover:text-deep-ocean transition-colors"
                  >
                    {showValidRowsOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-lg border border-slate-gray/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-light-sky/20">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Internet ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Area
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Connection Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-gray/10">
                      {currentRows.map((row, index) => {
                        const actualRowIndex = startIndex + index
                        const isEditing = editingRows.has(actualRowIndex)

                        // Get the actual data based on whether we're showing valid or error rows
                        const rowData = row._isValid ? row : row.data || {}
                        const rowErrors = row._isValid
                          ? []
                          : Array.isArray(row.errors)
                            ? row.errors
                            : row.errors
                              ? [row.errors]
                              : []

                        return (
                          <tr
                            key={actualRowIndex}
                            className={`${isEditing ? "bg-electric-blue/5" : "hover:bg-light-sky/10"} transition-colors`}
                          >
                            <td className="px-4 py-3 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{row._displayIndex || actualRowIndex + 1}</span>
                                {!row._isValid && rowErrors.length > 0 && (
                                  <div className="flex flex-col gap-1">
                                    {rowErrors.map((error: string, i: number) => (
                                      <span
                                        key={i}
                                        className="text-xs text-coral-red bg-coral-red/10 px-2 py-1 rounded"
                                      >
                                        {error}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {renderEditableField(actualRowIndex, "internet_id", rowData.internet_id || "")}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  {renderEditableField(actualRowIndex, "first_name", rowData.first_name || "")}
                                </div>
                                <div className="flex-1">
                                  {renderEditableField(actualRowIndex, "last_name", rowData.last_name || "")}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {renderEditableField(actualRowIndex, "email", rowData.email || "", "email")}
                            </td>
                            <td className="px-4 py-3">
                              {renderDropdownField(
                                actualRowIndex,
                                "area_id",
                                rowData.area_id || "",
                                dropdownData.areas,
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {renderEditableField(actualRowIndex, "connection_type", rowData.connection_type || "")}
                            </td>
                            <td className="px-4 py-3">
                              {row._isValid ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-green/10 text-emerald-green">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-coral-red/10 text-coral-red">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveRowChanges(actualRowIndex)}
                                      className="p-1 text-emerald-green hover:bg-emerald-green/10 rounded transition-colors"
                                      title="Save changes"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => resetRowChanges(actualRowIndex)}
                                      className="p-1 text-slate-gray hover:bg-slate-gray/10 rounded transition-colors"
                                      title="Reset changes"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleEditRow(actualRowIndex)}
                                    className="p-1 text-electric-blue hover:bg-electric-blue/10 rounded transition-colors"
                                    title="Edit row"
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-3 bg-light-sky/10 border-t border-slate-gray/10 flex items-center justify-between">
                    <div className="text-sm text-slate-gray">
                      Showing {startIndex + 1} to {Math.min(endIndex, displayRows.length)} of {displayRows.length} rows
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-slate-gray hover:text-deep-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-1 bg-electric-blue/10 text-electric-blue rounded text-sm font-medium">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-gray hover:text-deep-ocean disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

          {/* Empty States */}
          {displayRows.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-gray/20 p-8 text-center">
              <div className="text-slate-gray">
                {showValidRowsOnly ? (
                  <div>
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-slate-gray/50" />
                    <p className="text-lg font-medium mb-2">No Valid Rows Found</p>
                    <p className="text-sm">
                      All rows contain validation errors. Switch to Error Rows to review and fix them.
                    </p>
                  </div>
                ) : (
                  <div>
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-gray/50" />
                    <p className="text-lg font-medium mb-2">No Error Rows</p>
                    <p className="text-sm">All rows are valid and ready for processing!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "initial" && (
          <div className="p-6 border-t border-slate-gray/10 flex justify-end gap-3">
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
          <div className="p-6 border-t border-slate-gray/10 flex justify-between">
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
            >
              Start Over
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={processValidatedData}
                disabled={isProcessing || validationResult?.successCount === 0}
                className="px-6 py-3 bg-emerald-green text-white rounded-lg hover:bg-emerald-green/90 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-5 w-5" /> Processing...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5" /> Process Data ({validationResult?.successCount || 0} records)
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
