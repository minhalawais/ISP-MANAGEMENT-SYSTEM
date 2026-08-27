import React from "react"
import PageHeader from "../components/PageHeader.tsx"
import PlansGrid from "../sections/PlansGrid.tsx"
import CtaBand from "../sections/CtaBand.tsx"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { formatPrice } from "../utils.ts"

const PlansPage: React.FC = () => {
  const site = useMarketingSite()
  return <>
    <PageHeader
      eyebrow="Plans"
      title="Home internet packages"
      description="Compare monthly prices and speeds, then check which package is available at your address."
    />
    <section className="bg-[var(--mk-canvas)]">
      <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20">
        <PlansGrid />
      </div>
    </section>
    {site.addons?.length > 0 && <section className="mk-hairline-top bg-[var(--mk-surface)]"><div className="mk-shell px-5 sm:px-8 py-14 sm:py-16"><span className="mk-eyebrow">Optional services</span><h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Add what your connection needs</h2><div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-4 border-y border-[var(--mk-hairline)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--mk-hairline)]">{site.addons.map((addon) => <div key={addon.id} className="py-5 sm:px-5 first:pl-0"><p className="font-semibold">{addon.name}</p><p className="mt-1 text-sm text-[var(--mk-ink-dim)]">{formatPrice(addon.price, site.currency_symbol)} /mo</p><p className="mt-2 text-xs text-[var(--mk-ink-mute)]">{addon.tax_inclusive ? "Taxes included" : "Excludes applicable taxes"}</p></div>)}</div></div></section>}
    <CtaBand />
  </>
}

export default PlansPage
