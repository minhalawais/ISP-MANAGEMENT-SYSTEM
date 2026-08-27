import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useMarketingSite } from "../context/MarketingSiteContext.tsx"
import { FALLBACK_FAQS } from "../fallbackContent.ts"

const FaqAccordion: React.FC = () => {
  const site = useMarketingSite()
  const faqs = site.website_content?.faqs?.length ? site.website_content.faqs : FALLBACK_FAQS
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="divide-y divide-[var(--mk-hairline)] border-y border-[var(--mk-hairline)]">
      {faqs.map((faq, idx) => {
        const isOpen = openIdx === idx
        return (
          <div key={faq.question}>
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-[var(--mk-ink)]">{faq.question}</span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-[var(--mk-ink-mute)] transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="pb-5 text-sm text-[var(--mk-ink-dim)] leading-relaxed max-w-2xl">{faq.answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default FaqAccordion
