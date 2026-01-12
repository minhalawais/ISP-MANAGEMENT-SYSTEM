"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CRUDPage } from "../../components/crudPage.tsx"
import { EmployeeForm } from "../../components/forms/employeeForm.tsx"
import { useNavigate } from "react-router-dom"
import { Eye, Key, X, RefreshCw, Copy, Check } from "lucide-react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"

interface Employee {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  contact_number: string
  cnic: string
  current_balance?: number
  emergency_contact?: string
  house_address?: string
  cnic_image?: string
  picture?: string
  utility_bill_image?: string
  joining_date?: string
  salary?: number
  reference_name?: string
  reference_contact?: string
  reference_cnic_image?: string
}

interface CredentialsData {
  id: string
  username: string
  email: string
  has_credentials: boolean
  first_name: string
  last_name: string
}

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate()
  const [credentialsModal, setCredentialsModal] = useState<{ isOpen: boolean; employeeId: string | null }>({
    isOpen: false,
    employeeId: null,
  })
  const [credentials, setCredentials] = useState<CredentialsData | null>(null)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [formData, setFormData] = useState({ username: "", email: "", password: "" })
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  useEffect(() => {
    document.title = "MBA NET - Employee Management"
  }, [])

  const openCredentialsModal = async (employeeId: string) => {
    setCredentialsModal({ isOpen: true, employeeId })
    setCredentialsLoading(true)
    setNewPassword(null)
    try {
      const token = getToken()
      const response = await axiosInstance.get(`/employees/${employeeId}/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCredentials(response.data)
      setFormData({
        username: response.data.username || "",
        email: response.data.email || "",
        password: "",
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to fetch credentials")
      setCredentialsModal({ isOpen: false, employeeId: null })
    } finally {
      setCredentialsLoading(false)
    }
  }

  const handleSaveCredentials = async (generatePassword: boolean = false) => {
    if (!credentialsModal.employeeId) return
    setSaving(true)
    try {
      const token = getToken()
      const payload: any = {
        username: formData.username,
        email: formData.email,
      }
      
      if (generatePassword) {
        payload.generate_password = true
      } else if (formData.password) {
        payload.password = formData.password
      }

      const response = await axiosInstance.put(
        `/employees/${credentialsModal.employeeId}/credentials`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast.success("Credentials updated successfully!")
      
      if (response.data.password) {
        setNewPassword(response.data.password)
      } else {
        setCredentialsModal({ isOpen: false, employeeId: null })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update credentials")
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        header: "Name",
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      },
      {
        header: "Username",
        accessorKey: "username",
      },
      {
        header: "Contact",
        accessorKey: "contact_number",
      },
      {
        header: "CNIC",
        accessorKey: "cnic",
      },
      {
        header: "Salary",
        accessorKey: "salary",
        cell: (info) => info.getValue() ? `PKR ${Number(info.getValue()).toLocaleString()}` : '-',
      },
      {
        header: "Balance",
        accessorKey: "current_balance",
        cell: (info) => {
          const value = info.getValue() as number
          if (value === undefined || value === null) return '-'
          return (
            <span className={value >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
              PKR {Number(value).toLocaleString()}
            </span>
          )
        },
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: (info) => (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-violet-100 text-violet-800 border border-violet-200">
            {(info.getValue() as string)?.replace('_', ' ').toUpperCase()}
          </span>
        ),
      },
      {
        header: "Quick Actions",
        id: "quick_actions",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/employees/${info.row.original.id}`)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#89A8B2] to-[#B3C8CF] text-white rounded-lg hover:from-[#7a9aa4] hover:to-[#a3b8bf] transition-all duration-200 text-xs font-medium shadow-sm"
              title="View Profile"
            >
              <Eye className="h-3.5 w-3.5" />
              Profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openCredentialsModal(info.row.original.id)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-xs font-medium shadow-sm"
              title="Manage Credentials"
            >
              <Key className="h-3.5 w-3.5" />
              Credentials
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  )

  return (
    <>
      <CRUDPage<Employee>
        title="Employee"
        endpoint="employees"
        columns={columns}
        FormComponent={EmployeeForm}
        useFormData={true}
        validateBeforeSubmit={(formData) => {
          if (!formData.username) return "Username is required"
          if (!formData.first_name || !formData.last_name) return "Name is required"
          if (!formData.contact_number) return "Contact number is required"
          if (!formData.emergency_contact) return "Emergency contact is required"
          if (!formData.cnic) return "CNIC is required"
          if (!formData.house_address) return "House address is required"
          if (!formData.salary) return "Salary is required"
          if (!formData.reference_name) return "Reference name is required"
          if (!formData.reference_contact) return "Reference contact is required"
          if (!formData.role) return "Role is required"
          return null
        }}
      />

      {/* Credentials Modal */}
      {credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900">Manage Credentials</h3>
              </div>
              <button
                onClick={() => setCredentialsModal({ isOpen: false, employeeId: null })}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {credentialsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : newPassword ? (
                // Show generated password
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      New credentials generated successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      Please copy these credentials now. The password cannot be viewed again.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Username</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={formData.username}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(formData.username, "username")}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          {copied === "username" ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={newPassword}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-amber-50 text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(newPassword, "password")}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          {copied === "password" ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit form
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{credentials?.first_name} {credentials?.last_name}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">New Password (optional)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave empty to keep current"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              {newPassword ? (
                <button
                  onClick={() => setCredentialsModal({ isOpen: false, employeeId: null })}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCredentialsModal({ isOpen: false, employeeId: null })}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveCredentials(true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                    Generate Password
                  </button>
                  <button
                    onClick={() => handleSaveCredentials(false)}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmployeeManagement
