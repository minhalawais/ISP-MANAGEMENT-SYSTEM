"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  User,
  AtSign,
  Phone,
  CreditCard,
  Lock,
  UserCog,
  Eye,
  EyeOff,
  Key,
  Check,
  X,
  Loader2,
  ChevronDown,
  MapPin,
  Calendar,
  DollarSign,
  Upload,
  FileText,
  Image,
  Users,
} from "lucide-react"
import { debounce } from "lodash"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"

interface EmployeeFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFileChange?: (name: string, file: File | null) => void
  isEditing: boolean
}

export function EmployeeForm({ formData, handleInputChange, handleFileChange, isEditing }: EmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle")
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle")
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "none">("none")

  // File preview states
  const [previews, setPreviews] = useState<{
    cnic_image?: string
    picture?: string
    utility_bill_image?: string
    reference_cnic_image?: string
  }>({})

  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+{}[]|:;<>,.?"

    const allChars = lowercase + uppercase + numbers + symbols
    let password = ""

    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    password += symbols.charAt(Math.floor(Math.random() * symbols.length))

    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length)
      password += allChars[randomIndex]
    }

    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")

    handleInputChange({
      target: { name: "password", value: password },
    } as React.ChangeEvent<HTMLInputElement>)

    checkPasswordStrength(password)
  }

  const verifyUsername = useCallback(
    debounce(async (username: string) => {
      if (!username) {
        setUsernameStatus("idle")
        return
      }
      setUsernameStatus("loading")
      try {
        const token = getToken()
        const response = await axiosInstance.post(
          "/employees/verify-username",
          { username },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        setUsernameStatus(response.data.available ? "valid" : "invalid")
      } catch (error) {
        setUsernameStatus("invalid")
      }
    }, 300),
    [],
  )

  const verifyEmail = useCallback(
    debounce(async (email: string) => {
      if (!email) {
        setEmailStatus("idle")
        return
      }
      setEmailStatus("loading")
      try {
        const token = getToken()
        const response = await axiosInstance.post(
          "/employees/verify-email",
          { email },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        setEmailStatus(response.data.available ? "valid" : "invalid")
      } catch (error) {
        setEmailStatus("invalid")
      }
    }, 300),
    [],
  )

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength("none")
      return
    }
    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    const isLongEnough = password.length >= 8
    const score = [hasLowercase, hasUppercase, hasNumber, hasSymbol, isLongEnough].filter(Boolean).length

    if (score <= 2) setPasswordStrength("weak")
    else if (score <= 4) setPasswordStrength("medium")
    else setPasswordStrength("strong")
  }

  useEffect(() => {
    if (!isEditing) {
      verifyUsername(formData.username)
      verifyEmail(formData.email)
    }
    if (formData.password) {
      checkPasswordStrength(formData.password)
    }
  }, [formData.username, formData.email, formData.password, isEditing, verifyUsername, verifyEmail])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    handleInputChange(e)
    if (e.target.name === "username" && !isEditing) {
      verifyUsername(e.target.value)
    } else if (e.target.name === "email" && !isEditing) {
      verifyEmail(e.target.value)
    } else if (e.target.name === "password") {
      checkPasswordStrength(e.target.value)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      const file = files[0]
      handleFileChange?.(name, file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(prev => ({ ...prev, [name]: e.target?.result as string }))
        }
        reader.readAsDataURL(file)
      } else {
        setPreviews(prev => ({ ...prev, [name]: undefined }))
      }
    }
  }

  const renderStatusIcon = (status: "idle" | "loading" | "valid" | "invalid") => {
    switch (status) {
      case "loading": return <Loader2 className="animate-spin text-golden-amber h-4 w-4" />
      case "valid": return <Check className="text-emerald-green h-4 w-4" />
      case "invalid": return <X className="text-coral-red h-4 w-4" />
      default: return null
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "bg-coral-red"
      case "medium": return "bg-golden-amber"
      case "strong": return "bg-emerald-green"
      default: return "bg-slate-gray/20"
    }
  }

  const inputClass = "pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
  const labelClass = "block text-sm font-medium text-deep-ocean"

  return (
    <div className="space-y-6">
      {/* Section: Personal Information */}
      <div className="bg-light-sky/20 rounded-xl p-4 border border-slate-gray/10">
        <h3 className="text-sm font-semibold text-deep-ocean mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-1">
            <label htmlFor="first_name" className={labelClass}>First Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="first_name" name="first_name" value={formData.first_name || ""} onChange={handleChange} placeholder="Enter first name" className={inputClass} required />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label htmlFor="last_name" className={labelClass}>Last Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="last_name" name="last_name" value={formData.last_name || ""} onChange={handleChange} placeholder="Enter last name" className={inputClass} required />
            </div>
          </div>

          {/* Contact Number */}
          <div className="space-y-1">
            <label htmlFor="contact_number" className={labelClass}>Contact Number *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="contact_number" name="contact_number" value={formData.contact_number || ""} onChange={handleChange} placeholder="03XX-XXXXXXX" className={inputClass} required />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-1">
            <label htmlFor="emergency_contact" className={labelClass}>Emergency Contact *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="emergency_contact" name="emergency_contact" value={formData.emergency_contact || ""} onChange={handleChange} placeholder="Emergency contact number" className={inputClass} required />
            </div>
          </div>

          {/* CNIC */}
          <div className="space-y-1">
            <label htmlFor="cnic" className={labelClass}>CNIC Number *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="cnic" name="cnic" value={formData.cnic || ""} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" className={inputClass} required />
            </div>
          </div>

          {/* Joining Date */}
          <div className="space-y-1">
            <label htmlFor="joining_date" className={labelClass}>Joining Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="date" id="joining_date" name="joining_date" value={formData.joining_date || ""} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>

        {/* House Address */}
        <div className="space-y-1 mt-4">
          <label htmlFor="house_address" className={labelClass}>House Address *</label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-gray/60" />
            </div>
            <textarea id="house_address" name="house_address" value={formData.house_address || ""} onChange={handleChange} placeholder="Complete house address" rows={2} className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50" required />
          </div>
        </div>
      </div>

      {/* Section: Account & Employment */}
      <div className="bg-light-sky/20 rounded-xl p-4 border border-slate-gray/10">
        <h3 className="text-sm font-semibold text-deep-ocean mb-4 flex items-center gap-2">
          <UserCog className="h-4 w-4" /> Account & Employment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="username" className={labelClass}>Username *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="username" name="username" value={formData.username || ""} onChange={handleChange} placeholder="Enter username" className={`${inputClass} pr-10 ${usernameStatus === "invalid" ? "border-coral-red" : usernameStatus === "valid" ? "border-emerald-green" : ""}`} required disabled={isEditing} />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderStatusIcon(usernameStatus)}</div>
            </div>
            {usernameStatus === "invalid" && <p className="text-coral-red text-xs">Username is already taken</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className={labelClass}>Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSign className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="email" id="email" name="email" value={formData.email || ""} onChange={handleChange} placeholder="Enter email address" className={`${inputClass} pr-10 ${emailStatus === "invalid" ? "border-coral-red" : emailStatus === "valid" ? "border-emerald-green" : ""}`} />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderStatusIcon(emailStatus)}</div>
            </div>
            {emailStatus === "invalid" && <p className="text-coral-red text-xs">Email is already in use</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className={labelClass}>Password {!isEditing && "*"}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password || ""} onChange={handleChange} placeholder={isEditing ? "Leave blank to keep" : "Enter password"} className={`${inputClass} pr-20`} required={!isEditing} />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
                <button type="button" onClick={generatePassword} className="p-1.5 text-slate-gray hover:text-electric-blue transition-colors bg-light-sky rounded-md" title="Generate Password">
                  <Key className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-slate-gray hover:text-electric-blue transition-colors bg-light-sky rounded-md" title={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {passwordStrength !== "none" && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-gray/10 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`} style={{ width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%" }} />
                </div>
                <span className={`text-xs font-medium ${passwordStrength === "weak" ? "text-coral-red" : passwordStrength === "medium" ? "text-golden-amber" : "text-emerald-green"}`}>
                  {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label htmlFor="role" className={labelClass}>Role *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCog className="h-5 w-5 text-slate-gray/60" />
              </div>
              <select id="role" name="role" value={formData.role || ""} onChange={handleChange} className={`${inputClass} appearance-none`} required>
                <option value="">Select Role</option>
                <option value="auditor">Auditor</option>
                <option value="employee">Employee</option>
                <option value="company_owner">Admin</option>
                <option value="recovery_agent">Recovery Agent</option>
                <option value="technician">Technician</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-5 w-5 text-slate-gray/60" />
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="space-y-1">
            <label htmlFor="salary" className={labelClass}>Monthly Salary (PKR) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="number" id="salary" name="salary" value={formData.salary || ""} onChange={handleChange} placeholder="e.g., 50000" className={inputClass} required min="0" step="100" />
            </div>
          </div>

          {/* Commission per Complaint */}
          <div className="space-y-1">
            <label htmlFor="commission_amount_per_complaint" className={labelClass}>Commission/Complaint</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-purple-500/60" />
              </div>
              <input type="number" id="commission_amount_per_complaint" name="commission_amount_per_complaint" value={formData.commission_amount_per_complaint || ""} onChange={handleChange} placeholder="e.g., 50" className={inputClass} min="0" step="10" />
            </div>
            <p className="text-xs text-slate-gray/60">Per resolved complaint</p>
          </div>
        </div>
      </div>

      {/* Section: Reference Person */}
      <div className="bg-light-sky/20 rounded-xl p-4 border border-slate-gray/10">
        <h3 className="text-sm font-semibold text-deep-ocean mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" /> Reference Person
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reference Name */}
          <div className="space-y-1">
            <label htmlFor="reference_name" className={labelClass}>Reference Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="reference_name" name="reference_name" value={formData.reference_name || ""} onChange={handleChange} placeholder="Reference person name" className={inputClass} required />
            </div>
          </div>

          {/* Reference Contact */}
          <div className="space-y-1">
            <label htmlFor="reference_contact" className={labelClass}>Reference Contact *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-gray/60" />
              </div>
              <input type="text" id="reference_contact" name="reference_contact" value={formData.reference_contact || ""} onChange={handleChange} placeholder="Reference contact number" className={inputClass} required />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Document Attachments */}
      <div className="bg-light-sky/20 rounded-xl p-4 border border-slate-gray/10">
        <h3 className="text-sm font-semibold text-deep-ocean mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Document Attachments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee Picture */}
          <div className="space-y-2">
            <label className={labelClass}>Employee Picture *</label>
            <div className="relative">
              <input type="file" id="picture" name="picture" accept="image/*" onChange={onFileChange} className="hidden" />
              <label htmlFor="picture" className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-gray/30 rounded-lg cursor-pointer hover:border-electric-blue hover:bg-light-sky/50 transition-all">
                {previews.picture ? (
                  <img src={previews.picture} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                ) : formData.picture ? (
                  <span className="text-sm text-emerald-green flex items-center gap-2"><Check className="h-4 w-4" /> File uploaded</span>
                ) : (
                  <>
                    <Image className="h-5 w-5 text-slate-gray/60" />
                    <span className="text-sm text-slate-gray">Upload employee photo</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* CNIC Image */}
          <div className="space-y-2">
            <label className={labelClass}>CNIC Attachment *</label>
            <div className="relative">
              <input type="file" id="cnic_image" name="cnic_image" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
              <label htmlFor="cnic_image" className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-gray/30 rounded-lg cursor-pointer hover:border-electric-blue hover:bg-light-sky/50 transition-all">
                {previews.cnic_image ? (
                  <img src={previews.cnic_image} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                ) : formData.cnic_image ? (
                  <span className="text-sm text-emerald-green flex items-center gap-2"><Check className="h-4 w-4" /> File uploaded</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-gray/60" />
                    <span className="text-sm text-slate-gray">Upload CNIC photo/scan</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Utility Bill */}
          <div className="space-y-2">
            <label className={labelClass}>House Utility Bill *</label>
            <div className="relative">
              <input type="file" id="utility_bill_image" name="utility_bill_image" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
              <label htmlFor="utility_bill_image" className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-gray/30 rounded-lg cursor-pointer hover:border-electric-blue hover:bg-light-sky/50 transition-all">
                {previews.utility_bill_image ? (
                  <img src={previews.utility_bill_image} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                ) : formData.utility_bill_image ? (
                  <span className="text-sm text-emerald-green flex items-center gap-2"><Check className="h-4 w-4" /> File uploaded</span>
                ) : (
                  <>
                    <FileText className="h-5 w-5 text-slate-gray/60" />
                    <span className="text-sm text-slate-gray">Upload utility bill</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Reference CNIC */}
          <div className="space-y-2">
            <label className={labelClass}>Reference CNIC Attachment *</label>
            <div className="relative">
              <input type="file" id="reference_cnic_image" name="reference_cnic_image" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
              <label htmlFor="reference_cnic_image" className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-slate-gray/30 rounded-lg cursor-pointer hover:border-electric-blue hover:bg-light-sky/50 transition-all">
                {previews.reference_cnic_image ? (
                  <img src={previews.reference_cnic_image} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                ) : formData.reference_cnic_image ? (
                  <span className="text-sm text-emerald-green flex items-center gap-2"><Check className="h-4 w-4" /> File uploaded</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-gray/60" />
                    <span className="text-sm text-slate-gray">Upload reference CNIC</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
