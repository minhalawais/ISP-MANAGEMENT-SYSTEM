import React from "react"
import { motion } from "framer-motion"
import { DEFAULT_INSTALLATION_IMAGE } from "../fallbackContent.ts"

const STEPS = [
  { title: "Check availability", description: "Share your area and exact address for a coverage check." },
  { title: "Review available packages", description: "Compare the packages offered at that location." },
  { title: "Confirm the requirements", description: "Confirm applicable charges, equipment and installation requirements." },
  { title: "Schedule your connection", description: "Arrange a suitable connection date with the service team." },
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
        <img src={DEFAULT_INSTALLATION_IMAGE} alt="Internet connection equipment being prepared for installation" className="h-full w-full object-cover" loading="lazy" />
      </div>
    </div>
  </section>
)

export default ProcessRail
