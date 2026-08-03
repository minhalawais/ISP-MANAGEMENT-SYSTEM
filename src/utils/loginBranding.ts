export type LoginBrand = "nexus" | "connectx"

const CONNECTX_HOSTNAME = "connectx.mbanet.com.pk"

export const getLoginBrandForHostname = (hostname: string): LoginBrand => {
  return hostname.toLowerCase() === CONNECTX_HOSTNAME ? "connectx" : "nexus"
}

export const getCurrentLoginBrand = (): LoginBrand => {
  if (typeof window === "undefined") return "nexus"
  return getLoginBrandForHostname(window.location.hostname)
}

export const getConnectxLogoSrc = () => `${process.env.PUBLIC_URL || ""}/connectx_logo.png`
