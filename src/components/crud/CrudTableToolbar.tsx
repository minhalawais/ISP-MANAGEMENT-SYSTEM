import React, { useMemo } from "react"
import { Search, Filter, ChevronDown, FileDown, X } from "lucide-react"
import { CSVLink } from "react-csv"
import type { CrudFilterState, FilterValue, QuickFilterDef } from "../../types/crudFilters.ts"
import { getActiveQuickFilterChips, type ActiveFilterChip } from "../../utils/crudFilterParams.ts"
import { CrudQuickFilter } from "./CrudQuickFilter.tsx"

type CrudTableToolbarProps = {
  globalSearch: string
  onGlobalSearchChange: (value: string) => void
  quickFilters?: QuickFilterDef[]
  filterState?: CrudFilterState
  onQuickFilterChange?: (field: string, value: FilterValue) => void
  advancedFilterChips?: ActiveFilterChip[]
  onRemoveAdvancedFilter?: (field: string) => void
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  showAdvanced: boolean
  onToggleAdvanced: () => void
  exportData?: any[]
  exportFilename?: string
  hideExport?: boolean
}

function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string
  value: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md bg-electric-blue/10 text-deep-ocean border border-electric-blue/20 text-xs max-w-[14rem]">
      <span className="truncate">
        <span className="text-slate-gray">{label}:</span> {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="shrink-0 p-0.5 rounded hover:bg-electric-blue/20 text-slate-gray hover:text-deep-ocean"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

export function CrudTableToolbar({
  globalSearch,
  onGlobalSearchChange,
  quickFilters = [],
  filterState = {},
  onQuickFilterChange,
  advancedFilterChips = [],
  onRemoveAdvancedFilter,
  hasActiveFilters = false,
  onClearFilters,
  showAdvanced,
  onToggleAdvanced,
  exportData = [],
  exportFilename = "export.csv",
  hideExport = false,
}: CrudTableToolbarProps) {
  const quickFilterChips = useMemo(
    () => getActiveQuickFilterChips(quickFilters, filterState),
    [quickFilters, filterState],
  )

  const activeCount =
    quickFilterChips.length +
    advancedFilterChips.length +
    (globalSearch.trim() ? 1 : 0)

  const showActiveBar = activeCount > 0

  const handleClearAll = () => {
    onClearFilters?.()
    onGlobalSearchChange("")
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-lg shadow-sm border border-slate-gray/10">
        <div className="relative w-48 shrink-0">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className={`w-full h-9 pl-9 pr-8 text-sm border rounded-lg bg-white text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent ${
              globalSearch.trim()
                ? "border-electric-blue/40 bg-electric-blue/[0.03]"
                : "border-slate-gray/30"
            }`}
            placeholder="Search..."
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-gray/60 h-4 w-4" />
          {globalSearch.trim() ? (
            <button
              type="button"
              onClick={() => onGlobalSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-gray hover:text-deep-ocean hover:bg-slate-gray/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="hidden sm:block w-px h-6 bg-slate-gray/15 shrink-0" aria-hidden />

        <div className="flex flex-1 min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickFilters.map((qf) => (
            <CrudQuickFilter
              key={qf.id}
              def={qf}
              filterState={filterState}
              onChange={onQuickFilterChange ?? (() => {})}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-1">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className={`relative flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-sm transition-colors whitespace-nowrap ${
              showAdvanced || advancedFilterChips.length > 0
                ? "bg-electric-blue/10 text-electric-blue border-electric-blue/30"
                : "bg-white text-slate-gray border-slate-gray/20 hover:bg-light-sky/50"
            }`}
          >
            <Filter className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline">More filters</span>
            {advancedFilterChips.length > 0 ? (
              <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-electric-blue text-white text-[10px] font-medium leading-none">
                {advancedFilterChips.length}
              </span>
            ) : null}
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          {!hideExport && (
            <CSVLink
              data={exportData}
              filename={exportFilename}
              className={`flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                exportData.length === 0
                  ? "bg-slate-gray/10 text-slate-gray/50 cursor-not-allowed pointer-events-none"
                  : "bg-electric-blue text-white hover:bg-btn-hover shadow-sm"
              }`}
            >
              <FileDown className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">
                Export{exportData.length > 0 ? ` (${exportData.length})` : ""}
              </span>
            </CSVLink>
          )}
        </div>
      </div>

      {showActiveBar ? (
        <div className="flex items-center gap-2 px-1 flex-wrap">
          <span className="text-xs text-slate-gray shrink-0">
            {activeCount} filter{activeCount === 1 ? "" : "s"} applied
          </span>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {globalSearch.trim() ? (
              <FilterChip
                label="Search"
                value={globalSearch.trim()}
                onRemove={() => onGlobalSearchChange("")}
              />
            ) : null}
            {quickFilterChips.map((chip) => (
              <FilterChip
                key={chip.field}
                label={chip.label}
                value={chip.displayValue}
                onRemove={() => onQuickFilterChange?.(chip.field, null)}
              />
            ))}
            {advancedFilterChips.map((chip) => (
              <FilterChip
                key={chip.field}
                label={chip.label}
                value={chip.displayValue}
                onRemove={() => onRemoveAdvancedFilter?.(chip.field)}
              />
            ))}
          </div>
          {onClearFilters ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 h-7 px-2 ml-auto text-xs font-medium text-coral-red hover:text-coral-red/80 hover:bg-coral-red/5 rounded-md shrink-0"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          ) : null}
        </div>
      ) : hasActiveFilters && onClearFilters ? (
        <div className="flex items-center px-1">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium text-coral-red hover:text-coral-red/80 hover:bg-coral-red/5 rounded-md"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </button>
        </div>
      ) : null}
    </div>
  )
}
