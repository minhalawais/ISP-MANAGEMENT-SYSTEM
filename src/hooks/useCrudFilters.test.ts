import { renderHook, act } from "@testing-library/react"
import { useCrudFilters } from "./useCrudFilters.ts"
import { CRUD_FILTER_CONFIGS } from "../config/crudFilterConfigs.ts"

describe("useCrudFilters", () => {
  const config = CRUD_FILTER_CONFIGS.customer

  test("applyStatFilter toggles active status filter", () => {
    const { result } = renderHook(() => useCrudFilters({ config }))

    act(() => {
      result.current.applyStatFilter({
        id: "active",
        label: "Active",
        value: 0,
        tone: "success",
        icon: config.statCards[1].icon,
        filter: { field: "is_active", value: true },
      })
    })

    expect(result.current.filterState.is_active).toBe(true)
    expect(result.current.activeStatId).toBe("active")
    expect(result.current.tanStackColumnFilters).toEqual([{ id: "is_active", value: "true" }])

    act(() => {
      result.current.applyStatFilter({
        id: "active",
        label: "Active",
        value: 0,
        tone: "success",
        icon: config.statCards[1].icon,
        filter: { field: "is_active", value: true },
      })
    })

    expect(result.current.filterState.is_active).toBeUndefined()
    expect(result.current.activeStatId).toBeNull()
  })

  test("setQuickFilter and clearFilters", () => {
    const { result } = renderHook(() => useCrudFilters({ config }))

    act(() => {
      result.current.setQuickFilter("area", "Zone A")
    })
    expect(result.current.filterState.area).toBe("Zone A")

    act(() => {
      result.current.clearFilters()
    })
    expect(result.current.filterState).toEqual({})
    expect(result.current.hasActiveFilters).toBe(false)
  })
})
