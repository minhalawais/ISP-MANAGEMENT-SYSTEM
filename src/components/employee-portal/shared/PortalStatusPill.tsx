"use client"

import type React from "react"
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Receipt,
  XCircle,
} from "lucide-react"

export type PortalStatusKind =
  | "open"
  | "pending"
  | "in_progress"
  | "resolved"
  | "completed"
  | "collected"
  | "closed"
  | "cancelled"
  | "active"
  | "inactive"
  | "paid"
  | "verified"
  | "partially_paid"
  | "overdue"
  | "failed"

const STATUS_STYLES: Record<
  PortalStatusKind,
  { className: string; icon: React.ElementType; label: string }
> = {
  open: {
    className: "bg-golden-amber/10 text-golden-amber",
    icon: Clock,
    label: "Open",
  },
  pending: {
    className: "bg-golden-amber/10 text-golden-amber",
    icon: Clock,
    label: "Pending",
  },
  in_progress: {
    className: "bg-electric-blue/10 text-electric-blue",
    icon: MessageSquare,
    label: "In Progress",
  },
  resolved: {
    className: "bg-emerald-green/10 text-emerald-green",
    icon: CheckCircle2,
    label: "Resolved",
  },
  completed: {
    className: "bg-emerald-green/10 text-emerald-green",
    icon: CheckCircle2,
    label: "Completed",
  },
  collected: {
    className: "bg-golden-amber/10 text-golden-amber",
    icon: Receipt,
    label: "Collected",
  },
  closed: {
    className: "bg-slate-gray/10 text-slate-gray",
    icon: XCircle,
    label: "Closed",
  },
  cancelled: {
    className: "bg-slate-gray/10 text-slate-gray",
    icon: XCircle,
    label: "Cancelled",
  },
  active: {
    className: "bg-emerald-green/10 text-emerald-green",
    icon: CheckCircle2,
    label: "Active",
  },
  inactive: {
    className: "bg-slate-gray/10 text-slate-gray",
    icon: XCircle,
    label: "Inactive",
  },
  paid: {
    className: "bg-emerald-green/10 text-emerald-green",
    icon: CheckCircle2,
    label: "Paid",
  },
  verified: {
    className: "bg-emerald-green/10 text-emerald-green",
    icon: CheckCircle2,
    label: "Verified",
  },
  partially_paid: {
    className: "bg-golden-amber/10 text-golden-amber",
    icon: Clock,
    label: "Partially Paid",
  },
  overdue: {
    className: "bg-coral-red/10 text-coral-red",
    icon: XCircle,
    label: "Overdue",
  },
  failed: {
    className: "bg-coral-red/10 text-coral-red",
    icon: XCircle,
    label: "Failed",
  },
}

/** Soft circular avatar colors for list rows keyed by status. */
export const STATUS_AVATAR: Record<PortalStatusKind, { bg: string; text: string }> = {
  open: { bg: "bg-golden-amber/15", text: "text-golden-amber" },
  pending: { bg: "bg-golden-amber/15", text: "text-golden-amber" },
  in_progress: { bg: "bg-electric-blue/15", text: "text-electric-blue" },
  resolved: { bg: "bg-emerald-green/15", text: "text-emerald-green" },
  completed: { bg: "bg-emerald-green/15", text: "text-emerald-green" },
  collected: { bg: "bg-golden-amber/15", text: "text-golden-amber" },
  closed: { bg: "bg-slate-gray/15", text: "text-slate-gray" },
  cancelled: { bg: "bg-slate-gray/15", text: "text-slate-gray" },
  active: { bg: "bg-emerald-green/15", text: "text-emerald-green" },
  inactive: { bg: "bg-slate-gray/15", text: "text-slate-gray" },
  paid: { bg: "bg-emerald-green/15", text: "text-emerald-green" },
  verified: { bg: "bg-emerald-green/15", text: "text-emerald-green" },
  partially_paid: { bg: "bg-golden-amber/15", text: "text-golden-amber" },
  overdue: { bg: "bg-coral-red/15", text: "text-coral-red" },
  failed: { bg: "bg-coral-red/15", text: "text-coral-red" },
}

function resolveStatus(status: string): PortalStatusKind {
  const key = status.toLowerCase().replace(/\s+/g, "_") as PortalStatusKind
  return STATUS_STYLES[key] ? key : "pending"
}

export function portalStatusLabel(status: string): string {
  return STATUS_STYLES[resolveStatus(status)].label
}

interface PortalStatusPillProps {
  status: string
  className?: string
}

export function PortalStatusPill({ status, className = "" }: PortalStatusPillProps) {
  const kind = resolveStatus(status)
  const config = STATUS_STYLES[kind]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}

export function portalStatusAvatar(status: string) {
  return STATUS_AVATAR[resolveStatus(status)]
}
