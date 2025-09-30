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
  NetworkIcon
} from "lucide-react"
import { removeToken } from "../utils/auth.ts"
import axiosInstance from "../utils/axiosConfig.ts"

export const menuItems = [
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
    icon: NetworkIcon,
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
    title: "Reporting & Analytics",
    icon: BarChart,
    description: "Generate insights with comprehensive reports",
    path: "/reporting-analytics",
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

  const filteredMenuItems = menuItems.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))

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
    if ((isOpen || isHovered) && navRef.current) {
      navRef.current.scrollTop = scrollPosition
    }
  }, [isOpen, isHovered, scrollPosition])

  return (
    <aside
      className={`
        bg-white 
        ${isOpen || isHovered ? "w-72" : "w-20"} 
        h-[calc(100vh-3.5rem)] 
        flex 
        flex-col 
        shadow-md 
        transition-all 
        duration-300 
        ease-in-out 
        fixed 
        z-30
        top-14
        left-0
        overflow-y-auto
        hide-scrollbar
        border-r border-[#EBF5FF]
      `}
      onMouseEnter={() => {
        setIsHovered(true)
        if (navRef.current) {
          setScrollPosition(navRef.current.scrollTop)
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        if (navRef.current) {
          setScrollPosition(navRef.current.scrollTop)
        }
      }}
    >
      <button
        className="md:hidden absolute top-2 right-2 text-[#4A5568] hover:text-[#3A86FF]"
        onClick={() => setIsOpen(false)}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {(isOpen || isHovered) && (
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search modules..."
              className="w-full px-4 py-2 bg-[#EBF5FF] text-[#4A5568] border border-[#EBF5FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A86FF] transition-all duration-200 placeholder-[#4A5568]/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-3 text-[#4A5568]/70" />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-2 hide-scrollbar" ref={navRef}>
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
              ${!isOpen && !isHovered ? "justify-center" : ""}
              ${
                location.pathname === item.path
                  ? "bg-[#EBF5FF] border-l-4 border-[#3A86FF] text-[#2A5C8A]"
                  : "border-l-4 border-transparent"
              }
              relative
            `}
            onClick={() => {
              setActiveItem(item.title)
              if (navRef.current) {
                setScrollPosition(navRef.current.scrollTop)
              }
            }}
          >
            <item.icon
              className={`h-5 w-5 ${isOpen || isHovered ? "mr-3" : ""} ${
                location.pathname === item.path ? "text-[#3A86FF]" : "text-[#4A5568]/80"
              }`}
            />
            {isOpen || isHovered ? (
              <div>
                <span
                  className={`font-medium ${location.pathname === item.path ? "text-[#2A5C8A]" : "text-[#4A5568]"}`}
                >
                  {item.title}
                </span>
                <p className="text-xs text-[#4A5568]/60 mt-1">{item.description}</p>
              </div>
            ) : (
              <span className="sr-only">{item.title}</span>
            )}
            {!isOpen && !isHovered && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[#4A5568] text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-lg z-50 border border-[#EBF5FF]">
                {item.title}
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className={`p-4 border-t border-[#EBF5FF] ${!isOpen && !isHovered ? "flex justify-center" : ""} mt-auto`}>
        <button
          className={`
            group
            flex 
            items-center 
            ${isOpen || isHovered ? "w-full px-4" : "justify-center"} 
            py-2 
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
          <LogOut className={`h-5 w-5 ${isOpen || isHovered ? "mr-3" : ""}`} />
          {isOpen || isHovered ? (
            "Logout"
          ) : (
            <>
              <span className="sr-only">Logout</span>
              <div className="absolute left-full ml-2 px-2 py-1 bg-white text-[#4A5568] text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg z-50 border border-[#EBF5FF]">
                Logout
              </div>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
