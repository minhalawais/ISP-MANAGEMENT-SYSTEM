"use client"

import { useEffect, useState, type ElementType } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  MessageSquare,
  Star,
  UserCog,
  X,
  XCircle,
} from "lucide-react"
import customerPortalAxios from "../../utils/customerPortalAxios.ts"
import { ComplaintFilePreview } from "../complaint/ComplaintFilePreview.tsx"
import { PortalStatusPill } from "../employee-portal/shared/PortalStatusPill.tsx"

interface ActivityEvent {
  id: string
  action?: string
  actor_name?: string
  created_at: string | null
  summary: string
}

export interface CustomerPortalComplaintDetail {
  id: string
  ticket_number: string
  description: string
  category: string | null
  category_label: string | null
  status: string
  assigned_to_name: string | null
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
  response_due_date: string | null
  satisfaction_rating: number | null
  remarks: string | null
  feedback_comments: string | null
  attachment_path: string | null
  resolution_proof: string | null
  activity?: ActivityEvent[]
}

interface Props {
  complaintId: string | null
  onClose: () => void
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

const statusIcon: Record<string, ElementType> = {
  open: Clock,
  in_progress: MessageSquare,
  resolved: CheckCircle2,
  closed: XCircle,
}

export function CustomerPortalComplaintDetailModal({ complaintId, onClose }: Props) {
  const [complaint, setComplaint] = useState<CustomerPortalComplaintDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!complaintId) {
      setComplaint(null)
      setError(null)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await customerPortalAxios.get(
          `/public/customer/complaints/${complaintId}`
        )
        if (!cancelled) setComplaint(response.data)
      } catch {
        if (!cancelled) setError("Failed to load complaint details.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [complaintId])

  if (!complaintId) return null

  const StatusIcon = statusIcon[complaint?.status || ""] || AlertCircle
  const activity = complaint?.activity || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 bg-portal-primary px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {complaint ? `Ticket #${complaint.ticket_number}` : "Complaint details"}
            </h3>
            {complaint && (
              <p className="truncate text-[11px] text-white/80">
                {complaint.category_label || complaint.category || "Complaint"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-gray">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric-blue border-t-transparent" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="h-7 w-7 text-coral-red" />
              <p className="text-sm text-slate-gray">{error}</p>
            </div>
          )}

          {!loading && !error && complaint && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <PortalStatusPill status={complaint.status} />
                <span className="inline-flex items-center gap-1 text-xs text-slate-gray">
                  <StatusIcon className="h-3.5 w-3.5" />
                  {complaint.status.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-deep-ocean/10 bg-portal-tint/60 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                    Assigned to
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-deep-ocean">
                    <UserCog className="h-3.5 w-3.5 text-portal-primary" />
                    {complaint.assigned_to_name || "Pending assignment"}
                  </p>
                </div>
                <div className="rounded-lg border border-deep-ocean/10 bg-portal-tint/60 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                    Opened
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-deep-ocean">
                    <Calendar className="h-3.5 w-3.5 text-portal-primary" />
                    {formatDate(complaint.created_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-deep-ocean/10 bg-portal-tint/60 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                    Due
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-deep-ocean">
                    {formatDate(complaint.response_due_date)}
                  </p>
                </div>
                <div className="rounded-lg border border-deep-ocean/10 bg-portal-tint/60 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-gray">
                    Resolved
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-deep-ocean">
                    {formatDate(complaint.resolved_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-deep-ocean">
                  Description
                </p>
                <div className="whitespace-pre-wrap rounded-lg border border-electric-blue/15 bg-light-sky/50 p-3 text-sm text-deep-ocean">
                  {complaint.description || "—"}
                </div>
              </div>

              {complaint.remarks && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-deep-ocean">
                    Resolution notes
                  </p>
                  <div className="whitespace-pre-wrap rounded-lg border border-emerald-green/25 bg-emerald-green/10 p-3 text-sm text-deep-ocean">
                    {complaint.remarks}
                  </div>
                </div>
              )}

              {complaint.feedback_comments && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-deep-ocean">
                    Your feedback
                  </p>
                  <div className="whitespace-pre-wrap rounded-lg border border-golden-amber/25 bg-golden-amber/5 p-3 text-sm text-deep-ocean">
                    {complaint.feedback_comments}
                  </div>
                </div>
              )}

              {complaint.satisfaction_rating != null && (
                <div className="flex items-center gap-1.5 text-sm text-deep-ocean">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-gray">
                    Rating
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= (complaint.satisfaction_rating || 0)
                          ? "fill-golden-amber text-golden-amber"
                          : "text-slate-gray/30"
                      }`}
                    />
                  ))}
                </div>
              )}

              {(complaint.attachment_path || complaint.resolution_proof) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-deep-ocean">
                    Attachments
                  </p>
                  {complaint.attachment_path && (
                    <ComplaintFilePreview
                      label="Your attachment"
                      filePath={complaint.attachment_path}
                      fetchUrl={`/public/customer/complaints/${complaint.id}/attachment`}
                      client={customerPortalAxios}
                      actionClassName="text-electric-blue"
                    />
                  )}
                  {complaint.resolution_proof && (
                    <ComplaintFilePreview
                      label="Resolution proof"
                      filePath={complaint.resolution_proof}
                      fetchUrl={`/public/customer/complaints/${complaint.id}/resolution-proof`}
                      client={customerPortalAxios}
                      actionClassName="text-electric-blue"
                    />
                  )}
                </div>
              )}

              {activity.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-deep-ocean">
                    <History className="h-3.5 w-3.5" />
                    Activity
                  </p>
                  <ul className="max-h-40 overflow-y-auto rounded-lg border border-deep-ocean/10">
                    {activity.map((event, index) => (
                      <li
                        key={event.id || `${event.summary}-${index}`}
                        className={`border-l-2 border-electric-blue px-3 py-2 text-sm ${
                          index % 2 === 0 ? "bg-portal-tint/50" : "bg-white"
                        }`}
                      >
                        <p className="font-medium text-deep-ocean">{event.summary}</p>
                        <p className="text-[11px] text-slate-gray">
                          {event.actor_name || "Support team"}
                          {event.created_at ? ` · ${formatDate(event.created_at)}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-full rounded-lg bg-portal-primary text-sm font-medium text-white hover:bg-deep-ocean"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
