"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { User, Phone, Mail, CreditCard, Image, FileText, X, Globe, Sparkles } from "lucide-react"
import { WebsiteContentEditor } from "./WebsiteContentEditor.tsx"

interface VendorFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleFileChange?: (name: string, file: File | null) => void
  isEditing: boolean
}

export function VendorForm({ formData, handleInputChange, handleFileChange, isEditing }: VendorFormProps) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const inputClasses = `
    w-full 
    pl-10 
    pr-4 
    py-2.5
    text-sm
    border 
    border-[#EBF5FF] 
    rounded-lg 
    shadow-sm 
    bg-white 
    text-[#4A5568] 
    placeholder-[#4A5568]/60
    focus:ring-2 
    focus:ring-[#3A86FF]/30 
    focus:border-[#3A86FF] 
    transition-all 
    duration-200
  `

  const labelClasses = "block text-sm font-medium text-[#2A5C8A] mb-1"
  const iconClasses = "h-5 w-5 text-[#4A5568]/60"

  const handleLocalFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      const file = files[0]
      const url = URL.createObjectURL(file)
      setPreviewUrls(prev => ({ ...prev, [name]: url }))
      
      if (handleFileChange) {
        handleFileChange(name, file)
      }
    }
  }, [handleFileChange])

  const handleWebsiteContentChange = useCallback(
    (content: Record<string, unknown>) => {
      handleInputChange({ target: { name: "website_content", value: content } } as unknown as React.ChangeEvent<HTMLInputElement>)
    },
    [handleInputChange]
  )

  const removeFile = (fieldName: string) => {
    setPreviewUrls(prev => {
      const newUrls = { ...prev }
      if (newUrls[fieldName]) {
        URL.revokeObjectURL(newUrls[fieldName])
      }
      delete newUrls[fieldName]
      return newUrls
    })
    if (handleFileChange) {
      handleFileChange(fieldName, null)
    }
  }

  const renderFileUpload = (
    name: string,
    label: string,
    accept: string,
    icon: React.ReactNode
  ) => {
    const previewUrl = previewUrls[name] || formData[name]
    const isImage = accept.includes('image')
    
    return (
      <div className="space-y-2">
        <label className={labelClasses}>{label}</label>
        <div className="relative">
          {previewUrl ? (
            <div className="relative border border-[#EBF5FF] rounded-lg p-3 bg-white">
              <div className="flex items-center gap-3">
                {isImage && (previewUrl.startsWith('blob:') || previewUrl.startsWith('http')) ? (
                  <img src={previewUrl} alt={label} className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 bg-[#EBF5FF] rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-[#3A86FF]" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-[#4A5568] font-medium">File selected</p>
                  <p className="text-xs text-[#4A5568]/60">Click X to remove</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(name)}
                  className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#EBF5FF] rounded-lg p-6 bg-white hover:border-[#3A86FF]/50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                {icon}
                <input
                  type="file"
                  name={name}
                  onChange={handleLocalFileChange}
                  accept={accept}
                  className="w-full mt-2 text-sm text-[#4A5568] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#3A86FF] file:text-white hover:file:bg-[#2A5C8A] transition-all duration-200"
                />
                <p className="mt-2 text-xs text-[#4A5568]/60">
                  {isImage ? 'PNG, JPG, JPEG up to 10MB' : 'PDF, PNG, JPG up to 10MB'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className={labelClasses}>Vendor Name *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className={iconClasses} />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Enter vendor name"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Domain *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className={iconClasses} />
          </div>
          <input
            type="text"
            name="domain"
            value={formData.domain || formData.primary_domain || ""}
            onChange={handleInputChange}
            placeholder="fastnet.mbanet.com.pk"
            className={inputClasses}
            required
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-[#4A5568]/70">
          Hostname only — no http:// or path. Vendor users sign in only on this domain.
        </p>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Phone Number *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className={iconClasses} />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            placeholder="Enter phone number"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className={iconClasses} />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleInputChange}
            placeholder="Enter email address"
            className={inputClasses}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>CNIC Number *</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CreditCard className={iconClasses} />
          </div>
          <input
            type="text"
            name="cnic"
            value={formData.cnic || ""}
            onChange={handleInputChange}
            placeholder="Enter CNIC number (e.g., 12345-1234567-1)"
            className={inputClasses}
            required
            maxLength={15}
          />
        </div>
      </div>

      <div className="border-t border-[#EBF5FF] my-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFileUpload(
          'picture',
          'Vendor Picture',
          'image/png,image/jpeg,image/jpg',
          <Image className="h-8 w-8 text-[#4A5568]/50 mb-2" />
        )}

        {renderFileUpload(
          'cnic_front_image',
          'CNIC Front',
          'image/png,image/jpeg,image/jpg,application/pdf',
          <CreditCard className="h-8 w-8 text-[#4A5568]/50 mb-2" />
        )}

        {renderFileUpload(
          'cnic_back_image',
          'CNIC Back',
          'image/png,image/jpeg,image/jpg,application/pdf',
          <CreditCard className="h-8 w-8 text-[#4A5568]/50 mb-2" />
        )}

        {renderFileUpload(
          'agreement_document',
          'Agreement Document',
          'image/png,image/jpeg,image/jpg,application/pdf',
          <FileText className="h-8 w-8 text-[#4A5568]/50 mb-2" />
        )}
      </div>

      {isEditing && formData.is_provisioned && (
        <>
          <div className="border-t border-[#EBF5FF] my-4"></div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2A5C8A]">
              <Sparkles className="h-4 w-4 text-[#3A86FF]" />
              Website Content
            </p>
            <p className="text-xs text-[#4A5568]/70">
              Copy shown on this vendor's public marketing site at their domain. Leave blank to use defaults.
            </p>
          </div>
          <WebsiteContentEditor
            content={formData.website_content || {}}
            onChange={handleWebsiteContentChange}
          />
        </>
      )}
    </div>
  )
}

export default VendorForm
