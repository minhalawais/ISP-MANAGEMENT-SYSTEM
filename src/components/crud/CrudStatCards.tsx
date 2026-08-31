import React from "react"
import type { StatCardDef, StatCardTone } from "../../types/crudFilters.ts"

const toneStyles: Record<
  StatCardTone,
  { bg: string; border: string; value: string; iconBg: string; icon: string }
> = {
  neutral: {
    bg: "bg-light-sky/50",
    border: "border-slate-gray/10",
    value: "text-deep-ocean",
    iconBg: "bg-deep-ocean/10",
    icon: "text-deep-ocean",
  },
  success: {
    bg: "bg-emerald-green/5",
    border: "border-emerald-green/10",
    value: "text-emerald-green",
    iconBg: "bg-emerald-green/10",
    icon: "text-emerald-green",
  },
  danger: {
    bg: "bg-coral-red/5",
    border: "border-coral-red/10",
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
  info: {
    bg: "bg-electric-blue/5",
    border: "border-electric-blue/10",
    value: "text-electric-blue",
    iconBg: "bg-electric-blue/10",
    icon: "text-electric-blue",
  },
}

type CrudStatCardsProps = {
  cards: StatCardDef[]
  activeStatId: string | null
  onStatClick: (card: StatCardDef) => void
}

export function CrudStatCards({ cards, activeStatId, onStatClick }: CrudStatCardsProps) {
  const count = Math.min(cards.length, 4)
  const gridCols =
    count >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : count === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : count === 2
          ? "sm:grid-cols-2 lg:grid-cols-2"
          : "grid-cols-1"

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-3 mb-3`}>
      {cards.map((card) => {
        const styles = toneStyles[card.tone]
        const clickable = card.clickable !== false && !!card.filter
        const isActive = activeStatId === card.id

        return (
          <div
            key={card.id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-pressed={clickable ? isActive : undefined}
            onClick={() => clickable && onStatClick(card)}
            onKeyDown={(e) => {
              if (clickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                onStatClick(card)
              }
            }}
            className={`rounded-lg p-3 border ${styles.bg} ${styles.border} ${
              clickable ? "cursor-pointer hover:border-electric-blue/40 hover:shadow-sm transition-all" : ""
            } ${isActive ? "ring-2 ring-electric-blue border-electric-blue/50 bg-electric-blue/5" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-gray text-xs">{card.label}</p>
                <h3 className={`text-xl font-bold mt-0.5 ${styles.value}`}>{card.value}</h3>
                {card.subValue ? (
                  <p className={`text-xs font-medium mt-0.5 tabular-nums ${styles.value} opacity-80`}>
                    {card.subValue}
                  </p>
                ) : null}
              </div>
              <div className={`${styles.iconBg} p-2 rounded-full`}>
                <card.icon className={`h-4 w-4 ${styles.icon}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
