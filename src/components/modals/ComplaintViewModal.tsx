"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  User,
  Phone,
  Globe,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RotateCcw,
  Star,
  AlertCircle,
  UserCog,
  Users,
  History,
} from "lucide-react"
import { Modal } from "../modal.tsx"
import axiosInstance from "../../utils/axiosConfig.ts"
import { ComplaintFilePreview } from "../complaint/ComplaintFilePreview.tsx"
import { ResolveComplaintModal, type ResolveComplaintPayload } from "./ResolveComplaintModal.tsx"
import { getToken } from "../../utils/auth.ts"
import { toast } from "../../utils/notify.ts"
import { createFormDataRequestConfig } from "../../utils/crudSubmit.ts"

interface VisibleEmployee {
  id: string
  name: string
  role: string
  is_assignee: boolean
}

interface ActivityEvent {
  id: string
  action: string
  actor_name: string
  created_at: string | null
  summary: string
}

interface ComplaintDetail {
  id: string
  ticket_number: string
  customer_name: string | null
  internet_id: string | null
  phone_number: string | null
  category: string | null
  category_label: string | null
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  assigned_to: string | null
  assigned_to_name: string | null
  is_unassigned?: boolean
  visible_to?: VisibleEmployee[]
  activity?: ActivityEvent[]
  created_at: string
  updated_at: string | null
  resolved_at: string | null
  response_due_date: string | null
  satisfaction_rating: number | null
  resolution_attempts: number
  attachment_path: string | null
  resolution_proof: string | null
  feedback_comments: string | null
  remarks: string | null
}

interface Props {
  complaintId: string | null
  onClose: () => void
  onResolved?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  no_internet: "No Internet / Connectivity",
  slow_speed: "Slow Speed",
  billing: "Billing / Invoice",
  installation: "Installation / Relocation",
  hardware: "Hardware / Equipment",
  other: "Other",
}

const statusBadge: Record<string, { className: string; icon: React.ElementType; label: string }> = {
  open: { className: "bg-golden-amber text-white shadow-sm shadow-golden-amber/30", icon: Clock, label: "Open" },
  in_progress: {
    className: "bg-electric-blue text-white shadow-sm shadow-electric-blue/30",
    icon: MessageSquare,
    label: "In Progress",
  },
  resolved: {
    className: "bg-emerald-green text-white shadow-sm shadow-emerald-green/30",
    icon: CheckCircle2,
    label: "Resolved",
  },
  closed: { className: "bg-slate-gray text-white shadow-sm", icon: XCircle, label: "Closed" },
}

