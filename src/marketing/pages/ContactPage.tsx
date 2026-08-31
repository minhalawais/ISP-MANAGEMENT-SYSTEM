import React, { useState } from "react"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import PageHeader from "../components/PageHeader.tsx"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { buildMailtoLink, buildWhatsAppLink } from "../utils.ts"

const ContactPage: React.FC = () => {
  const site = useMarketingSite()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [area, setArea] = useState("")
  const [message, setMessage] = useState("")

  const composedMessage = `Hi ${site.name}, my name is ${name || "___"}. My phone number is ${phone || "___"}${area ? ` and my area is ${area}` : ""}. ${message || "I'd like to check internet availability and packages."}`
  const whatsappLink = buildWhatsAppLink(site.website_content?.social_links?.whatsapp || site.contact_number, composedMessage)
  const mailtoLink = buildMailtoLink(site.email, `Inquiry from ${name || "website visitor"}`)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const link = whatsappLink || mailtoLink
    if (link) window.open(link, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to our service team"
        description={whatsappLink ? "Share your area and question, then continue the conversation on WhatsApp." : "Share your area and question, then continue through the available contact channel."}
      />
      <section className="bg-[var(--mk-canvas)]">
        <div className="mk-shell px-5 sm:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-[var(--mk-radius-panel)] bg-[var(--mk-surface)] border border-[var(--mk-hairline)] p-6 sm:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-[var(--mk-ink)] mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-11 px-4 rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-canvas)] text-sm focus:outline-none focus:border-[var(--mk-accent)]"
                  required
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--mk-ink)] mb-1.5">Mobile number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" className="w-full h-11 px-4 rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-canvas)] text-sm focus:outline-none focus:border-[var(--mk-accent)]" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--mk-ink)] mb-1.5">Area</label>
                {site.areas.length > 0 ? (
                  <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full h-11 px-4 rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-canvas)] text-sm focus:outline-none focus:border-[var(--mk-accent)]">
                    <option value="">Select your area</option>
                    {site.areas.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                ) : (
                  <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Your area or locality" className="w-full h-11 px-4 rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-canvas)] text-sm focus:outline-none focus:border-[var(--mk-accent)]" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--mk-ink)] mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us your street or block, package interest, or service question."
                  rows={5}
                  className="w-full px-4 py-3 rounded-md border border-[var(--mk-hairline-strong)] bg-[var(--mk-canvas)] text-sm focus:outline-none focus:border-[var(--mk-accent)] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!whatsappLink && !mailtoLink}
                className="h-11 px-6 inline-flex items-center gap-2 rounded-md bg-[var(--mk-ink)] text-white text-sm font-medium hover:bg-[var(--mk-accent)] transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {whatsappLink ? "Continue on WhatsApp" : "Continue by email"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {site.address && (
              <div className="flex items-start gap-3 rounded-[var(--mk-radius-card)] bg-[var(--mk-surface)] border border-[var(--mk-hairline)] p-5">
                <MapPin className="h-5 w-5 text-[var(--mk-accent)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)]">Address</p>
                  <p className="mt-1 text-sm text-[var(--mk-ink)]">{site.address}</p>
                </div>
              </div>
            )}
            {site.contact_number && (
              <div className="flex items-start gap-3 rounded-[var(--mk-radius-card)] bg-[var(--mk-surface)] border border-[var(--mk-hairline)] p-5">
                <Phone className="h-5 w-5 text-[var(--mk-accent)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)]">Phone</p>
                  <p className="mt-1 text-sm text-[var(--mk-ink)]">{site.contact_number}</p>
                </div>
              </div>
            )}
            {site.email && (
              <div className="flex items-start gap-3 rounded-[var(--mk-radius-card)] bg-[var(--mk-surface)] border border-[var(--mk-hairline)] p-5">
                <Mail className="h-5 w-5 text-[var(--mk-accent)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)]">Email</p>
                  <p className="mt-1 text-sm text-[var(--mk-ink)]">{site.email}</p>
                </div>
              </div>
            )}
            {site.website_content?.business_hours && (
              <div className="rounded-[var(--mk-radius-card)] bg-[var(--mk-surface)] border border-[var(--mk-hairline)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mk-ink-mute)]">Business hours</p>
                <p className="mt-1 text-sm text-[var(--mk-ink)]">{site.website_content.business_hours}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default ContactPage
