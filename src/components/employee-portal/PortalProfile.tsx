"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  Shield,
  Edit3,
  Save,
  X,
  Image,
  FileText,
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
  salary: number
  current_balance: number
  paid_amount: number
  picture: string | null
  cnic_image: string | null
  utility_bill_image: string | null
  reference_name: string | null
  reference_contact: string | null
  reference_cnic_image: string | null
  created_at: string | null
}

interface PortalProfileProps {
  onProfileUpdate?: () => void
}

// Helper to construct full file URL
const getFileUrl = (path: string | null) => {
  if (!path) return "";
  const baseURL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
  // Remove leading slash if present in path to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseURL}/${cleanPath}`;
};

export function PortalProfile({ onProfileUpdate }: PortalProfileProps) {
  // ... existing state ...
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    contact_number: "",
    emergency_contact: "",
    house_address: "",
  })
  const [saving, setSaving] = useState(false)

  // ... fetchProfile and handleSave (unchanged) ...
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
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#89A8B2] to-[#6B8A94] rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold overflow-hidden">
            {profile.picture ? (
              <img
                src={getFileUrl(profile.picture)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerText = profile.first_name?.charAt(0) || "E";
                }}
              />
            ) : (
              profile.first_name?.charAt(0) || "E"
            )}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-white/80 capitalize">{profile.role?.replace("_", " ")}</p>
            <p className="text-sm text-white/70 mt-1">@{profile.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${profile.is_active ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
                }`}
            >
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Toggle */}
      <div className="flex justify-end">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#89A8B2] text-white rounded-lg hover:bg-[#7896a0] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#89A8B2] text-[#89A8B2] rounded-lg hover:bg-[#89A8B2]/10"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#89A8B2]" />
            Personal Information
          </h3>
          <div className="space-y-4">
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent"
                  />
                ) : (
                  profile.contact_number || "-"
                )
              }
            />
            <InfoRow icon={Shield} label="CNIC" value={profile.cnic || "-"} />
            <InfoRow
              icon={Phone}
              label="Emergency Contact"
              value={
                isEditing ? (
                  <input
                    type="text"
                    value={editData.emergency_contact}
                    onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent"
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
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent resize-none"
                  />
                ) : (
                  profile.house_address || "-"
                )
              }
            />
          </div>
        </div>

        {/* Work Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#89A8B2]" />
            Work Information
          </h3>
          <div className="space-y-4">
            <InfoRow
              icon={Calendar}
              label="Joining Date"
              value={profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : "-"}
            />
            <InfoRow
              icon={CreditCard}
              label="Monthly Salary"
              value={`PKR ${profile.salary?.toLocaleString() || 0}`}
            />
            <InfoRow
              icon={CreditCard}
              label="Current Balance"
              value={`PKR ${profile.current_balance?.toLocaleString() || 0}`}
            />
            <InfoRow
              icon={CreditCard}
              label="Total Paid"
              value={`PKR ${profile.paid_amount?.toLocaleString() || 0}`}
            />
          </div>
        </div>

        {/* Reference Information */}
        {(profile.reference_name || profile.reference_contact) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#89A8B2]" />
              Reference
            </h3>
            <div className="space-y-4">
              <InfoRow icon={User} label="Name" value={profile.reference_name || "-"} />
              <InfoRow icon={Phone} label="Contact" value={profile.reference_contact || "-"} />
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#89A8B2]" />
            Documents
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <DocumentCard label="CNIC" documentPath={profile.cnic_image} />
            <DocumentCard label="Utility Bill" documentPath={profile.utility_bill_image} />
            <DocumentCard label="Reference CNIC" documentPath={profile.reference_cnic_image} />
            <DocumentCard label="Profile Picture" documentPath={profile.picture} />
          </div>
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
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  )
}

function DocumentCard({ label, documentPath }: { label: string; documentPath: string | null }) {
  const hasDocument = !!documentPath;
  const fileUrl = getFileUrl(documentPath);

  return (
    <a
      href={hasDocument ? fileUrl : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-3 rounded-lg border transition-colors ${hasDocument
          ? "border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer"
          : "border-gray-200 bg-gray-50 cursor-default"
        }`}
      onClick={(e) => !hasDocument && e.preventDefault()}
    >
      <div className="flex items-center gap-2">
        <Image className={`w-5 h-5 ${hasDocument ? "text-green-600" : "text-gray-400"}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <p className={`text-xs mt-1 ${hasDocument ? "text-green-600" : "text-gray-500"}`}>
        {hasDocument ? "View Document" : "Not uploaded"}
      </p>
    </a>
  )
}
