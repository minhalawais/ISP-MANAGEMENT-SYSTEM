"use client"

import type React from "react"
import { Map, ClipboardList } from "lucide-react"

interface AreaZoneFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function AreaZoneForm({ formData, handleInputChange, isEditing }: AreaZoneFormProps) {
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
      {/* Area/Zone Name */}
      <div className="space-y-2">
        <label className={labelClasses}>Area/Zone Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Map className={iconClasses} />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            placeholder="Enter area or zone name"
            className={inputClasses}
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <ClipboardList className={iconClasses} />
          </div>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleInputChange}
            placeholder="Enter area/zone description"
            rows={3}
            className={`${inputClasses} resize-y min-h-[120px]`}
          />
        </div>
      </div>
    </div>
  )
}

export default AreaZoneForm
