// Hostnames that always serve the admin/employee app, never a vendor's
// marketing site. Every other hostname is treated as a vendor domain bound
// in company_hosts (see api/app/services/company_host_access.py) and gets
// the marketing site rendered instead.
const ADMIN_HOSTNAMES = new Set(["localhost", "127.0.0.1", "nexus.mbanet.com.pk", "connectx.mbanet.com.pk"])

/**
 * Resolve which vendor marketing site (if any) should render for the
 * current browser location.
 *
 * - Real vendor domains (production): hostname itself, unless it's a known
 *   admin hostname.
 * - Local dev: dev server (:3000) is always "localhost", so a `?site=`
 *   query override lets you preview any vendor's site without DNS/hosts
 *   file changes. Only honored in development builds.
 *
 * Returns null when the admin app should render instead.
 */
export const resolveMarketingHost = (hostname: string, search: string): string | null => {
  const normalizedHostname = hostname.trim().toLowerCase()

  if (process.env.NODE_ENV === "development") {
    const override = new URLSearchParams(search).get("site")
    if (override && override.trim()) {
      return override.trim().toLowerCase()
    }
  }

  if (!normalizedHostname || ADMIN_HOSTNAMES.has(normalizedHostname)) {
    return null
  }
  if (normalizedHostname.startsWith("customer.")) {
    return null
  }
  return normalizedHostname
}
