"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { Sidebar } from "../components/sideNavbar.tsx"
import { Topbar } from "../components/topNavbar.tsx"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Phone,
  Star,
  User,
  ArrowLeft,
  Paperclip,
  Tag,
  Edit,
  Save,
  X,
} from "lucide-react"
import { toast } from "react-toastify"

interface Complaint {
  id: string
  customer_id: string
  customer_name: string
  internet_id: string
  phone_number: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to: string | null
  assigned_to_name: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  response_due_date: string | null
  satisfaction_rating: number | null
  resolution_attempts: number
  attachment_path: string | null
  feedback_comments: string | null
  is_active: boolean
  resolution_proof: string | null
  ticket_number: string
  remarks: string | null
}

const ComplaintDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isEditingRemarks, setIsEditingRemarks] = useState(false)
  const [remarks, setRemarks] = useState<string>("")
  const [isSavingRemarks, setIsSavingRemarks] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  useEffect(() => {
    document.title = "Complaint Details"
    const fetchComplaintData = async () => {
      try {
        setLoading(true)
        const token = getToken()
        const response = await axiosInstance.get(`/complaints/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setComplaint(response.data)
        setRemarks(response.data.remarks || "")
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch complaint data", error)
        setError("Failed to load complaint details. Please try again later.")
        setLoading(false)
      }
    }

    if (id) {
      fetchComplaintData()
    }
  }, [id])

  useEffect(() => {
    // Focus the textarea when editing mode is enabled
    if (isEditingRemarks && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditingRemarks])

  const handleDownloadAttachment = () => {
    if (complaint?.attachment_path) {
      const token = getToken()
      fetch(`/complaints/attachment/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.style.display = "none"
          a.href = url
          a.download = `complaint_attachment_${complaint.ticket_number}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
        })
        .catch((error) => console.error("Error:", error))
    }
  }

  const handleEditRemarks = () => {
    setIsEditingRemarks(true)
  }

  const handleCancelEditRemarks = () => {
    setRemarks(complaint?.remarks || "")
    setIsEditingRemarks(false)
  }

  const handleSaveRemarks = async () => {
    if (!id) return

    try {
      setIsSavingRemarks(true)
      const token = getToken()
      await axiosInstance.put(
        `/complaints/update-remarks/${id}`,
        { remarks },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Update the local complaint object with the new remarks
      if (complaint) {
        setComplaint({
          ...complaint,
          remarks,
        })
      }

      setIsEditingRemarks(false)
      toast.success("Remarks updated successfully", {
        style: { background: "#E5E1DA", color: "#89A8B2" },
      })
    } catch (error) {
      console.error("Failed to update remarks", error)
      toast.error("Failed to update remarks", {
        style: { background: "#F1F0E8", color: "#B3C8CF" },
      })
    } finally {
      setIsSavingRemarks(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[#8b5cf6]"></div>
          <p className="text-lg font-medium text-[#8b5cf6]">Loading complaint details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">Error</h2>
          <p className="text-center text-gray-600">{error}</p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate("/complaints")}
              className="rounded-md bg-[#8b5cf6] px-4 py-2 text-white transition duration-300 hover:bg-[#7c3aed]"
            >
              Back to Complaints
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="h-16 w-16 text-yellow-500" />
          </div>
          <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">Complaint Not Found</h2>
          <p className="text-center text-gray-600">
            The complaint you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate("/complaints")}
              className="rounded-md bg-[#8b5cf6] px-4 py-2 text-white transition duration-300 hover:bg-[#7c3aed]"
            >
              Back to Complaints
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 pt-20 transition-all duration-300 ${
            isSidebarOpen ? "ml-72" : "ml-20"
          }`}
        >
          <div className="container mx-auto max-w-5xl">
            {/* Header with back button */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/complaints")}
                  className="flex items-center rounded-full bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-[#8b5cf6]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-3xl font-bold text-[#8b5cf6]">Complaint Details</h1>
              </div>
            </div>

            {/* Ticket info card */}
            <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-md">
              <div className="bg-gradient-to-r from-[#8b5cf6] to-[#9f7aea] p-4">
                <div className="flex flex-wrap items-center justify-between">
                  <div className="mb-2 flex items-center space-x-3 md:mb-0">
                    <Tag className="h-6 w-6 text-white" />
                    <h2 className="text-xl font-semibold text-white">Ticket #{complaint.ticket_number}</h2>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                        complaint.status,
                      )}`}
                    >
                      {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500">Customer Information</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-3 flex items-start space-x-3">
                        <User className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p className="text-gray-800">{complaint.customer_name}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex items-start space-x-3">
                        <Tag className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Internet ID</p>
                          <p className="text-gray-800">{complaint.internet_id}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone Number</p>
                          <p className="text-gray-800">{complaint.phone_number}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500">Assignment Information</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-3 flex items-start space-x-3">
                        <User className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assigned To</p>
                          <p className="text-gray-800">{complaint.assigned_to_name || "Unassigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Resolution Attempts</p>
                          <p className="text-gray-800">{complaint.resolution_attempts}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500">Dates</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-3 flex items-start space-x-3">
                        <Calendar className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Created At</p>
                          <p className="text-gray-800">{new Date(complaint.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex items-start space-x-3">
                        <Calendar className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Updated At</p>
                          <p className="text-gray-800">{new Date(complaint.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mb-3 flex items-start space-x-3">
                        <Calendar className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Response Due Date</p>
                          <p className="text-gray-800">
                            {complaint.response_due_date
                              ? new Date(complaint.response_due_date).toLocaleString()
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Resolved At</p>
                          <p className="text-gray-800">
                            {complaint.resolved_at
                              ? new Date(complaint.resolved_at).toLocaleString()
                              : "Not resolved yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500">Feedback</h3>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-3 flex items-start space-x-3">
                        <Star className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Satisfaction Rating</p>
                          <div className="flex items-center">
                            {complaint.satisfaction_rating ? (
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < complaint.satisfaction_rating!
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-gray-600">({complaint.satisfaction_rating}/5)</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Not rated yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="mt-1 h-5 w-5 flex-shrink-0 text-[#8b5cf6]" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Feedback Comments</p>
                          <p className="text-gray-800">{complaint.feedback_comments || "No feedback provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description and remarks */}
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-medium text-gray-800">Description</h3>
                </div>
                <div className="p-6">
                  <p className="whitespace-pre-wrap text-gray-700">{complaint.description}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="border-b border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Remarks</h3>
                  {!isEditingRemarks ? (
                    <button
                      onClick={handleEditRemarks}
                      className="flex items-center text-sm text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {remarks ? "Edit" : "Add"} Remarks
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancelEditRemarks}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={isSavingRemarks}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRemarks}
                        className="flex items-center text-sm text-green-600 hover:text-green-700 transition-colors"
                        disabled={isSavingRemarks}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSavingRemarks ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {isEditingRemarks ? (
                    <textarea
                      ref={textareaRef}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
                      placeholder="Add your remarks here..."
                      disabled={isSavingRemarks}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{remarks || "No remarks added"}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments and resolution proof */}
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-medium text-gray-800">Attachment</h3>
                </div>
                <div className="p-6">
                  {complaint.attachment_path ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-5 w-5 text-[#8b5cf6]" />
                        <span className="text-gray-700">Complaint Attachment</span>
                      </div>
                      <button
                        onClick={handleDownloadAttachment}
                        className="rounded-md bg-[#8b5cf6] px-3 py-1 text-sm text-white transition duration-300 hover:bg-[#7c3aed]"
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
                      <p className="text-gray-500">No attachment available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-md">
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-medium text-gray-800">Resolution Proof</h3>
                </div>
                <div className="p-6">
                  {complaint.resolution_proof ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-[#8b5cf6]" />
                        <span className="text-gray-700">Resolution Document</span>
                      </div>
                      <button
                        onClick={() => {
                          const token = getToken()
                          fetch(`/complaints/resolution-proof/${id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then((response) => response.blob())
                            .then((blob) => {
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.style.display = "none"
                              a.href = url
                              a.download = `resolution_proof_${complaint.ticket_number}`
                              document.body.appendChild(a)
                              a.click()
                              window.URL.revokeObjectURL(url)
                            })
                            .catch((error) => console.error("Error:", error))
                        }}
                        className="rounded-md bg-[#8b5cf6] px-3 py-1 text-sm text-white transition duration-300 hover:bg-[#7c3aed]"
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
                      <p className="text-gray-500">No resolution proof available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap justify-end space-x-4">
              <button
                onClick={() => navigate("/complaints")}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition duration-300 hover:bg-gray-50"
              >
                Back to List
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ComplaintDetailPage

