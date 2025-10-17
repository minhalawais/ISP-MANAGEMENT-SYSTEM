"use client"
import { useState, useEffect } from "react"
import { ExecutiveDashboard } from "./ExecutiveDashboard.tsx"
import { CustomerAnalytics } from "./CustomerAnalysis.tsx"
import { FinancialAnalytics } from "./FinancialAnalysis.tsx"
import { ServiceSupport } from "./ServiceSupport.tsx"
import { InventoryManagement } from "./InventoryManagement.tsx"
import { EmployeePerformance } from "./EmployeeAnalytics.tsx"
import { AreaAnalysis } from "./AreaAnalytics.tsx"
import { ServicePlanAnalytics } from "./ServiePlanAnalytics.tsx"
import { RecoveryCollections } from "./RecoveryCollection.tsx"
import { OperationalMetrics } from "./OperationaMetrices.tsx"
import { BankAccountAnalysis } from "./BankAccountAnalysis.tsx"
import { Sidebar } from "../sideNavbar.tsx"
import { Topbar } from "../topNavbar.tsx"
import { UnifiedDashboard } from "./UnifiedFinancialDashboard.tsx"

const sections = [
  {
    id: "executive",
    name: "Executive Overview",
    component: ExecutiveDashboard,
    category: "Leadership"
  },
  {
    id: "customer",
    name: "Customer Analytics",
    component: CustomerAnalytics,
    category: "Customer"
  },
  {
    id: "financial",
    name: "Financial Analytics",
    component: UnifiedDashboard,
    category: "Financial"
  },
  {
    id: "service",
    name: "Service & Support",
    component: ServiceSupport,
    category: "Operations"
  },
  {
    id: "inventory",
    name: "Inventory",
    component: InventoryManagement,
    category: "Operations"
  },
  {
    id: "employee",
    name: "Employee Performance",
    component: EmployeePerformance,
    category: "Human Resources"
  },
  {
    id: "area",
    name: "Regional Analysis",
    component: AreaAnalysis,
    category: "Geographic"
  },
  {
    id: "serviceplan",
    name: "Service Plans",
    component: ServicePlanAnalytics,
    category: "Products"
  },
  {
    id: "recovery",
    name: "Collections",
    component: RecoveryCollections,
    category: "Financial"
  },
  {
    id: "operational",
    name: "Operations",
    component: OperationalMetrics,
    category: "Operations"
  },
]
const Dashboard = () => {
  useEffect(() => {
    document.title = "MBA NET - Business Intelligence"
  }, [])

  const [filters, setFilters] = useState({
    dateRange: { start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
    company: "all",
    area: "all",
    servicePlan: "all",
    customerStatus: "all",
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("executive")

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const ActiveComponent = sections.find(section => section.id === activeTab)?.component || ExecutiveSummary
  const activeSection = sections.find(section => section.id === activeTab)

  return (
    <div className="flex h-screen bg-[#F1F0E8]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar toggleSidebar={toggleSidebar} />

        <div className="flex flex-col min-h-screen">
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-[#F1F0E8] p-0 sm:p-6 pt-20 transition-all duration-300 ${
              isSidebarOpen ? "ml-72" : "ml-0 lg:ml-20"
            }`}
          >

            {/* Header Section */}
            <div className="bg-white shadow-sm border-b border-[#E5E1DA] px-8 pt-20 pb-0">
              <div className="max-w-[1800px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">Business Intelligence</h1>
                    <p className="text-gray-600 text-sm">Comprehensive analytics and reporting dashboard</p>

                    </div>

{/* Filter Indicators */}
<div className="flex items-center gap-3">
  <div className="text-xs text-gray-500 bg-[#F1F0E8] px-3 py-2 rounded-md border">
    {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
  </div>
  {filters.company !== "all" && (
    <div className="text-xs text-white bg-[#89A8B2] px-3 py-2 rounded-md">
      {filters.company}
    </div>
  )}
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    Live
  </div>
</div>
</div>

{/* Professional Tab Navigation */}
<div className="flex space-x-1 bg-[#F1F0E8] p-1 rounded-lg mb-0">
<div className="flex overflow-x-auto scrollbar-hide space-x-1 w-full">
  {sections.map((section) => (
    <button
      key={section.id}
      onClick={() => setActiveTab(section.id)}
      className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
        activeTab === section.id
          ? "bg-white text-[#89A8B2] shadow-sm border border-[#E5E1DA]"
          : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
      }`}
    >
      {section.name}
    </button>
  ))}
</div>
</div>
</div>
</div>


            {/* Content Header */}
            <div className="bg-white border-b border-[#E5E1DA] px-8 py-4">
              <div className="max-w-[1800px] mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-[#89A8B2] rounded-full"></div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{activeSection?.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-[#E5E1DA] px-2 py-1 rounded">
                          {activeSection?.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          Updated {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button className="text-xs text-gray-600 hover:text-gray-900 px-3 py-2 border border-[#E5E1DA] rounded-md hover:bg-[#F1F0E8] transition-colors">
                      Export
                    </button>
                    <button className="text-xs text-white bg-[#89A8B2] hover:bg-[#7a9aa4] px-3 py-2 rounded-md transition-colors">
                      Refresh Data
                    </button>
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

            {/* Professional Footer */}
            <footer className="bg-white border-t border-[#E5E1DA] px-8 py-4">
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

      {/* Professional Styling */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}


export default Dashboard
