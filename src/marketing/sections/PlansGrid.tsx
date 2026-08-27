import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check, Gauge, Wifi } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink, formatPrice, formatSpeed } from "../utils.ts"

const usageGuide = (speed?: number | null) => {
  if (!speed) return null
  if (speed <= 10) return "Browsing, messaging and everyday use"
  if (speed <= 20) return "Streaming and everyday family use"
  if (speed <= 40) return "Multiple devices and work from home"
  if (speed <= 70) return "Heavy streaming, gaming and larger homes"
  return "Many connected devices and high-demand use"
}

const usefulDescription = (description: string | undefined, speed?: number | null) => {
  const value = description?.trim()
  if (!value) return usageGuide(speed)
  const normalized = value.toLowerCase().replace(/\s+/g, "")
  if (speed && (normalized === `${speed}mb` || normalized === `${speed}mbps`)) return usageGuide(speed)
  return value
}

const PlansGrid: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const site = useMarketingSite()
  const audiences = useMemo(() => Array.from(new Set(site.plans.map((plan) => plan.customer_type))), [site.plans])
  const [audience, setAudience] = useState<"residential" | "business">(
    audiences.includes("residential") ? "residential" : "business",
  )
  const matchingPlans = site.plans.filter((plan) => plan.customer_type === audience)
  const plans = compact ? matchingPlans.slice(0, 3) : matchingPlans
  const waNumber = site.website_content?.social_links?.whatsapp || site.contact_number

  if (plans.length === 0) {
    return (
      <div className="rounded-[var(--mk-radius-card)] border border-[var(--mk-hairline)] bg-[var(--mk-surface)] p-10 text-center">
        <p className="text-sm text-[var(--mk-ink-dim)]">
          Package details are not available here yet. Contact us on WhatsApp for current options.
        </p>
      </div>
    )
  }

  return (
    <div>
      {audiences.length > 1 && (
        <div className="mb-7 inline-flex rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-surface)] p-1" aria-label="Package audience">
          {audiences.map((item) => (
            <button key={item} type="button" onClick={() => setAudience(item)} className={`h-9 px-4 rounded text-sm font-medium capitalize transition-colors ${audience === item ? "bg-[var(--mk-ink)] text-white" : "text-[var(--mk-ink-dim)] hover:text-[var(--mk-ink)]"}`}>
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {plans.map((plan, idx) => {
        const isPopular = plan.is_featured
        const whatsappLink = buildWhatsAppLink(
          waNumber,
          `Hi, I'd like to subscribe to the ${plan.name} plan (${formatSpeed(plan.speed_mbps) || "internet"}) from ${site.name}.`,
        )
        const speedLabel = formatSpeed(plan.speed_mbps)
        const description = usefulDescription(plan.description, plan.speed_mbps)
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className={`relative rounded-[var(--mk-radius-card)] p-6 flex flex-col ${
              isPopular
                ? "bg-[var(--mk-ink)] text-white shadow-lg ring-2 ring-[var(--mk-accent)]"
                : "bg-[var(--mk-surface)] border border-[var(--mk-hairline)] mk-shadow-sm"
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[var(--mk-accent)] text-white text-xs font-semibold">
                Most popular
              </span>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`mk-display text-lg font-semibold ${isPopular ? "text-white" : ""}`}>{plan.name}</p>
                {(plan.is_unlimited || plan.data_cap_gb) && <p className={`mt-1 text-xs uppercase tracking-wide ${isPopular ? "text-white/55" : "text-[var(--mk-ink-mute)]"}`}>
                  {plan.is_unlimited ? "Unlimited data" : `${plan.data_cap_gb} GB / month`}
                </p>}
              </div>
              <span
                className={`h-10 w-10 rounded-xl inline-flex items-center justify-center ${
                  isPopular ? "bg-white/10 text-[#7ff0ae]" : "bg-[var(--mk-accent-tint)] text-[var(--mk-accent)]"
                }`}
              >
                <Wifi className="h-5 w-5" />
              </span>
            </div>

            {speedLabel && (
              <p className={`mt-5 mk-display text-4xl font-semibold tracking-tight ${isPopular ? "text-white" : ""}`}>
                {plan.speed_mbps}
                <span className={`ml-1.5 text-base font-medium ${isPopular ? "text-white/65" : "text-[var(--mk-ink-mute)]"}`}>
                  Mbps
                </span>
              </p>
            )}

            <p className="mt-3 mk-display text-2xl font-semibold">
              {formatPrice(plan.price, site.currency_symbol)}
              {plan.price !== null && (
                <span className={`text-sm font-normal ${isPopular ? "text-white/60" : "text-[var(--mk-ink-mute)]"}`}>
                  {" "}
                  /mo
                </span>
              )}
            </p>

            {description && (
              <p className={`mt-3 text-sm leading-relaxed ${isPopular ? "text-white/80" : "text-[var(--mk-ink-dim)]"}`}>
                {description}
              </p>
            )}

            <ul className="mt-5 space-y-2">
              {speedLabel && (
                <li className={`flex items-center gap-2 text-sm ${isPopular ? "text-white/85" : "text-[var(--mk-ink-dim)]"}`}>
                  <Gauge className={`h-3.5 w-3.5 shrink-0 ${isPopular ? "text-[#7ff0ae]" : "text-[var(--mk-accent)]"}`} />
                  Up to {speedLabel}
                </li>
              )}
              {plan.upload_speed_mbps ? (
                <li
                  className={`flex items-center gap-2 text-sm ${isPopular ? "text-white/85" : "text-[var(--mk-ink-dim)]"}`}
                >
                  <Check className={`h-3.5 w-3.5 shrink-0 ${isPopular ? "text-[#7ff0ae]" : "text-[var(--mk-accent)]"}`} />
                  Up to {plan.upload_speed_mbps} Mbps upload
                </li>
              ) : null}
              {plan.technology ? <li className={`flex items-center gap-2 text-sm ${isPopular ? "text-white/85" : "text-[var(--mk-ink-dim)]"}`}><Check className={`h-3.5 w-3.5 shrink-0 ${isPopular ? "text-[#7ff0ae]" : "text-[var(--mk-accent)]"}`} />{plan.technology}</li> : null}
              {plan.installation_fee !== null ? <li className={`flex items-center gap-2 text-sm ${isPopular ? "text-white/85" : "text-[var(--mk-ink-dim)]"}`}><Check className={`h-3.5 w-3.5 shrink-0 ${isPopular ? "text-[#7ff0ae]" : "text-[var(--mk-accent)]"}`} />Installation {formatPrice(plan.installation_fee, site.currency_symbol)}</li> : null}
              {plan.equipment_fee !== null ? <li className={`flex items-center gap-2 text-sm ${isPopular ? "text-white/85" : "text-[var(--mk-ink-dim)]"}`}><Check className={`h-3.5 w-3.5 shrink-0 ${isPopular ? "text-[#7ff0ae]" : "text-[var(--mk-accent)]"}`} />Equipment {formatPrice(plan.equipment_fee, site.currency_symbol)}</li> : null}
            </ul>

            <p className={`mt-4 text-xs ${isPopular ? "text-white/55" : "text-[var(--mk-ink-mute)]"}`}>
              {plan.tax_inclusive ? "Includes applicable taxes" : "Excludes applicable taxes, where required"}
              {plan.contract_term_months ? ` • ${plan.contract_term_months}-month term` : ""}
            </p>

            <div className="flex-1" />
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 h-10 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
                  isPopular
                    ? "bg-white text-[var(--mk-ink)] hover:bg-[var(--mk-accent)] hover:text-white"
                    : "bg-[var(--mk-ink)] text-white hover:bg-[var(--mk-accent)]"
                }`}
              >
                Get this package
              </a>
            )}
          </motion.div>
        )
      })}
      </div>
    </div>
  )
}

export default PlansGrid
