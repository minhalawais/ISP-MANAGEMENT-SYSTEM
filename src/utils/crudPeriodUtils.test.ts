import {
  buildMonthOptions,
  buildYearOptions,
  filterRowsByPktPeriod,
  formatPeriodLabel,
  getInitialPeriod,
  getPktMonthBounds,
  getPktNow,
  isDateInPktPeriod,
  periodToQueryParam,
  periodForTextSearch,
  periodQueryParamsForTextSearch,
} from "./crudPeriodUtils.ts"

describe("crudPeriodUtils", () => {
  test("getInitialPeriod respects defaults", () => {
    expect(getInitialPeriod("all")).toBeNull()
    const current = getInitialPeriod("current_month")
    expect(current).not.toBeNull()
    expect(current!.month).toBeGreaterThanOrEqual(1)
    expect(current!.month).toBeLessThanOrEqual(12)
  })

  test("getPktMonthBounds returns PKT inclusive range", () => {
    const { start, end } = getPktMonthBounds(2026, 8)
    expect(start.toISOString()).toBe("2026-07-31T19:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-31T18:59:59.999Z")
  })

  test("isDateInPktPeriod handles YYYY-MM-DD dates", () => {
    expect(isDateInPktPeriod("2026-08-15", { year: 2026, month: 8 })).toBe(true)
    expect(isDateInPktPeriod("2026-07-31", { year: 2026, month: 8 })).toBe(false)
    expect(isDateInPktPeriod(null, { year: 2026, month: 8 })).toBe(false)
    expect(isDateInPktPeriod("2026-08-01", null)).toBe(true)
  })

  test("filterRowsByPktPeriod filters by field", () => {
    const rows = [
      { id: "1", payment_date: "2026-08-10" },
      { id: "2", payment_date: "2026-07-10" },
    ]
    const filtered = filterRowsByPktPeriod(rows, { year: 2026, month: 8 }, "payment_date")
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe("1")
  })

  test("periodToQueryParam formats filter_month", () => {
    expect(periodToQueryParam(null)).toEqual({})
    expect(periodToQueryParam({ year: 2026, month: 8 })).toEqual({ filter_month: "2026-08" })
  })

  test("periodForTextSearch clears period while searching", () => {
    const period = { year: 2026, month: 8 }
    expect(periodForTextSearch(period, "")).toEqual(period)
    expect(periodForTextSearch(period, "   ")).toEqual(period)
    expect(periodForTextSearch(period, "INV-123")).toBeNull()
    expect(periodQueryParamsForTextSearch(period, "minha")).toEqual({})
    expect(periodQueryParamsForTextSearch(period, "")).toEqual({ filter_month: "2026-08" })
  })

  test("formatPeriodLabel", () => {
    expect(formatPeriodLabel(null)).toBe("All")
    expect(formatPeriodLabel({ year: 2026, month: 8 })).toBe("Aug 2026")
  })

  test("getPktNow returns numeric year and month", () => {
    const now = getPktNow()
    expect(now.year).toBeGreaterThan(2019)
    expect(now.month).toBeGreaterThanOrEqual(1)
    expect(now.month).toBeLessThanOrEqual(12)
  })

  test("buildMonthOptions keeps future months selectable", () => {
    const months = buildMonthOptions(getPktNow().year)
    expect(months).toHaveLength(12)
    expect(months.every((m) => !m.disabled)).toBe(true)
  })

  test("buildYearOptions includes next year", () => {
    const { year } = getPktNow()
    const years = buildYearOptions()
    expect(years[0]).toBe(year + 1)
    expect(years).toContain(year)
  })
})
