import React from "react"
import { motion } from "framer-motion"
import { DEFAULT_INSTALLATION_IMAGE } from "../fallbackContent.ts"

const STEPS = [
  { title: "Check your location", description: "Choose your area and share the exact street or society." },
  { title: "Review available plans", description: "Compare the packages and charges available at that location." },
  { title: "Confirm the installation", description: "The team confirms wiring, equipment, timing and any one-time cost." },
  { title: "Get connected", description: "A technician installs and tests the connection before handover." },
]

const ProcessRail: React.FC = () => (
  <section className="mk-hairline-bottom bg-[var(--mk-canvas)]">
    <div className="mk-shell px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16 items-center">
      <div>
        <span className="mk-eyebrow">Installation</span>
        <h2 className="mt-4 max-w-lg text-3xl sm:text-4xl font-semibold">From area check to a tested connection</h2>
        <div className="mt-9 divide-y divide-[var(--mk-hairline)] border-y border-[var(--mk-hairline)]">
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="grid grid-cols-[2.25rem_1fr] gap-4 py-4"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mk-accent-tint)] text-[var(--mk-accent)] font-semibold text-sm">
              {idx + 1}
            </span>
            <div><p className="font-semibold text-[var(--mk-ink)]">{step.title}</p><p className="mt-1 text-sm text-[var(--mk-ink-dim)] leading-relaxed">{step.description}</p></div>
          </motion.div>
        ))}
        </div>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#dfe8e4]">
        <img src={DEFAULT_INSTALLATION_IMAGE} alt="A local technician testing a home fiber connection" className="h-full w-full object-cover" loading="lazy" />
      </div>
    </div>
  </section>
)

export default ProcessRail
