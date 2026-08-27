"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { getToken, removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { LOGIN_ROUTE } from "../utils/authRedirects.ts"
import { useCompany } from "../context/CompanyContext.tsx"
import {
  LayoutDashboard,
  User,
  ClipboardList,
  AlertCircle,
  Users,
  Wallet,
  Box,
  RefreshCw,
  MoreHorizontal,
  LogOut,
  ChevronRight,
} from "lucide-react"

import { NotificationBell } from "../components/notifications/NotificationBell.tsx"
import { NotificationsProvider } from "../components/notifications/NotificationsProvider.tsx"
import { PortalDashboard } from "../components/employee-portal/PortalDashboard.tsx"
import { PortalProfile } from "../components/employee-portal/PortalProfile.tsx"
import { PortalTasks } from "../components/employee-portal/PortalTasks.tsx"
import { PortalComplaints } from "../components/employee-portal/PortalComplaints.tsx"
import { PortalCustomers } from "../components/employee-portal/PortalCustomers.tsx"
import { PortalFinancial } from "../components/employee-portal/PortalFinancial.tsx"
import { PortalInventory } from "../components/employee-portal/PortalInventory.tsx"
import { PortalRecoveries } from "../components/employee-portal/PortalRecoveries.tsx"
import { PortalSheet } from "../components/employee-portal/shared/PortalSheet.tsx"
import {
  mergePortalAccess,
  type PortalModuleName,
} from "../utils/employeePortalAccess.ts"
import {
  EMPLOYEE_PORTAL_SECTION_STORAGE_KEY,
  isPortalSection,
  readStoredPortalSection,
  sectionFromSearch,
  storePortalSection,
} from "../utils/employeePortalNavigation.ts"

interface EmployeeProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  picture: string | null
  enabled_modules?: string[]
}

type SectionType = PortalModuleName

const ALL_SECTIONS: { id: SectionType; name: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", name: "My Tasks", icon: ClipboardList },
  { id: "complaints", name: "Complaints", icon: AlertCircle },
  { id: "customers", name: "Customers", icon: Users },
  { id: "recoveries", name: "Recoveries", icon: RefreshCw },
  { id: "financial", name: "Financial", icon: Wallet },
  { id: "inventory", name: "Inventory", icon: Box },
  { id: "profile", name: "My Profile", icon: User },
]

// Priority order for the mobile bottom tab bar; remaining enabled sections fall into "More".
const PRIMARY_TAB_IDS: SectionType[] = ["dashboard", "tasks", "customers", "recoveries"]

function BrandMark({ logoUrl, name, sizeClassName }: { logoUrl?: string | null; name?: string; sizeClassName: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || "Company logo"}
        className={`${sizeClassName} max-w-[140px] object-contain rounded-md`}
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = "none"
        }}
      />
    )
  }
  return (
    <div className={`${sizeClassName} aspect-square rounded-lg bg-gradient-to-br from-portal-accent to-portal-primary flex items-center justify-center`}>
      <LayoutDashboard className="w-1/2 h-1/2 text-white" />
    </div>
  )
}

