"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  ChevronLeft,
  Clipboard,
  Banknote,
  Receipt,
  Network,
  DollarSign,
  TrendingUp,
  X
} from "lucide-react"
import { removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"

export const menuItems = [
  {
    title: "Reporting & Analytics",
    icon: BarChart,
    description: "Generate insights with comprehensive reports",
    path: "/reporting-analytics",
  },
  {
    title: "Employee Management",
    icon: Users,
    description: "Manage and track employee records and performance",
    path: "/employee-management",
  },
  {
    title: "Customer Management",
    icon: Users,
    description: "Comprehensive customer relationship management",
    path: "/customer-management",
  },
  {
    title: "Service Plan Management",
    icon: FileText,
    description: "Create, update, and monitor service plans",
    path: "/service-plan-management",
  },
  {
    title: "Payment Management",
    icon: CreditCard,
    description: "Track and manage customer payments",
    path: "/payment-management",
  },
  {
    title: "ISP Payments",
    icon: Network,
    description: "Track and manage ISP payments",
    path: "/isp-payment-management",
  },
  {
    title: "Billing & Invoices",
    icon: Receipt,
    description: "Handle financial transactions and billing cycles",
    path: "/billing-invoices",
  },
  {
    title: "Bank Accounts",
    icon: Banknote,
    description: "Handle bank accounts",
    path: "/bank-management", 
  },
  {
    title: "Expense Management",
    icon: DollarSign,
    description: "Track and manage operational expenses",
    path: "/expense-management",
  },
  {
    title: "Extra Income Management",
    icon: TrendingUp,
    description: "Track and manage additional income sources",
    path: "/extra-income-management",
  },
  {
    title: "Complaint Management",
    icon: AlertCircle,
    description: "Track and resolve customer complaints efficiently",
    path: "/complaint-management",
  },
  {
    title: "Inventory Management",
    icon: Package,
    description: "Real-time tracking of inventory and stock levels",
    path: "/inventory-management",
  },
  {
    title: "ISP Management",
    icon: Package,
    description: "Manage and monitor ISP Company details",
    path: "/isp-management",
  },
  {
    title: "Supplier Management",
    icon: Truck,
    description: "Manage supplier relationships and procurement",
    path: "/supplier-management",
  },
  {
    title: "Area/Zone Management",
    icon: Map,
    description: "Define and manage operational zones",
    path: "/area-zone-management",
  },
  {
    title: "Recovery Task Management",
    icon: UserCheck,
    description: "Monitor and track recovery-related tasks",
    path: "/recovery-task-management",
  },
  {
    title: "Messaging",
    icon: MessageSquare,
    description: "Internal communication and messaging system",
    path: "/message-management",
  },
  {
    title: "Task Management",
    icon: CheckSquare,
    description: "Organize and prioritize organizational tasks",
    path: "/task-management",
  },
  {
    title: "Logs Management",
    icon: Clipboard,
    description: "View and manage system logs",
    path: "/logs-management",
  },
]

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, setIsOpen }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeItem, setActiveItem] = useState("")
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const navRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  const filteredMenuItems = menuItems.filter((item) => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout")
      removeToken()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if ((isOpen || isHovered) && navRef.current) {
      navRef.current.scrollTop = scrollPosition
    }
  }, [isOpen, isHovered, scrollPosition])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
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
    setActiveItem("")
    if (isMobile) {
      setIsOpen(false)
    }
    if (navRef.current) {
      setScrollPosition(navRef.current.scrollTop)
    }
  }

  const shouldExpand = isMobile ? isOpen : (isOpen || isHovered)

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={`
          bg-white 
          ${shouldExpand ? "w-72" : "w-20"} 
          h-[calc(100vh-3.5rem)] 
          flex 
          flex-col 
          shadow-lg
          transition-all 
          duration-300 
          ease-in-out 
          fixed 
          ${isMobile ? 'z-50' : 'z-30'}
          top-14
          ${isMobile && !isOpen ? '-left-72' : 'left-0'}
          overflow-hidden
          border-r border-[#EBF5FF]
        `}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsHovered(true)
            if (navRef.current) {
              setScrollPosition(navRef.current.scrollTop)
            }
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            setIsHovered(false)
            if (navRef.current) {
              setScrollPosition(navRef.current.scrollTop)
            }
          }
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && isOpen && (
          <button
            className="absolute top-4 right-4 p-2 text-[#4A5568] hover:text-[#3A86FF] hover:bg-[#EBF5FF] rounded-lg transition-colors z-10"
            onClick={() => setIsOpen(false)}
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
                className="w-full px-4 py-2.5 bg-[#EBF5FF] text-[#4A5568] border border-[#EBF5FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A86FF] transition-all duration-200 placeholder-[#4A5568]/60 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-3 text-[#4A5568]/70 h-4 w-4" />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav 
          className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-[#EBF5FF] scrollbar-track-transparent hover:scrollbar-thumb-[#3A86FF]/30" 
          ref={navRef}
        >
          {filteredMenuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`
                group
                flex 
                items-center 
                px-4 
                py-3 
                my-1 
                rounded-lg 
                text-[#4A5568]
                hover:bg-[#EBF5FF]
                transition-all 
                duration-200
                ${!shouldExpand ? "justify-center" : ""}
                ${
                  location.pathname === item.path
                    ? "bg-[#EBF5FF] border-l-4 border-[#3A86FF] text-[#2A5C8A]"
                    : "border-l-4 border-transparent"
                }
                relative
                cursor-pointer
              `}
              onClick={handleLinkClick}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${shouldExpand ? "mr-3" : ""} ${
                  location.pathname === item.path ? "text-[#3A86FF]" : "text-[#4A5568]/80"
                }`}
              />
              {shouldExpand ? (
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-medium text-sm block truncate ${
                      location.pathname === item.path ? "text-[#2A5C8A]" : "text-[#4A5568]"
                    }`}
                  >
                    {item.title}
                  </span>
                  <p className="text-xs text-[#4A5568]/60 mt-0.5 truncate">{item.description}</p>
                </div>
              ) : (
                <span className="sr-only">{item.title}</span>
              )}
              {!shouldExpand && !isMobile && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#2A5C8A] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg z-50 pointer-events-none">
                  {item.title}
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-[#2A5C8A]"></div>
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t border-[#EBF5FF] ${!shouldExpand ? "flex justify-center" : ""} flex-shrink-0`}>
          <button
            className={`
              group
              flex 
              items-center 
              ${shouldExpand ? "w-full px-4" : "justify-center"} 
              py-2.5 
              text-[#4A5568]
              hover:bg-[#EF4444]/10 
              hover:text-[#EF4444]
              rounded-lg 
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
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[#2A5C8A] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg z-50 pointer-events-none whitespace-nowrap">
                    Logout
                    <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-[#2A5C8A]"></div>
                  </div>
                )}
              </>
            )}
          </button>
        </div>
      </aside>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #EBF5FF;
          border-radius: 3px;
        }
        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: rgba(58, 134, 255, 0.3);
        }
      `}</style>
    </>
  )
}