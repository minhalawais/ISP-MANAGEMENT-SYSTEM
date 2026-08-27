"use client"

import React, { useContext, useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "../../hooks/useNotifications.ts"
import type { AppNotification } from "../../services/notification.service.ts"
import { NotificationsContext } from "./NotificationsProvider.tsx"

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

function badgeLabel(count: number) {
  if (count <= 0) return null
  return count > 99 ? "99+" : String(count)
}

type InboxApi = ReturnType<typeof useNotifications>

const NotificationBellView: React.FC<{ className?: string; api: InboxApi }> = ({
  className = "",
  api,
}) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { unreadCount, items, refreshList, refreshUnread, markRead } = api

  useEffect(() => {
    if (!open) return
    refreshList("unread")
  }, [open, refreshList])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const onItemClick = async (n: AppNotification) => {
    try {
      if (!n.is_read) await markRead(n.id)
    } catch {
      // still navigate
    }
    setOpen(false)
    refreshUnread()
    if (n.deep_link) navigate(n.deep_link)
  }

  const badge = badgeLabel(unreadCount)

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-[#4A5568] hover:bg-[#EBF5FF] rounded-full transition-colors duration-200"
      >
        <Bell className="h-5 w-5" />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-semibold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-deep-ocean">Notifications</span>
            <button
              type="button"
              className="text-xs text-electric-blue hover:underline"
              onClick={() => {
                setOpen(false)
                navigate("/notifications")
              }}
            >
              View all
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-gray text-center">No unread notifications</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onItemClick(n)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    n.is_read ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-electric-blue flex-shrink-0" />
                    )}
                    <div className={!n.is_read ? "" : "pl-3.5"}>
                      <p className="text-sm font-medium text-deep-ocean leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-gray mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const NotificationBellStandalone: React.FC<{ className?: string }> = ({ className }) => {
  const api = useNotifications({ autoPoll: true, previewSize: 15 })
  return <NotificationBellView className={className} api={api} />
}

export const NotificationBell: React.FC<{ className?: string }> = ({ className = "" }) => {
  const shared = useContext(NotificationsContext)
  if (shared) return <NotificationBellView className={className} api={shared} />
  return <NotificationBellStandalone className={className} />
}
