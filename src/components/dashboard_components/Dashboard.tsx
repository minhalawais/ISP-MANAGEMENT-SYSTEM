"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnifiedFinancialDashboard } from "@/components/unified/unified-financial-dashboard"
import { Ledger } from "@/components/ledger/ledger"

export default function Page() {
  return (
    <main className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Unified Dashboard</h1>
        <p className="text-[#6B7280]">Analytics overview and detailed ledger</p>
      </header>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-auto bg-[#F1F0E8] border border-[#E5E1DA]">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-[#1F2937]">
            Dashboard Analytics
          </TabsTrigger>
          <TabsTrigger value="ledger" className="data-[state=active]:bg-white data-[state=active]:text-[#1F2937]">
            Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          <UnifiedFinancialDashboard />
        </TabsContent>
        <TabsContent value="ledger" className="mt-4">
          <Ledger />
        </TabsContent>
      </Tabs>
    </main>
  )
}
