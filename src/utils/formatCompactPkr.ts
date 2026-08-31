/** Compact PKR for KPI sub-stats (e.g. "PKR 17.2M"). Matches dashboard KPI style. */
export function formatCompactPkr(value: number | string | null | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return "PKR 0"
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}PKR ${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}PKR ${(abs / 1_000).toFixed(0)}K`
  return `${sign}PKR ${abs.toLocaleString()}`
}

/** Count label for KPI sub-stats (e.g. "42 invoices"). Returns null when count is not useful. */
export function formatCountLabel(
  value: number | string | null | undefined,
  singular: string,
  plural?: string,
): string | null {
  if (value == null || value === "") return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  const word = n === 1 ? singular : plural || `${singular}s`
  return `${n.toLocaleString()} ${word}`
}
