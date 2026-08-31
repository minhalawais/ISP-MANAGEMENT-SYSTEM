import React from "react"
import { Headphones, MessageCircle, Phone, UserRound } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildTelLink, buildWhatsAppLink } from "../utils.ts"

const CustomerCareBand: React.FC = () => {
  const site = useMarketingSite()
  const portalUrl = site.website_content?.customer_portal_url?.trim() || null
  const whatsappLink = buildWhatsAppLink(site.website_content?.social_links?.whatsapp || site.contact_number, `Hi ${site.name}, I need help with my connection.`)
  const telLink = buildTelLink(site.contact_number)
  const actions = [
    ...(portalUrl ? [{ label: "Customer portal", detail: "View your account and billing", href: portalUrl, icon: UserRound }] : []),
    ...(telLink ? [{ label: "Call support", detail: site.contact_number, href: telLink, icon: Phone }] : []),
    { label: "Contact support", detail: "Send your question to the support team", href: "/contact", icon: Headphones },
  ]

  return (
    <section className="mk-hairline-bottom bg-[#eaf1ee]">
      <div className="mk-shell px-5 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div><span className="mk-eyebrow">Already connected?</span><h2 className="mt-3 text-2xl sm:text-3xl font-semibold">Manage your account and get support</h2></div>
          {whatsappLink && <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--mk-accent)]"><MessageCircle className="h-4 w-4" />WhatsApp support</a>}
        </div>
        <div className="mt-8 grid md:grid-cols-3 border-y border-[var(--mk-hairline-strong)] divide-y md:divide-y-0 md:divide-x divide-[var(--mk-hairline-strong)]">
          {actions.map((action) => {
            const Icon = action.icon
            return <a key={action.label} href={action.href} className="group flex items-center gap-4 py-5 md:px-6 first:pl-0 last:pr-0"><Icon className="h-6 w-6 text-[var(--mk-accent)]" /><span><strong className="block text-sm text-[var(--mk-ink)] group-hover:text-[var(--mk-accent)]">{action.label}</strong><span className="text-xs text-[var(--mk-ink-mute)]">{action.detail}</span></span></a>
          })}
        </div>
      </div>
    </section>
  )
}

export default CustomerCareBand
