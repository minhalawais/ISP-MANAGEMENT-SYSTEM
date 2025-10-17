import type React from "react"

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  trend?: {
    direction: "up" | "down"
    percentage: number
  }
  subtext?: string
}

export const KPICard: React.FC<KPICardProps> = ({ icon, label, value, color, trend, subtext }) => (
  <div className="bg-white rounded-lg p-5 border border-[#E5E1DA] shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-[#4A5568] font-medium">{label}</p>
      <div className={`${color} p-2.5 rounded-lg`}>{icon}</div>
    </div>
    <div className="flex items-baseline justify-between">
      <p className="text-2xl font-bold text-[#2A5C8A]">{value}</p>
      {trend && (
        <span className={`text-xs font-semibold ${trend.direction === "up" ? "text-[#10B981]" : "text-[#EF4444]"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.percentage}%
        </span>
      )}
    </div>
    {subtext && <p className="text-xs text-[#4A5568] mt-2">{subtext}</p>}
  </div>
)

export default KPICard
