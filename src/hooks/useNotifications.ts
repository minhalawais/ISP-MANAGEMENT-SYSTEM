import { useCallback, useEffect, useRef, useState } from "react"
import {
  type AppNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.ts"

const POLL_MS = 45000

/**
 * Poll-only inbox updates.
 * SSE (/notifications/stream) is disabled: under Flask + uvicorn WSGI adapters,
 * long-lived streams hold worker threads and starve other API requests (timeouts).
 */
export function useNotifications(options?: { autoPoll?: boolean; previewSize?: number }) {
  const autoPoll = options?.autoPoll !== false
  const previewSize = options?.previewSize ?? 15
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<AppNotification[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("unread")
  const mounted = useRef(true)

  const refreshUnread = useCallback(async () => {
    try {
      const count = await fetchUnreadCount()
      if (mounted.current) setUnreadCount(count)
    } catch {
      // ignore poll errors
    }
  }, [])

  const refreshList = useCallback(
    async (status: "all" | "unread" = statusFilter, page = 1) => {
      setLoading(true)
      try {
        const res = await fetchNotifications({
          status,
          page,
          page_size: previewSize,
        })
        if (mounted.current) {
          setItems(res.items)
          setTotal(res.total)
        }
      } catch {
        if (mounted.current) {
          setItems([])
          setTotal(0)
        }
      } finally {
        if (mounted.current) setLoading(false)
      }
    },
    [previewSize, statusFilter],
  )

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id)
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    const updated = await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    return updated
  }, [])

  useEffect(() => {
    mounted.current = true
    refreshUnread()
    if (autoPoll) {
      refreshList("unread")
    }
    return () => {
      mounted.current = false
    }
  }, [autoPoll, refreshUnread, refreshList])

  useEffect(() => {
    if (!autoPoll) return
    const tick = () => {
      if (document.visibilityState === "hidden") return
      refreshUnread()
    }
    const id = window.setInterval(tick, POLL_MS)
    const onVis = () => {
      if (document.visibilityState === "visible") refreshUnread()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [autoPoll, refreshUnread])

  return {
    unreadCount,
    items,
    total,
    loading,
    statusFilter,
    setStatusFilter,
    refreshUnread,
    refreshList,
    markRead,
    markAllRead,
  }
}
