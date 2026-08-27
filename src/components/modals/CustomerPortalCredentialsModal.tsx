"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Copy, Key, RefreshCw, X } from "lucide-react"
import axiosInstance from "../../utils/axiosConfig.ts"
import { getToken } from "../../utils/auth.ts"
import { toast } from "../../utils/notify.ts";interface PortalCredentialsStatus {
  customer_id: string
  cnic: string
  name: string
  has_portal_credentials: boolean
  must_change_password: boolean
  portal_credentials_created_at: string | null
}

interface GeneratedCredentials {
  cnic: string
  new_password: string
  customer_name: string
}

interface CustomerPortalCredentialsModalProps {
  customerId: string | null
  onClose: () => void
}

export function CustomerPortalCredentialsModal({
  customerId,
  onClose,
}: CustomerPortalCredentialsModalProps) {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<PortalCredentialsStatus | null>(null)
  const [generated, setGenerated] = useState<GeneratedCredentials | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!customerId) return

    const fetchStatus = async () => {
      setLoading(true)
      try {
        const token = getToken()
        const response = await axiosInstance.get(`/customers/${customerId}/portal-credentials`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setStatus(response.data)
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to load credentials status")
        onClose()
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [customerId, onClose])

  const handleGenerate = async () => {
    if (!customerId) return
    setGenerating(true)
    try {
      const token = getToken()
      const response = await axiosInstance.post(
        `/customers/${customerId}/portal-credentials`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setGenerated({
        cnic: response.data.cnic,
        new_password: response.data.new_password,
        customer_name: response.data.customer_name,
      })
      setStatus((prev) =>
        prev
          ? { ...prev, has_portal_credentials: true, must_change_password: true }
          : prev
      )
      toast.success("Portal credentials generated")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to generate credentials")
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generated) return
    const text = `CNIC: ${generated.cnic}\nPassword: ${generated.new_password}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!customerId) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4">
      <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300/70">
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#1e4568] bg-[#2A5C8A]">
          <div className="flex items-center gap-2 text-white">
            <Key className="w-4 h-4" />
            <div>
              <p className="font-semibold text-sm tracking-tight">Portal Credentials</p>
              {status && <p className="text-white/70 text-xs">{status.name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-slate-100">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : generated ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Share immediately. The password will not be shown again.
                </p>
              </div>
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">CNIC (login ID)</p>
                  <p className="font-mono font-semibold text-slate-800">{generated.cnic}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Password</p>
                  <p className="font-mono font-semibold text-slate-800 tracking-wide">{generated.new_password}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
                    copied ? "bg-emerald-600" : "bg-[#2A5C8A] hover:bg-[#1e4568]"
                  }`}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {status && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-gray">Status</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      !status.has_portal_credentials
                        ? "bg-gray-100 text-gray-600"
                        : status.must_change_password
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {!status.has_portal_credentials
                      ? "Not set"
                      : status.must_change_password
                        ? "Must change on next login"
                        : "Active"}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-gray">
                Customer signs in at the portal with CNIC and this password. After a reset, they must set a new password on next login.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-9 rounded-md text-sm font-medium text-white bg-[#2A5C8A] hover:bg-[#1e4568] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {generating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {status?.has_portal_credentials ? "Reset Password" : "Generate Credentials"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
