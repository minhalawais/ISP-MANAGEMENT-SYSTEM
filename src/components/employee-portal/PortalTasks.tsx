"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "react-toastify"
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
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
} from "lucide-react"

interface Task {
  id: string
  task_type: string
  priority: string
  status: string
  due_date: string | null
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
  in_progress: { color: "text-blue-700", bg: "bg-blue-100", icon: ClipboardList },
  completed: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
  cancelled: { color: "text-gray-700", bg: "bg-gray-100", icon: X },
}

const priorityConfig: Record<string, { border: string; badge: string }> = {
  low: { border: "border-l-gray-400", badge: "bg-gray-100 text-gray-700" },
  medium: { border: "border-l-blue-400", badge: "bg-blue-100 text-blue-700" },
  high: { border: "border-l-orange-400", badge: "bg-orange-100 text-orange-700" },
  critical: { border: "border-l-red-500", badge: "bg-red-100 text-red-700" },
}

const taskTypeLabels: Record<string, string> = {
  installation: "Installation",
  maintenance: "Maintenance",
  complaint: "Complaint",
  recovery: "Recovery",
  inspection: "Inspection",
}

export function PortalTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [updating, setUpdating] = useState(false)
  const [completionForm, setCompletionForm] = useState({
    status: "",
    completion_notes: "",
    completion_proof: "",
  })

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = filter !== "all" ? `?status=${filter}` : ""
      const response = await axiosInstance.get(`/employee-portal/tasks${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTasks(response.data)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedTask || !completionForm.status) return
    setUpdating(true)
    try {
      const token = getToken()
      await axiosInstance.put(
        `/employee-portal/tasks/${selectedTask.id}/status`,
        {
          status: completionForm.status,
          completion_notes: completionForm.completion_notes || null,
          completion_proof: completionForm.completion_proof || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Task updated successfully!")
      setSelectedTask(null)
      fetchTasks()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task")
    } finally {
      setUpdating(false)
    }
  }

  const openTaskModal = (task: Task) => {
    setSelectedTask(task)
    setCompletionForm({
      status: task.status,
      completion_notes: task.completion_notes || "",
      completion_proof: task.completion_proof || "",
    })
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() 
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
            {status === "all" ? "All Tasks" : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                {tasks.filter((t) => t.status === "pending").length}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.status === "in_progress").length}
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
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => isOverdue(t.due_date) && t.status !== "completed").length}
              </p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const status = statusConfig[task.status] || statusConfig.pending
            const priority = priorityConfig[task.priority] || priorityConfig.medium
            const StatusIcon = status.icon
            const overdue = isOverdue(task.due_date) && task.status !== "completed"

            return (
              <div
                key={task.id}
                onClick={() => openTaskModal(task)}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${priority.border} p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priority.badge}`}>
                      {task.priority}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {taskTypeLabels[task.task_type] || task.task_type}
                </h3>

                {task.customer_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>{task.customer_name}</span>
                    {task.customer_internet_id && (
                      <span className="text-xs text-[#89A8B2]">({task.customer_internet_id})</span>
                    )}
                  </div>
                )}

                {task.customer_area && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{task.customer_area}</span>
                  </div>
                )}

                {task.due_date && (
                  <div className={`flex items-center gap-2 text-sm ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(task.due_date).toLocaleDateString()}
                      {overdue && " (Overdue)"}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#89A8B2] to-[#6B8A94]">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Task Details</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
              {/* Task Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    {taskTypeLabels[selectedTask.task_type] || selectedTask.task_type}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${priorityConfig[selectedTask.priority]?.badge}`}>
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className={`font-medium ${statusConfig[selectedTask.status]?.color}`}>
                      {selectedTask.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Date</p>
                    <p className={`font-medium ${isOverdue(selectedTask.due_date) && selectedTask.status !== "completed" ? "text-red-600" : "text-gray-900"}`}>
                      {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleString() : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">
                      {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  {selectedTask.completed_at && (
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-medium text-green-600">
                        {new Date(selectedTask.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              {selectedTask.customer_name && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="font-medium">{selectedTask.customer_name}</span>
                    </div>
                    {selectedTask.customer_internet_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Internet ID</span>
                        <span className="font-medium text-[#89A8B2]">{selectedTask.customer_internet_id}</span>
                      </div>
                    )}
                    {selectedTask.customer_phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phone</span>
                        <a href={`tel:${selectedTask.customer_phone}`} className="font-medium text-[#89A8B2] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedTask.customer_phone}
                        </a>
                      </div>
                    )}
                    {selectedTask.customer_area && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Area</span>
                        <span className="font-medium">{selectedTask.customer_area}</span>
                      </div>
                    )}
                    {selectedTask.customer_address && (
                      <div>
                        <span className="text-gray-600">Address</span>
                        <p className="font-medium mt-1">{selectedTask.customer_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTask.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Task Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedTask.notes}</p>
                </div>
              )}

              {/* Completion Notes (if completed) */}
              {selectedTask.completion_notes && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    Completion Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedTask.completion_notes}</p>
                </div>
              )}

              {/* Update Form (if not completed) */}
              {selectedTask.status !== "completed" && selectedTask.status !== "cancelled" && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900">Update Task</h4>
                  
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
                          placeholder="Describe what was done..."
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
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              {selectedTask.status !== "completed" && selectedTask.status !== "cancelled" && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-[#89A8B2] text-white rounded-lg text-sm font-medium hover:bg-[#7a9aa4] transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update Task"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
