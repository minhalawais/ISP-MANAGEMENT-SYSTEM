"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "admin_sidebar_open"

type AdminLayoutContextValue = {
  isSidebarOpen: boolean
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
  /** True when page is rendered inside AdminPortalLayout (chrome provided). */
  hasChrome: true
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null)

function readStoredOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === "1" || raw === "true"
  } catch {
    return true
  }
}

export const AdminLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(readStoredOpen)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isSidebarOpen ? "1" : "0")
    } catch {
      // ignore
    }
  }, [isSidebarOpen])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({
      isSidebarOpen,
      setIsSidebarOpen,
      toggleSidebar,
      hasChrome: true as const,
    }),
    [isSidebarOpen, toggleSidebar],
  )

  return <AdminLayoutContext.Provider value={value}>{children}</AdminLayoutContext.Provider>
}

/** Returns layout chrome API when inside AdminPortalLayout; otherwise null. */
export function useAdminLayout(): AdminLayoutContextValue | null {
  return useContext(AdminLayoutContext)
}

export function useOptionalAdminChrome(): boolean {
  return useContext(AdminLayoutContext)?.hasChrome === true
}
