"use client"
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { ExecutiveDashboard } from "../dashboard_components/ExecutiveDashboard.tsx"
import { CustomerAnalytics } from "../dashboard_components/CustomerAnalysis.tsx"
import { ServiceSupport } from "../dashboard_components/ServiceSupport.tsx"
import { InventoryManagement } from "../dashboard_components/InventoryManagement.tsx"
import EmployeeAnalytics from "../dashboard_components/EmployeeAnalytics.tsx"
import { AreaAnalysis } from "../dashboard_components/AreaAnalytics.tsx"
import { ServicePlanAnalytics } from "../dashboard_components/ServiePlanAnalytics.tsx"
import { RecoveryCollections } from "../dashboard_components/RecoveryCollection.tsx"
import { OperationalMetrics } from "../dashboard_components/OperationaMetrices.tsx"
import { Sidebar } from "../sideNavbar.tsx"
import { Topbar } from "../topNavbar.tsx"
import { UnifiedDashboard } from "../dashboard_components/UnifiedFinancialDashboard.tsx"
import {
  PieChart,
  Users,
  DollarSign,
  Wrench,
  Package,
  UserCheck,
  MapPin,
  FileText,
  Wallet,
  Activity
} from "lucide-react"

// Section configuration
const sections: Record<string, {
  name: string
  component: React.ComponentType<any>
  category: string
  icon: React.ComponentType<any>
  description: string
}> = {
  executive: {
    name: "Executive Overview",
    component: ExecutiveDashboard,
    category: "Leadership",
    icon: PieChart,
    description: "High-level business summary and key performance indicators"
  },
  customers: {
    name: "Customer Analytics",
    component: CustomerAnalytics,
    category: "Customer",
    icon: Users,
    description: "Customer insights, trends, and behavioral analysis"
  },
  financial: {
    name: "Financial Analytics",
    component: UnifiedDashboard,
    category: "Financial",
    icon: DollarSign,
    description: "Revenue, expenses, and financial performance metrics"
  },
  service: {
    name: "Service & Support",
    component: ServiceSupport,
    category: "Operations",
    icon: Wrench,
    description: "Support performance and service quality metrics"
  },
  inventory: {
    name: "Inventory Analytics",
    component: InventoryManagement,
    category: "Operations",
    icon: Package,
    description: "Stock levels, equipment tracking, and inventory analysis"
  },
  employees: {
    name: "Employee Performance",
    component: EmployeeAnalytics,
    category: "Human Resources",
    icon: UserCheck,
    description: "Staff productivity and performance metrics"
  },
  regional: {
    name: "Regional Analysis",
    component: AreaAnalysis,
    category: "Geographic",
    icon: MapPin,
    description: "Geographic performance and regional distribution"
  },
  plans: {
    name: "Service Plans",
    component: ServicePlanAnalytics,
    category: "Products",
    icon: FileText,
    description: "Plan performance, distribution, and trends"
  },
  collections: {
    name: "Collections",
    component: RecoveryCollections,
    category: "Financial",
    icon: Wallet,
    description: "Recovery tracking and collection performance"
  },
  operations: {
    name: "Operations",
    component: OperationalMetrics,
    category: "Operations",
    icon: Activity,
    description: "Operational efficiency and process metrics"
  },
}

const ReportingPage = () => {
  const { section } = useParams<{ section: string }>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [filters] = useState({
    dateRange: { start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
    company: "all",
    area: "all",
    servicePlan: "all",
    customerStatus: "all",
  })

  const currentSection = sections[section || "executive"] || sections.executive
  const ActiveComponent = currentSection.component
  const Icon = currentSection.icon

  useEffect(() => {
    document.title = `MBA NET - ${currentSection.name}`
  }, [currentSection.name])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />

        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#F1F0E8] p-0 sm:p-6 pt-20 transition-all duration-300 ${
            isSidebarOpen ? "ml-72" : "ml-0 lg:ml-20"
          }`}
        >
          {/* Header Section */}
          <div className="bg-white shadow-sm border-b border-[#E5E1DA] px-8 pt-20 pb-6">
            <div className="max-w-[1800px] mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#3A86FF] to-[#2A5C8A] rounded-xl shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{currentSection.name}</h1>
                    <p className="text-gray-600 text-sm mt-1">{currentSection.description}</p>
                  </div>
                </div>

                {/* Filter Indicators */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-[#F1F0E8] px-3 py-2 rounded-md border">
                    {currentSection.category}
                  </span>
                  <div className="text-xs text-gray-500 bg-[#F1F0E8] px-3 py-2 rounded-md border">
                    {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 px-0 py-4">
            <div className="max-w-[1800px] mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-[#E5E1DA] min-h-[600px]">
                <div className="p-2 sm:p-6">
                  <div className="transition-all duration-300 ease-in-out">
                    <ActiveComponent filters={filters} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-[#E5E1DA] px-8 py-4 mt-4">
            <div className="max-w-[1800px] mx-auto">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-6">
                  <span>© 2024 MBA NET</span>
                  <span>Business Intelligence Platform</span>
                  <span>Version 2.1.0</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Server Status: Active</span>
                  <span>Last Sync: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default ReportingPage
