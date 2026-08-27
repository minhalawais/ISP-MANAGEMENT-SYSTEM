import type { ColumnFiltersState } from "@tanstack/react-table"
import type { CrudFilterState, FilterValue, QuickFilterDef } from "../types/crudFilters.ts"

export type ActiveFilterChip = {
  field: string
  label: string
  displayValue: string
}

export const filterValueToString = (value: FilterValue): string => {
  if (value === null || value === undefined || value === "") return ""
  if (typeof value === "boolean") return value ? "true" : "false"
  return String(value)
}

export const isFieldFilterActive = (value: FilterValue | undefined): boolean =>
  value !== null && value !== undefined && value !== ""

export const isFilterActive = (state: CrudFilterState): boolean =>
  Object.values(state).some((v) => isFieldFilterActive(v))

export const getQuickFilterDisplayLabel = (def: QuickFilterDef, value: FilterValue): string => {
  if (def.type === "select") {
    const str = filterValueToString(value)
    return def.options.find((o) => o.value === str)?.label ?? str
  }
  return filterValueToString(value)
}

export const getActiveQuickFilterChips = (
  quickFilters: QuickFilterDef[],
  filterState: CrudFilterState,
): ActiveFilterChip[] =>
  quickFilters.flatMap((def) => {
    const value = filterState[def.field]
    if (!isFieldFilterActive(value)) return []
    return [
      {
        field: def.field,
        label: def.label,
        displayValue: getQuickFilterDisplayLabel(def, value!),
      },
    ]
  })

export const toTanStackColumnFilters = (state: CrudFilterState): ColumnFiltersState =>
  Object.entries(state)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([id, value]) => ({ id, value: filterValueToString(value) }))

export const toServerQueryParams = (state: CrudFilterState): Record<string, string> => {
  const params: Record<string, string> = {}
  Object.entries(state).forEach(([field, value]) => {
    const str = filterValueToString(value)
    if (str) params[`filter_${field}`] = str
  })
  return params
}

export const toInvoicePageParams = (state: CrudFilterState): Record<string, string> => {
  const params: Record<string, string> = {}
  Object.entries(state).forEach(([field, value]) => {
    const str = filterValueToString(value)
    if (str) params[`filter_${field}`] = str
  })
  return params
}

export const mergeColumnFilters = (
  quickState: CrudFilterState,
  advancedFilters: ColumnFiltersState,
  inlineFields: string[],
): ColumnFiltersState => {
  const quick = toTanStackColumnFilters(quickState)
  const advanced = advancedFilters.filter((f) => !inlineFields.includes(f.id))
  const merged = new Map<string, string>()
  advanced.forEach((f) => merged.set(f.id, String(f.value)))
  quick.forEach((f) => merged.set(f.id, String(f.value)))
  return Array.from(merged.entries()).map(([id, value]) => ({ id, value }))
}

export const crudStateFromColumnFilters = (
  filters: ColumnFiltersState,
  fields: string[],
): CrudFilterState => {
  const state: CrudFilterState = {}
  filters.forEach((f) => {
    if (fields.includes(f.id)) {
      const raw = String(f.value)
      if (f.id === "is_active" || f.id === "is_read") {
        state[f.id] = raw === "true"
      } else {
        state[f.id] = raw
      }
    }
  })
  return state
}

export function computeCrudStats(data: Record<string, unknown>[], statCardIds: { id: string; filter?: { field: string; value: FilterValue } }[]): Record<string, number> {
  const stats: Record<string, number> = { total: data.length }
  statCardIds.forEach((card) => {
    if (card.id === "total") {
      stats.total = data.length
      return
    }
    if (!card.filter || card.filter.value === null) return
    const { field, value } = card.filter
    stats[card.id] = data.filter((row) => {
      const rowVal = row[field]
      if (typeof value === "boolean") return rowVal === value
      return String(rowVal ?? "").toLowerCase() === String(value).toLowerCase()
    }).length
  })
  return stats
}
