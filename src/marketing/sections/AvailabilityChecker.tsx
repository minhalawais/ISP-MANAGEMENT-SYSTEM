import React, { useState } from "react"
import { CheckCircle2, MessageCircle, Search } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildWhatsAppLink } from "../utils.ts"

const AvailabilityChecker: React.FC = () => {
  const site = useMarketingSite()
  const coverage = site.coverage || []
  const [areaId, setAreaId] = useState("")
  const [subZoneId, setSubZoneId] = useState("")
  const [street, setStreet] = useState("")
  const [checked, setChecked] = useState(false)

  const area = coverage.find((item) => item.id === areaId)
  const subZone = area?.sub_zones.find((item) => item.id === subZoneId)
  const location = [street.trim(), subZone?.name, area?.name].filter(Boolean).join(", ")
  const hasSubZones = Boolean(area?.sub_zones.length)
  const waNumber = site.website_content?.social_links?.whatsapp || site.contact_number
  const whatsappLink = buildWhatsAppLink(
    waNumber,
    `Hi ${site.name}, please confirm internet availability in ${location || "my neighbourhood"}.`,
  )

  const handleCheck = (event: React.FormEvent) => {
    event.preventDefault()
    if (areaId) setChecked(true)
  }

  return (
    <section id="coverage-check" className="bg-[var(--mk-accent)] text-white">
      <div className="mk-shell px-5 sm:px-8 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-7 lg:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Check availability</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">Is your street in our network?</h2>
            <p className="mt-2 text-sm text-white/78 max-w-md">
              Choose your area for an initial check. Our team confirms the exact address before installation.
            </p>
          </div>

          {coverage.length > 0 ? (
            <form onSubmit={handleCheck} className={`grid gap-3 ${hasSubZones ? "sm:grid-cols-[1fr_1fr_1.1fr_auto]" : "sm:grid-cols-[1fr_1.25fr_auto]"}`}>
              <label className="block">
                <span className="sr-only">Area</span>
                <select
                  value={areaId}
                  onChange={(event) => {
                    setAreaId(event.target.value)
                    setSubZoneId("")
                    setChecked(false)
                  }}
                  className="w-full h-12 rounded-md border border-white/25 bg-white px-4 text-sm text-[var(--mk-ink)]"
                  required
                >
                  <option value="">Select area</option>
                  {coverage.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              {hasSubZones && <label className="block">
                <span className="sr-only">Sub-area</span>
                <select value={subZoneId} onChange={(event) => { setSubZoneId(event.target.value); setChecked(false) }} className="w-full h-12 rounded-md border border-white/25 bg-white px-4 text-sm text-[var(--mk-ink)]">
                  <option value="">Select sub-area</option>
                  {area?.sub_zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>}
              <label className="block">
                <span className="sr-only">Street or block</span>
                <input value={street} onChange={(event) => { setStreet(event.target.value); setChecked(false) }} placeholder="Street, block or landmark" className="w-full h-12 rounded-md border border-white/25 bg-white px-4 text-sm text-[var(--mk-ink)] placeholder:text-[var(--mk-ink-mute)]" required />
              </label>
              <button type="submit" className="h-12 px-5 rounded-md bg-[var(--mk-ink)] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#182c35]">
                <Search className="h-4 w-4" /> Check area
              </button>
            </form>
          ) : (
            whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="h-12 px-5 rounded-md bg-white text-[var(--mk-ink)] text-sm font-semibold inline-flex items-center justify-center gap-2 justify-self-start lg:justify-self-end">
                <MessageCircle className="h-4 w-4" /> Ask about my area
              </a>
            )
          )}
        </div>

        {checked && area && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/20 pt-5" role="status">
            <p className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span><strong>{area.name}</strong> is in our listed coverage. Our team still needs to confirm service at <strong>{street.trim()}</strong>.</span>
            </p>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
                Confirm on WhatsApp <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default AvailabilityChecker
