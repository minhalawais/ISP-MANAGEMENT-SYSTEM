"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, X, Eye, FileText, ImageIcon } from "lucide-react"
import { toast } from "react-toastify"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"

interface FileUploadFieldProps {
  label: string
  name: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  currentImage?: string
  disabled?: boolean
  accept?: string
  maxSize?: number // in MB
}

export function FileUploadField({
  label,
  name,
  onChange,
  currentImage,
  disabled = false,
  accept = "image/*,.pdf",
  maxSize = 5,
}: FileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`, {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      return
    }

    // Validate file type
    const allowedTypes = accept.split(",").map((type) => type.trim())
    const isValidType = allowedTypes.some((type) => {
      if (type === "image/*") return file.type.startsWith("image/")
      if (type === ".pdf") return file.type === "application/pdf"
      return file.type === type
    })

    if (!isValidType) {
      toast.error("Invalid file type", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
      return
    }

    try {
      setIsUploading(true)

      // Upload file immediately
      const token = getToken()
      const formData = new FormData()
      formData.append(name, file)

      const response = await axiosInstance.post(`/customers/upload-file/${name}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        setUploadedFile(response.data.file_path)

        // Create preview URL for images
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file)
          setPreviewUrl(url)
        }

        // Trigger the onChange with the file path
        const syntheticEvent = {
          target: {
            name,
            value: response.data.file_path,
            files: [file],
          },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)

        toast.success("File uploaded successfully", {
          style: { background: "#D1FAE5", color: "#10B981" },
        })
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast.error(error.response?.data?.error || "Failed to upload file", {
        style: { background: "#FEE2E2", color: "#EF4444" },
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Trigger onChange with empty value
    const syntheticEvent = {
      target: {
        name,
        value: "",
        files: null,
      },
    } as React.ChangeEvent<HTMLInputElement>

    onChange(syntheticEvent)
  }

  const viewFile = async () => {
    if (currentImage) {
      try {
        const response = await axiosInstance.get(currentImage, {
          responseType: "blob",
        })

        const url = window.URL.createObjectURL(response.data)
        window.open(url, "_blank")

        setTimeout(() => window.URL.revokeObjectURL(url), 60000)
      } catch (error) {
        console.error("Error viewing file:", error)
        toast.error("Failed to load file", {
          style: { background: "#FEE2E2", color: "#EF4444" },
        })
      }
    } else if (previewUrl) {
      window.open(previewUrl, "_blank")
    }
  }

  const hasFile = uploadedFile || currentImage
  const canPreview = previewUrl || currentImage

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-gray">{label}</label>

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {!hasFile ? (
          <div
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              disabled || isUploading
                ? "border-slate-gray/20 bg-slate-gray/5 cursor-not-allowed"
                : "border-slate-gray/30 hover:border-electric-blue/50 hover:bg-light-sky/20"
            }`}
          >
            <Upload
              className={`mx-auto h-8 w-8 mb-2 ${
                disabled || isUploading ? "text-slate-gray/50" : "text-slate-gray/70"
              }`}
            />
            <p className={`text-sm mb-1 ${disabled || isUploading ? "text-slate-gray/50" : "text-slate-gray"}`}>
              {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-slate-gray/70">Max size: {maxSize}MB</p>
          </div>
        ) : (
          <div className="border border-slate-gray/30 rounded-lg p-4 bg-light-sky/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {accept.includes("image") ? (
                  <ImageIcon className="h-8 w-8 text-electric-blue" />
                ) : (
                  <FileText className="h-8 w-8 text-electric-blue" />
                )}
                <div>
                  <p className="text-sm font-medium text-deep-ocean">File uploaded successfully</p>
                  <p className="text-xs text-slate-gray">{uploadedFile ? "New file uploaded" : "Current file"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canPreview && (
                  <button
                    type="button"
                    onClick={viewFile}
                    className="p-2 text-electric-blue hover:bg-electric-blue/10 rounded-lg transition-colors"
                    title="View file"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={disabled}
                  className="p-2 text-coral-red hover:bg-coral-red/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-electric-blue">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-electric-blue border-t-transparent"></div>
          Uploading file...
        </div>
      )}
    </div>
  )
}
