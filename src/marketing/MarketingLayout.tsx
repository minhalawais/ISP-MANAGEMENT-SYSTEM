import React from "react"
import MarketingHeader from "./MarketingHeader.tsx"
import MarketingFooter from "./MarketingFooter.tsx"
import { useMarketingSite } from "./context/MarketingSiteContext.tsx"

const MarketingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const site = useMarketingSite()
  const accent = site.website_content?.brand_color
  const style = /^#[0-9a-f]{6}$/i.test(accent || "") ? ({ "--mk-accent": accent } as React.CSSProperties) : undefined
  return <div className="marketing-site flex min-h-screen flex-col" style={style}>
    <MarketingHeader />
    <main className="flex-1">{children}</main>
    <MarketingFooter />
  </div>
}

export default MarketingLayout
