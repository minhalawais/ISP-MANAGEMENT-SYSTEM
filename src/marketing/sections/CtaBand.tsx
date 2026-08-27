import React from "react"
import { ArrowRight } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink } from "../utils.ts"

const CtaBand: React.FC = () => {
  const site = useMarketingSite()
  const waNumber = site.website_content?.social_links?.whatsapp || site.contact_number
  const whatsappLink = buildWhatsAppLink(waNumber, `Hi, I'd like to get connected with ${site.name}.`)

  return (
    <section className="relative overflow-hidden mk-ink-surface">
      <div className="mk-grid-lines" />
      <div className="relative mk-shell px-5 sm:px-8 py-16 sm:py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <span className="mk-eyebrow">Get connected</span>
          <h2 className="mt-3 max-w-md text-2xl sm:text-3xl font-semibold">
            Ready to check your address and choose a package?
          </h2>
        </div>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-white text-[var(--mk-ink)] text-sm font-semibold hover:bg-[#7ff0ae] transition-colors self-start sm:self-auto"
          >
            Start on WhatsApp
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </section>
  )
}

export default CtaBand
