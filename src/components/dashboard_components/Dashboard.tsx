"use client"
import { useState, useEffect } from "react"
import { ExecutiveSummary } from "./ExecutiveDashboard.tsx"
import { CustomerAnalytics } from "./CustomerAnalysis.tsx"
import { FinancialAnalytics } from "./FinancialAnalysis.tsx"
import { ServiceSupport } from "./ServiceSupport.tsx"
import { InventoryManagement } from "./InventoryManagement.tsx"
import { EmployeePerformance } from "./EmployeeAnalytics.tsx"
import { AreaAnalysis } from "./AreaAnalytics.tsx"
import { ServicePlanAnalytics } from "./ServiePlanAnalytics.tsx"
import { RecoveryCollections } from "./RecoveryCollection.tsx"
import { OperationalMetrics } from "./OperationaMetrices.tsx"
import { Sidebar } from "../sideNavbar.tsx"
import { Topbar } from "../topNavbar.tsx"

const sections = [
  { id: "executive", name: "Executive Dashboard", component: ExecutiveSummary },
  { id: "customer", name: "Customer Analytics", component: CustomerAnalytics },
  { id: "financial", name: "Financial Analytics", component: FinancialAnalytics },
  { id: "service", name: "Service & Support", component: ServiceSupport },
  { id: "inventory", name: "Inventory Management", component: InventoryManagement },
  { id: "employee", name: "Employee Performance", component: EmployeePerformance },
  { id: "area", name: "Area-wise Analysis", component: AreaAnalysis },
  { id: "serviceplan", name: "Service Plan Analytics", component: ServicePlanAnalytics },
  { id: "recovery", name: "Recovery & Collections", component: RecoveryCollections },
  { id: "operational", name: "Operational Metrics", component: OperationalMetrics },
]

const Dashboard = () => {
  useEffect(() => {
    document.title = "MBA NET - Reporting & Analytics"
  }, [])

  const [filters, setFilters] = useState({
    dateRange: { start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
    company: "all",
    area: "all",
    servicePlan: "all",
    customerStatus: "all",
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className="flex flex-col min-h-screen">
          <main
            className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-6 pt-20 transition-all duration-300 ${
              isSidebarOpen ? "ml-72" : "ml-20"
            }`}
          >
            <ExecutiveSummary filters={filters} />
            <CustomerAnalytics filters={filters} />
            <FinancialAnalytics filters={filters} />
            <ServiceSupport filters={filters} />
            <InventoryManagement filters={filters} />
            <EmployeePerformance filters={filters} />
            <AreaAnalysis filters={filters} />
            <ServicePlanAnalytics filters={filters} />
            <RecoveryCollections filters={filters} />
            <OperationalMetrics filters={filters} />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
