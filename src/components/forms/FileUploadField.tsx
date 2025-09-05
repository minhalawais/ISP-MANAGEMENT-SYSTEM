"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { Paperclip, CheckCircle2, FileImage, File, Upload, X, AlertCircle } from "lucide-react"

interface FileUploadFieldProps {
  label: string
  name: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  currentImage?: string
  currentDocument?: string
}

export function FileUploadField({ label, name, onChange, currentImage, currentDocument }: FileUploadFieldProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Create a preview URL when a file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      // For newly uploaded files, we need to create a temporary URL
      // Extract the customer ID from the current image/document URL if available
      let customerId = null
      if (currentImage) {
        const match = currentImage.match(/\/([^/]+)$/)
        if (match) customerId = match[1]
      } else if (currentDocument) {
        const match = currentDocument.match(/\/([^/]+)$/)
        if (match) customerId = match[1]
      }

      // If we have a customer ID, we can construct a URL to fetch the file
      if (customerId) {
        if (name === "cnic_front_image") {
          setPreviewUrl(`http://127.0.0.1:8000/customers/cnic-front-image/${customerId}`)
          setFileType("image")
        } else if (name === "cnic_back_image") {
          setPreviewUrl(`http://127.0.0.1:8000/customers/cnic-back-image/${customerId}`)
          setFileType("image")
        } else if (name === "agreement_document") {
          setPreviewUrl(`http://127.0.0.1:8000/customers/agreement-document/${customerId}`)
          setFileType("document")
        }
      } else {
        // For new customers without an ID yet, we'll show a placeholder or icon
        setPreviewUrl(null)
        if (name.includes("cnic")) {
          setFileType("image")
        } else if (name.includes("agreement")) {
          setFileType("document")
        }
      }
    }
  }, [uploadedFile, currentImage, currentDocument, name])

  // Set initial preview URL from props
  useEffect(() => {
    if (currentImage) {
      setPreviewUrl(currentImage)
      setFileType("image")
    } else if (currentDocument) {
      setPreviewUrl(currentDocument)
      setFileType("document")
    }
  }, [currentImage, currentDocument])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // Determine file type for preview
      if (file.type.startsWith("image/")) {
        setFileType("image");
        const tempUrl = URL.createObjectURL(file);
        setPreviewUrl(tempUrl);
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setFileType("document");
      }

      const formData = new FormData();
      formData.append(name, file);

      try {
        const token = getToken();
        const response = await axiosInstance.post(
          `http://127.0.0.1:8000/customers/upload-file/${name}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 100)
              );
              setUploadProgress(percentCompleted);
            },
          }
        );

        setUploadedFile(response.data.file_path);
        console.log('File uploaded successfully:', response.data.file_path);
        // Update the parent form data with the file path
        const event = {
          target: {
            name: name,
            value: response.data.file_path,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(event); // This will update the formData in the parent component

        setIsUploading(false);
        setUploadProgress(100);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadError("Upload failed. Please try again.");
        setIsUploading(false);
        if (previewUrl && !currentImage && !currentDocument) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const event = {
        target: {
          files: e.dataTransfer.files
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(event);
    }
  };

  // Clean up any object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleClearFile = () => {
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
    setFileType(null);
    
    // Clear the file input
    const fileInput = document.getElementById(name) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    
    // Update parent form
    const event = {
      target: {
        name: name,
        value: "",
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(event);
  };

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-sm font-medium text-slate-gray mb-2">
        {label}
      </label>
      
      <div 
        className={`relative mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 
          ${isDragging ? 'border-electric-blue border-solid' : 'border-slate-gray/20 border-dashed'} 
          ${uploadError ? 'bg-red-50' : 'bg-light-sky/30'} 
          rounded-xl shadow-sm hover:border-electric-blue/50 transition-all duration-300 group
          ${isUploading ? 'opacity-75' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-2 text-center w-full py-4">
          <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-electric-blue' : 'text-slate-gray/60'} group-hover:text-electric-blue/70 transition-colors duration-300`} />
          
          <div className="flex flex-col text-sm text-slate-gray">
            <label
              htmlFor={name}
              className="relative cursor-pointer rounded-md font-medium text-electric-blue hover:text-deep-ocean focus-within:outline-none transition-colors duration-200"
            >
              <span className="inline-flex items-center hover:underline">
                Upload a file
                <input
                  id={name}
                  name={name}
                  type="file"
                  onChange={handleFileUpload}
                  className="sr-only"
                  accept=".png,.jpg,.jpeg,.pdf"
                  disabled={isUploading}
                />
              </span>
            </label>
            <p className="mt-1">or drag and drop</p>
          </div>
          
          <p className="text-xs text-slate-gray">PNG, JPG, JPEG, or PDF up to 10MB</p>

          {isUploading && (
            <div className="mt-4 w-full max-w-md mx-auto">
              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-electric-blue h-3 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-gray mt-2 font-medium">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {uploadError && (
            <div className="mt-3 text-coral-red text-sm flex items-center justify-center bg-red-50 py-2 px-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" /> 
              <span>{uploadError}</span>
            </div>
          )}

          {uploadedFile && !isUploading && !uploadError && (
            <div className="mt-3 text-emerald-green text-sm flex items-center justify-center bg-emerald-50 py-2 px-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 mr-1 flex-shrink-0" /> 
              <span>File uploaded successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview section for Images */}
      {fileType === "image" && (
        <div className="mt-4">
          <div className="relative w-full h-56 bg-white rounded-xl overflow-hidden shadow-md border border-slate-gray/10">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt={`${label} preview`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Image failed to load:", e)
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
                <button 
                  onClick={handleClearFile}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-slate-gray hover:text-coral-red p-1 rounded-full shadow-sm transition-colors"
                  title="Remove image"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center justify-center h-full">
                <FileImage className="h-16 w-16 text-electric-blue mb-3" />
                <p className="text-sm font-medium text-slate-gray">Image uploaded successfully</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileImage className="h-16 w-16 text-slate-gray/30 mb-3" />
                <p className="text-sm text-slate-gray">No image uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview section for Documents */}
      {fileType === "document" && (
        <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-slate-gray/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-light-sky/40 p-3 rounded-lg mr-3">
                <File className="h-6 w-6 text-electric-blue" />
              </div>
              <div>
                <p className="font-medium text-slate-gray">
                  {uploadedFile ? "Document uploaded" : "No document"}
                </p>
                <p className="text-xs text-slate-gray/70">
                  {uploadedFile ? "PDF file" : "No file selected"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-electric-blue hover:text-deep-ocean bg-light-sky/30 hover:bg-light-sky/50 py-2 px-3 rounded-lg transition-colors font-medium text-sm"
                >
                  <Paperclip className="mr-1 h-4 w-4" />
                  View
                </a>
              )}
              
              {(previewUrl || uploadedFile) && (
                <button
                  onClick={handleClearFile}
                  className="inline-flex items-center text-slate-gray hover:text-coral-red bg-slate-gray/10 hover:bg-slate-gray/20 py-2 px-3 rounded-lg transition-colors font-medium text-sm"
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}