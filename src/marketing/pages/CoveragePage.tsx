import React from "react"
import PageHeader from "../components/PageHeader.tsx"
import CoverageList from "../sections/CoverageList.tsx"
import CtaBand from "../sections/CtaBand.tsx"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import AvailabilityChecker from "../sections/AvailabilityChecker.tsx"

const CoveragePage: React.FC = () => {
  const site = useMarketingSite()
  return (
    <>
      <PageHeader
        eyebrow="Coverage"
        title="Where we operate"
        description={
          site.areas.length > 0
            ? `Check your address against ${site.areas.length} listed service area${site.areas.length === 1 ? "" : "s"}. Final availability depends on street-level feasibility.`
            : "Contact us to check availability at your address."
        }
      />
      <AvailabilityChecker />
      <section className="bg-[var(--mk-canvas)]">
        <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
          <CoverageList />
        </div>
      </section>
      <CtaBand />
    </>
  )
}

export default CoveragePage
