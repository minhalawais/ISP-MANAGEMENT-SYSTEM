import React from "react"
import PageHeader from "../components/PageHeader.tsx"
import FaqAccordion from "../sections/FaqAccordion.tsx"
import CtaBand from "../sections/CtaBand.tsx"

const FaqPage: React.FC = () => (
  <>
    <PageHeader eyebrow="FAQ" title="Frequently asked questions" />
    <section className="bg-[var(--mk-surface)]">
      <div className="mk-shell-narrow px-5 sm:px-8 py-16 sm:py-20">
        <FaqAccordion />
      </div>
    </section>
    <CtaBand />
  </>
)

export default FaqPage
