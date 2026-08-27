import axios from "axios"
import type { MarketingSite } from "../types.ts"

const getBaseURL = () =>
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/" : "https://nexus.mbanet.com.pk/api/")

export class SiteNotConfiguredError extends Error {
  constructor(public host: string) {
    super(`No marketing site is configured for host: ${host}`)
    this.name = "SiteNotConfiguredError"
  }
}

/**
 * Fetch the public marketing payload for a vendor domain.
 *
 * X-Site-Host is only a fallback used by the API when there's no
 * X-Forwarded-Host (i.e. local dev, where :3000 and :8000 are different
 * origins). We still send it in production — it's simply ignored there
 * because the reverse proxy's X-Forwarded-Host always wins.
 */
export const fetchPublicSite = async (siteHost: string): Promise<MarketingSite> => {
  const baseURL = getBaseURL()
  const normalizedBase = baseURL.endsWith("/") ? baseURL : `${baseURL}/`
  try {
    const response = await axios.get(`${normalizedBase}public/site`, {
      headers: { "X-Site-Host": siteHost },
      params: { _t: Date.now() },
    })
    return response.data as MarketingSite
  } catch (error: any) {
    if (error?.response?.status === 404) {
      throw new SiteNotConfiguredError(siteHost)
    }
    throw error
  }
}
