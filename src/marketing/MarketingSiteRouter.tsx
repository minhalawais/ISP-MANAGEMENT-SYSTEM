import React, { useEffect, useState } from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import "./styles/marketingTheme.css"
import { fetchPublicSite, SiteNotConfiguredError } from "./api/marketingApi.ts"
import type { MarketingSite } from "./types.ts"
import { MarketingSiteProvider } from "./context/MarketingSiteContext.tsx"
import MarketingLayout from "./MarketingLayout.tsx"
import SiteNotConfigured from "./SiteNotConfigured.tsx"
import HomePage from "./pages/HomePage.tsx"
import PlansPage from "./pages/PlansPage.tsx"
import CoveragePage from "./pages/CoveragePage.tsx"
import AboutPage from "./pages/AboutPage.tsx"
import FaqPage from "./pages/FaqPage.tsx"
import ContactPage from "./pages/ContactPage.tsx"
import { getAssetUrl } from "../utils/auth.ts"

type LoadState =
  | { status: "loading" }
  | { status: "ready"; site: MarketingSite }
  | { status: "not-configured" }
  | { status: "error" }

const MarketingSiteRouter: React.FC<{ siteHost: string }> = ({ siteHost }) => {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    fetchPublicSite(siteHost)
      .then((site) => {
        if (!cancelled) setState({ status: "ready", site })
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof SiteNotConfiguredError) {
          setState({ status: "not-configured" })
        } else {
          setState({ status: "error" })
        }
      })
    return () => {
      cancelled = true
    }
  }, [siteHost])

  useEffect(() => {
    if (state.status !== "ready") return
    const site = state.site
    const previousTitle = document.title
    document.title = site.tagline ? `${site.name} — ${site.tagline}` : `${site.name} | Home Internet`
    const descriptionText = site.website_content?.hero_subheadline || site.tagline || `Internet packages and coverage from ${site.name}.`

    let description = document.querySelector("meta[name='description']") as HTMLMetaElement | null
    const previousDescription = description?.content
    if (!description) {
      description = document.createElement("meta")
      description.name = "description"
      document.head.appendChild(description)
    }
    description.content = descriptionText

    let themeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null
    const previousThemeColor = themeColor?.content
    if (!themeColor) {
      themeColor = document.createElement("meta")
      themeColor.name = "theme-color"
      document.head.appendChild(themeColor)
    }
    themeColor.content = site.website_content?.brand_color || "#087c69"

    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
    const previousHref = link?.href
    const iconUrl = getAssetUrl(site.favicon_url) || getAssetUrl(site.logo_url)
    if (iconUrl) {
      if (!link) {
        link = document.createElement("link")
        link.rel = "icon"
        document.head.appendChild(link)
      }
      link.href = iconUrl
    }

    return () => {
      document.title = previousTitle
      if (link && previousHref) link.href = previousHref
      if (description && previousDescription !== undefined) description.content = previousDescription
      if (themeColor && previousThemeColor !== undefined) themeColor.content = previousThemeColor
    }
  }, [state])

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="h-8 w-8 rounded-full border-2 border-[#0f6e5c] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (state.status === "not-configured") {
    return <SiteNotConfigured host={siteHost} />
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-[#10151a]">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#4b545c]">This site couldn't be loaded. Please try again shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <MarketingSiteProvider site={state.site}>
      <Router>
        <MarketingLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </MarketingLayout>
      </Router>
    </MarketingSiteProvider>
  )
}

export default MarketingSiteRouter
