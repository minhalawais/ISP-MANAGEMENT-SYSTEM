"use client"

import React, { createContext } from "react"
import { useNotifications } from "../../hooks/useNotifications.ts"

type NotificationsApi = ReturnType<typeof useNotifications>

export const NotificationsContext = createContext<NotificationsApi | null>(null)

/** One shared poller for layouts that render multiple bells (desktop + mobile headers). */
export const NotificationsProvider: React.FC<{
  children: React.ReactNode
  previewSize?: number
}> = ({ children, previewSize = 15 }) => {
  const api = useNotifications({ autoPoll: true, previewSize })
  return (
    <NotificationsContext.Provider value={api}>{children}</NotificationsContext.Provider>
  )
}
