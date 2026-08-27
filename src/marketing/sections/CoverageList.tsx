import React from "react"
import { MapPin } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"

const CoverageList: React.FC = () => {
  const site = useMarketingSite()
  const areas = site.areas || []

  if (areas.length === 0) {
    return (
      <div className="rounded-[var(--mk-radius-card)] border border-[var(--mk-hairline)] bg-[var(--mk-surface)] p-10 text-center">
        <p className="text-sm text-[var(--mk-ink-dim)]">
          No coverage areas are listed yet. Contact us to check availability at your address.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {areas.map((area) => (
        <div
          key={area}
          className="flex items-center gap-2 rounded-[var(--mk-radius-chip)] border border-[var(--mk-hairline)] bg-[var(--mk-surface)] px-3.5 py-3 text-sm text-[var(--mk-ink)]"
        >
          <MapPin className="h-4 w-4 text-[var(--mk-accent)] flex-shrink-0" />
          <span className="truncate">{area}</span>
        </div>
      ))}
    </div>
  )
}

export default CoverageList
