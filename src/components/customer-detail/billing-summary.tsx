import type React from "react"
import { DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface BillingSummaryProps {
  totalPaid: number
  outstandingBalance: number
  averageMonthly: number
  paymentReliability: number
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  totalPaid,
  outstandingBalance,
  averageMonthly,
  paymentReliability,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg p-5 text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-90">Total Paid</p>
        <DollarSign className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">PKR {totalPaid.toFixed(0)}</p>
    </div>

    <div className="bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg p-5 text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-90">Outstanding</p>
        <AlertTriangle className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">PKR {outstandingBalance.toFixed(0)}</p>
    </div>

    <div className="bg-gradient-to-br from-[#3A86FF] to-[#2563EB] rounded-lg p-5 text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-90">Avg Monthly</p>
        <Clock className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">PKR {averageMonthly.toFixed(0)}</p>
    </div>

    <div className="bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg p-5 text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-90">Reliability</p>
        <CheckCircle className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{paymentReliability.toFixed(0)}%</p>
    </div>
  </div>
)

export default BillingSummary
