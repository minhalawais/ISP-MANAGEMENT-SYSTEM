"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
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
  Shield
} from "lucide-react"
import { removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"

// Storage keys for persistent state
const SIDEBAR_OPEN_DROPDOWNS_KEY = "sidebar_open_dropdowns"
const SIDEBAR_SCROLL_POSITION_KEY = "sidebar_scroll_position"

// Grouped menu structure with dropdowns - User requested order
export const menuItems = [
  // 1. Reporting & Analytics
  {
    title: "Reporting & Analytics",
    icon: BarChart,
    description: "Comprehensive business intelligence",
    isDropdown: true,
    subItems: [
      { title: "Executive Overview", description: "High-level business summary", path: "/reporting/executive", icon: PieChart },
      { title: "Customer Analytics", description: "Customer insights & trends", path: "/reporting/customers", icon: Users },
      { title: "Financial Analytics", description: "Revenue & financial metrics", path: "/reporting/financial", icon: DollarSign },
      { title: "Service & Support", description: "Support performance metrics", path: "/reporting/service", icon: Wrench },
      { title: "Inventory Analytics", description: "Stock & equipment analysis", path: "/reporting/inventory", icon: Package },
      { title: "Employee Performance", description: "Staff productivity metrics", path: "/reporting/employees", icon: UserCheck },
      { title: "Regional Analysis", description: "Geographic performance", path: "/reporting/regional", icon: MapPin },
      { title: "Service Plans", description: "Plan performance & trends", path: "/reporting/plans", icon: FileText },
      { title: "Collections", description: "Recovery & collection tracking", path: "/reporting/collections", icon: Wallet },
      { title: "Operations", description: "Operational efficiency", path: "/reporting/operations", icon: Activity },
    ]
  },
  // 2. Vendor & Employee Management
  {
    title: "Vendor & Employee Management",
    icon: Briefcase,
    description: "Vendors, employees & suppliers",
    isDropdown: true,
    subItems: [
      { title: "Employee Management", description: "Manage staff records", path: "/employee-management", icon: Users },
      { title: "Vendor Management", description: "Manage vendor profiles", path: "/vendor-management", icon: Store },
      { title: "Supplier Management", description: "Supplier relationships", path: "/supplier-management", icon: Truck },
      { title: "ISP Management", description: "ISP company details", path: "/isp-management", icon: Network },
    ]
  },
  // 3. Customer Management
  {
    title: "Customer Management",
    icon: Users,
    description: "Customers & service plans",
    isDropdown: true,
    subItems: [
      { title: "Customer Management", description: "Customer relationships", path: "/customer-management", icon: Users },
      { title: "Service Plan Management", description: "Manage service plans", path: "/service-plan-management", icon: FileText },
    ]
  },
  // 4. Payments
  {
    title: "Payments",
    icon: DollarSign,
    description: "Payments, billing & finances",
    isDropdown: true,
    subItems: [
      { title: "Payment Management", description: "Track customer payments", path: "/payment-management", icon: CreditCard },
      { title: "ISP Payments", description: "ISP payment tracking", path: "/isp-payment-management", icon: Network },
      { title: "Billing & Invoices", description: "Invoice management", path: "/billing-invoices", icon: Receipt },
      { title: "Bank Accounts", description: "Bank account management", path: "/bank-management", icon: Banknote },
      { title: "Expense Management", description: "Track expenses", path: "/expense-management", icon: DollarSign },
      { title: "Extra Income", description: "Additional income sources", path: "/extra-income-management", icon: TrendingUp },
    ]
  },
  // 5. Complaint Management
  {
    title: "Complaint Management",
    icon: AlertCircle,
    description: "Complaints, tasks & recovery",
    isDropdown: true,
    subItems: [
      { title: "Complaint Management", description: "Resolve customer issues", path: "/complaint-management", icon: AlertCircle },
      { title: "Task Management", description: "Organize tasks", path: "/task-management", icon: CheckSquare },
      { title: "Recovery Tasks", description: "Recovery tracking", path: "/recovery-task-management", icon: UserCheck },
    ]
  },
  // 6. Inventory Management
  {
    title: "Inventory Management",
    icon: Package,
    description: "Stock & equipment tracking",
    isDropdown: true,
    subItems: [
      { title: "Inventory Management", description: "Stock management", path: "/inventory-management", icon: Package },
    ]
  },
  // 7. Area Zone Management
  {
    title: "Area Zone Management",
    icon: Map,
    description: "Areas & sub-zones",
    isDropdown: true,
    subItems: [
      { title: "Area/Zone Management", description: "Manage main areas", path: "/area-zone-management", icon: Map },
      { title: "Sub-Zones", description: "Manage sub-zones", path: "/areas", icon: Layers },
    ]
  },
  // 8. Admin
  {
    title: "Admin",
    icon: Shield,
    description: "Messaging, logs & settings",
    isDropdown: true,
    subItems: [
      { title: "Messaging", description: "Internal messaging", path: "/message-management", icon: MessageSquare },
      { title: "WhatsApp Queue", description: "Message queue", path: "/whatsapp/queue", icon: MessageSquare },
      { title: "Bulk Sender", description: "Send bulk messages", path: "/whatsapp/bulk-sender", icon: MessageSquare },
      { title: "WhatsApp Settings", description: "Configure WhatsApp", path: "/whatsapp/settings", icon: Settings },
      { title: "Logs Management", description: "View system logs", path: "/logs-management", icon: Clipboard },
    ]
  },
]

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, setIsOpen }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  // Initialize open dropdowns from localStorage (empty array = all closed by default)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_DROPDOWNS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Initialize scroll position from localStorage
  const [scrollPosition, setScrollPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_SCROLL_POSITION_KEY)
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  })

  // Persist open dropdowns to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_DROPDOWNS_KEY, JSON.stringify(openDropdowns))
    } catch (e) {
      console.error("Failed to save sidebar state:", e)
    }
  }, [openDropdowns])

  // Persist scroll position to localStorage (save only, no auto-restore to prevent auto-scroll fighting)
  const saveScrollPosition = useCallback(() => {
    if (navRef.current) {
      const position = navRef.current.scrollTop
      setScrollPosition(position)
      try {
        localStorage.setItem(SIDEBAR_SCROLL_POSITION_KEY, position.toString())
      } catch (e) {
        console.error("Failed to save scroll position:", e)
      }
    }
  }, [])

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.title.toLowerCase().includes(searchQuery.toLowerCase())) return true
    if (item.subItems?.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))) return true
    return false
  })

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout")
      removeToken()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const toggleDropdown = (title: string) => {
    setOpenDropdowns(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && setIsOpen) {
        const sidebar = document.getElementById('sidebar')
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen, setIsOpen])

  const handleLinkClick = () => {
    if (isMobile && setIsOpen) {
      setIsOpen(false)
    }
    saveScrollPosition()
  }

  // Check if any sub-item is active for a dropdown
  const isDropdownActive = (item: typeof menuItems[0]) => {
    return item.subItems?.some(sub => location.pathname === sub.path)
  }

  const shouldExpand = isMobile ? isOpen : (isOpen || isHovered)

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`
          bg-gradient-to-b from-white to-slate-50
          ${shouldExpand ? "w-72" : "w-20"} 
          h-[calc(100vh-3.5rem)] 
          flex 
          flex-col 
          shadow-xl
          transition-all 
          duration-300 
          ease-in-out 
          fixed 
          ${isMobile ? 'z-50' : 'z-30'}
          top-14
          ${isMobile && !isOpen ? '-left-72' : 'left-0'}
          overflow-hidden
          border-r border-slate-200/80
        `}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsHovered(false)
            saveScrollPosition()
          }
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && isOpen && (
          <button
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-10"
            onClick={() => setIsOpen && setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Search Bar */}
        {shouldExpand && (
          <div className="p-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules..."
                className="w-full px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-3 text-slate-400 h-4 w-4" />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300"
          ref={navRef}
          onScroll={saveScrollPosition}
        >
          {filteredMenuItems.map((item, index) => {
            const isActive = isDropdownActive(item)
            const isDropdownOpen = openDropdowns.includes(item.title)
            const Icon = item.icon

            return (
              <div key={index} className="mb-2">
                {/* Dropdown Header - Premium styling */}
                <button
                  className={`
                    group
                    flex 
                    items-center 
                    w-full
                    px-3 
                    py-3 
                    rounded-xl 
                    transition-all 
                    duration-200
                    ${!shouldExpand ? "justify-center" : ""}
                    ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : isDropdownOpen
                        ? "bg-slate-100 text-slate-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }
                    relative
                    cursor-pointer
                  `}
                  onClick={() => shouldExpand && toggleDropdown(item.title)}
                >
                  <div className={`
                    ${shouldExpand ? "mr-3" : ""} 
                    ${!isActive ? "p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-blue-100 group-hover:to-blue-50 shadow-sm" : "p-2"}
                    transition-all duration-200
                  `}>
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"}`}
                    />
                  </div>
                  {shouldExpand ? (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        <span
                          className={`font-semibold text-sm block truncate ${isActive ? "text-white" : "text-slate-700"}`}
                        >
                          {item.title}
                        </span>
                        <p className={`text-xs mt-0.5 truncate ${isActive ? "text-blue-100" : "text-slate-400"}`}>{item.description}</p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 ml-2 transition-transform duration-300 ${isActive ? "text-blue-100" : "text-slate-400"} ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </>
                  ) : (
                    <span className="sr-only">{item.title}</span>
                  )}
                  {!shouldExpand && !isMobile && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl z-50 pointer-events-none">
                      {item.title}
                      <div className="absolute top-1/2 -left-1.5 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-slate-800"></div>
                    </div>
                  )}
                </button>

                {/* Dropdown Sub-Items - Distinct styling */}
                {shouldExpand && isDropdownOpen && item.subItems && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-slate-200 space-y-1">
                    {item.subItems
                      .filter(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery)
                      .map((subItem, subIndex) => {
                        const SubIcon = subItem.icon
                        const isSubActive = location.pathname === subItem.path
                        return (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className={`
                              group
                              flex 
                              items-center 
                              px-3 
                              py-2.5
                              rounded-lg 
                              transition-all 
                              duration-200
                              ${isSubActive
                                ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500 -ml-[2px] pl-[14px]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              }
                              relative
                              cursor-pointer
                            `}
                            onClick={handleLinkClick}
                          >
                            <SubIcon className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors ${isSubActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium text-sm block truncate ${isSubActive ? "text-blue-700" : "text-slate-600 group-hover:text-slate-800"}`}>
                                {subItem.title}
                              </span>
                            </div>
                            {isSubActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            )}
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t border-slate-200 ${!shouldExpand ? "flex justify-center" : ""} flex-shrink-0 bg-white`}>
          <button
            className={`
              group
              flex 
              items-center 
              ${shouldExpand ? "w-full px-4" : "justify-center"} 
              py-2.5 
              text-slate-500
              hover:bg-red-50 
              hover:text-red-600
              rounded-xl 
              transition-all 
              duration-200
              relative
            `}
            onClick={handleLogout}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${shouldExpand ? "mr-3" : ""}`} />
            {shouldExpand ? (
              <span className="font-medium text-sm">Logout</span>
            ) : (
              <>
                <span className="sr-only">Logout</span>
                {!isMobile && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl z-50 pointer-events-none whitespace-nowrap">
                    Logout
                    <div className="absolute top-1/2 -left-1.5 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-slate-800"></div>
                  </div>
                )}
              </>
            )}
          </button>
        </div>
      </aside>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}</style>
    </>
  )
}