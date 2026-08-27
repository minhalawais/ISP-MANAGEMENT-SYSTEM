"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import { createFormDataRequestConfig } from "../../utils/crudSubmit.ts"
import { isAllowedResolutionProofImage } from "../../utils/customerPortalComplaint.ts"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Phone,
  MapPin,
  ChevronRight,
  MessageSquare,
  Image,
  Star,
  Hash,
} from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"
import { PortalSegmentedControl } from "./shared/PortalSegmentedControl.tsx"
import { PortalSheet } from "./shared/PortalSheet.tsx"
import { PortalStatusPill, portalStatusAvatar } from "./shared/PortalStatusPill.tsx"
import { ComplaintFilePreview } from "../complaint/ComplaintFilePreview.tsx"

interface Complaint {
  id: string
  ticket_number: string
  description: string | null
  status: string
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
  response_due_date: string | null
  resolution_attempts: number
  satisfaction_rating: number | null
  resolution_proof: string | null
  remarks: string | null
  attachment_path: string | null
  feedback_comments: string | null
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_area: string | null
  customer_internet_id: string | null
  assigned_to?: string | null
  assigned_to_name?: string | null
  is_unassigned?: boolean
  is_assignee?: boolean
  can_update?: boolean
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
]

export function PortalComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [updating, setUpdating] = useState(false)
  const [resolutionForm, setResolutionForm] = useState({
    status: "",
    remarks: "",
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchComplaints()
  }, [filter])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = filter !== "all" ? `?status=${filter}` : ""
      const response = await axiosInstance.get(`/employee-portal/complaints${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setComplaints(response.data)
    } catch (error) {
      console.error("Failed to fetch complaints:", error)
      toast.error("Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }

  const clearProofFile = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofFile(null)
    setProofPreview(null)
  }

  const handleProofFileChange = (file: File | null) => {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    if (!file) {
      setProofFile(null)
      setProofPreview(null)
      return
    }
    if (!isAllowedResolutionProofImage(file.name)) {
      toast.error("Proof must be a PNG, JPG, JPEG, GIF, or WebP image")
      return
    }
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const handleStatusUpdate = async () => {
    if (!selectedComplaint || !resolutionForm.status) return
    setUpdating(true)
    try {
      const token = getToken()
      if (proofFile) {
        const body = new FormData()
        body.append("status", resolutionForm.status)
        if (resolutionForm.remarks) body.append("remarks", resolutionForm.remarks)
        body.append("resolution_proof", proofFile, proofFile.name)
        await axiosInstance.put(
          `/employee-portal/complaints/${selectedComplaint.id}/status`,
          body,
          createFormDataRequestConfig(token)
        )
      } else {
        await axiosInstance.put(
          `/employee-portal/complaints/${selectedComplaint.id}/status`,
          {
            status: resolutionForm.status,
            remarks: resolutionForm.remarks || null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      toast.success("Complaint updated successfully!")
      clearProofFile()
      setSelectedComplaint(null)
      fetchComplaints()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update complaint")
    } finally {
      setUpdating(false)
    }
  }

  const openComplaintModal = (complaint: Complaint) => {
    clearProofFile()
    setSelectedComplaint(complaint)
    setResolutionForm({
      status: complaint.status,
      remarks: complaint.remarks || "",
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-14 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-9 bg-gray-200 rounded-lg animate-pulse w-64" />
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const ratedComplaints = complaints.filter((c) => c.satisfaction_rating)
  const avgRating = ratedComplaints.length
    ? (ratedComplaints.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / ratedComplaints.length).toFixed(1)
    : "—"

  const statItems: PortalStatItem[] = [
    { key: "open", label: "Open", value: complaints.filter((c) => c.status === "open").length, icon: AlertCircle, tone: "danger" },
    {
      key: "in_progress",
      label: "In progress",
      value: complaints.filter((c) => c.status === "in_progress").length,
      icon: Clock,
      tone: "accent",
    },
    {
      key: "resolved",
      label: "Resolved",
      value: complaints.filter((c) => c.status === "resolved").length,
      icon: CheckCircle,
      tone: "success",
    },
    { key: "avg_rating", label: "Avg rating", value: avgRating, icon: Star, tone: "default" },
  ]

  const detailTitle = selectedComplaint ? `#${selectedComplaint.ticket_number}` : ""
  const detailSubtitle = selectedComplaint?.customer_name || undefined

  const canUpdateSelected =
    !!selectedComplaint &&
    Boolean(selectedComplaint.can_update) &&
    selectedComplaint.status !== "resolved" &&
    selectedComplaint.status !== "closed"

  const detailFooter = selectedComplaint && (
    <>
      <button
        onClick={() => setSelectedComplaint(null)}
        className="h-9 px-4 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        Close
      </button>
      {canUpdateSelected && (
        <button
          onClick={handleStatusUpdate}
          disabled={updating}
          className="h-9 px-4 rounded-lg bg-portal-primary text-sm font-medium text-white hover:bg-portal-primary-dark transition-colors disabled:opacity-50"
        >
          {updating ? "Updating..." : "Update complaint"}
        </button>
      )}
    </>
  )

  const detailBody = selectedComplaint && (
    <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PortalStatusPill status={selectedComplaint.status} />
              {selectedComplaint.is_assignee ? (
                <span className="rounded-full bg-electric-blue/10 px-2 py-0.5 text-[10px] font-medium text-electric-blue">
                  Assigned to you
                </span>
              ) : selectedComplaint.is_unassigned ? (
                <span className="rounded-full bg-coral-red/10 px-2 py-0.5 text-[10px] font-medium text-coral-red">
                  Unassigned
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  View only
                </span>
              )}
              {selectedComplaint.satisfaction_rating && (
                <div className="ml-auto flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < selectedComplaint.satisfaction_rating! ? "text-amber-500 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500">Assignee</p>
                <p className="font-medium text-gray-900">
                  {selectedComplaint.is_unassigned
                    ? "Unassigned"
                    : selectedComplaint.assigned_to_name || (selectedComplaint.is_assignee ? "You" : "Another employee")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString() : "—"}
                </p>
              </div>
              {selectedComplaint.resolved_at && (
                <div>
                  <p className="text-gray-500">Resolved</p>
                  <p className="font-medium text-emerald-600">
                    {new Date(selectedComplaint.resolved_at).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Attempts</p>
                <p className="font-medium text-gray-900">{selectedComplaint.resolution_attempts}</p>
              </div>
              {selectedComplaint.response_due_date && (
                <div>
                  <p className="text-gray-500">Due by</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedComplaint.response_due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {selectedComplaint.description && (
              <div className="border-t border-gray-100 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
                <p className="text-gray-700">{selectedComplaint.description}</p>
              </div>
            )}

            {selectedComplaint.customer_name && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <User className="w-3.5 h-3.5" /> Name
                  </span>
                  {selectedComplaint.customer_id ? (
                    <Link
                      to={`/employee-portal/customers/${selectedComplaint.customer_id}`}
                      className="font-medium text-electric-blue hover:underline"
                    >
                      {selectedComplaint.customer_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{selectedComplaint.customer_name}</span>
                  )}
                </div>
                {selectedComplaint.customer_internet_id && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Internet ID</span>
                    {selectedComplaint.customer_id ? (
                      <Link
                        to={`/employee-portal/customers/${selectedComplaint.customer_id}`}
                        className="font-medium text-electric-blue hover:underline"
                      >
                        {selectedComplaint.customer_internet_id}
                      </Link>
                    ) : (
                      <span className="font-medium text-electric-blue">{selectedComplaint.customer_internet_id}</span>
                    )}
                  </div>
                )}
                {selectedComplaint.customer_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone</span>
                    <a
                      href={`tel:${selectedComplaint.customer_phone}`}
                      className="flex items-center gap-1 font-medium text-electric-blue"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedComplaint.customer_phone}
                    </a>
                  </div>
                )}
                {selectedComplaint.customer_area && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-3.5 h-3.5" /> Area
                    </span>
                    <span className="font-medium">{selectedComplaint.customer_area}</span>
                  </div>
                )}
                {selectedComplaint.customer_address && (
                  <div>
                    <span className="text-gray-600">Address</span>
                    <p className="mt-1 font-medium">{selectedComplaint.customer_address}</p>
                  </div>
                )}
              </div>
            )}

            {selectedComplaint.remarks && (
              <div className="border-t border-gray-100 pt-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  <MessageSquare className="w-3.5 h-3.5" /> Resolution remarks
                </p>
                <p className="text-gray-700">{selectedComplaint.remarks}</p>
              </div>
            )}

            {selectedComplaint.feedback_comments && (
              <div className="border-t border-gray-100 pt-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <MessageSquare className="w-3.5 h-3.5" /> Customer feedback
                </p>
                <p className="text-gray-700">{selectedComplaint.feedback_comments}</p>
              </div>
            )}

            {(selectedComplaint.attachment_path || selectedComplaint.resolution_proof) && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments</p>
                {selectedComplaint.attachment_path && (
                  <ComplaintFilePreview
                    label="Complaint attachment"
                    filePath={selectedComplaint.attachment_path}
                    fetchUrl={`/employee-portal/complaints/${selectedComplaint.id}/attachment`}
                    actionClassName="text-electric-blue"
                  />
                )}
                {selectedComplaint.resolution_proof && (
                  <ComplaintFilePreview
                    label="Resolution proof"
                    filePath={selectedComplaint.resolution_proof}
                    fetchUrl={`/employee-portal/complaints/${selectedComplaint.id}/resolution-proof`}
                    actionClassName="text-electric-blue"
                  />
                )}
              </div>
            )}

            {selectedComplaint.status !== "resolved" &&
              selectedComplaint.status !== "closed" &&
              !canUpdateSelected && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {selectedComplaint.is_unassigned
                    ? "This ticket is unassigned. Only the company owner can assign it."
                    : "You can view this ticket, but only the assigned technician can update it."}
                </div>
              )}

            {canUpdateSelected && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Update complaint</p>

                <div>
                  <label className="text-xs font-medium text-gray-600">Status</label>
                  <select
                    value={resolutionForm.status}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
                    className="mt-1 w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {resolutionForm.status === "resolved" && (
                  <>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Resolution remarks
                      </label>
                      <textarea
                        value={resolutionForm.remarks}
                        onChange={(e) => setResolutionForm({ ...resolutionForm, remarks: e.target.value })}
                        placeholder="Describe how the issue was resolved..."
                        rows={3}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent resize-none"
                      />
                    </div>

                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <Image className="w-3.5 h-3.5" />
                        Resolution proof
                      </p>
                      <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center hover:bg-gray-100">
                        {proofPreview ? (
                          <img
                            src={proofPreview}
                            alt="Resolution proof preview"
                            className="mb-2 max-h-32 rounded-md object-contain"
                          />
                        ) : (
                          <Image className="mb-1 h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-600">
                          {proofFile ? proofFile.name : "Upload image (PNG, JPG, GIF, WebP)"}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          className="sr-only"
                          aria-label="Upload resolution proof"
                          onChange={(e) => handleProofFileChange(e.target.files?.[0] || null)}
                        />
                      </label>
                      {proofFile && (
                        <button
                          type="button"
                          onClick={clearProofFile}
                          className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
    )

  return (
    <div className="lg:grid lg:grid-cols-[360px_1fr] lg:items-start lg:gap-4">
      <div className="space-y-3">
        <PortalStatStrip items={statItems} columnsMobile={2} columnsDesktop={2} />

        <PortalSegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

        {complaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No complaints found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
            {complaints.map((complaint) => {
              const avatar = portalStatusAvatar(complaint.status)
              const isSelected = selectedComplaint?.id === complaint.id

              return (
                <div
                  key={complaint.id}
                  onClick={() => openComplaintModal(complaint)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-portal-tint border-l-2 border-l-electric-blue" : "hover:bg-gray-50 active:bg-gray-100 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatar.bg}`}>
                    <AlertCircle className={`w-4 h-4 ${avatar.text}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-electric-blue">
                        <Hash className="w-3 h-3" />
                        {complaint.ticket_number}
                      </span>
                      {complaint.is_assignee && (
                        <span className="rounded bg-electric-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-electric-blue">
                          Yours
                        </span>
                      )}
                      {!complaint.is_assignee && !complaint.is_unassigned && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          View
                        </span>
                      )}
                      {complaint.satisfaction_rating && (
                        <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                          {[...Array(complaint.satisfaction_rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-gray-700">
                      {complaint.customer_name || complaint.description || "No description"}
                      {complaint.customer_area ? ` · ${complaint.customer_area}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : "—"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 lg:hidden" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-120px)] lg:flex-col lg:rounded-xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm">
        {selectedComplaint ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-gray-900">{detailTitle}</h3>
                {detailSubtitle && <p className="truncate text-xs text-gray-500">{detailSubtitle}</p>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{detailBody}</div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
              {detailFooter}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
            <AlertCircle className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Select a complaint to view details</p>
          </div>
        )}
      </div>

      <PortalSheet
        open={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={detailTitle}
        subtitle={detailSubtitle}
        footer={detailFooter}
        hideOnDesktop
      >
        {detailBody}
      </PortalSheet>
    </div>
  )
}
