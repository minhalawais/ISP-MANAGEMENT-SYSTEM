import React from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { MarketingSiteProvider } from "./context/MarketingSiteContext"
import type { MarketingSite } from "./types"
import MarketingHeader from "./MarketingHeader"
import Hero from "./sections/Hero"
import {
  defaultAboutText,
  defaultFooterTagline,
  defaultHeroHeadline,
} from "./fallbackContent"

const emptySite: MarketingSite = {
  id: "company-1",
  name: "Fast Network",
  address: "",
  contact_number: "",
  email: "",
  website: "",
  tagline: "",
  currency_symbol: "Rs.",
  logo_url: null,
  favicon_url: null,
  website_content: {},
  plans: [],
  addons: [],
  areas: [],
  coverage: [],
  stats: { plan_count: 0, area_count: 0, customer_count: null },
}

const renderWithSite = (node: React.ReactNode, site: MarketingSite = emptySite) =>
  render(
    <MemoryRouter>
      <MarketingSiteProvider site={site}>{node}</MarketingSiteProvider>
    </MemoryRouter>,
  )

describe("marketing default content", () => {
  it("uses company identity without inventing a location", () => {
    expect(defaultHeroHeadline("Fast Network")).toBe("Fast, dependable internet from Fast Network")
    expect(defaultHeroHeadline("Fast Network", "Kasur and nearby areas")).toBe(
      "Fast home internet for Kasur and nearby areas",
    )
  })

  it("does not claim business service when no business package exists", () => {
    expect(defaultAboutText("Fast Network", false)).not.toContain("business")
    expect(defaultFooterTagline("Fast Network", false)).not.toContain("business")
    expect(defaultFooterTagline("Fast Network", true)).toContain("homes and businesses")
  })

  it("keeps core website pages discoverable and hides an unconfigured portal", () => {
    renderWithSite(<MarketingHeader />)

    expect(screen.getByText("Fast Network")).toBeInTheDocument()
    expect(screen.getByText("Sales and support")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Packages" })).toHaveAttribute("href", "/plans")
    expect(screen.getByRole("link", { name: "Coverage" })).toHaveAttribute("href", "/coverage")
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about")
    expect(screen.queryByText("Customer portal")).not.toBeInTheDocument()
  })

  it("renders a neutral zero-content hero and coverage action", () => {
    renderWithSite(<Hero />)

    expect(screen.getByRole("heading", { name: "Fast, dependable internet from Fast Network" })).toBeInTheDocument()
    expect(screen.getByText("Ask about coverage")).toBeInTheDocument()
    expect(screen.queryByText(/Lahore/i)).not.toBeInTheDocument()
  })

  it("keeps explicit website content authoritative", () => {
    renderWithSite(<Hero />, {
      ...emptySite,
      website_content: { hero_headline: "Internet built for our neighbourhood" },
    })

    expect(screen.getByRole("heading", { name: "Internet built for our neighbourhood" })).toBeInTheDocument()
  })
})
