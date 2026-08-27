"use client"

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useNotifications } from "../hooks/useNotifications.ts"
import { useCompany } from "../context/CompanyContext.tsx"
import {
  type AppNotification,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "../services/notification.service.ts"
import { isEmployeePortalRole } from "../utils/authRedirects.ts"
import { getRole } from "../utils/auth.ts"

function formatRelative(iso?: string | null) {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { setPageTitle } = useCompany()
  const role = getRole()
  const {
    items,
    loading,
    statusFilter,
    setStatusFilter,
    refreshList,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications({ autoPoll: true, previewSize: 50 })

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)

  useEffect(() => {
    setPageTitle?.("Notifications")
  }, [setPageTitle])

  useEffect(() => {
    refreshList(statusFilter, 1)
  }, [statusFilter, refreshList])

  useEffect(() => {
    let cancelled = false
    fetchNotificationPreferences()
      .then((p) => {
        if (!cancelled) setPrefs(p)
      })
      .catch(() => {
        if (!cancelled) setPrefs(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onOpen = async (n: AppNotification) => {
    try {
      if (!n.is_read) await markRead(n.id)
    } catch {
      // continue
    }
    if (n.deep_link) navigate(n.deep_link)
  }

  const toggleMute = async (eventId: string) => {
    if (!prefs || prefsSaving) return
    const muted = new Set(prefs.muted_event_types)
    if (muted.has(eventId)) muted.delete(eventId)
    else muted.add(eventId)
    setPrefsSaving(true)
    try {
      const next = await updateNotificationPreferences({
        muted_event_types: Array.from(muted),
      })
      setPrefs(next)
    } catch {
      // keep previous
    } finally {
      setPrefsSaving(false)
    }
  }

  const toggleWhatsApp = async () => {
    if (!prefs || prefsSaving) return
    setPrefsSaving(true)
    try {
      const next = await updateNotificationPreferences({
        whatsapp_action_required: !prefs.whatsapp_action_required,
      })
      setPrefs(next)
    } catch {
      // keep previous
    } finally {
      setPrefsSaving(false)
    }
  }

  const backPath = isEmployeePortalRole(role) ? "/employee-portal" : "/reporting/executive"

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="p-2 rounded-md text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-deep-ocean">Notifications</h1>
              <p className="text-xs text-slate-gray">{unreadCount} unread</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrefsOpen((v) => !v)}
              className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-deep-ocean hover:bg-slate-50"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => markAllRead().then(() => refreshList(statusFilter))}
              className="h-9 px-3 text-sm rounded-md border border-slate-200 bg-white text-deep-ocean hover:bg-slate-50"
            >
              Mark all read
            </button>
          </div>
        </div>

        {prefsOpen && prefs && (
          <div className="mb-4 p-4 bg-white border border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-deep-ocean mb-2">Mute event types</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
              {prefs.known_event_types.map((ev) => {
                const muted = prefs.muted_event_types.includes(ev.id)
                return (
                  <label
                    key={ev.id}
                    className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={muted}
                      disabled={prefsSaving}
                      onChange={() => toggleMute(ev.id)}
                      className="rounded border-slate-300"
                    />
                    <span>{ev.label}</span>
                  </label>
                )
              })}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.whatsapp_action_required}
                disabled={prefsSaving}
                onChange={toggleWhatsApp}
                className="rounded border-slate-300"
              />
              <span>WhatsApp for action-required alerts</span>
            </label>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {(["unread", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`h-9 px-3 text-sm rounded-md border ${
                statusFilter === tab
                  ? "bg-electric-blue text-white border-electric-blue"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {tab === "unread" ? "Unread" : "All"}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <p className="px-4 py-8 text-sm text-slate-gray text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-gray text-center">No notifications</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onOpen(n)}
                className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-electric-blue flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-deep-ocean">{n.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatRelative(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-gray mt-0.5">{n.body}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
