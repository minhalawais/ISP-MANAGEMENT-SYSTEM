"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Edit3,
  Save,
  X,
} from "lucide-react"

interface ProfileData {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  contact_number: string
  cnic: string
  role: string
  is_active: boolean
  emergency_contact: string
  house_address: string
  joining_date: string | null
  picture: string | null
  created_at: string | null
}

interface PortalProfileProps {
  onProfileUpdate?: () => void
}

const getFileUrl = (path: string | null) => {
  if (!path) return ""
  const baseURL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return `${baseURL}/${cleanPath}`
}

export function PortalProfile({ onProfileUpdate }: PortalProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    contact_number: "",
    emergency_contact: "",
    house_address: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/employee-portal/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(response.data)
      setEditData({
        contact_number: response.data.contact_number || "",
        emergency_contact: response.data.emergency_contact || "",
        house_address: response.data.house_address || "",
      })
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getToken()
      await axiosInstance.put("/employee-portal/profile", editData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Profile updated successfully")
      setIsEditing(false)
      fetchProfile()
      onProfileUpdate?.()
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-72 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-portal-accent to-portal-primary rounded-xl p-4 lg:p-5 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-xl font-bold overflow-hidden">
              {profile.picture ? (
                <img
                  src={getFileUrl(profile.picture)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                    ;(e.target as HTMLImageElement).parentElement!.innerText = profile.first_name?.charAt(0) || "E"
                  }}
                />
              ) : (
                profile.first_name?.charAt(0) || "E"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold truncate">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-sm text-white/80 capitalize truncate">{profile.role?.replace("_", " ")}</p>
            </div>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                profile.is_active ? "bg-white/20 text-white" : "bg-red-500/30 text-white"
              }`}
            >
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-3 bg-portal-primary text-white rounded-lg text-sm font-medium hover:bg-portal-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 h-9 px-3 border border-portal-primary text-portal-primary rounded-lg text-sm font-medium hover:bg-portal-tint"
            >
              <Edit3 className="w-4 h-4" />
              Edit profile
            </button>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-portal-tint">
                <User className="h-3.5 w-3.5 text-portal-primary" />
              </span>
              Personal information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <InfoRow icon={Mail} label="Email" value={profile.email} />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={
                isEditing ? (
                  <input
                    type="text"
                    value={editData.contact_number}
                    onChange={(e) => setEditData({ ...editData, contact_number: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
                  />
                ) : (
                  profile.contact_number || "-"
                )
              }
            />
            <InfoRow icon={Shield} label="CNIC" value={profile.cnic || "-"} />
            <InfoRow
              icon={Phone}
              label="Emergency contact"
              value={
                isEditing ? (
                  <input
                    type="text"
                    value={editData.emergency_contact}
                    onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
                  />
                ) : (
                  profile.emergency_contact || "-"
                )
              }
            />
            <InfoRow
              icon={MapPin}
              label="Address"
              value={
                isEditing ? (
                  <textarea
                    value={editData.house_address}
                    onChange={(e) => setEditData({ ...editData, house_address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent resize-none"
                  />
                ) : (
                  profile.house_address || "-"
                )
              }
            />
          </div>

          <div className="px-4 py-3 border-y border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-portal-tint">
                <Briefcase className="h-3.5 w-3.5 text-portal-primary" />
              </span>
              Work information
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <InfoRow
              icon={Calendar}
              label="Joining date"
              value={profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : "-"}
            />
          </div>
        </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  )
}
