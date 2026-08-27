import React, { createContext, useContext } from "react"
import type { MarketingSite } from "../types.ts"

const MarketingSiteContext = createContext<MarketingSite | null>(null)

export const MarketingSiteProvider: React.FC<{ site: MarketingSite; children: React.ReactNode }> = ({
  site,
  children,
}) => <MarketingSiteContext.Provider value={site}>{children}</MarketingSiteContext.Provider>

/** Must be used within a mounted MarketingSiteRouter — always has data once rendered. */
export const useMarketingSite = (): MarketingSite => {
  const site = useContext(MarketingSiteContext)
  if (!site) {
    throw new Error("useMarketingSite() called outside of MarketingSiteProvider")
  }
  return site
}
