import React from "react"
import PageHeader from "../components/PageHeader.tsx"
import WhyChooseUs from "../sections/WhyChooseUs.tsx"
import StatBand from "../sections/StatBand.tsx"
import CtaBand from "../sections/CtaBand.tsx"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { defaultAboutText } from "../fallbackContent.ts"

const AboutPage: React.FC = () => {
  const site = useMarketingSite()
  const content = site.website_content || {}
  const hasBusinessPlans = site.plans.some((plan) => plan.customer_type === "business")

  return (
    <>
      <PageHeader eyebrow="About" title={`About ${site.name}`} />
      <section className="bg-[var(--mk-surface)]">
        <div className="mk-shell-narrow px-5 sm:px-8 py-16 sm:py-20">
          <p className="text-base sm:text-lg text-[var(--mk-ink-dim)] leading-relaxed">
            {content.about_text || defaultAboutText(site.name, hasBusinessPlans)}
          </p>
          {content.business_hours && (
            <div className="mt-8 mk-hairline-top pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)]">
                Business hours
              </p>
              <p className="mt-2 text-sm text-[var(--mk-ink)]">{content.business_hours}</p>
            </div>
          )}
        </div>
      </section>
      <StatBand />
      <WhyChooseUs />
      <CtaBand />
    </>
  )
}

export default AboutPage
