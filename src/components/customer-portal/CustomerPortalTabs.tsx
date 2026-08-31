"use client"

import type { ElementType } from "react"

export interface CustomerPortalTabOption {
  value: string
  label: string
  icon: ElementType
}

interface CustomerPortalTabsProps {
  options: CustomerPortalTabOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CustomerPortalTabs({
  options,
  value,
  onChange,
  className = "",
}: CustomerPortalTabsProps) {
  return (
    <div
      className={`flex gap-1 overflow-x-auto rounded-xl border border-deep-ocean/10 bg-white p-1.5 shadow-sm ${className}`}
      role="tablist"
      aria-label="Customer portal sections"
    >
      {options.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-portal-primary text-white shadow-sm"
                : "text-slate-gray hover:bg-portal-tint hover:text-portal-primary"
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-gray"}`} />
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
