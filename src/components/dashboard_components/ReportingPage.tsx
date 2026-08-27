"use client"
import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useCompany } from "../../context/CompanyContext.tsx"
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
import { useOptionalAdminChrome } from "../../context/AdminLayoutContext.tsx"
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
  Activity,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react"

const sections: Record<string, {
  name: string
  component: React.ComponentType<any>
  category: string
  icon: React.ComponentType<any>
}> = {
  executive: {
    name: "Executive Overview",
    component: ExecutiveDashboard,
    category: "Leadership",
    icon: PieChart,
  },
  customers: {
    name: "Customer Analytics",
    component: CustomerAnalytics,
    category: "Customer",
    icon: Users,
  },
  financial: {
    name: "Financial Analytics",
    component: UnifiedDashboard,
    category: "Financial",
    icon: DollarSign,
  },
  service: {
    name: "Service & Support",
    component: ServiceSupport,
    category: "Operations",
    icon: Wrench,
  },
  inventory: {
    name: "Inventory Analytics",
    component: InventoryManagement,
    category: "Operations",
    icon: Package,
  },
  employees: {
    name: "Employee Performance",
    component: EmployeeAnalytics,
    category: "Human Resources",
    icon: UserCheck,
  },
  regional: {
    name: "Regional Analysis",
    component: AreaAnalysis,
    category: "Geographic",
    icon: MapPin,
  },
  plans: {
    name: "Service Plans",
    component: ServicePlanAnalytics,
    category: "Products",
    icon: FileText,
  },
  collections: {
    name: "Collections",
    component: RecoveryCollections,
    category: "Financial",
    icon: Wallet,
  },
  operations: {
    name: "Operations",
    component: OperationalMetrics,
    category: "Operations",
    icon: Activity,
  },
}

const ReportingPage = () => {
  const { section } = useParams<{ section: string }>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const hasChrome = useOptionalAdminChrome()
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

  const { setPageTitle } = useCompany()

  useEffect(() => {
    setPageTitle(currentSection.name)
  }, [setPageTitle, currentSection.name])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex h-screen bg-light-sky/50"}>
      {!hasChrome && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      )}

      <div className={hasChrome ? "flex-1 min-w-0 w-full" : "flex-1 flex flex-col overflow-hidden"}>
        {!hasChrome && <Topbar toggleSidebar={toggleSidebar} />}

        <main
          className={
            hasChrome
              ? "px-3 py-3 sm:px-4"
              : `flex-1 overflow-x-hidden overflow-y-auto bg-light-sky/50 px-3 py-3 sm:px-4 pt-16 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0 lg:ml-20"
          }`
          }
        >
          <div className="container mx-auto max-w-[1800px]">
            <div className="flex items-center text-xs text-slate-gray mb-2">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1" />
              <span>Reporting</span>
              <ChevronRight className="h-3.5 w-3.5 mx-1" />
              <span className="text-deep-ocean font-medium">{currentSection.name}</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-xl font-semibold text-deep-ocean flex items-center gap-2">
                  <Icon className="h-5 w-5 text-electric-blue" />
                  {currentSection.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-gray">
                  <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50">
                    {currentSection.category}
                  </span>
                  <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50">
                    {filters.dateRange.start.toLocaleDateString()} – {filters.dateRange.end.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <ActiveComponent filters={filters} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ReportingPage
