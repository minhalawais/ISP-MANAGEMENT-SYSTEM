import React from "react"
import { motion } from "framer-motion"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"

const WhyChooseUs: React.FC = () => {
  const site = useMarketingSite()
  const serviceCity = site.website_content?.service_city?.trim() || "your local area"
  const localFacts = [
    {
      title: "Coverage information",
      description: site.areas.length > 0
        ? `${site.areas.length} listed service areas around ${serviceCity}, with street-level confirmation before installation.`
        : "Coverage and installation requirements are confirmed for each address.",
    },
    {
      title: "Packages you can compare",
      description: site.plans.length > 0
        ? `Compare ${site.plans.length} monthly internet packages before speaking with the sales team.`
        : "Ask the sales team which monthly package is available at your address.",
    },
    site.contact_number ? {
      title: "Direct contact",
      description: `Call or WhatsApp ${site.contact_number} for availability, installation and service questions.`,
    } : null,
  ].filter((item): item is { title: string; description: string } => Boolean(item))
  const items = site.website_content?.why_choose_us?.length
    ? site.website_content.why_choose_us
    : localFacts

  return (
    <section className="mk-hairline-bottom bg-[var(--mk-surface)]">
      <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
        <span className="mk-eyebrow">Service information</span>
        <h2 className="mt-3 max-w-lg text-2xl sm:text-3xl font-semibold">
          What to expect, from inquiry to connection
        </h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="mk-hairline-top pt-5"
            >
              <p className="text-xs font-mono text-[var(--mk-ink-mute)]">{String(idx + 1).padStart(2, "0")}</p>
              <p className="mt-2 font-semibold text-[var(--mk-ink)]">{item.title}</p>
              <p className="mt-2 text-sm text-[var(--mk-ink-dim)] leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
