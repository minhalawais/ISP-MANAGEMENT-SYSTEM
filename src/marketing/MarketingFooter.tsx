import React from "react"
import { Link } from "react-router-dom"
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { useMarketingSite } from "./context/MarketingSiteContext.tsx"
import { buildMailtoLink, buildTelLink, buildWhatsAppLink } from "./utils.ts"
import { getAssetUrl } from "../utils/auth.ts"
import { defaultFooterTagline } from "./fallbackContent.ts"

const MarketingFooter: React.FC = () => {
  const site = useMarketingSite()
  const socials = site.website_content?.social_links || {}
  const whatsappLink = buildWhatsAppLink(socials.whatsapp || site.contact_number)
  const telLink = buildTelLink(site.contact_number)
  const mailtoLink = buildMailtoLink(site.email)
  const year = new Date().getFullYear()
  const logoSrc = getAssetUrl(site.logo_url)
  const hasBusinessPlans = site.plans.some((plan) => plan.customer_type === "business")
  const footerLinks = [
    { to: "/plans", label: "Packages" },
    { to: "/coverage", label: "Coverage" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ]

  return (
    <footer className="mk-hairline-top bg-[var(--mk-surface)]">
      <div className="mk-shell px-5 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            {logoSrc ? (
              <img src={logoSrc} alt={site.name} className="h-8 w-8 rounded object-contain" />
            ) : (
              <span className="h-8 w-8 rounded-lg bg-[var(--mk-accent)] flex items-center justify-center text-white font-semibold">
                {site.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="mk-display text-[15px] font-semibold">{site.name}</span>
          </div>
          <p className="text-sm text-[var(--mk-ink-dim)] max-w-sm leading-relaxed">
            {site.tagline || defaultFooterTagline(site.name, hasBusinessPlans)}
          </p>
          <div className="flex items-center gap-3 mt-4">
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--mk-hairline)] text-[var(--mk-ink-dim)] hover:text-[var(--mk-accent)] hover:border-[var(--mk-accent)] transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--mk-hairline)] text-[var(--mk-ink-dim)] hover:text-[var(--mk-accent)] hover:border-[var(--mk-accent)] transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)] mb-3">Site</p>
          <ul className="space-y-2">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-[var(--mk-ink-dim)] hover:text-[var(--mk-ink)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)] mb-3">Contact</p>
          <ul className="space-y-2.5 text-sm text-[var(--mk-ink-dim)]">
            {site.address && (
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-[var(--mk-ink-mute)]" />
                <span>{site.address}</span>
              </li>
            )}
            {site.contact_number && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-[var(--mk-ink-mute)]" />
                {telLink ? (
                  <a href={telLink} className="hover:text-[var(--mk-ink)] transition-colors">
                    {site.contact_number}
                  </a>
                ) : (
                  <span>{site.contact_number}</span>
                )}
              </li>
            )}
            {whatsappLink && (
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-[var(--mk-ink-mute)]" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--mk-ink)] transition-colors">WhatsApp sales and support</a>
              </li>
            )}
            {site.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-[var(--mk-ink-mute)]" />
                {mailtoLink ? (
                  <a href={mailtoLink} className="hover:text-[var(--mk-ink)] transition-colors">
                    {site.email}
                  </a>
                ) : (
                  <span>{site.email}</span>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mk-hairline-top">
        <div className="mk-shell px-5 sm:px-8 py-4 text-xs text-[var(--mk-ink-mute)]">
          © {year} {site.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default MarketingFooter
