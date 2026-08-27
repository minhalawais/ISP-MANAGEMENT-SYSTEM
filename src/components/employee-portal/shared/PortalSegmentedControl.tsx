"use client"

export interface PortalSegmentedOption {
  value: string
  label: string
}

interface PortalSegmentedControlProps {
  options: PortalSegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function PortalSegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: PortalSegmentedControlProps) {
  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-1 shadow-sm ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-2.5 text-xs font-medium transition-all ${
            value === option.value
              ? "bg-white text-electric-blue shadow-sm ring-1 ring-electric-blue/20"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
