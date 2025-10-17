import type React from "react"

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "completed" | "failed" | "resolved" | "open" | "paid"
  size?: "sm" | "md" | "lg"
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const statusConfig = {
    active: { bg: "bg-[#10B981]", text: "Active" },
    inactive: { bg: "bg-[#EF4444]", text: "Inactive" },
    pending: { bg: "bg-[#F59E0B]", text: "Pending" },
    completed: { bg: "bg-[#10B981]", text: "Completed" },
    failed: { bg: "bg-[#EF4444]", text: "Failed" },
    resolved: { bg: "bg-[#10B981]", text: "Resolved" },
    open: { bg: "bg-[#3A86FF]", text: "Open" },
    paid: { bg: "bg-[#10B981]", text: "Paid" }, // Add this line
  }

  const config = statusConfig[status] || { bg: "bg-[#6B7280]", text: status } // Fallback for unknown status
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  }

  return (
    <span className={`${config.bg} text-white font-semibold rounded-full ${sizeClasses[size]} inline-block`}>
      {config.text}
    </span>
  )
}

export default StatusBadge