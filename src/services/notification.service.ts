import axiosInstance from "../utils/axiosConfig.ts"
import { getToken } from "../utils/auth.ts"

export interface AppNotification {
  id: string
  company_id?: string | null
  recipient_user_id: string
  actor_user_id?: string | null
  event_type: string
  entity_type: string
  entity_id: string
  title: string
  body: string
  severity: string
  payload?: Record<string, unknown>
  deep_link?: string | null
  is_read: boolean
  read_at?: string | null
  created_at?: string | null
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

export async function fetchNotifications(params?: {
  status?: "all" | "unread"
  page?: number
  page_size?: number
}): Promise<{ items: AppNotification[]; total: number }> {
  const res = await axiosInstance.get("/notifications", {
    headers: authHeaders(),
    params: {
      status: params?.status || "all",
      page: params?.page || 1,
      page_size: params?.page_size || 20,
    },
  })
  return { items: res.data.items || [], total: res.data.total || 0 }
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await axiosInstance.get("/notifications/unread-count", {
    headers: authHeaders(),
  })
  return Number(res.data?.count || 0)
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const res = await axiosInstance.post(`/notifications/${id}/read`, null, {
    headers: authHeaders(),
  })
  return res.data
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await axiosInstance.post("/notifications/read-all", null, {
    headers: authHeaders(),
  })
  return Number(res.data?.updated || 0)
}

export interface NotificationPreferences {
  muted_event_types: string[]
  whatsapp_action_required: boolean
  known_event_types: { id: string; label: string }[]
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await axiosInstance.get("/notifications/preferences", {
    headers: authHeaders(),
  })
  return res.data
}

export async function updateNotificationPreferences(payload: {
  muted_event_types?: string[]
  whatsapp_action_required?: boolean
}): Promise<NotificationPreferences> {
  const res = await axiosInstance.put("/notifications/preferences", payload, {
    headers: authHeaders(),
  })
  return res.data
}

export function notificationsStreamUrl(): string {
  const token = getToken()
  const base = (axiosInstance.defaults.baseURL || "").replace(/\/$/, "")
  return `${base}/notifications/stream?token=${encodeURIComponent(token || "")}`
}
