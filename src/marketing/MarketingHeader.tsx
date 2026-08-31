import React, { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { Menu, MessageCircle, Phone, UserRound, Wifi, X } from "lucide-react"
import { useMarketingSite } from "./context/MarketingSiteContext.tsx"
import { buildTelLink, buildWhatsAppLink, formatDisplayPhone } from "./utils.ts"
import { getAssetUrl } from "../utils/auth.ts"

const MarketingHeader: React.FC = () => {
  const site = useMarketingSite()
  const [menuOpen, setMenuOpen] = useState(false)
  const waNumber = site.website_content?.social_links?.whatsapp || site.contact_number
  const whatsappLink = buildWhatsAppLink(waNumber, `Hi, I'm interested in internet plans from ${site.name}.`)
  const telLink = buildTelLink(site.contact_number)
  const phoneLabel = formatDisplayPhone(site.contact_number)
  const logoSrc = getAssetUrl(site.logo_url)
  const customerPortalUrl = site.website_content?.customer_portal_url?.trim() || null
  const hasBusinessPlans = site.plans.some((plan) => plan.customer_type === "business")
  const hasCoverage = site.coverage.length > 0
  const navLinks = [
    { to: "/plans", label: "Packages" },
    { to: "/coverage", label: "Coverage" },
    ...(hasBusinessPlans ? [{ to: "/#business-internet", label: "Business" }] : []),
    { to: "/about", label: "About" },
    { to: "/contact", label: "Support" },
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? "text-[var(--mk-ink)]" : "text-[var(--mk-ink-dim)] hover:text-[var(--mk-ink)]"
    }`

  return (
    <header className="sticky top-0 z-40 bg-[var(--mk-surface)]/96 backdrop-blur border-b border-[var(--mk-hairline)]">
      <div className="hidden md:block border-b border-[var(--mk-hairline)] bg-[#edf3f0]">
        <div className="mk-shell-wide px-8 h-8 flex items-center justify-between text-xs text-[var(--mk-ink-dim)]">
          <span>{site.website_content?.service_city?.trim() ? `Serving ${site.website_content.service_city}` : site.website_content?.support_hours || site.website_content?.business_hours || "Sales and support"}</span>
          <div className="flex items-center gap-5">
            {telLink && <a href={telLink} className="inline-flex items-center gap-1.5 hover:text-[var(--mk-accent)]"><Phone className="h-3.5 w-3.5" />{phoneLabel}</a>}
            {customerPortalUrl && <a href={customerPortalUrl} className="inline-flex items-center gap-1.5 font-semibold text-[var(--mk-ink)] hover:text-[var(--mk-accent)]"><UserRound className="h-3.5 w-3.5" />Customer portal</a>}
          </div>
        </div>
      </div>
      <div className="mk-shell-wide px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setMenuOpen(false)}>
          {logoSrc ? (
            <img src={logoSrc} alt={site.name} className="h-9 w-9 rounded-lg object-contain flex-shrink-0" />
          ) : (
            <span className="h-9 w-9 rounded-lg bg-[var(--mk-accent)] flex-shrink-0 flex items-center justify-center text-white font-semibold">
              {site.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="mk-display text-[15px] font-semibold truncate">{site.name}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md border border-[var(--mk-hairline-strong)] text-[var(--mk-ink)] text-sm font-medium hover:border-[var(--mk-accent)] transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
          {hasCoverage ? (
            <a href="/#coverage-check" className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--mk-ink)] text-white text-sm font-semibold hover:bg-[var(--mk-accent)] transition-colors"><Wifi className="h-3.5 w-3.5" />Get internet</a>
          ) : whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--mk-ink)] text-white text-sm font-semibold hover:bg-[var(--mk-accent)] transition-colors"><MessageCircle className="h-3.5 w-3.5" />Ask about coverage</a>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[var(--mk-hairline)] text-[var(--mk-ink)]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--mk-hairline)] bg-[var(--mk-surface)] px-5 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {customerPortalUrl && <a href={customerPortalUrl} className="h-10 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--mk-hairline-strong)] text-sm font-medium"><UserRound className="h-4 w-4" />Customer portal</a>}
            {telLink && (
              <a
                href={telLink}
                className="h-10 inline-flex items-center justify-center gap-2 rounded-md border border-[var(--mk-hairline-strong)] text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                {phoneLabel || "Call"}
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--mk-ink)] text-white text-sm font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default MarketingHeader
