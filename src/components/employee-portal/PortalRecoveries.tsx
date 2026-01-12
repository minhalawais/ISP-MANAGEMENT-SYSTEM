"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  RefreshCw,
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
  Receipt,
  DollarSign,
  AlertTriangle,
} from "lucide-react"

interface Recovery {
  id: string
  invoice_id: string
  invoice_number: string | null
  invoice_due_date: string | null
  amount: number
  paid_amount: number
  remaining_amount: number
  status: string
  notes: string | null
  completion_notes: string | null
  completion_proof: string | null
  created_at: string | null
  completed_at: string | null
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_area: string | null
  customer_internet_id: string | null
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock },
  in_progress: { color: "text-blue-700", bg: "bg-blue-100", icon: RefreshCw },
  completed: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  cancelled: { color: "text-gray-700", bg: "bg-gray-100", icon: X },
}

export function PortalRecoveries() {
  const [recoveries, setRecoveries] = useState<Recovery[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedRecovery, setSelectedRecovery] = useState<Recovery | null>(null)
  const [updating, setUpdating] = useState(false)
  const [completionForm, setCompletionForm] = useState({
    status: "",
    completion_notes: "",
    completion_proof: "",
  })

  useEffect(() => {
    fetchRecoveries()
  }, [filter])

  const fetchRecoveries = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = filter !== "all" ? `?status=${filter}` : ""
      const response = await axiosInstance.get(`/employee-portal/recoveries${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setRecoveries(response.data)
    } catch (error) {
      console.error("Failed to fetch recoveries:", error)
      toast.error("Failed to load recoveries")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedRecovery || !completionForm.status) return
    setUpdating(true)
    try {
      const token = getToken()
      await axiosInstance.put(
        `/employee-portal/recoveries/${selectedRecovery.id}/status`,
        {
          status: completionForm.status,
          completion_notes: completionForm.completion_notes || null,
          completion_proof: completionForm.completion_proof || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Recovery updated successfully!")
      setSelectedRecovery(null)
      fetchRecoveries()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update recovery")
    } finally {
      setUpdating(false)
    }
  }

  const openRecoveryModal = (recovery: Recovery) => {
    setSelectedRecovery(recovery)
    setCompletionForm({
      status: recovery.status,
      completion_notes: recovery.completion_notes || "",
      completion_proof: recovery.completion_proof || "",
    })
  }

  const totalPending = recoveries.filter((r) => r.status === "pending" || r.status === "in_progress")
    .reduce((sum, r) => sum + r.remaining_amount, 0)

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
        {["all", "pending", "in_progress", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === status
                ? "bg-[#89A8B2] text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {status === "all" ? "All Recoveries" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {recoveries.filter((r) => r.status === "pending").length}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {recoveries.filter((r) => r.status === "in_progress").length}
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
                {recoveries.filter((r) => r.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                PKR {totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">To Recover</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recoveries Grid */}
      {recoveries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recovery tasks found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recoveries.map((recovery) => {
            const status = statusConfig[recovery.status] || statusConfig.pending
            const StatusIcon = status.icon
            const isOverdue = recovery.invoice_due_date && new Date(recovery.invoice_due_date) < new Date()

            return (
              <div
                key={recovery.id}
                onClick={() => openRecoveryModal(recovery)}
                className={`bg-white rounded-xl border ${isOverdue && recovery.status !== "completed" ? "border-red-200" : "border-gray-200"} p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#89A8B2] flex items-center gap-1">
                      <Receipt className="w-3 h-3" />
                      {recovery.invoice_number || "N/A"}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {recovery.status.replace("_", " ")}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Amount Display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">PKR {recovery.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className={`font-bold ${recovery.remaining_amount > 0 ? "text-red-600" : "text-green-600"}`}>
                      PKR {recovery.remaining_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {recovery.customer_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>{recovery.customer_name}</span>
                    {recovery.customer_internet_id && (
                      <span className="text-xs text-[#89A8B2]">({recovery.customer_internet_id})</span>
                    )}
                  </div>
                )}

                {recovery.customer_area && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{recovery.customer_area}</span>
                  </div>
                )}

                {isOverdue && recovery.status !== "completed" && (
                  <div className="flex items-center gap-2 text-sm text-red-600 font-medium mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    Overdue
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#89A8B2] to-[#6B8A94]">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Recovery Details</h3>
                  <p className="text-sm text-white/80">Invoice #{selectedRecovery.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecovery(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
              {/* Invoice Amount Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusConfig[selectedRecovery.status]?.bg} ${statusConfig[selectedRecovery.status]?.color}`}>
                    {selectedRecovery.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-900">PKR {selectedRecovery.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid</p>
                    <p className="text-lg font-bold text-green-600">PKR {selectedRecovery.paid_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className={`text-lg font-bold ${selectedRecovery.remaining_amount > 0 ? "text-red-600" : "text-green-600"}`}>
                      PKR {selectedRecovery.remaining_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                  {selectedRecovery.invoice_due_date && (
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className={`font-medium ${new Date(selectedRecovery.invoice_due_date) < new Date() && selectedRecovery.status !== "completed" ? "text-red-600" : "text-gray-900"}`}>
                        {new Date(selectedRecovery.invoice_due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Assigned</p>
                    <p className="font-medium text-gray-900">
                      {selectedRecovery.created_at ? new Date(selectedRecovery.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  {selectedRecovery.completed_at && (
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-medium text-green-600">
                        {new Date(selectedRecovery.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              {selectedRecovery.customer_name && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{selectedRecovery.customer_name}</span>
                    </div>
                    {selectedRecovery.customer_internet_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Internet ID</span>
                        <span className="font-medium text-[#89A8B2]">{selectedRecovery.customer_internet_id}</span>
                      </div>
                    )}
                    {selectedRecovery.customer_phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phone</span>
                        <a href={`tel:${selectedRecovery.customer_phone}`} className="font-medium text-[#89A8B2] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedRecovery.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedRecovery.customer_area && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area</span>
                        <span className="font-medium">{selectedRecovery.customer_area}</span>
                      </div>
                    )}
                    {selectedRecovery.customer_address && (
                      <div>
                        <span className="text-gray-600">Address</span>
                        <p className="font-medium mt-1">{selectedRecovery.customer_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRecovery.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedRecovery.notes}</p>
                </div>
              )}

              {/* Completion Notes (if completed) */}
              {selectedRecovery.completion_notes && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    Completion Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedRecovery.completion_notes}</p>
                </div>
              )}

              {/* Update Form (if not completed) */}
              {selectedRecovery.status !== "completed" && selectedRecovery.status !== "cancelled" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Update Recovery</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={completionForm.status}
                      onChange={(e) => setCompletionForm({ ...completionForm, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#89A8B2] focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {completionForm.status === "completed" && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Completion Notes
                        </label>
                        <textarea
                          value={completionForm.completion_notes}
                          onChange={(e) => setCompletionForm({ ...completionForm, completion_notes: e.target.value })}
                          placeholder="Describe how the recovery was completed..."
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
                          value={completionForm.completion_proof}
                          onChange={(e) => setCompletionForm({ ...completionForm, completion_proof: e.target.value })}
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
                onClick={() => setSelectedRecovery(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {selectedRecovery.status !== "completed" && selectedRecovery.status !== "cancelled" && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg text-sm font-medium hover:bg-[#7a9aa4] transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update Recovery"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
