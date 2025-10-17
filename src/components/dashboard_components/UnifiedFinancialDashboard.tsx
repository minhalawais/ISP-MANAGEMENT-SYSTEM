"use client"
import { useState } from "react"
import { UnifiedFinancialDashboard } from "./UnifiedDashboard.tsx"
import { Ledger } from "./ledger/Ledger.tsx"

export const UnifiedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "ledger">("analytics")

  return (
    <main className="p-2 px-2">


      <div className="w-full">
        {/* Custom Tabs List */}
        <div className="grid grid-cols-2 w-full md:w-auto bg-[#F1F0E8] border border-[#E5E1DA] rounded-lg p-1">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "analytics"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            Dashboard Analytics
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "ledger"
                ? "bg-white text-[#1F2937] shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            Ledger
          </button>
        </div>

        {/* Custom Tabs Content */}
        <div className="mt-4">
          {activeTab === "analytics" && <UnifiedFinancialDashboard />}
          {activeTab === "ledger" && <Ledger />}
        </div>
      </div>
    </main>
  )
}