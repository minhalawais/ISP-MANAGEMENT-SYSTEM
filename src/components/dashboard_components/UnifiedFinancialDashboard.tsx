"use client"
import { useState } from "react"
import { UnifiedFinancialDashboard } from "./UnifiedDashboard.tsx"
import { Ledger } from "./ledger/Ledger.tsx"

export const UnifiedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "ledger">("analytics")

  return (
    <div className="w-full">
      <div className="inline-flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 mb-3">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`h-9 px-3 text-sm rounded-md font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`h-9 px-3 text-sm rounded-md font-medium transition-colors ${
            activeTab === "ledger"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Ledger
        </button>
      </div>

      {activeTab === "analytics" && <UnifiedFinancialDashboard />}
      {activeTab === "ledger" && <Ledger />}
    </div>
  )
}