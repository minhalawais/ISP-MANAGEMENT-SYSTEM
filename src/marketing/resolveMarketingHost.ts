const LOCAL_PREVIEW_HOSTNAMES = new Set(["localhost", "127.0.0.1"])
const LOCAL_PREVIEW_STORAGE_KEY = "marketing_preview_host"

const normalizePreviewHost = (value: string | null): string | null => {
  const normalized = value?.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/, 1)[0]
  if (!normalized || !/^[a-z0-9.-]+(?::\d+)?$/.test(normalized)) return null
  return normalized.replace(/:\d+$/, "")
}

const getStoredPreviewHost = (): string | null => {
  try {
    return normalizePreviewHost(window.sessionStorage.getItem(LOCAL_PREVIEW_STORAGE_KEY))
  } catch {
    return null
  }
}

const storePreviewHost = (host: string) => {
  try {
    window.sessionStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, host)
  } catch {
    // Preview still works for the current URL when storage is unavailable.
  }
}

/**
 * Resolve which vendor marketing site (if any) should render for the
 * current browser location.
 *
 * - Every real hostname is resolved through the backend company_hosts table.
 *   Portal routing is path-based (`/admin`) rather than tied to domain names.
 * - Local dev: dev server (:3000) is always "localhost", so a `?site=`
 *   query override lets you preview any vendor's site without DNS/hosts
 *   file changes. The selection is retained in sessionStorage so marketing
 *   links and hard reloads do not lose the preview host.
 *
 * Returns null when the admin app should render instead.
 */
export const resolveMarketingHost = (hostname: string, search: string): string | null => {
  const normalizedHostname = hostname.trim().toLowerCase()

  if (process.env.NODE_ENV !== "production" && LOCAL_PREVIEW_HOSTNAMES.has(normalizedHostname)) {
    const override = normalizePreviewHost(new URLSearchParams(search).get("site"))
    if (override) {
      storePreviewHost(override)
      return override
    }
    return getStoredPreviewHost()
  }

  if (!normalizedHostname) {
    return null
  }
  if (normalizedHostname.startsWith("customer.")) {
    return null
  }
  return normalizedHostname
}
