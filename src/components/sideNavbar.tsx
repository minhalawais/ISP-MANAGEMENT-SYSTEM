"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  Package,
  Truck,
  BarChart,
  Map,
  UserCheck,
  MessageSquare,
  CheckSquare,
  LogOut,
  Search,
  Clipboard,
  Banknote,
  Receipt,
  Network,
  DollarSign,
  TrendingUp,
  X,
  ChevronDown,
  PieChart,
  Activity,
  Settings,
  Layers,
  Briefcase,
  Wallet,
  Wrench,
  MapPin,
  Store,
  Shield,
} from "lucide-react"
import { removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"
import { LOGIN_ROUTE } from "../utils/authRedirects.ts"
import { isAnyPathActive, isPathActive } from "../utils/sidebarNav.ts"

const SIDEBAR_OPEN_DROPDOWNS_KEY = "sidebar_open_dropdowns"
const SIDEBAR_SCROLL_POSITION_KEY = "sidebar_scroll_position"

export type SidebarLeaf = {
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export type SidebarGroup = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  isDropdown: true
  subItems: SidebarLeaf[]
}

export type SidebarLink = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  isDropdown?: false
  path: string
}

export type SidebarItem = SidebarGroup | SidebarLink

export const pinnedItems: SidebarLeaf[] = [
  { title: "Executive Overview", path: "/reporting/executive", icon: PieChart },
  { title: "Customers", path: "/customer-management", icon: Users },
  { title: "Billing & Invoices", path: "/billing-invoices", icon: Receipt },
  { title: "Payments", path: "/payment-management", icon: CreditCard },
  { title: "Complaints", path: "/complaint-management", icon: AlertCircle },
]

