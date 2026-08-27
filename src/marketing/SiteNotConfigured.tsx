import React from "react"

/** Neutral fallback shown when a hostname has no company_hosts binding. */
const SiteNotConfigured: React.FC<{ host: string }> = ({ host }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-6">
    <div className="text-center max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7a8288]">Site unavailable</p>
      <h1 className="mt-3 text-xl font-semibold text-[#10151a]">This site isn't configured yet</h1>
      <p className="mt-2 text-sm text-[#4b545c]">
        No website is set up for <span className="font-medium">{host}</span>. If you're the site owner, contact
        your provider to finish setup.
      </p>
    </div>
  </div>
)

export default SiteNotConfigured