export default function EmployeePortal() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { company } = useCompany()
  const [activeSection, setActiveSectionState] = useState<SectionType>(
    () => sectionFromSearch(searchParams.toString()) || readStoredPortalSection() || "dashboard"
  )
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [enabledModuleIds, setEnabledModuleIds] = useState<string[]>(
    ALL_SECTIONS.map((s) => s.id)
  )
  const [loading, setLoading] = useState(true)

  const setActiveSection = useCallback(
    (id: SectionType) => {
      setActiveSectionState(id)
      storePortalSection(id)
    },
    []
  )

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    storePortalSection(activeSection)
    const current = searchParams.get("section")
    const desired = activeSection === "dashboard" ? null : activeSection
    if (current === desired) return
    if (desired && !isPortalSection(desired)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (desired) next.set("section", desired)
        else next.delete("section")
        return next
      },
      { replace: true }
    )
  }, [activeSection, searchParams, setSearchParams])

  const sections = useMemo(
    () => ALL_SECTIONS.filter((s) => enabledModuleIds.includes(s.id)),
    [enabledModuleIds]
  )

  const tabSections = useMemo(
    () =>
      PRIMARY_TAB_IDS.map((id) => sections.find((s) => s.id === id)).filter(
        (s): s is (typeof ALL_SECTIONS)[number] => Boolean(s)
      ),
    [sections]
  )

  const moreSections = useMemo(
    () => sections.filter((s) => !tabSections.some((t) => t.id === s.id)),
    [sections, tabSections]
  )

  useEffect(() => {
    if (!sections.length) return
    if (!sections.some((s) => s.id === activeSection)) {
      setActiveSection(sections[0].id)
    }
  }, [sections, activeSection, setActiveSection])

  const fetchProfile = async () => {
    try {
      const token = getToken()
      const response = await axiosInstance.get("/employee-portal/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(response.data)
      const fromApi = response.data?.enabled_modules
      if (Array.isArray(fromApi) && fromApi.length) {
        setEnabledModuleIds(fromApi)
      } else {
        const merged = mergePortalAccess(response.data?.portal_access)
        setEnabledModuleIds(
          ALL_SECTIONS.map((s) => s.id).filter((id) => merged.modules[id]?.enabled)
        )
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(EMPLOYEE_PORTAL_SECTION_STORAGE_KEY)
    } catch {
      // Ignore private-mode / unavailable storage.
    }
    removeToken()
    navigate(LOGIN_ROUTE)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <PortalDashboard />
      case "profile":
        return <PortalProfile onProfileUpdate={fetchProfile} />
      case "tasks":
        return <PortalTasks />
      case "complaints":
        return <PortalComplaints />
      case "customers":
        return <PortalCustomers />
      case "financial":
        return <PortalFinancial />
      case "inventory":
        return <PortalInventory />
      case "recoveries":
        return <PortalRecoveries />
      default:
        return <PortalDashboard />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-portal-primary"></div>
      </div>
    )
  }

  const isMoreActive = moreSections.some((s) => s.id === activeSection)
  const bottomNavItems = [
    ...tabSections,
    ...(moreSections.length > 0
      ? [{ id: "more" as const, name: "More", icon: MoreHorizontal }]
      : []),
  ]

  return (
    <NotificationsProvider>
    <div className="min-h-screen bg-[#F4F7FA]">
      <header className="hidden lg:flex relative bg-white shadow-sm px-6 py-3 items-center justify-between sticky top-0 z-50">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-portal-accent to-portal-primary" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BrandMark logoUrl={company?.logo_url} name={company?.name} sizeClassName="h-8" />
            <span className="text-lg font-bold text-gray-900">Employee Portal</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">
            {sections.find((s) => s.id === activeSection)?.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{profile?.first_name}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-portal-accent to-portal-primary flex items-center justify-center text-white font-semibold text-sm">
              {profile?.first_name?.charAt(0) || "E"}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <header className="lg:hidden relative bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-portal-accent to-portal-primary" />
        <div className="flex items-center gap-2">
          <BrandMark logoUrl={company?.logo_url} name={company?.name} sizeClassName="h-7" />
          <h1 className="text-base font-semibold text-gray-900">Employee Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setActiveSection("profile")}
            aria-label="My profile"
            className="w-8 h-8 rounded-full bg-portal-accent flex items-center justify-center text-white font-medium text-sm"
          >
            {profile?.first_name?.charAt(0) || "E"}
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:static lg:top-[57px] lg:h-[calc(100vh-57px)] w-64 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-100 bg-portal-tint">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-portal-accent to-portal-primary flex items-center justify-center text-white font-semibold ring-2 ring-white shadow">
                {profile?.first_name?.charAt(0) || "E"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-portal-primary capitalize truncate">{profile?.role?.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-portal-primary text-white shadow-md shadow-portal-primary/25"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-white/60" />}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{section.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6 overflow-auto min-h-[calc(100vh-57px)]">
          <div className="max-w-screen-2xl mx-auto">
            <div className="lg:hidden mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                {sections.find((s) => s.id === activeSection)?.name}
              </h1>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, minmax(0, 1fr))` }}
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isMore = item.id === "more"
            const isActive = isMore ? isMoreActive : activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (isMore ? setIsMoreOpen(true) : setActiveSection(item.id))}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? "text-portal-primary" : "text-gray-400"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-portal-tint" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                {item.name}
              </button>
            )
          })}
        </div>
      </nav>

      <PortalSheet open={isMoreOpen} onClose={() => setIsMoreOpen(false)} title="More">
        <div className="space-y-1">
          {moreSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setActiveSection(section.id)
                  setIsMoreOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-portal-tint text-portal-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 text-gray-400" />
                {section.name}
              </button>
            )
          })}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </PortalSheet>
    </div>
    </NotificationsProvider>
  )
}
