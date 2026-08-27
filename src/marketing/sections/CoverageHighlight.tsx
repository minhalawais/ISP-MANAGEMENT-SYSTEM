import React from "react"
import { motion } from "framer-motion"
import { MapPin, MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink } from "../utils.ts"
import { FALLBACK_COVERAGE_BLURB } from "../fallbackContent.ts"

const CoverageHighlight: React.FC = () => {
  const site = useMarketingSite()
  const content = site.website_content || {}
  const areas = site.areas
  const blurb = content.coverage_blurb?.trim() || FALLBACK_COVERAGE_BLURB
  const waNumber = content.social_links?.whatsapp || site.contact_number
  const whatsappLink = buildWhatsAppLink(
    waNumber,
    `Hi ${site.name}, please check if my area has coverage.`,
  )

  if (areas.length === 0) {
    return (
      <section className="mk-hairline-bottom bg-[var(--mk-surface)]">
        <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
          <span className="mk-eyebrow">Coverage</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Where we operate</h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-[var(--mk-ink-dim)] leading-relaxed">{blurb}</p>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 h-10 px-5 inline-flex items-center gap-2 rounded-md bg-[var(--mk-ink)] text-white text-sm font-medium hover:bg-[var(--mk-accent)] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Ask about your area
            </a>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mk-hairline-bottom bg-[var(--mk-surface)]">
      <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <span className="mk-eyebrow">Coverage</span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Neighbourhoods we serve</h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--mk-ink-dim)] leading-relaxed">{blurb}</p>
          </div>
          <Link
            to="/coverage"
            className="text-sm font-medium text-[var(--mk-accent)] hover:underline"
          >
            Full coverage list
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areas.slice(0, 9).map((area, idx) => (
              <motion.div
                key={area}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
                className="rounded-[var(--mk-radius-card)] border border-[var(--mk-hairline)] bg-[var(--mk-canvas)] p-4"
              >
                <MapPin className="h-4 w-4 text-[var(--mk-accent)]" />
                <p className="mt-2 text-sm font-medium text-[var(--mk-ink)] leading-snug">{area}</p>
              </motion.div>
            ))}
            {areas.length > 9 && (
              <div className="rounded-[var(--mk-radius-card)] border border-dashed border-[var(--mk-hairline-strong)] p-4 flex items-center">
                <p className="text-sm text-[var(--mk-ink-mute)]">+{areas.length - 9} more areas</p>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-lg bg-[var(--mk-ink)] text-white p-6 sm:p-8 min-h-[260px] flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#7ff0ae] font-semibold">Address confirmation</p>
              <p className="mt-3 mk-display text-2xl font-semibold leading-snug">
                {content.service_city?.trim() || `${site.name} coverage`}
              </p>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                We serve {areas.length} listed area{areas.length === 1 ? "" : "s"}. Our team checks your street, building and network availability before confirming an installation.
              </p>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 h-10 px-5 inline-flex items-center gap-2 rounded-md bg-white text-[var(--mk-ink)] text-sm font-semibold hover:bg-[var(--mk-accent)] hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Check my area
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CoverageHighlight
