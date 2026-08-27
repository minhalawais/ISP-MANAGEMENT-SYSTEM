import { useCallback, useMemo, useState } from "react"
import type { ColumnFiltersState } from "@tanstack/react-table"
import type { CrudFilterConfig } from "../types/crudFilters.ts"
import { mergeColumnFilters } from "../utils/crudFilterParams.ts"
import { useCrudFilters } from "./useCrudFilters.ts"

type UseCrudTableFiltersOptions = {
  config: CrudFilterConfig
  onFilterChange?: () => void
}

export function useCrudTableFilters({ config, onFilterChange }: UseCrudTableFiltersOptions) {
  const crudFilters = useCrudFilters({ config, onFilterChange })
  const [advancedFilters, setAdvancedFilters] = useState<ColumnFiltersState>([])

  const mergedColumnFilters = useMemo(
    () => mergeColumnFilters(crudFilters.filterState, advancedFilters, crudFilters.inlineFields),
    [crudFilters.filterState, advancedFilters, crudFilters.inlineFields],
  )

  const handleColumnFiltersChange = useCallback(
    (filters: ColumnFiltersState) => {
      const advanced = filters.filter((f) => !crudFilters.inlineFields.includes(f.id))
      setAdvancedFilters(advanced)
    },
    [crudFilters.inlineFields],
  )

  const clearAllFilters = useCallback(() => {
    crudFilters.clearFilters()
    setAdvancedFilters([])
  }, [crudFilters])

  const hasAnyActiveFilters =
    crudFilters.hasActiveFilters || advancedFilters.some((f) => f.value !== "")

  return {
    ...crudFilters,
    advancedFilters,
    mergedColumnFilters,
    handleColumnFiltersChange,
    clearAllFilters,
    hasAnyActiveFilters,
  }
}
