"use client"

import type React from "react"
import { Building2, User, Mail, Phone, MapPin } from "lucide-react"

interface SupplierFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function SupplierForm({ formData, handleInputChange, isEditing }: SupplierFormProps) {
  const inputClasses = `
    w-full 
    pl-10 
    pr-4 
    py-3 
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

  return (
    <div className="space-y-6">
      {/* Supplier Name */}
      <div className="space-y-2">
        <label className={labelClasses}>Supplier Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className={iconClasses} />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Enter supplier name"
            className={inputClasses}
            required
          />
        </div>
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <label className={labelClasses}>Contact Person</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className={iconClasses} />
          </div>
          <input
            type="text"
            name="contact_person"
            value={formData.contact_person || ""}
            onChange={handleInputChange}
            placeholder="Enter contact person name"
            className={inputClasses}
          />
        </div>
      </div>

      {/* Email */}
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
            required
          />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className={labelClasses}>Phone</label>
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
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className={labelClasses}>Address</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <MapPin className={iconClasses} />
          </div>
          <textarea
            name="address"
            value={formData.address || ""}
            onChange={handleInputChange}
            placeholder="Enter complete address"
            rows={3}
            className={`${inputClasses} resize-y min-h-[120px]`}
          />
        </div>
      </div>
    </div>
  )
}

export default SupplierForm
