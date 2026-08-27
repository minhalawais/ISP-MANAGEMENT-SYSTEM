import { useCallback, useMemo, useState } from "react"
import type { CrudPeriod, CrudPeriodConfig } from "../types/crudFilters.ts"
import {
  formatPeriodLabel,
  getInitialPeriod,
  periodToQueryParam,
} from "../utils/crudPeriodUtils.ts"

type UseCrudPeriodFilterOptions = {
  config: CrudPeriodConfig
  onPeriodChange?: () => void
}

export function useCrudPeriodFilter({ config, onPeriodChange }: UseCrudPeriodFilterOptions) {
  const [period, setPeriodState] = useState<CrudPeriod>(() => getInitialPeriod(config.defaultPeriod))

  const setPeriod = useCallback(
    (next: CrudPeriod) => {
      setPeriodState(next)
      onPeriodChange?.()
    },
    [onPeriodChange],
  )

  const setAll = useCallback(() => {
    setPeriodState(null)
    onPeriodChange?.()
  }, [onPeriodChange])

  const isActive = period !== null
  const label = useMemo(() => formatPeriodLabel(period), [period])
  const queryParams = useMemo(() => periodToQueryParam(period), [period])

  return {
    period,
    setPeriod,
    setAll,
    isActive,
    label,
    queryParams,
    dateField: config.dateField,
    fetchMode: config.fetchMode,
  }
}
