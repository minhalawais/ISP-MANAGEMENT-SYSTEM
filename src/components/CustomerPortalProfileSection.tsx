"use client"

import { useState } from "react"
import {
  User,
  Mail,
  Phone,
  IdCard,
  Wifi,
  MapPin,
  Calendar,
  Pencil,
  X,
  Save,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react"
import customerPortalAxios from "../utils/customerPortalAxios.ts"
import { setCustomerPortalToken } from "../utils/customerPortalAuth.ts"
import { LocationPicker } from "./LocationPicker.tsx"

export interface PortalCustomerProfile {
  id: string
  name: string
  email: string
  internet_id: string
  phone_1: string
  phone_2: string | null
  cnic: string
  installation_address: string
  gps_coordinates?: string | null
  area: string | null
  sub_zone: string | null
  isp: string | null
  connection_type: string | null
  installation_date: string | null
  is_active: boolean
  recharge_date: string | null
}

interface CustomerPortalProfileSectionProps {
  customer: PortalCustomerProfile
  onSaved: (payload: any) => void
}

const fieldClass =
  "h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-portal-accent focus:outline-none focus:ring-2 focus:ring-portal-accent/40"

export function CustomerPortalProfileSection({ customer, onSaved }: CustomerPortalProfileSectionProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [email, setEmail] = useState(customer.email || "")
  const [phone1, setPhone1] = useState(customer.phone_1 || "")
  const [phone2, setPhone2] = useState(customer.phone_2 || "")
  const [address, setAddress] = useState(customer.installation_address || "")
  const [gps, setGps] = useState(customer.gps_coordinates || "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const startEdit = () => {
    setEmail(customer.email || "")
    setPhone1(customer.phone_1 || "")
    setPhone2(customer.phone_2 || "")
    setAddress(customer.installation_address || "")
    setGps(customer.gps_coordinates || "")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
    setSuccess(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError(null)
    setSuccess(null)
  }

  const saveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await customerPortalAxios.put("/public/customer/profile", {
        email: email.trim(),
        phone_1: phone1.trim(),
        phone_2: phone2.trim() || null,
        installation_address: address.trim(),
        gps_coordinates: gps.trim() || null,
      })
      const { message, ...payload } = response.data
      onSaved(payload)
      setSuccess(message || "Profile updated")
      setEditing(false)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    setPasswordSaving(true)
    setError(null)
    setSuccess(null)
    try {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match")
        return
      }
      const response = await customerPortalAxios.post("/public/customer/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      if (response.data.token) {
        setCustomerPortalToken(response.data.token)
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSuccess(response.data.message || "Password updated")
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update password")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-portal-tint px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
              <User className="h-4 w-4 text-portal-primary" />
              Personal information
            </h3>
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-slate-gray hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
          <div className="space-y-3 p-4 text-sm">
            {success && (
              <p className="rounded-lg bg-emerald-green/5 px-3 py-2 text-xs text-emerald-green">{success}</p>
            )}
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="text-slate-gray">Internet ID</span>
              <span className="font-semibold text-portal-primary">{customer.internet_id}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="flex items-center gap-1.5 text-slate-gray">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <span className="font-medium text-gray-900">{customer.email || "—"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="flex items-center gap-1.5 text-slate-gray">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </span>
              <span className="font-medium text-gray-900">{customer.phone_1 || "—"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="flex items-center gap-1.5 text-slate-gray">
                <Phone className="h-3.5 w-3.5" /> Mobile
              </span>
              <span className="font-medium text-gray-900">{customer.phone_2 || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-1.5 text-slate-gray">
                <IdCard className="h-3.5 w-3.5" /> CNIC
              </span>
              <span className="font-mono font-medium text-gray-900">{customer.cnic}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-portal-tint px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
              <Wifi className="h-4 w-4 text-portal-primary" />
              Connection details
            </h3>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="border-b border-gray-50 py-1.5">
              <span className="mb-1 flex items-center gap-1.5 text-slate-gray">
                <MapPin className="h-3.5 w-3.5" /> Address
              </span>
              <p className="font-medium text-gray-900">{customer.installation_address || "—"}</p>
              {customer.gps_coordinates && (
                <p className="mt-1 text-xs text-slate-gray">{customer.gps_coordinates}</p>
              )}
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="text-slate-gray">Area</span>
              <span className="font-medium text-gray-900">
                {customer.area}
                {customer.sub_zone ? ` / ${customer.sub_zone}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="text-slate-gray">ISP</span>
              <span className="font-medium text-gray-900">{customer.isp || "—"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
              <span className="text-slate-gray">Connection type</span>
              <span className="font-medium capitalize text-gray-900">
                {customer.connection_type || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-1.5 text-slate-gray">
                <Calendar className="h-3.5 w-3.5" /> Installation date
              </span>
              <span className="font-medium text-gray-900">
                {customer.installation_date
                  ? new Date(customer.installation_date).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-portal-tint px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-deep-ocean">
          <Pencil className="h-4 w-4 text-portal-primary" />
          Edit profile
        </h3>
        <button
          type="button"
          onClick={cancelEdit}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-slate-gray hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>

      <div className="space-y-5 p-4">
        {error && <p className="rounded-lg bg-coral-red/5 px-3 py-2 text-xs text-coral-red">{error}</p>}
        {success && (
          <p className="rounded-lg bg-emerald-green/5 px-3 py-2 text-xs text-emerald-green">{success}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-gray">Internet ID</label>
            <input
              value={customer.internet_id}
              disabled
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-gray">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-gray">CNIC</label>
            <input
              value={customer.cnic}
              disabled
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-gray">WhatsApp number</label>
            <input
              type="tel"
              value={phone1}
              onChange={(e) => setPhone1(e.target.value)}
              placeholder="03XXXXXXXXX"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-gray">Mobile number</label>
            <input
              type="tel"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder="Optional"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-gray">Location</p>
          <LocationPicker
            address={address}
            gpsCoordinates={gps}
            onAddressChange={setAddress}
            onGpsChange={setGps}
            disabled={saving}
          />
          <p className="mt-2 text-[11px] text-gray-400">
            Area and ISP stay as assigned by your provider.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-portal-primary px-4 text-sm font-medium text-white hover:bg-portal-primary-dark disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-gray">
            <Lock className="h-3.5 w-3.5" />
            Change password
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-gray">Current password</label>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${fieldClass} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2 top-7 text-gray-400"
                aria-label="Toggle current password"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-gray">New password</label>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${fieldClass} pr-9`}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-7 text-gray-400"
                aria-label="Toggle new password"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-gray">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={savePassword}
              disabled={passwordSaving || !currentPassword || !newPassword}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-slate-gray hover:bg-gray-50 disabled:opacity-50"
            >
              <Lock className="h-3.5 w-3.5" />
              {passwordSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
