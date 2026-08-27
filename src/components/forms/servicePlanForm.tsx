"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Package, FileText, Zap, Database, DollarSign, Globe } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"

interface ISP {
  id: string
  name: string
}

interface ServicePlanFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  isEditing: boolean
}

export function ServicePlanForm({ formData, handleInputChange, isEditing }: ServicePlanFormProps) {
  const [isps, setIsps] = useState<ISP[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIsps = async () => {
      try {
        const token = getToken()
        const response = await axiosInstance.get("/isps/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setIsps(response.data)
      } catch (error) {
        console.error("Failed to fetch ISPs", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIsps()
  }, [])

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
      {/* ISP Selection */}
      <div className="space-y-2">
        <label className={labelClasses}>ISP <span className="text-red-500">*</span></label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className={iconClasses} />
          </div>
          <select
            name="isp_id"
            value={formData.isp_id || ""}
            onChange={handleInputChange}
            className={inputClasses}
            required
            disabled={isLoading}
          >
            <option value="">-- Select ISP --</option>
            {isps.map((isp) => (
              <option key={isp.id} value={isp.id}>
                {isp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Plan Name <span className="text-red-500">*</span></label>
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
          <label className={labelClasses}>Price (PKR) <span className="text-red-500">*</span></label>
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

      <div className="border-t border-[#EBF5FF] pt-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#2A5C8A]">Public website offer</h3>
          <p className="mt-1 text-xs text-[#4A5568]">Publishing is off by default. Review customer-facing names, charges and claims before enabling it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClasses}>Product type</label><select name="product_type" value={formData.product_type || "internet"} onChange={handleInputChange} className={inputClasses}><option value="internet">Internet</option><option value="tv">TV</option><option value="iptv">IPTV</option><option value="addon">Add-on</option><option value="static_ip">Static IP</option></select></div>
          <div><label className={labelClasses}>Customer type</label><select name="customer_type" value={formData.customer_type || "residential"} onChange={handleInputChange} className={inputClasses}><option value="residential">Residential</option><option value="business">Business</option></select></div>
          <div><label className={labelClasses}>Technology</label><select name="technology" value={formData.technology || ""} onChange={handleInputChange} className={inputClasses}><option value="">Not specified</option><option value="FTTH / GPON">FTTH / GPON</option><option value="Fixed wireless">Fixed wireless</option><option value="Ethernet">Ethernet</option><option value="Hybrid">Hybrid</option></select></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2"><label className={labelClasses}>Public package name</label><input type="text" name="public_name" value={formData.public_name || ""} onChange={handleInputChange} placeholder="e.g. Home 20 — never expose internal tariff codes" className={inputClasses} /></div>
          <div><label className={labelClasses}>Display order</label><input type="number" name="display_order" value={formData.display_order ?? 100} onChange={handleInputChange} className={inputClasses} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className={labelClasses}>Upload Mbps</label><input type="number" name="upload_speed_mbps" value={formData.upload_speed_mbps || ""} onChange={handleInputChange} className={inputClasses} /></div>
          <div><label className={labelClasses}>Installation fee</label><input type="number" name="installation_fee" value={formData.installation_fee ?? ""} onChange={handleInputChange} className={inputClasses} /></div>
          <div><label className={labelClasses}>Equipment fee</label><input type="number" name="equipment_fee" value={formData.equipment_fee ?? ""} onChange={handleInputChange} className={inputClasses} /></div>
          <div><label className={labelClasses}>Contract months</label><input type="number" name="contract_term_months" value={formData.contract_term_months || ""} onChange={handleInputChange} className={inputClasses} /></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClasses}>Data policy</label><select name="is_unlimited" value={String(formData.is_unlimited === true || formData.is_unlimited === "true")} onChange={handleInputChange} className={inputClasses}><option value="false">Use data cap</option><option value="true">Unlimited</option></select></div>
          <div><label className={labelClasses}>Taxes</label><select name="tax_inclusive" value={String(formData.tax_inclusive === true || formData.tax_inclusive === "true")} onChange={handleInputChange} className={inputClasses}><option value="false">Exclusive</option><option value="true">Inclusive</option></select></div>
          <div><label className={labelClasses}>Featured</label><select name="is_featured" value={String(formData.is_featured === true || formData.is_featured === "true")} onChange={handleInputChange} className={inputClasses}><option value="false">No</option><option value="true">Yes</option></select></div>
          <div><label className={labelClasses}>Website status</label><select name="is_public" value={String(formData.is_public === true || formData.is_public === "true")} onChange={handleInputChange} className={inputClasses}><option value="false">Private</option><option value="true">Published</option></select></div>
        </div>
      </div>
    </div>
  )
}
