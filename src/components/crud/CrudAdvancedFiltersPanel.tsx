import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Search } from "lucide-react"

type CrudAdvancedFiltersPanelProps<T> = {
  columns: ColumnDef<T>[]
  excludeFields?: string[]
  getColumnFilterValue: (columnId: string) => string
  onColumnFilterChange: (columnId: string, value: string) => void
  distinctValues: Record<string, Set<any>>
}

export function CrudAdvancedFiltersPanel<T>({
  columns,
  excludeFields = [],
  getColumnFilterValue,
  onColumnFilterChange,
  distinctValues,
}: CrudAdvancedFiltersPanelProps<T>) {
  const filterColumns = columns.filter(
    (col) =>
      typeof col.accessorKey === "string" &&
      col.header !== "Actions" &&
      !excludeFields.includes(col.accessorKey as string),
  )

  if (filterColumns.length === 0) return null

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-gray/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filterColumns.map((column) => {
        const columnId = column.accessorKey as string
        return (
          <div key={columnId} className="space-y-1">
            <label className="text-xs font-medium text-slate-gray/70 uppercase tracking-wide">
              {column.header as string}
            </label>
            <div className="relative">
              <input
                type="text"
                value={getColumnFilterValue(columnId)}
                onChange={(e) => onColumnFilterChange(columnId, e.target.value)}
                placeholder={`Filter ${column.header as string}...`}
                className="w-full pl-3 pr-8 py-2 text-sm border border-slate-gray/20 rounded-md bg-light-sky/20 text-deep-ocean placeholder-slate-gray/40 focus:outline-none focus:ring-1 focus:ring-electric-blue/30"
                list={`options-${columnId}`}
              />
              <Search className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-gray/40 h-3.5 w-3.5" />
              <datalist id={`options-${columnId}`}>
                {Array.from(distinctValues[columnId] || []).map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
          </div>
        )
      })}
    </div>
  )
}
