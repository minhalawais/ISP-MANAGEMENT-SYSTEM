import React from "react"
import type { CrudFilterState, FilterValue, QuickFilterDef } from "../../types/crudFilters.ts"
import { filterValueToString, isFieldFilterActive } from "../../utils/crudFilterParams.ts"

type CrudQuickFilterProps = {
  def: QuickFilterDef
  filterState: CrudFilterState
  onChange: (field: string, value: FilterValue) => void
}

const activeSelectClass =
  "border-electric-blue/50 bg-electric-blue/[0.06] text-deep-ocean ring-1 ring-electric-blue/20 font-medium"
const idleSelectClass = "border-slate-gray/30 bg-white text-slate-gray"

export function CrudQuickFilter({ def, filterState, onChange }: CrudQuickFilterProps) {
  const current = filterValueToString(filterState[def.field] ?? "")
  const isActive = isFieldFilterActive(filterState[def.field])

  if (def.type === "text") {
    return (
      <div className="shrink-0 w-[8.5rem]">
        <label className="sr-only">{def.label}</label>
        <input
          type="text"
          value={current}
          placeholder={def.placeholder ?? def.label}
          onChange={(e) => onChange(def.field, e.target.value || null)}
          className={`w-full h-9 px-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-transparent ${
            isActive ? activeSelectClass : idleSelectClass
          }`}
        />
      </div>
    )
  }

  return (
    <div className="relative shrink-0 w-[8.5rem]">
      <label className="sr-only">{def.label}</label>
      <select
        value={current}
        onChange={(e) => {
          const val = e.target.value
          if (def.field === "is_active" || def.field === "is_read") {
            onChange(def.field, val === "" ? null : val === "true")
          } else {
            onChange(def.field, val || null)
          }
        }}
        className={`w-full h-9 pl-2.5 pr-7 text-sm border rounded-lg appearance-none focus:ring-2 focus:ring-electric-blue focus:border-transparent truncate ${
          isActive ? activeSelectClass : idleSelectClass
        }`}
        title={isActive ? `${def.label}: ${current}` : def.label}
      >
        {def.options.map((opt) => (
          <option key={opt.value || "__all__"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
        {isActive ? (
          <span className="h-1.5 w-1.5 rounded-full bg-electric-blue mr-0.5" aria-hidden />
        ) : null}
        <svg className="h-3.5 w-3.5 text-slate-gray/70" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  )
}
