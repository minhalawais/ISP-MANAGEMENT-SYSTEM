import React from "react"
import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { FALLBACK_TESTIMONIALS } from "../fallbackContent.ts"

const TrustBand: React.FC = () => {
  const site = useMarketingSite()
  const content = site.website_content || {}
  const testimonials =
    content.testimonials && content.testimonials.length > 0
      ? content.testimonials.filter((t) => t.quote?.trim())
      : FALLBACK_TESTIMONIALS
  const stats = site.stats
  const proof = [
    stats.customer_count ? { label: "Active customers", value: `${stats.customer_count.toLocaleString()}+` } : null,
    content.established_year ? { label: "Serving since", value: String(content.established_year) } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item))
  const hasTestimonials = testimonials.length > 0

  if (proof.length === 0 && testimonials.length === 0) return null

  return (
    <section className="mk-hairline-bottom bg-[var(--mk-canvas)]">
      <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mk-eyebrow">Trust</span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">{hasTestimonials ? "What customers say" : `About ${site.name}`}</h2>
          </div>
          <p className="text-sm text-[var(--mk-ink-dim)] max-w-sm">Verified company information and feedback supplied by {site.name}.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {proof.map((item) => (
            <div
              key={item.label}
              className="rounded-[var(--mk-radius-card)] border border-[var(--mk-hairline)] bg-[var(--mk-surface)] px-4 py-3"
            >
              <p className="mk-display text-xl font-semibold text-[var(--mk-ink)]">{item.value}</p>
              <p className="text-xs text-[var(--mk-ink-mute)] mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {testimonials.length > 0 && <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.slice(0, 3).map((item, idx) => (
            <motion.blockquote
              key={`${item.name}-${idx}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-[var(--mk-radius-card)] border border-[var(--mk-hairline)] bg-[var(--mk-surface)] p-5"
            >
              <Quote className="h-4 w-4 text-[var(--mk-accent)]" />
              <p className="mt-3 text-sm leading-relaxed text-[var(--mk-ink-dim)]">“{item.quote}”</p>
              <footer className="mt-4 text-sm font-medium text-[var(--mk-ink)]">
                {item.name}
                {item.area ? (
                  <span className="font-normal text-[var(--mk-ink-mute)]"> · {item.area}</span>
                ) : null}
              </footer>
            </motion.blockquote>
          ))}
        </div>}
      </div>
    </section>
  )
}

export default TrustBand
