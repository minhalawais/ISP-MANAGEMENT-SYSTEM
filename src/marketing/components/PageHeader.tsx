import React from "react"

const PageHeader: React.FC<{ eyebrow: string; title: string; description?: string }> = ({
  eyebrow,
  title,
  description,
}) => (
  <div className="mk-hairline-bottom bg-[var(--mk-surface)]">
    <div className="mk-shell px-5 sm:px-8 py-14 sm:py-16">
      <span className="mk-eyebrow">{eyebrow}</span>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-[var(--mk-ink-dim)]">{description}</p>}
    </div>
  </div>
)

export default PageHeader