const INFO_TONES = [
  { iconWrap: "bg-electric-blue/15 text-electric-blue", card: "border-electric-blue/15 bg-electric-blue/[0.04]" },
  { iconWrap: "bg-deep-ocean/15 text-deep-ocean", card: "border-deep-ocean/15 bg-deep-ocean/[0.04]" },
  { iconWrap: "bg-emerald-green/15 text-emerald-green", card: "border-emerald-green/15 bg-emerald-green/[0.04]" },
  { iconWrap: "bg-golden-amber/15 text-golden-amber", card: "border-golden-amber/15 bg-golden-amber/[0.04]" },
] as const

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-deep-ocean">
      {Icon ? (
        <span className="flex h-5 w-5 items-center justify-center rounded bg-electric-blue/15 text-electric-blue">
          <Icon className="h-3 w-3" />
        </span>
      ) : null}
      {children}
    </p>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
  toneIndex = 0,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  toneIndex?: number
}) {
  const tone = INFO_TONES[toneIndex % INFO_TONES.length]
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${tone.card}`}>
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.iconWrap}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">{label}</p>
        <p className="truncate text-sm font-semibold text-deep-ocean">{value}</p>
      </div>
    </div>
  )
}

export function ComplaintViewModal({ complaintId, onClose, onResolved }: Props) {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResolve, setShowResolve] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!complaintId) {
      setComplaint(null)
      setError(null)
      return
    }
    let cancelled = false
    const fetchComplaint = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axiosInstance.get(`/complaints/${complaintId}`)
        if (!cancelled) setComplaint(response.data)
      } catch (err) {
        console.error("Failed to fetch complaint details", err)
        if (!cancelled) setError("Failed to load complaint details.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchComplaint()
    return () => {
      cancelled = true
    }
  }, [complaintId])

  const status = complaint ? statusBadge[complaint.status] || statusBadge.open : null
  const StatusIcon = status?.icon
  const isUnassigned = complaint?.is_unassigned ?? !complaint?.assigned_to
  const visibleTo = complaint?.visible_to || []
  const activity = complaint?.activity || []

  return (
    <Modal
      isVisible={!!complaintId}
      onClose={onClose}
      title={complaint ? `Ticket #${complaint.ticket_number}` : "Complaint Details"}
      size="lg"
      
    >
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-gray">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-blue border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-coral-red" />
          <p className="text-sm text-slate-gray">{error}</p>
        </div>
      )}

      {!loading && !error && complaint && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-electric-blue/15 bg-gradient-to-r from-light-sky to-white px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-electric-blue">Category</p>
              <p className="text-base font-semibold text-deep-ocean">
                {complaint.category_label || CATEGORY_LABELS[complaint.category || ""] || complaint.category || "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isUnassigned && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-red px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-coral-red/25">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Needs assignment
                </span>
              )}
              {status && StatusIcon && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <InfoItem icon={User} label="Customer" value={complaint.customer_name || "—"} toneIndex={0} />
            <InfoItem icon={Globe} label="Internet ID" value={complaint.internet_id || "—"} toneIndex={1} />
            <InfoItem icon={Phone} label="Phone" value={complaint.phone_number || "—"} toneIndex={2} />
            <InfoItem
              icon={UserCog}
              label="Assigned To"
              toneIndex={3}
              value={
                isUnassigned ? (
                  <span className="text-coral-red">Unassigned</span>
                ) : (
                  complaint.assigned_to_name || "—"
                )
              }
            />
            <InfoItem icon={Calendar} label="Created At" value={formatDate(complaint.created_at)} toneIndex={0} />
            <InfoItem icon={Calendar} label="Due Date" value={formatDate(complaint.response_due_date)} toneIndex={1} />
            <InfoItem
              icon={CheckCircle2}
              label="Resolved At"
              value={formatDate(complaint.resolved_at)}
              toneIndex={2}
            />
            <InfoItem
              icon={RotateCcw}
              label="Resolution Attempts"
              value={complaint.resolution_attempts}
              toneIndex={3}
            />
            {complaint.satisfaction_rating != null && (
              <InfoItem
                icon={Star}
                label="Satisfaction Rating"
                toneIndex={3}
                value={
                  <span className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= complaint.satisfaction_rating!
                            ? "fill-golden-amber text-golden-amber"
                            : "text-slate-gray/30"
                        }`}
                      />
                    ))}
                  </span>
                }
              />
            )}
          </div>

          <div>
            <SectionLabel icon={Users}>Visible to</SectionLabel>
            <p className="mb-2 text-xs text-slate-gray">
              Employees who can see this ticket in their portal. Only the assignee can update it.
            </p>
            {visibleTo.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-gray/25 bg-slate-50 px-3 py-2.5 text-sm text-slate-gray">
                No portal employees currently match this ticket&apos;s visibility rules.
              </div>
            ) : (
              <ul className="divide-y divide-electric-blue/10 overflow-hidden rounded-lg border border-electric-blue/20 bg-light-sky/40">
                {visibleTo.map((emp) => (
                  <li
                    key={emp.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${
                      emp.is_assignee ? "bg-electric-blue/10" : "bg-white/70"
                    }`}
                  >
                    <span className="font-semibold text-deep-ocean">{emp.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs capitalize text-slate-gray">{emp.role.replace("_", " ")}</span>
                      {emp.is_assignee ? (
                        <span className="rounded-full bg-electric-blue px-2 py-0.5 text-[10px] font-semibold text-white">
                          Assignee
                        </span>
                      ) : (
                        <span className="rounded-full bg-deep-ocean/10 px-2 py-0.5 text-[10px] font-semibold text-deep-ocean">
                          Viewer
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionLabel>Description</SectionLabel>
            <div className="whitespace-pre-wrap rounded-lg border border-electric-blue/20 bg-light-sky/60 p-3 text-sm leading-relaxed text-deep-ocean">
              {complaint.description || "—"}
            </div>
          </div>

          {complaint.remarks && (
            <div>
              <SectionLabel>Resolution Remarks</SectionLabel>
              <div className="whitespace-pre-wrap rounded-lg border border-emerald-green/30 bg-emerald-green/10 p-3 text-sm leading-relaxed text-deep-ocean">
                {complaint.remarks}
              </div>
            </div>
          )}

          {complaint.feedback_comments && (
            <div>
              <SectionLabel>Customer Feedback</SectionLabel>
              <div className="whitespace-pre-wrap rounded-lg border border-golden-amber/25 bg-golden-amber/5 p-3 text-sm leading-relaxed text-deep-ocean">
                {complaint.feedback_comments}
              </div>
            </div>
          )}

          {(complaint.attachment_path || complaint.resolution_proof) && (
            <div>
              <SectionLabel>Attachments</SectionLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {complaint.attachment_path && (
                  <ComplaintFilePreview
                    label="Complaint attachment"
                    filePath={complaint.attachment_path}
                    fetchUrl={`/complaints/attachment/${complaint.id}`}
                    actionClassName="text-electric-blue"
                  />
                )}
                {complaint.resolution_proof && (
                  <ComplaintFilePreview
                    label="Resolution proof"
                    filePath={complaint.resolution_proof}
                    fetchUrl={`/complaints/resolution-proof/${complaint.id}`}
                    actionClassName="text-electric-blue"
                  />
                )}
              </div>
            </div>
          )}

          {activity.length > 0 && (
            <div>
              <SectionLabel icon={History}>Activity</SectionLabel>
              <ul className="max-h-48 space-y-0 overflow-y-auto rounded-lg border border-deep-ocean/15 bg-white">
                {activity.map((event, index) => (
                  <li
                    key={event.id}
                    className={`border-l-2 border-electric-blue px-3 py-2.5 text-sm ${
                      index % 2 === 0 ? "bg-light-sky/50" : "bg-white"
                    }`}
                  >
                    <p className="font-semibold text-deep-ocean">{event.summary}</p>
                    <p className="text-xs text-slate-gray">
                      {event.actor_name}
                      {event.created_at ? ` · ${formatDate(event.created_at)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {complaint.status !== "resolved" && complaint.status !== "closed" && (
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                disabled={resolving}
                onClick={() => setShowResolve(true)}
                className="h-9 px-4 rounded-lg bg-electric-blue text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                Resolve with billing
              </button>
            </div>
          )}
        </div>
      )}

      <ResolveComplaintModal
        isOpen={showResolve}
        onClose={() => setShowResolve(false)}
        onConfirm={async (payload: ResolveComplaintPayload) => {
          if (!complaint) return
          if (payload.cash_amount > 0 && payload.materials.length === 0) {
            toast.error("Enter parts used or set cash received to 0")
            return
          }
          setResolving(true)
          try {
            const token = getToken()
            const body = new FormData()
            body.append("remarks", payload.notes)
            body.append("materials", JSON.stringify(payload.materials))
            body.append("cash_amount", String(payload.cash_amount || 0))
            if (payload.cash_amount > 0) {
              body.append("payment_method", payload.payment_method || "cash")
              if (payload.payment_date) body.append("payment_date", payload.payment_date)
            }
            if (payload.resolutionProof) {
              body.append("resolution_proof", payload.resolutionProof, payload.resolutionProof.name)
            }
            await axiosInstance.post(
              `/complaints/${complaint.id}/resolve-with-billing`,
              body,
              createFormDataRequestConfig(token)
            )
            toast.success("Complaint resolved")
            setShowResolve(false)
            onResolved?.()
            onClose()
          } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.response?.data?.error || "Resolve failed")
          } finally {
            setResolving(false)
          }
        }}
      />
    </Modal>
  )
}
