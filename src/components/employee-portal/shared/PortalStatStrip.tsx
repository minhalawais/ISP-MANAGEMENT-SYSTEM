"use client"

import type React from "react"

export interface PortalStatItem {
  key: string
  label: string
  value: React.ReactNode
  icon?: React.ElementType
  tone?: "default" | "accent" | "success" | "danger" | "warning"
}

const TONE_STYLES: Record<
  NonNullable<PortalStatItem["tone"]>,
  { bg: string; border: string; value: string; iconBg: string; icon: string }
> = {
  default: {
    bg: "bg-light-sky/60",
    border: "border-deep-ocean/10",
    value: "text-deep-ocean",
    iconBg: "bg-deep-ocean/10",
    icon: "text-deep-ocean",
  },
  accent: {
    bg: "bg-electric-blue/5",
    border: "border-electric-blue/15",
    value: "text-electric-blue",
    iconBg: "bg-electric-blue/10",
    icon: "text-electric-blue",
  },
  success: {
    bg: "bg-emerald-green/5",
    border: "border-emerald-green/15",
    value: "text-emerald-green",
    iconBg: "bg-emerald-green/10",
    icon: "text-emerald-green",
  },
  danger: {
    bg: "bg-coral-red/5",
    border: "border-coral-red/15",
    value: "text-coral-red",
    iconBg: "bg-coral-red/10",
    icon: "text-coral-red",
  },
  warning: {
    bg: "bg-golden-amber/5",
    border: "border-golden-amber/20",
    value: "text-golden-amber",
    iconBg: "bg-golden-amber/10",
    icon: "text-golden-amber",
  },
}

const MOBILE_COLS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
}

const DESKTOP_COLS: Record<2 | 3 | 4 | 6, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
}

interface PortalStatStripProps {
  items: PortalStatItem[]
  columnsMobile?: 1 | 2 | 3
  columnsDesktop?: 2 | 3 | 4 | 6
  className?: string
}

export function PortalStatStrip({
  items,
  columnsMobile = 3,
  columnsDesktop = 4,
  className = "",
}: PortalStatStripProps) {
  return (
    <div className={`grid ${MOBILE_COLS[columnsMobile]} ${DESKTOP_COLS[columnsDesktop]} gap-2 ${className}`}>
      {items.map((item) => {
        const Icon = item.icon
        const tone = TONE_STYLES[item.tone || "default"]
        return (
          <div
            key={item.key}
            className={`rounded-xl border p-3 shadow-sm ${tone.bg} ${tone.border}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium leading-tight text-slate-gray">{item.label}</p>
                <p className={`mt-0.5 text-xl font-bold leading-none tabular-nums ${tone.value}`}>{item.value}</p>
              </div>
              {Icon && (
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.iconBg}`}>
                  <Icon className={`h-4 w-4 ${tone.icon}`} />
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
