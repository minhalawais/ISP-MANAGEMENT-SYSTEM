"use client"

import type React from "react"
import { Package, FileText, Zap, Database, DollarSign } from "lucide-react"

interface ServicePlanFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function ServicePlanForm({ formData, handleInputChange, isEditing }: ServicePlanFormProps) {
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
      <div className="space-y-2">
        <label className={labelClasses}>Plan Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Package className={iconClasses} />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Enter plan name"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <FileText className={iconClasses} />
          </div>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter plan description"
            rows={3}
            className={`${inputClasses} resize-y min-h-[120px]`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className={labelClasses}>Speed (Mbps)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Zap className={iconClasses} />
            </div>
            <input
              type="number"
              name="speed_mbps"
              value={formData.speed_mbps || ""}
              onChange={handleInputChange}
              placeholder="Enter speed in Mbps"
              className={inputClasses}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Data Cap (GB)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Database className={iconClasses} />
            </div>
            <input
              type="number"
              name="data_cap_gb"
              value={formData.data_cap_gb || ""}
              onChange={handleInputChange}
              placeholder="Enter data cap in GB"
              className={inputClasses}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Price</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className={iconClasses} />
            </div>
            <input
              type="number"
              name="price"
              value={formData.price || ""}
              onChange={handleInputChange}
              placeholder="Enter price"
              className={inputClasses}
              required
            />
          </div>
        </div>
      </div>
    </div>
  )
}
