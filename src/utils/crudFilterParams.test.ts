import {
  filterValueToString,
  isFilterActive,
  getActiveQuickFilterChips,
  toTanStackColumnFilters,
  toServerQueryParams,
  toInvoicePageParams,
  mergeColumnFilters,
  computeCrudStats,
} from "./crudFilterParams.ts"

describe("crudFilterParams", () => {
  test("filterValueToString handles boolean and empty", () => {
    expect(filterValueToString(true)).toBe("true")
    expect(filterValueToString(false)).toBe("false")
    expect(filterValueToString(null)).toBe("")
    expect(filterValueToString("paid")).toBe("paid")
  })

  test("toTanStackColumnFilters maps state", () => {
    expect(toTanStackColumnFilters({ status: "pending", is_active: true })).toEqual([
      { id: "status", value: "pending" },
      { id: "is_active", value: "true" },
    ])
  })

  test("toServerQueryParams prefixes filter_", () => {
    expect(toServerQueryParams({ status: "paid" })).toEqual({ filter_status: "paid" })
  })

  test("toInvoicePageParams matches server shape", () => {
    expect(toInvoicePageParams({ status: "pending", internet_id: "MB001" })).toEqual({
      filter_status: "pending",
      filter_internet_id: "MB001",
    })
  })

  test("mergeColumnFilters prefers quick over advanced for inline fields", () => {
    const merged = mergeColumnFilters(
      { status: "paid" },
      [{ id: "status", value: "pending" }, { id: "area", value: "North" }],
      ["status"],
    )
    expect(merged).toEqual([
      { id: "area", value: "North" },
      { id: "status", value: "paid" },
    ])
  })

  test("computeCrudStats counts by card filters", () => {
    const data = [
      { status: "open", is_active: true },
      { status: "open", is_active: false },
      { status: "resolved", is_active: true },
    ]
    const stats = computeCrudStats(data, [
      { id: "total" },
      { id: "open", filter: { field: "status", value: "open" } },
      { id: "resolved", filter: { field: "status", value: "resolved" } },
    ])
    expect(stats.total).toBe(3)
    expect(stats.open).toBe(2)
    expect(stats.resolved).toBe(1)
  })

  test("isFilterActive detects non-empty state", () => {
    expect(isFilterActive({})).toBe(false)
    expect(isFilterActive({ status: "paid" })).toBe(true)
  })

  test("getActiveQuickFilterChips returns display labels", () => {
    const chips = getActiveQuickFilterChips(
      [
        {
          id: "status",
          label: "Status",
          type: "select",
          field: "status",
          options: [
            { value: "", label: "All" },
            { value: "paid", label: "Paid" },
          ],
        },
      ],
      { status: "paid" },
    )
    expect(chips).toEqual([{ field: "status", label: "Status", displayValue: "Paid" }])
  })
})
