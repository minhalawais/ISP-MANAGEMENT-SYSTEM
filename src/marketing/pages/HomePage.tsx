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
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink } from "../utils.ts"

const HomePage: React.FC = () => {
  const site = useMarketingSite()
  const hasPlans = site.plans.length > 0
  const whatsappLink = buildWhatsAppLink(
    site.website_content?.social_links?.whatsapp || site.contact_number,
    `Hi ${site.name}, please share the internet packages available at my address.`,
  )

  return (
    <>
      <Hero />
      <AvailabilityChecker />

      {hasPlans ? <section className="mk-hairline-bottom bg-[var(--mk-canvas)]">
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
      </section> : (
        <section className="mk-hairline-bottom bg-[var(--mk-canvas)]">
          <div className="mk-shell px-5 sm:px-8 py-12 sm:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <span className="mk-eyebrow">Packages</span>
              <h2 className="mt-3 text-2xl font-semibold">Find the package available at your address</h2>
              <p className="mt-2 text-sm text-[var(--mk-ink-dim)] max-w-xl">Packages are confirmed according to coverage and connection type. Contact the team for currently available options.</p>
            </div>
            {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="h-11 px-5 shrink-0 inline-flex items-center justify-center rounded-md bg-[var(--mk-ink)] text-white text-sm font-semibold hover:bg-[var(--mk-accent)] transition-colors">Ask about packages</a>}
          </div>
        </section>
      )}

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
