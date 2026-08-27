import type { CrudPeriod } from "../types/crudFilters.ts"

export const PKT_TIMEZONE = "Asia/Karachi"
const MIN_YEAR = 2020

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function getPktNow(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT_TIMEZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? new Date().getFullYear()),
    month: Number(parts.find((p) => p.type === "month")?.value ?? 1),
  }
}

export function getInitialPeriod(defaultPeriod: "all" | "current_month"): CrudPeriod {
  if (defaultPeriod === "all") return null
  const { year, month } = getPktNow()
  return { year, month }
}

export function getPktMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, "0")
  const dd = String(lastDay).padStart(2, "0")
  return {
    start: new Date(`${year}-${mm}-01T00:00:00+05:00`),
    end: new Date(`${year}-${mm}-${dd}T23:59:59.999+05:00`),
  }
}

export function parseRowDate(value: unknown): Date | null {
  if (value == null || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const raw = String(value).trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00+05:00`)
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isDateInPktPeriod(value: unknown, period: CrudPeriod): boolean {
  if (!period) return true
  const date = parseRowDate(value)
  if (!date) return false
  const { start, end } = getPktMonthBounds(period.year, period.month)
  return date >= start && date <= end
}

export function filterRowsByPktPeriod<T extends Record<string, unknown>>(
  rows: T[],
  period: CrudPeriod,
  dateField: string,
): T[] {
  if (!period) return rows
  return rows.filter((row) => isDateInPktPeriod(row[dateField], period))
}

export function periodToQueryParam(period: CrudPeriod): Record<string, string> {
  if (!period) return {}
  const mm = String(period.month).padStart(2, "0")
  return { filter_month: `${period.year}-${mm}` }
}

/**
 * Text search always looks across all periods — ignore month filter while q is set.
 */
export function periodForTextSearch(
  period: CrudPeriod,
  searchText?: string | null,
): CrudPeriod {
  return String(searchText ?? "").trim() ? null : period
}

export function periodQueryParamsForTextSearch(
  period: CrudPeriod,
  searchText?: string | null,
): Record<string, string> {
  return periodToQueryParam(periodForTextSearch(period, searchText))
}

export function formatPeriodLabel(period: CrudPeriod): string {
  if (!period) return "All"
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`
}

export function buildYearOptions(minYear = MIN_YEAR, yearsAhead = 1): number[] {
  const currentYear = getPktNow().year
  const maxYear = currentYear + Math.max(0, yearsAhead)
  const years: number[] = []
  for (let y = maxYear; y >= minYear; y -= 1) years.push(y)
  return years
}

/** All calendar months are selectable — ISP billing often targets next month in advance. */
export function buildMonthOptions(_year?: number): { value: number; label: string; disabled: boolean }[] {
  return MONTH_NAMES.map((label, index) => ({
    value: index + 1,
    label,
    disabled: false,
  }))
}
