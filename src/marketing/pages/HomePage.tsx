import React from "react"
import Hero from "../sections/Hero.tsx"
import PlansGrid from "../sections/PlansGrid.tsx"
import WhyChooseUs from "../sections/WhyChooseUs.tsx"
import ProcessRail from "../sections/ProcessRail.tsx"
import TrustBand from "../sections/TrustBand.tsx"
import CtaBand from "../sections/CtaBand.tsx"
import AvailabilityChecker from "../sections/AvailabilityChecker.tsx"
import BusinessInternetBand from "../sections/BusinessInternetBand.tsx"
import CustomerCareBand from "../sections/CustomerCareBand.tsx"
import FaqAccordion from "../sections/FaqAccordion.tsx"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <AvailabilityChecker />

      <section className="mk-hairline-bottom bg-[var(--mk-canvas)]">
        <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="mk-eyebrow">Packages</span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Choose a package for your home</h2>
              <p className="mt-2 text-sm text-[var(--mk-ink-dim)]">Compare monthly prices and choose the speed that suits how your household uses the internet.</p>
            </div>
            <Link
              to="/plans"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--mk-accent)] hover:gap-2.5 transition-all"
            >
              See all packages
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <PlansGrid compact />
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <BusinessInternetBand />
      <ProcessRail />
      <section className="mk-hairline-bottom bg-[var(--mk-surface)]">
        <div className="mk-shell-narrow px-5 sm:px-8 py-16 sm:py-20">
          <span className="mk-eyebrow">Before you connect</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Common questions, answered clearly</h2>
          <div className="mt-8"><FaqAccordion /></div>
        </div>
      </section>
      <TrustBand />
      <CtaBand />
      <CustomerCareBand />
    </>
  )
}

export default HomePage
