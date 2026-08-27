import { useCallback, useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import type { CrudFilterConfig, CrudFilterState, FilterValue, StatCardDef } from "../types/crudFilters.ts"
import {
  filterValueToString,
  isFilterActive,
  toInvoicePageParams,
  toServerQueryParams,
  toTanStackColumnFilters,
} from "../utils/crudFilterParams.ts"

type UseCrudFiltersOptions = {
  config: CrudFilterConfig
  onFilterChange?: () => void
}

export function useCrudFilters({ config, onFilterChange }: UseCrudFiltersOptions) {
  const [filterState, setFilterState] = useState<CrudFilterState>({})
  const [activeStatId, setActiveStatId] = useState<string | null>(null)

  const inlineFields = useMemo(
    () => config.quickFilters.map((f) => f.field),
    [config.quickFilters],
  )

  const notify = useCallback(() => {
    onFilterChange?.()
  }, [onFilterChange])

  const applyStatFilter = useCallback(
    (card: StatCardDef) => {
      if (card.clickable === false || !card.filter) return

      setActiveStatId((prev) => {
        if (prev === card.id) {
          setFilterState((state) => {
            const next = { ...state }
            const fields = card.clearFields?.length
              ? card.clearFields
              : config.statFilterGroupField
                ? [config.statFilterGroupField]
                : [card.filter!.field]
            fields.forEach((f) => delete next[f])
            return next
          })
          notify()
          return null
        }

        setFilterState((state) => {
          const next = { ...state }
          const clearFields = card.clearFields?.length
            ? card.clearFields
            : config.statFilterGroupField
              ? [config.statFilterGroupField]
              : [card.filter!.field]
          clearFields.forEach((f) => delete next[f])
          if (card.filter!.value !== null && card.filter!.value !== "") {
            next[card.filter!.field] = card.filter!.value
          }
          return next
        })
        notify()
        return card.id
      })
    },
    [config.statFilterGroupField, notify],
  )

  const setQuickFilter = useCallback(
    (field: string, value: FilterValue) => {
      setFilterState((state) => {
        const next = { ...state }
        if (value === null || value === "" || value === undefined) {
          delete next[field]
        } else {
          next[field] = value
        }
        return next
      })

      if (config.statFilterGroupField === field) {
        const matchingCard = config.statCards.find(
          (c) =>
            c.filter &&
            c.filter.field === field &&
            filterValueToString(c.filter.value) === filterValueToString(value),
        )
        setActiveStatId(matchingCard?.id ?? null)
      }
      notify()
    },
    [config.statCards, config.statFilterGroupField, notify],
  )

  const clearFilters = useCallback(() => {
    setFilterState({})
    setActiveStatId(null)
    notify()
  }, [notify])

  const tanStackColumnFilters = useMemo(
    () => toTanStackColumnFilters(filterState),
    [filterState],
  )

  const serverQueryParams = useMemo(() => toServerQueryParams(filterState), [filterState])

  const invoicePageParams = useMemo(() => toInvoicePageParams(filterState), [filterState])

  const hasActiveFilters = useMemo(() => isFilterActive(filterState), [filterState])

  const syncFromColumnFilters = useCallback(
    (filters: ColumnFiltersState) => {
      setFilterState((prev) => {
        const next = { ...prev }
        inlineFields.forEach((field) => {
          const match = filters.find((f) => f.id === field)
          if (match && match.value !== "") {
            if (field === "is_active" || field === "is_read") {
              next[field] = String(match.value) === "true"
            } else {
              next[field] = String(match.value)
            }
          } else if (!match || match.value === "") {
            if (field in next && config.statFilterGroupField !== field) {
              // keep stat-driven fields unless cleared via advanced panel
            }
          }
        })
        return next
      })
    },
    [inlineFields, config.statFilterGroupField],
  )

  return {
    filterState,
    activeStatId,
    inlineFields,
    hasActiveFilters,
    applyStatFilter,
    setQuickFilter,
    clearFilters,
    tanStackColumnFilters,
    serverQueryParams,
    invoicePageParams,
    syncFromColumnFilters,
  }
}
