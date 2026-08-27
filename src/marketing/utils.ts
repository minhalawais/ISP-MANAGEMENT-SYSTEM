/** Best-effort digits-only phone number for a wa.me deep link. */
export const buildWhatsAppLink = (phone: string, message?: string): string | null => {
  const digits = (phone || "").replace(/[^\d]/g, "")
  if (!digits) return null
  const withCountry = digits.startsWith("0") ? `92${digits.slice(1)}` : digits
  const query = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${withCountry}${query}`
}

export const buildMailtoLink = (email: string, subject?: string): string | null => {
  if (!email) return null
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : ""
  return `mailto:${email}${query}`
}

export const formatPrice = (price: number | null, currencySymbol: string): string => {
  if (price === null || price === undefined) return "Contact us"
  return `${currencySymbol} ${Math.round(price).toLocaleString()}`
}

export const formatSpeed = (speedMbps: number | null): string | null => {
  if (!speedMbps) return null
  return `${speedMbps} Mbps`
}

/** Display phone for Pakistani numbers (92300… → 0300…). */
export const formatDisplayPhone = (phone: string): string => {
  const digits = (phone || "").replace(/[^\d]/g, "")
  if (!digits) return phone || ""
  let local = digits
  if (local.startsWith("92") && local.length >= 12) local = `0${local.slice(2)}`
  if (local.length === 11) return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  return local
}

export const buildTelLink = (phone: string): string | null => {
  const digits = (phone || "").replace(/[^\d+]/g, "")
  if (!digits) return null
  return `tel:${digits.startsWith("+") ? digits : `+${digits.startsWith("0") ? `92${digits.slice(1)}` : digits}`}`
}

/** Lowest priced plan with a price — for hero “from PKR …” line. */
export const lowestPlanPrice = (
  plans: { price: number | null }[],
): number | null => {
  const priced = plans.map((p) => p.price).filter((p): p is number => p != null && p > 0)
  if (!priced.length) return null
  return Math.min(...priced)
}
