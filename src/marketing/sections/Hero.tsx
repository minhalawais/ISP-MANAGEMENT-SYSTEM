import React from "react"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, MessageCircle } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink, formatPrice, lowestPlanPrice } from "../utils.ts"
import { getAssetUrl } from "../../utils/auth.ts"
import {
  DEFAULT_HERO_IMAGE,
  FALLBACK_HERO_HEADLINE,
  FALLBACK_HERO_SUBHEADLINE,
  FALLBACK_INSTALL_SLA,
} from "../fallbackContent.ts"

const Hero: React.FC = () => {
  const site = useMarketingSite()
  const content = site.website_content || {}
  const whatsappLink = buildWhatsAppLink(
    content.social_links?.whatsapp || site.contact_number,
    `Hi, I'm interested in internet plans from ${site.name}.`,
  )
  const configuredHero = getAssetUrl(content.hero_image_url?.trim() || null)
  const heroImage = configuredHero || DEFAULT_HERO_IMAGE
  const fromPrice = lowestPlanPrice(site.plans)
  const cityLine =
    content.service_city?.trim() ||
    (site.areas.length > 0 ? `Serving ${site.areas.slice(0, 3).join(", ")}${site.areas.length > 3 ? " & more" : ""}` : null)
  const installSla = content.install_sla?.trim() || FALLBACK_INSTALL_SLA

  return (
    <section className="relative overflow-hidden flex items-end bg-[#e9efec] min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-6rem)]">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        onError={(e) => {
          const img = e.currentTarget
          if (img.getAttribute("src") === DEFAULT_HERO_IMAGE) return
          img.src = DEFAULT_HERO_IMAGE
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,248,246,0.98)_0%,rgba(244,248,246,0.94)_34%,rgba(244,248,246,0.38)_60%,rgba(244,248,246,0)_78%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,rgba(14,26,31,0.18),transparent)]" />

      <div className="relative mk-shell-wide px-5 sm:px-8 py-14 sm:py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {cityLine && <p className="mb-5 text-sm font-medium text-[var(--mk-ink-dim)] flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--mk-accent)]" />{cityLine}</p>}

          <h1 className="text-[2.35rem] sm:text-[3.65rem] leading-[1.02] font-semibold text-[var(--mk-ink)] max-w-[14ch]">
            {content.hero_headline || FALLBACK_HERO_HEADLINE}
          </h1>
          <p className="mt-5 max-w-lg text-base sm:text-lg text-[var(--mk-ink-dim)] leading-relaxed">
            {content.hero_subheadline || FALLBACK_HERO_SUBHEADLINE}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--mk-ink-dim)]">
            {fromPrice != null && (
              <span>
                Packages from{" "}
                <strong className="text-[var(--mk-ink)] font-semibold">{formatPrice(fromPrice, site.currency_symbol)}</strong>
                /mo
              </span>
            )}
            {installSla && (
              <>
                {fromPrice != null && <span className="text-[var(--mk-ink-mute)]">•</span>}
                <span>{installSla}</span>
              </>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#coverage-check"
              className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-[var(--mk-ink)] text-white text-sm font-semibold hover:bg-[var(--mk-accent)] transition-colors"
            >
              Check my area
              <ArrowRight className="h-4 w-4" />
            </a>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-6 inline-flex items-center gap-2 rounded-md border border-[var(--mk-hairline-strong)] bg-white/72 text-[var(--mk-ink)] text-sm font-medium hover:border-[var(--mk-accent)] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp sales
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
