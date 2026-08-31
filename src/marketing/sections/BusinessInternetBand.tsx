import React from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { DEFAULT_BUSINESS_IMAGE } from "../fallbackContent.ts"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"

const BUSINESS_NEEDS = ["Cloud billing and POS", "CCTV and remote monitoring", "Video calls and file sharing"]

const BusinessInternetBand: React.FC = () => {
  const site = useMarketingSite()
  if (!site.plans.some((plan) => plan.customer_type === "business")) return null

  return (
  <section id="business-internet" className="mk-hairline-bottom bg-[var(--mk-surface)]">
    <div className="mk-shell px-5 sm:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#dfe8e4]">
        <img src={DEFAULT_BUSINESS_IMAGE} alt="A small business using connected systems" className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div>
        <span className="mk-eyebrow">For business</span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-semibold leading-tight max-w-[14ch]">Internet that keeps everyday business moving</h2>
        <p className="mt-5 text-[var(--mk-ink-dim)] leading-relaxed max-w-xl">
          Ask about business packages when your shop, office, cameras and payments need a connection planned around real operating hours.
        </p>
        <ul className="mt-7 space-y-3">
          {BUSINESS_NEEDS.map((item) => <li key={item} className="flex items-center gap-3 text-sm text-[var(--mk-ink)]"><CheckCircle2 className="h-5 w-5 text-[var(--mk-accent)]" />{item}</li>)}
        </ul>
        <Link to="/plans" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--mk-accent)] hover:gap-3 transition-all">
          Explore business packages <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
  )
}

export default BusinessInternetBand
