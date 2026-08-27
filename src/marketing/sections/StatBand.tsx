import React from "react"
import { Users, MapPin, Wifi, CalendarClock } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"

const StatBand: React.FC = () => {
  const site = useMarketingSite()
  const stats = site.stats
  const establishedYear = site.website_content?.established_year
  const yearsActive = establishedYear ? new Date().getFullYear() - Number(establishedYear) : null

  const items = [
    stats.customer_count > 0 && {
      icon: Users,
      value: `${stats.customer_count.toLocaleString()}+`,
      label: "Customers connected",
    },
    stats.area_count > 0 && {
      icon: MapPin,
      value: `${stats.area_count}`,
      label: stats.area_count === 1 ? "Area covered" : "Areas covered",
    },
    stats.plan_count > 0 && {
      icon: Wifi,
      value: `${stats.plan_count}`,
      label: stats.plan_count === 1 ? "Plan available" : "Plans available",
    },
    yearsActive !== null &&
      yearsActive > 0 && {
        icon: CalendarClock,
        value: `${yearsActive}+`,
        label: "Years in service",
      },
  ].filter(Boolean) as { icon: typeof Users; value: string; label: string }[]

  if (items.length === 0) return null

  const colsClass =
    items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"

  return (
    <section className="mk-hairline-bottom bg-[var(--mk-surface)]">
      <div className="mk-shell px-5 sm:px-8 py-10">
        <div className={`grid grid-cols-2 ${colsClass} gap-6`}>
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-[var(--mk-accent)] flex-shrink-0" />
              <div>
                <p className="mk-display text-2xl font-semibold leading-none">{item.value}</p>
                <p className="text-xs text-[var(--mk-ink-mute)] mt-1">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatBand
