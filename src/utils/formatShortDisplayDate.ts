const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

/**
 * Format calendar dates as `01-Aug-26` (day-short month-2-digit year).
 * Parses YYYY-MM-DD without timezone shift when possible.
 */
export function formatShortDisplayDate(value: string | null | undefined): string {
  if (!value) return "—"
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  let day: number
  let monthIndex: number
  let year: number
  if (match) {
    year = Number(match[1])
    monthIndex = Number(match[2]) - 1
    day = Number(match[3])
  } else {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "—"
    day = d.getDate()
    monthIndex = d.getMonth()
    year = d.getFullYear()
  }
  if (monthIndex < 0 || monthIndex > 11) return "—"
  return `${String(day).padStart(2, "0")}-${SHORT_MONTHS[monthIndex]}-${String(year).slice(-2)}`
}
