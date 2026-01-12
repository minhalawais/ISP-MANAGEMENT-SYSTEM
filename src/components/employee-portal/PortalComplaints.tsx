"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  Filter,
  FileText,
  MessageSquare,
  Image,
  Star,
  Hash,
} from "lucide-react"

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
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  open: { color: "text-red-700", bg: "bg-red-100", icon: AlertCircle },
  in_progress: { color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock },
  resolved: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  closed: { color: "text-gray-700", bg: "bg-gray-100", icon: X },
}

export function PortalComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [updating, setUpdating] = useState(false)
  const [resolutionForm, setResolutionForm] = useState({
    status: "",
    remarks: "",
    resolution_proof: "",
  })

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

  const handleStatusUpdate = async () => {
    if (!selectedComplaint || !resolutionForm.status) return
    setUpdating(true)
    try {
      const token = getToken()
      await axiosInstance.put(
        `/employee-portal/complaints/${selectedComplaint.id}/status`,
        {
          status: resolutionForm.status,
          remarks: resolutionForm.remarks || null,
          resolution_proof: resolutionForm.resolution_proof || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Complaint updated successfully!")
      setSelectedComplaint(null)
      fetchComplaints()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update complaint")
    } finally {
      setUpdating(false)
    }
  }

  const openComplaintModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setResolutionForm({
      status: complaint.status,
      remarks: complaint.remarks || "",
      resolution_proof: complaint.resolution_proof || "",
    })
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
        {["all", "open", "in_progress", "resolved"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === status
                ? "bg-[#89A8B2] text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {status === "all" ? "All Complaints" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {complaints.filter((c) => c.status === "open").length}
              </p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {complaints.filter((c) => c.status === "in_progress").length}
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {complaints.filter((c) => c.status === "resolved").length}
              </p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {complaints.length > 0 
                  ? (complaints.filter(c => c.satisfaction_rating).reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / 
                     complaints.filter(c => c.satisfaction_rating).length || 0).toFixed(1)
                  : "—"
                }
              </p>
              <p className="text-xs text-gray-500">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      {complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No complaints found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {complaints.map((complaint) => {
            const status = statusConfig[complaint.status] || statusConfig.open
            const StatusIcon = status.icon

            return (
              <div
                key={complaint.id}
                onClick={() => openComplaintModal(complaint)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#89A8B2] flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {complaint.ticket_number}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {complaint.status.replace("_", " ")}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {complaint.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{complaint.description}</p>
                )}

                {complaint.customer_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>{complaint.customer_name}</span>
                    {complaint.customer_internet_id && (
                      <span className="text-xs text-[#89A8B2]">({complaint.customer_internet_id})</span>
                    )}
                  </div>
                )}

                {complaint.customer_area && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{complaint.customer_area}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                  {complaint.satisfaction_rating && (
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      {[...Array(complaint.satisfaction_rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#89A8B2] to-[#6B8A94]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Complaint Details</h3>
                  <p className="text-sm text-white/80">#{selectedComplaint.ticket_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
              {/* Complaint Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusConfig[selectedComplaint.status]?.bg} ${statusConfig[selectedComplaint.status]?.color}`}>
                    {selectedComplaint.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  {selectedComplaint.satisfaction_rating && (
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < selectedComplaint.satisfaction_rating! ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                  {selectedComplaint.resolved_at && (
                    <div>
                      <p className="text-gray-500">Resolved</p>
                      <p className="font-medium text-green-600">
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
                      <p className="text-gray-500">Due By</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedComplaint.response_due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedComplaint.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-700">{selectedComplaint.description}</p>
                </div>
              )}

              {/* Customer Info */}
              {selectedComplaint.customer_name && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{selectedComplaint.customer_name}</span>
                    </div>
                    {selectedComplaint.customer_internet_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Internet ID</span>
                        <span className="font-medium text-[#89A8B2]">{selectedComplaint.customer_internet_id}</span>
                      </div>
                    )}
                    {selectedComplaint.customer_phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phone</span>
                        <a href={`tel:${selectedComplaint.customer_phone}`} className="font-medium text-[#89A8B2] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedComplaint.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedComplaint.customer_area && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area</span>
                        <span className="font-medium">{selectedComplaint.customer_area}</span>
                      </div>
                    )}
                    {selectedComplaint.customer_address && (
                      <div>
                        <span className="text-gray-600">Address</span>
                        <p className="font-medium mt-1">{selectedComplaint.customer_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remarks (if resolved) */}
              {selectedComplaint.remarks && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    Resolution Remarks
                  </h4>
                  <p className="text-sm text-gray-700">{selectedComplaint.remarks}</p>
                </div>
              )}

              {/* Feedback */}
              {selectedComplaint.feedback_comments && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Customer Feedback
                  </h4>
                  <p className="text-sm text-gray-700">{selectedComplaint.feedback_comments}</p>
                </div>
              )}

              {/* Update Form (if not resolved) */}
              {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Update Complaint</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={resolutionForm.status}
                      onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  {resolutionForm.status === "resolved" && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Resolution Remarks
                        </label>
                        <textarea
                          value={resolutionForm.remarks}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, remarks: e.target.value })}
                          placeholder="Describe how the issue was resolved..."
                          rows={3}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Proof URL (optional)
                        </label>
                        <input
                          type="text"
                          value={resolutionForm.resolution_proof}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, resolution_proof: e.target.value })}
                          placeholder="https://..."
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg text-sm font-medium hover:bg-[#7a9aa4] transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update Complaint"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
