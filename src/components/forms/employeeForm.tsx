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
} from "lucide-react"
import { debounce } from "lodash"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"

interface EmployeeFormProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  isEditing: boolean
}

export function EmployeeForm({ formData, handleInputChange, isEditing }: EmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle")
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle")
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "none">("none")

  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+{}[]|:;<>,.?"

    const allChars = lowercase + uppercase + numbers + symbols
    let password = ""

    // Ensure at least one of each character type
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    password += symbols.charAt(Math.floor(Math.random() * symbols.length))

    // Fill the rest randomly
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length)
      password += allChars[randomIndex]
    }

    // Shuffle the password
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")

    handleInputChange({
      target: {
        name: "password",
        value: password,
      },
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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setUsernameStatus(response.data.available ? "valid" : "invalid")
      } catch (error) {
        console.error("Error verifying username:", error)
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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setEmailStatus(response.data.available ? "valid" : "invalid")
      } catch (error) {
        console.error("Error verifying email:", error)
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

    // Check password strength
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleInputChange(e)
    if (e.target.name === "username" && !isEditing) {
      verifyUsername(e.target.value)
    } else if (e.target.name === "email" && !isEditing) {
      verifyEmail(e.target.value)
    } else if (e.target.name === "password") {
      checkPasswordStrength(e.target.value)
    }
  }

  const renderStatusIcon = (status: "idle" | "loading" | "valid" | "invalid") => {
    switch (status) {
      case "loading":
        return <Loader2 className="animate-spin text-golden-amber h-4 w-4" />
      case "valid":
        return <Check className="text-emerald-green h-4 w-4" />
      case "invalid":
        return <X className="text-coral-red h-4 w-4" />
      default:
        return null
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-coral-red"
      case "medium":
        return "bg-golden-amber"
      case "strong":
        return "bg-emerald-green"
      default:
        return "bg-slate-gray/20"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-2">
          <label htmlFor="first_name" className="block text-sm font-medium text-deep-ocean">
            First Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name || ""}
              onChange={handleChange}
              placeholder="Enter first name"
              className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
              required
            />
          </div>
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label htmlFor="last_name" className="block text-sm font-medium text-deep-ocean">
            Last Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name || ""}
              onChange={handleChange}
              placeholder="Enter last name"
              className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
              required
            />
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-deep-ocean">
          Username
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username || ""}
            onChange={handleChange}
            placeholder="Enter username"
            className={`pl-10 pr-10 w-full py-2.5 bg-light-sky/30 border rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50 ${
              usernameStatus === "invalid"
                ? "border-coral-red"
                : usernameStatus === "valid"
                  ? "border-emerald-green"
                  : "border-slate-gray/20"
            }`}
            required
            disabled={isEditing}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderStatusIcon(usernameStatus)}</div>
        </div>
        {usernameStatus === "invalid" && <p className="text-coral-red text-xs mt-1">Username is already taken</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-deep-ocean">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AtSign className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="Enter email address"
            className={`pl-10 pr-10 w-full py-2.5 bg-light-sky/30 border rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50 ${
              emailStatus === "invalid"
                ? "border-coral-red"
                : emailStatus === "valid"
                  ? "border-emerald-green"
                  : "border-slate-gray/20"
            }`}
            required
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderStatusIcon(emailStatus)}</div>
        </div>
        {emailStatus === "invalid" && <p className="text-coral-red text-xs mt-1">Email is already in use</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Number */}
        <div className="space-y-2">
          <label htmlFor="contact_number" className="block text-sm font-medium text-deep-ocean">
            Contact Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="contact_number"
              name="contact_number"
              value={formData.contact_number || ""}
              onChange={handleChange}
              placeholder="Enter contact number"
              className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
            />
          </div>
        </div>

        {/* CNIC */}
        <div className="space-y-2">
          <label htmlFor="cnic" className="block text-sm font-medium text-deep-ocean">
            CNIC
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-slate-gray/60" />
            </div>
            <input
              type="text"
              id="cnic"
              name="cnic"
              value={formData.cnic || ""}
              onChange={handleChange}
              placeholder="e.g., 42201-1234567-1"
              className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-deep-ocean">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-gray/60" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password || ""}
            onChange={handleChange}
            placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
            className="pl-10 pr-24 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 placeholder:text-slate-gray/50"
            required={!isEditing}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={generatePassword}
              className="p-1.5 text-slate-gray hover:text-electric-blue transition-colors bg-light-sky rounded-md"
              title="Generate Password"
            >
              <Key className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-slate-gray hover:text-electric-blue transition-colors bg-light-sky rounded-md"
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        {passwordStrength !== "none" && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-gray">Password strength:</span>
              <span
                className={`text-xs font-medium ${
                  passwordStrength === "weak"
                    ? "text-coral-red"
                    : passwordStrength === "medium"
                      ? "text-golden-amber"
                      : "text-emerald-green"
                }`}
              >
                {passwordStrength === "weak" ? "Weak" : passwordStrength === "medium" ? "Medium" : "Strong"}
              </span>
            </div>
            <div className="w-full bg-slate-gray/10 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getPasswordStrengthColor()}`}
                style={{
                  width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-deep-ocean">
          Role
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserCog className="h-5 w-5 text-slate-gray/60" />
          </div>
          <select
            id="role"
            name="role"
            value={formData.role || ""}
            onChange={handleChange}
            className="pl-10 w-full py-2.5 bg-light-sky/30 border border-slate-gray/20 rounded-lg focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200 appearance-none"
            required
          >
            <option value="">Select Role</option>
            <option value="auditor">Auditor</option>
            <option value="employee">Employee</option>
            <option value="company_owner">Admin</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-5 w-5 text-slate-gray/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
