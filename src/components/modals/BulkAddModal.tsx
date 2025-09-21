"use client"

import type React from "react"
import { useState } from "react"
import { Download, Upload, AlertCircle, CheckCircle, X, FileText, Loader } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface BulkAddModalProps {
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
  errors: Array<{
    row: number
    errors: string[]
  }>
}

export function BulkAddModal({ isVisible, onClose, endpoint, entityName, onSuccess }: BulkAddModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [step, setStep] = useState<"initial" | "uploading" | "validation" | "complete">("initial")

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
      link.setAttribute("download", `${entityName.toLowerCase()}_template.csv`)
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

  const uploadFile = async () => {
    if (!file) return

    setIsUploading(true)
    setStep("uploading")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = getToken()
      const response = await axiosInstance.post(`/${endpoint}/bulk-add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(percentCompleted)
        },
      })

      setValidationResult(response.data)
      setStep(response.data.success ? "complete" : "validation")

      if (response.data.success) {
        toast.success(
          `Successfully added ${response.data.successCount} out of ${response.data.totalRecords} ${entityName.toLowerCase()}s`,
          {
            style: { background: "#D1FAE5", color: "#10B981" },
          },
        )
        onSuccess()
      } else {
        toast.warning(
          `Added ${response.data.successCount} out of ${response.data.totalRecords} ${entityName.toLowerCase()}s with ${
            response.data.failedCount
          } errors`,
          {
            style: { background: "#FEF3C7", color: "#D97706" },
          },
        )
      }
    } catch (error) {
      console.error("Failed to upload file", error)
      toast.error("Failed to upload file", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      setStep("initial")
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setValidationResult(null)
    setUploadProgress(0)
    setStep("initial")
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-gray/10">
          <h2 className="text-2xl font-bold text-deep-ocean">Bulk Add {entityName}s</h2>
          <button
            onClick={onClose}
            className="text-slate-gray hover:text-deep-ocean transition-colors rounded-full p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "initial" && (
            <div className="space-y-6">
              <div className="bg-light-sky/30 rounded-lg p-4 border border-electric-blue/20">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-electric-blue mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-deep-ocean">Important Instructions</h3>
                    <ul className="mt-2 text-sm text-slate-gray space-y-1 list-disc pl-5">
                      <li>Download the template file to see the required format</li>
                      <li>Fill in the customer data according to the template</li>
                      <li>Required fields must not be empty</li>
                      <li>Upload the completed file to add multiple customers at once</li>
                      <li>The system will validate your data before adding customers</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-gray/20 rounded-lg p-6 hover:border-electric-blue/40 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-light-sky/50 p-4 rounded-full mb-4">
                      <Download className="h-8 w-8 text-electric-blue" />
                    </div>
                    <h3 className="text-lg font-semibold text-deep-ocean mb-2">Download Template</h3>
                    <p className="text-sm text-slate-gray mb-4">
                      Get a CSV template with all required fields and examples
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" /> Download Template
                    </button>
                  </div>
                </div>

                <div className="border border-slate-gray/20 rounded-lg p-6 hover:border-electric-blue/40 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-light-sky/50 p-4 rounded-full mb-4">
                      <Upload className="h-8 w-8 text-electric-blue" />
                    </div>
                    <h3 className="text-lg font-semibold text-deep-ocean mb-2">Upload File</h3>
                    <p className="text-sm text-slate-gray mb-4">Upload your completed CSV or Excel file</p>
                    <div className="w-full">
                      <label className="flex flex-col items-center px-4 py-2 bg-white text-electric-blue rounded-lg border border-electric-blue cursor-pointer hover:bg-electric-blue/5 transition-colors">
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {file ? file.name : "Choose file"}
                        </span>
                        <input type="file" className="hidden" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between bg-light-sky/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-electric-blue mr-2" />
                    <span className="text-sm font-medium text-deep-ocean">{file.name}</span>
                    <span className="ml-2 text-xs text-slate-gray">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetForm} className="p-1 text-slate-gray hover:text-coral-red transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="animate-spin h-12 w-12 text-electric-blue mb-4" />
              <h3 className="text-lg font-semibold text-deep-ocean mb-2">Uploading and Processing</h3>
              <p className="text-sm text-slate-gray mb-6">Please wait while we process your file...</p>
              <div className="w-full max-w-md bg-light-sky/30 rounded-full h-4 mb-2">
                <div
                  className="bg-electric-blue h-4 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-gray">{uploadProgress}% Complete</p>
            </div>
          )}

          {step === "validation" && validationResult && (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800">Validation Results</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      {validationResult.successCount} out of {validationResult.totalRecords} records were successfully
                      added. {validationResult.failedCount} records had errors.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-gray/20 rounded-lg overflow-hidden">
                <div className="bg-light-sky/20 px-4 py-3 border-b border-slate-gray/10">
                  <h3 className="font-medium text-deep-ocean">Error Details</h3>
                </div>
                <div className="max-h-64 overflow-y-auto p-4">
                  {validationResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="mb-4 last:mb-0 bg-coral-red/5 p-3 rounded-lg border border-coral-red/20"
                    >
                      <h4 className="font-medium text-deep-ocean mb-1">
                        Row {error.row + 1} {/* Adding 1 to account for 0-based index */}
                      </h4>
                      <ul className="text-sm text-slate-gray space-y-1 list-disc pl-5">
                        {error.errors.map((err, i) => (
                          <li key={i} className="text-coral-red">
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "complete" && validationResult && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-emerald-green/10 p-4 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-green" />
              </div>
              <h3 className="text-xl font-semibold text-deep-ocean mb-2">Upload Successful!</h3>
              <p className="text-center text-slate-gray mb-6">
                Successfully added {validationResult.successCount} out of {validationResult.totalRecords}{" "}
                {entityName.toLowerCase()}s to the system.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-light-sky/50 text-deep-ocean rounded-lg hover:bg-light-sky transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "initial" && (
          <div className="p-6 border-t border-slate-gray/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={uploadFile}
              disabled={!file || isUploading}
              className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-blue disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin h-5 w-5" /> Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" /> Upload and Process
                </>
              )}
            </button>
          </div>
        )}

        {step === "validation" && (
          <div className="p-6 border-t border-slate-gray/10 flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2.5 border border-slate-gray/20 text-slate-gray rounded-lg hover:bg-light-sky/50 transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-btn-hover transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
