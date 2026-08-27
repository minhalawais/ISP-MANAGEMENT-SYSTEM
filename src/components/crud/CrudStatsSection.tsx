import React from "react"
import type { StatCardDef } from "../../types/crudFilters.ts"
import type { CrudPeriod } from "../../types/crudFilters.ts"
import { CrudStatCards } from "./CrudStatCards.tsx"
import { CrudPeriodFilter } from "./CrudPeriodFilter.tsx"

type CrudStatsSectionProps = {
  cards: StatCardDef[]
  activeStatId: string | null
  onStatClick: (card: StatCardDef) => void
  period: CrudPeriod
  periodLabel: string
  periodActive: boolean
  onSetPeriod: (period: CrudPeriod) => void
  onSetPeriodAll: () => void
}

export function CrudStatsSection({
  cards,
  activeStatId,
  onStatClick,
  period,
  periodLabel,
  periodActive,
  onSetPeriod,
  onSetPeriodAll,
}: CrudStatsSectionProps) {
  return (
    <div>
      <CrudStatCards cards={cards} activeStatId={activeStatId} onStatClick={onStatClick} />
      <div className="flex justify-end mt-2">
        <CrudPeriodFilter
          period={period}
          label={periodLabel}
          isActive={periodActive}
          onSetPeriod={onSetPeriod}
          onSetAll={onSetPeriodAll}
        />
      </div>
    </div>
  )
}
