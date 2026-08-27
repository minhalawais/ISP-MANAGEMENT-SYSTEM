"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getToken } from "../../utils/auth.ts"
import axiosInstance from "../../utils/axiosConfig.ts"
import { toast } from "../../utils/notify.ts";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  User,
  Phone,
  MapPin,
  ChevronRight,
  X,
  MessageSquare,
  Image,
} from "lucide-react"
import { PortalStatStrip, type PortalStatItem } from "./shared/PortalStatStrip.tsx"
import { PortalSegmentedControl } from "./shared/PortalSegmentedControl.tsx"
import { PortalSheet } from "./shared/PortalSheet.tsx"
import { PortalStatusPill, portalStatusAvatar } from "./shared/PortalStatusPill.tsx"

interface TaskAssignee {
  id: string
  name: string
}

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
  assignees?: TaskAssignee[]
  is_unassigned?: boolean
  is_assignee?: boolean
  can_update?: boolean
}

const priorityConfig: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

const taskTypeLabels: Record<string, string> = {
  installation: "Installation",
  maintenance: "Maintenance",
  complaint: "Complaint",
  inspection: "Inspection",
  recovery: "Recovery",
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]

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
    if (!selectedTask.can_update) {
      toast.error("Only an assigned employee can update this task")
      return
    }
    if (completionForm.status === "completed" && !completionForm.completion_notes.trim()) {
      toast.error("Completion notes are required")
      return
    }
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

  const overdueCount = tasks.filter((t) => isOverdue(t.due_date) && t.status !== "completed").length

  const statItems: PortalStatItem[] = [
    { key: "pending", label: "Pending", value: tasks.filter((t) => t.status === "pending").length, icon: Clock, tone: "warning" },
    { key: "in_progress", label: "In progress", value: tasks.filter((t) => t.status === "in_progress").length, icon: ClipboardList, tone: "accent" },
    { key: "completed", label: "Completed", value: tasks.filter((t) => t.status === "completed").length, icon: CheckCircle, tone: "success" },
    { key: "overdue", label: "Overdue", value: overdueCount, icon: X, tone: overdueCount ? "danger" : "default" },
  ]

  const detailTitle = selectedTask ? taskTypeLabels[selectedTask.task_type] || selectedTask.task_type : ""
  const detailSubtitle = selectedTask?.customer_name || undefined

  const canUpdateSelected =
    !!selectedTask &&
    Boolean(selectedTask.can_update) &&
    selectedTask.status !== "completed" &&
    selectedTask.status !== "cancelled"

  const detailFooter = selectedTask && (
    <>
      <button
        onClick={() => setSelectedTask(null)}
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
          {updating ? "Updating..." : "Update task"}
        </button>
      )}
    </>
  )

  const detailBody = selectedTask && (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <PortalStatusPill status={selectedTask.status} />
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[selectedTask.priority] || priorityConfig.medium}`}
        >
          {selectedTask.priority.toUpperCase()}
        </span>
        {selectedTask.is_assignee ? (
          <span className="rounded-full bg-electric-blue/10 px-2 py-0.5 text-[10px] font-medium text-electric-blue">
            Assigned to you
          </span>
        ) : selectedTask.is_unassigned ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Unassigned
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            View only
          </span>
        )}
      </div>

      {!selectedTask.can_update && selectedTask.status !== "completed" && selectedTask.status !== "cancelled" && (
        <p className="text-xs text-gray-500">
          {selectedTask.is_unassigned
            ? "Waiting for the company owner to assign this task."
            : "Assigned to another employee. You can view details only."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-gray-500">Due date</p>
          <p
            className={`font-medium ${
              isOverdue(selectedTask.due_date) && selectedTask.status !== "completed"
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
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
            <p className="font-medium text-emerald-600">
              {new Date(selectedTask.completed_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {selectedTask.assignees && selectedTask.assignees.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Assignees</p>
          <p className="text-gray-700">
            {selectedTask.assignees.map((a) => a.name).join(", ")}
          </p>
        </div>
      )}

      {selectedTask.customer_name && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <User className="w-3.5 h-3.5" /> Name
            </span>
            {selectedTask.customer_id ? (
              <Link
                to={`/employee-portal/customers/${selectedTask.customer_id}`}
                className="font-medium text-electric-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedTask.customer_name}
              </Link>
            ) : (
              <span className="font-medium">{selectedTask.customer_name}</span>
            )}
          </div>
          {selectedTask.customer_internet_id && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Internet ID</span>
              <span className="font-medium text-electric-blue">{selectedTask.customer_internet_id}</span>
            </div>
          )}
          {selectedTask.customer_phone && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Phone</span>
              <a
                href={`tel:${selectedTask.customer_phone}`}
                className="flex items-center gap-1 font-medium text-electric-blue"
              >
                <Phone className="w-3 h-3" />
                {selectedTask.customer_phone}
              </a>
            </div>
          )}
          {selectedTask.customer_area && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="w-3.5 h-3.5" /> Area
              </span>
              <span className="font-medium">{selectedTask.customer_area}</span>
            </div>
          )}
          {selectedTask.customer_address && (
            <div>
              <span className="text-gray-600">Address</span>
              <p className="mt-1 font-medium">{selectedTask.customer_address}</p>
            </div>
          )}
        </div>
      )}

      {selectedTask.notes && (
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Task notes</p>
          <p className="text-gray-700">{selectedTask.notes}</p>
        </div>
      )}

      {selectedTask.completion_notes && (
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <MessageSquare className="w-3.5 h-3.5" /> Completion notes
          </p>
          <p className="text-gray-700">{selectedTask.completion_notes}</p>
        </div>
      )}

      {canUpdateSelected && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Update task</p>

          <div>
            <label className="text-xs font-medium text-gray-600">Status</label>
            <select
              value={completionForm.status}
              onChange={(e) => setCompletionForm({ ...completionForm, status: e.target.value })}
              className="mt-1 w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {completionForm.status === "completed" && (
            <>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Completion notes *
                </label>
                <textarea
                  value={completionForm.completion_notes}
                  onChange={(e) => setCompletionForm({ ...completionForm, completion_notes: e.target.value })}
                  placeholder="Describe what was done..."
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <Image className="w-3.5 h-3.5" />
                  Proof URL (optional)
                </label>
                <input
                  type="text"
                  value={completionForm.completion_proof}
                  onChange={(e) => setCompletionForm({ ...completionForm, completion_proof: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full h-9 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-portal-accent/40 focus:border-portal-accent"
                />
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

        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y divide-gray-100 overflow-hidden">
            {tasks.map((task) => {
              const avatar = portalStatusAvatar(task.status)
              const overdue = isOverdue(task.due_date) && task.status !== "completed"
              const isSelected = selectedTask?.id === task.id

              return (
                <div
                  key={task.id}
                  onClick={() => openTaskModal(task)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-portal-tint border-l-2 border-l-electric-blue"
                      : "hover:bg-gray-50 active:bg-gray-100 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatar.bg}`}>
                    <ClipboardList className={`w-4 h-4 ${avatar.text}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {taskTypeLabels[task.task_type] || task.task_type}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          priorityConfig[task.priority] || priorityConfig.medium
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.is_assignee && (
                        <span className="shrink-0 rounded-full bg-electric-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-electric-blue">
                          You
                        </span>
                      )}
                      {!task.is_assignee && task.is_unassigned && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {task.customer_name || "No customer"}
                      {task.customer_area ? ` · ${task.customer_area}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {task.due_date && (
                      <span
                        className={`text-xs whitespace-nowrap ${
                          overdue ? "font-semibold text-red-600" : "text-gray-400"
                        }`}
                      >
                        {overdue ? "Overdue" : new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 lg:hidden" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-120px)] lg:flex-col lg:rounded-xl lg:border lg:border-gray-100 lg:bg-white lg:shadow-sm">
        {selectedTask ? (
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
            <ClipboardList className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Select a task to view details</p>
          </div>
        )}
      </div>

      <PortalSheet
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
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