export const menuItems: SidebarItem[] = [
  {
    id: "reporting",
    title: "Reporting",
    icon: BarChart,
    isDropdown: true,
    subItems: [
      { title: "Executive Overview", path: "/reporting/executive", icon: PieChart },
      { title: "Customer Analytics", path: "/reporting/customers", icon: Users },
      { title: "Financial Analytics", path: "/reporting/financial", icon: DollarSign },
      { title: "Service & Support", path: "/reporting/service", icon: Wrench },
      { title: "Inventory Analytics", path: "/reporting/inventory", icon: Package },
      { title: "Employee Performance", path: "/reporting/employees", icon: UserCheck },
      { title: "Regional Analysis", path: "/reporting/regional", icon: MapPin },
      { title: "Service Plans", path: "/reporting/plans", icon: FileText },
      { title: "Collections", path: "/reporting/collections", icon: Wallet },
      { title: "Operations", path: "/reporting/operations", icon: Activity },
    ],
  },
  {
    id: "people",
    title: "People & Vendors",
    icon: Briefcase,
    isDropdown: true,
    subItems: [
      { title: "Employee Management", path: "/employee-management", icon: Users },
      { title: "Vendor Management", path: "/vendor-management", icon: Store },
      { title: "Supplier Management", path: "/supplier-management", icon: Truck },
      { title: "ISP Management", path: "/isp-management", icon: Network },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    icon: Users,
    isDropdown: true,
    subItems: [
      { title: "Customer Management", path: "/customer-management", icon: Users },
      { title: "Service Plan Management", path: "/service-plan-management", icon: FileText },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: DollarSign,
    isDropdown: true,
    subItems: [
      { title: "Payment Management", path: "/payment-management", icon: CreditCard },
      { title: "ISP Payments", path: "/isp-payment-management", icon: Network },
      { title: "Billing & Invoices", path: "/billing-invoices", icon: Receipt },
      { title: "Bank Accounts", path: "/bank-management", icon: Banknote },
      { title: "Expense Management", path: "/expense-management", icon: DollarSign },
      { title: "Extra Income", path: "/extra-income-management", icon: TrendingUp },
    ],
  },
  {
    id: "ops",
    title: "Ops",
    icon: AlertCircle,
    isDropdown: true,
    subItems: [
      { title: "Complaint Management", path: "/complaint-management", icon: AlertCircle },
      { title: "Task Management", path: "/task-management", icon: CheckSquare },
      { title: "Recovery Tasks", path: "/recovery-task-management", icon: UserCheck },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    path: "/inventory-management",
  },
  {
    id: "areas",
    title: "Areas",
    icon: Map,
    isDropdown: true,
    subItems: [
      { title: "Area/Zone Management", path: "/area-zone-management", icon: Map },
      { title: "Sub-Zones", path: "/areas", icon: Layers },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: Shield,
    isDropdown: true,
    subItems: [
      { title: "Messaging", path: "/message-management", icon: MessageSquare },
      { title: "WhatsApp Queue", path: "/whatsapp/queue", icon: MessageSquare },
      { title: "Bulk Sender", path: "/whatsapp/bulk-sender", icon: MessageSquare },
      { title: "WhatsApp Settings", path: "/whatsapp/settings", icon: Settings },
      { title: "Logs Management", path: "/logs-management", icon: Clipboard },
    ],
  },
]

function isGroup(item: SidebarItem): item is SidebarGroup {
  return item.isDropdown === true
}

function groupPaths(item: SidebarGroup): string[] {
  return item.subItems.map((s) => s.path)
}

function readOpenDropdowns(): string[] {
  try {
    const saved = localStorage.getItem(SIDEBAR_OPEN_DROPDOWNS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function readScrollPosition(): number {
  try {
    const saved = localStorage.getItem(SIDEBAR_SCROLL_POSITION_KEY)
    return saved ? parseInt(saved, 10) || 0 : 0
  } catch {
    return 0
  }
}

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [flyoutId, setFlyoutId] = useState<string | null>(null)
  const [flyoutTop, setFlyoutTop] = useState(56)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(readOpenDropdowns)
  const persistedOpenRef = useRef<string[]>(readOpenDropdowns())
  const scrollRestoredRef = useRef(false)

  const expanded = isMobile ? isOpen : isOpen

  const clearFlyoutCloseTimer = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current)
      flyoutCloseTimer.current = null
    }
  }

  /** Align flyout top with the hovered/clicked icon; clamp so it stays on-screen. */
  const positionFlyout = (anchor: HTMLElement | null) => {
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const estimatedH = flyoutRef.current?.offsetHeight ?? 160
    const maxTop = Math.max(56, window.innerHeight - estimatedH - 8)
    setFlyoutTop(Math.min(Math.max(rect.top, 56), maxTop))
  }

  const openFlyout = (id: string, anchor?: HTMLElement | null) => {
    clearFlyoutCloseTimer()
    if (anchor) positionFlyout(anchor)
    setFlyoutId(id)
  }

  const scheduleFlyoutClose = () => {
    clearFlyoutCloseTimer()
    flyoutCloseTimer.current = setTimeout(() => setFlyoutId(null), 180)
  }

  useEffect(() => () => clearFlyoutCloseTimer(), [])

  // Re-clamp after flyout paints (real height known)
  useEffect(() => {
    if (!flyoutId || !flyoutRef.current) return
    const el = flyoutRef.current
    const h = el.offsetHeight
    const maxTop = Math.max(56, window.innerHeight - h - 8)
    const clamped = Math.min(Math.max(flyoutTop, 56), maxTop)
    if (clamped !== flyoutTop) setFlyoutTop(clamped)
  }, [flyoutId, flyoutTop])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_DROPDOWNS_KEY, JSON.stringify(openDropdowns))
      if (!searchQuery.trim()) persistedOpenRef.current = openDropdowns
    } catch {
      // ignore
    }
  }, [openDropdowns, searchQuery])

  const saveScrollPosition = useCallback(() => {
    if (!navRef.current) return
    const position = navRef.current.scrollTop
    try {
      localStorage.setItem(SIDEBAR_SCROLL_POSITION_KEY, String(position))
    } catch {
      // ignore
    }
  }, [])

  const restoreScrollPosition = useCallback(() => {
    if (!navRef.current) return
    navRef.current.scrollTop = readScrollPosition()
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && setIsOpen) {
        const sidebar = document.getElementById("sidebar")
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      if (flyoutId && flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        const sidebar = document.getElementById("sidebar")
        if (sidebar && sidebar.contains(event.target as Node)) return
        setFlyoutId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isOpen, setIsOpen, flyoutId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFlyoutId(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    setFlyoutId(null)
  }, [location.pathname])

  // Auto-expand group for current route
  useEffect(() => {
    const activeGroup = menuItems.find(
      (item) => isGroup(item) && isAnyPathActive(location.pathname, groupPaths(item)),
    )
    if (activeGroup && isGroup(activeGroup)) {
      setOpenDropdowns((prev) =>
        prev.includes(activeGroup.id) ? prev : [...prev, activeGroup.id],
      )
    }
  }, [location.pathname])

  // Restore scroll when expanded / mounted
  useEffect(() => {
    if (!expanded && !isMobile) return
    const id = requestAnimationFrame(() => {
      restoreScrollPosition()
      scrollRestoredRef.current = true
      const active = navRef.current?.querySelector("[data-sidebar-active='true']")
      if (active && typeof (active as HTMLElement).scrollIntoView === "function") {
        ;(active as HTMLElement).scrollIntoView({ block: "nearest" })
      }
    })
    return () => cancelAnimationFrame(id)
  }, [expanded, isMobile, location.pathname, restoreScrollPosition, openDropdowns])

  const q = searchQuery.trim().toLowerCase()

  // Search: auto-open matching groups
  useEffect(() => {
    if (!q) {
      setOpenDropdowns(persistedOpenRef.current)
      return
    }
    const matchIds = menuItems
      .filter((item) => {
        if (!isGroup(item)) {
          return item.title.toLowerCase().includes(q)
        }
        if (item.title.toLowerCase().includes(q)) return true
        return item.subItems.some((s) => s.title.toLowerCase().includes(q))
      })
      .map((item) => item.id)
    setOpenDropdowns(matchIds)
  }, [q])

  const filteredMenuItems = useMemo(() => {
    if (!q) return menuItems
    return menuItems.filter((item) => {
      if (!isGroup(item)) return item.title.toLowerCase().includes(q)
      if (item.title.toLowerCase().includes(q)) return true
      return item.subItems.some((s) => s.title.toLowerCase().includes(q))
    })
  }, [q])

  const filteredPinned = useMemo(() => {
    if (!q) return pinnedItems
    return pinnedItems.filter((p) => p.title.toLowerCase().includes(q))
  }, [q])

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout")
      removeToken()
      navigate(LOGIN_ROUTE)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleLinkClick = () => {
    saveScrollPosition()
    setFlyoutId(null)
    if (isMobile && setIsOpen) setIsOpen(false)
  }

  const flyoutGroup = useMemo(() => {
    if (!flyoutId) return null
    const item = menuItems.find((m) => m.id === flyoutId)
    return item && isGroup(item) ? item : null
  }, [flyoutId])

  const renderLeafLink = (sub: SidebarLeaf, opts?: { inFlyout?: boolean }) => {
    const SubIcon = sub.icon
    const active = isPathActive(location.pathname, sub.path)
    return (
      <Link
        key={sub.path}
        to={sub.path}
        data-sidebar-active={active ? "true" : undefined}
        className={`group flex items-center px-2.5 py-1.5 rounded-md transition-colors duration-150 text-sm ${
          active
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
        } ${opts?.inFlyout ? "w-full" : ""}`}
        onClick={handleLinkClick}
      >
        <SubIcon
          className={`h-4 w-4 mr-2.5 flex-shrink-0 ${
            active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          }`}
        />
        <span className={`font-medium truncate ${active ? "text-blue-700" : ""}`}>{sub.title}</span>
      </Link>
    )
  }

  const onCollapsedIconClick = (item: SidebarItem, anchor: HTMLElement) => {
    if (!isGroup(item)) {
      navigate(item.path)
      handleLinkClick()
      return
    }
    if (item.subItems.length === 1) {
      navigate(item.subItems[0].path)
      handleLinkClick()
      return
    }
    if (flyoutId === item.id) {
      setFlyoutId(null)
      return
    }
    positionFlyout(anchor)
    setFlyoutId(item.id)
  }

  const onCollapsedIconEnter = (item: SidebarItem, anchor: HTMLElement) => {
    if (!isGroup(item) || item.subItems.length <= 1) return
    openFlyout(item.id, anchor)
  }

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`
          bg-white
          ${expanded ? "w-72" : "w-20"}
          h-[calc(100vh-3.5rem)]
          flex flex-col
          transition-[width] duration-300 ease-in-out
          fixed z-30 top-14
          ${isMobile && !isOpen ? "-left-72" : "left-0"}
          ${isMobile ? "z-50" : ""}
          overflow-hidden
          border-r border-slate-200
        `}
      >
        {isMobile && isOpen && (
          <button
            type="button"
            className="absolute top-3 right-3 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg z-10"
            onClick={() => setIsOpen && setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {expanded && (
          <div className="p-3 flex-shrink-0 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules..."
                className="w-full h-9 px-3 pr-9 bg-white text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-2.5 top-2.5 text-slate-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        )}

        <nav
          ref={navRef}
          className={`flex-1 overflow-y-auto py-2 scrollbar-thin ${
            expanded ? "px-2" : "px-2 flex flex-col items-center gap-0.5"
          }`}
          onScroll={saveScrollPosition}
        >
          {/* Pinned */}
          {filteredPinned.length > 0 && (
            <div className={`mb-2 ${expanded ? "" : "w-full flex flex-col items-center gap-0.5"}`}>
              {expanded && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Frequent
                </p>
              )}
              {filteredPinned.map((pin) => {
                const Icon = pin.icon
                const active = isPathActive(location.pathname, pin.path)
                if (!expanded) {
                  return (
                    <Link
                      key={pin.path}
                      to={pin.path}
                      title={pin.title}
                      data-sidebar-active={active ? "true" : undefined}
                      onClick={handleLinkClick}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="sr-only">{pin.title}</span>
                    </Link>
                  )
                }
                return renderLeafLink(pin)
              })}
              {expanded && <div className="my-2 border-t border-slate-100" />}
            </div>
          )}

          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const containsActive =
              isGroup(item)
                ? isAnyPathActive(location.pathname, groupPaths(item))
                : isPathActive(location.pathname, item.path)
            const isDropdownOpen = isGroup(item) && openDropdowns.includes(item.id)

            if (!expanded) {
              return (
                <div
                  key={item.id}
                  className="w-full flex justify-center relative"
                  onMouseEnter={(e) => onCollapsedIconEnter(item, e.currentTarget)}
                  onMouseLeave={scheduleFlyoutClose}
                >
                  <button
                    type="button"
                    title={item.title}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                      containsActive
                        ? "bg-slate-100 text-blue-700 ring-1 ring-blue-200"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                    onClick={(e) => onCollapsedIconClick(item, e.currentTarget)}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="sr-only">{item.title}</span>
                  </button>
                </div>
              )
            }

            if (!isGroup(item)) {
              const active = isPathActive(location.pathname, item.path)
              return (
                <div key={item.id} className="mb-0.5">
                  <Link
                    to={item.path}
                    data-sidebar-active={active ? "true" : undefined}
                    onClick={handleLinkClick}
                    className={`group flex items-center w-full h-9 px-3 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] mr-3 flex-shrink-0 ${
                        active ? "text-blue-600" : "text-slate-500"
                      }`}
                    />
                    <span className="font-medium truncate">{item.title}</span>
                  </Link>
                </div>
              )
            }

            const children = item.subItems.filter(
              (sub) => !q || sub.title.toLowerCase().includes(q) || item.title.toLowerCase().includes(q),
            )

            return (
              <div key={item.id} className="mb-0.5">
                <button
                  type="button"
                  className={`group flex items-center w-full h-9 px-3 rounded-lg text-sm transition-colors relative ${
                    containsActive
                      ? "bg-slate-100 text-slate-800"
                      : isDropdownOpen
                        ? "bg-slate-50 text-slate-700"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => toggleDropdown(item.id)}
                >
                  {containsActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-blue-600" />
                  )}
                  <Icon className="h-[18px] w-[18px] mr-3 flex-shrink-0 text-slate-500" />
                  <span className="flex-1 min-w-0 text-left font-medium truncate">{item.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 ml-2 flex-shrink-0 text-slate-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && children.length > 0 && (
                  <div className="mt-0.5 ml-2 pl-2 border-l border-slate-200 space-y-0.5">
                    {children.map((sub) => renderLeafLink(sub))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div
          className={`border-t border-slate-200 flex-shrink-0 bg-white ${
            expanded ? "p-3" : "p-2 flex justify-center"
          }`}
        >
          <button
            type="button"
            className={`group flex items-center text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ${
              expanded ? "w-full h-9 px-3" : "h-9 w-9 justify-center"
            }`}
            onClick={handleLogout}
            title={!expanded ? "Logout" : undefined}
          >
            <LogOut className={`h-[18px] w-[18px] flex-shrink-0 ${expanded ? "mr-2.5" : ""}`} />
            {expanded ? <span className="font-medium text-sm">Logout</span> : <span className="sr-only">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Collapsed flyout — aligned to the hovered/clicked icon */}
      {!expanded && !isMobile && flyoutGroup && (
        <div
          ref={flyoutRef}
          style={{ top: flyoutTop, left: 80 }}
          className="fixed z-40 w-64 max-h-[min(24rem,calc(100vh-1rem))] overflow-y-auto bg-white border border-slate-200 rounded-r-lg shadow-lg py-2"
          onMouseEnter={clearFlyoutCloseTimer}
          onMouseLeave={scheduleFlyoutClose}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {flyoutGroup.title}
          </p>
          <div className="px-1.5 space-y-0.5">
            {flyoutGroup.subItems.map((sub) => renderLeafLink(sub, { inFlyout: true }))}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .scrollbar-thin:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
      `}</style>
    </>
  )
}
