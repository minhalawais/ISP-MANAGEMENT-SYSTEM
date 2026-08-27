"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type FilterFn,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Search,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import debounce from "lodash/debounce"
import { rankItem } from "@tanstack/match-sorter-utils"
import type { CrudFilterState, FilterValue, QuickFilterDef } from "../../types/crudFilters.ts"
import { CrudTableToolbar } from "../crud/CrudTableToolbar.tsx"
import { CrudAdvancedFiltersPanel } from "../crud/CrudAdvancedFiltersPanel.tsx"
import "./table.css"

// Define fuzzy search filter function
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  if (!value) return true;
  
  // For global filtering, we need to search across all columns
  const searchValue = value.toLowerCase();
  const rowData = row.original;
  
  // Search across all string values in the row
  const searchableText = Object.values(rowData)
    .filter(val => val != null && typeof val === 'string')
    .map(val => val.toLowerCase())
    .join(' ');
  
  return searchableText.includes(searchValue);
}

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  selectedRows?: string[]
  setSelectedRows?: (rows: string[]) => void
  handleToggleStatus?: (id: string, currentStatus: boolean) => void
  isLoading?: boolean
  quickFilters?: QuickFilterDef[]
  filterState?: CrudFilterState
  onQuickFilterChange?: (field: string, value: FilterValue) => void
  onClearFilters?: () => void
  hasActiveFilters?: boolean
  inlineFilterFields?: string[]
  controlledColumnFilters?: ColumnFiltersState
  onControlledColumnFiltersChange?: (filters: ColumnFiltersState) => void
  /** Fired (debounced) when the toolbar text search changes — used to bypass period filters. */
  onSearchTextChange?: (q: string) => void
}

export function Table<T extends { id: string }>({
  data,
  columns,
  selectedRows: externalSelectedRows,
  setSelectedRows: setExternalSelectedRows,
  handleToggleStatus,
  isLoading = false,
  quickFilters,
  filterState,
  onQuickFilterChange,
  onClearFilters,
  hasActiveFilters,
  inlineFilterFields = [],
  controlledColumnFilters,
  onControlledColumnFiltersChange,
  onSearchTextChange,
}: TableProps<T>) {
  const useControlledFilters = controlledColumnFilters !== undefined
  const [globalFilter, setGlobalFilter] = useState("")
  const [localGlobalFilter, setLocalGlobalFilter] = useState("")
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])
  const columnFilters = useControlledFilters ? controlledColumnFilters : internalColumnFilters
  const setColumnFilters = useControlledFilters
    ? (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
        const next = typeof updater === "function" ? updater(controlledColumnFilters!) : updater
        onControlledColumnFiltersChange?.(next)
      }
    : setInternalColumnFilters
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, string>>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [distinctValues, setDistinctValues] = useState<Record<string, Set<any>>>({})
  const [showFilters, setShowFilters] = useState(false)

  const table = useReactTable({
    data, // Use original data, let TanStack Table handle filtering
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    state: {
      rowSelection,
      globalFilter,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    // Enable row selection
    enableRowSelection: true,
    getRowId: (originalRow) => originalRow.id,
  })

  // Debounced search handlers with reduced delay
  const debouncedGlobalSearch = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value)
        onSearchTextChange?.(value)
      }, 150), // Reduced from 300ms to 150ms
    [onSearchTextChange],
  )

  const debouncedColumnSearch = useMemo(
    () =>
      debounce((columnId: string, value: string) => {
        setColumnFilters((prev) => {
          const existingFilter = prev.find((filter) => filter.id === columnId)
          if (value === "") {
            // Remove filter if value is empty
            return prev.filter((filter) => filter.id !== columnId)
          }
          if (existingFilter) {
            // Update existing filter
            return prev.map((filter) =>
              filter.id === columnId ? { ...filter, value } : filter
            )
          } else {
            // Add new filter
            return [...prev, { id: columnId, value }]
          }
        })
      }, 150), // Reduced from 300ms to 150ms
    [],
  )

  // Handle global filter changes
  const handleGlobalFilterChange = useCallback((value: string) => {
    setLocalGlobalFilter(value)
    debouncedGlobalSearch(value)
  }, [debouncedGlobalSearch])

  // Handle column filter changes
  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setLocalColumnFilters(prev => ({ ...prev, [columnId]: value }))
    debouncedColumnSearch(columnId, value)
  }, [debouncedColumnSearch])

  // Cleanup debounced functions
  useEffect(() => {
    return () => {
      debouncedGlobalSearch.cancel()
      debouncedColumnSearch.cancel()
    }
  }, [debouncedGlobalSearch, debouncedColumnSearch])

  // Calculate distinct values for column filters
  useEffect(() => {
    const newDistinctValues: Record<string, Set<any>> = {}
    columns.forEach((column) => {
      if (typeof column.accessorKey === "string") {
        newDistinctValues[column.accessorKey] = new Set(
          data.map((row) => (row as any)[column.accessorKey as string]).filter(Boolean),
        )
      }
    })
    setDistinctValues(newDistinctValues)
  }, [data, columns])

  // Update external selected rows when row selection changes - FIXED VERSION
  useEffect(() => {
    if (setExternalSelectedRows) {
      const selectedRowIds = Object.keys(rowSelection)
        .map(rowIndex => {
          const row = table.getRowModel().rows[parseInt(rowIndex)];
          return row?.original?.id;
        })
        .filter((id): id is string => id !== undefined);
      
      setExternalSelectedRows(selectedRowIds);
    }
  }, [rowSelection, table, setExternalSelectedRows]);

  const { rows } = table.getRowModel()

  const selectedRowsData = useMemo(() => {
    return Object.keys(rowSelection)
      .map((key) => {
        const row = rows[parseInt(key)];
        return row?.original;
      })
      .filter((row): row is T => row !== undefined);
  }, [rowSelection, rows])

  const getColumnFilterValue = useCallback(
    (columnId: string) => {
      if (localColumnFilters[columnId] !== undefined) return localColumnFilters[columnId]
      const match = columnFilters.find((f) => f.id === columnId)
      return match ? String(match.value) : ""
    },
    [localColumnFilters, columnFilters],
  )

  useEffect(() => {
    if (!useControlledFilters) return
    const next: Record<string, string> = {}
    controlledColumnFilters?.forEach((f) => {
      if (!inlineFilterFields.includes(f.id)) next[f.id] = String(f.value)
    })
    setLocalColumnFilters(next)
  }, [controlledColumnFilters, inlineFilterFields, useControlledFilters])

  const toolbarQuickFilters = quickFilters ?? []
  const useCrudToolbar = toolbarQuickFilters.length > 0

  const advancedFilterChips = useMemo(() => {
    return Object.entries(localColumnFilters)
      .filter(([id, val]) => val.trim() && !inlineFilterFields.includes(id))
      .map(([id, val]) => {
        const col = columns.find((c) => typeof c.accessorKey === "string" && c.accessorKey === id)
        return {
          field: id,
          label: String(col?.header ?? id),
          displayValue: val,
        }
      })
  }, [localColumnFilters, inlineFilterFields, columns])

  const handleClearAllFilters = useCallback(() => {
    onClearFilters?.()
    handleGlobalFilterChange("")
  }, [onClearFilters, handleGlobalFilterChange])

  const toolbarHasActive =
    (hasActiveFilters ?? false) ||
    localGlobalFilter.trim().length > 0 ||
    advancedFilterChips.length > 0

  return (
    <div className="space-y-6">
      {useCrudToolbar ? (
        <>
          <CrudTableToolbar
            globalSearch={localGlobalFilter}
            onGlobalSearchChange={handleGlobalFilterChange}
            quickFilters={toolbarQuickFilters}
            filterState={filterState}
            onQuickFilterChange={onQuickFilterChange}
            advancedFilterChips={advancedFilterChips}
            onRemoveAdvancedFilter={(field) => handleColumnFilterChange(field, "")}
            hasActiveFilters={toolbarHasActive}
            onClearFilters={handleClearAllFilters}
            showAdvanced={showFilters}
            onToggleAdvanced={() => setShowFilters(!showFilters)}
            exportData={selectedRowsData}
            exportFilename="selected_rows.csv"
          />
          {showFilters && (
            <CrudAdvancedFiltersPanel
              columns={columns}
              excludeFields={inlineFilterFields}
              getColumnFilterValue={getColumnFilterValue}
              onColumnFilterChange={handleColumnFilterChange}
              distinctValues={distinctValues}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-gray/10">
            <div className="relative w-full lg:w-auto flex-1 max-w-md">
              <input
                type="text"
                value={localGlobalFilter}
                onChange={(e) => handleGlobalFilterChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-gray/20 rounded-lg bg-light-sky/30 text-deep-ocean placeholder-slate-gray/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-transparent transition-all duration-200"
                placeholder="Search all columns..."
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/60 h-4 w-4" />
            </div>
          </div>
          {showFilters && (
            <CrudAdvancedFiltersPanel
              columns={columns}
              getColumnFilterValue={getColumnFilterValue}
              onColumnFilterChange={handleColumnFilterChange}
              distinctValues={distinctValues}
            />
          )}
        </>
      )}

      <div
        className="overflow-auto bg-white rounded-lg shadow-md max-h-[calc(100vh-280px)] custom-scrollbar border border-slate-gray/10"
      >
        <table className="data-table min-w-full divide-y divide-slate-gray/10">
          <thead className="bg-light-sky sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-3 py-2 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={table.getIsAllRowsSelected()}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                      className="rounded border-slate-gray/30 text-electric-blue focus:ring-electric-blue/50"
                    />
                  </div>
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <button
                            className={`flex items-center gap-1.5 hover:text-electric-blue transition-colors ${
                              header.column.getIsSorted() ? "text-electric-blue font-semibold" : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() ? (
                              header.column.getIsSorted() === "desc" ? (
                                <SortDesc className="h-3.5 w-3.5" />
                              ) : (
                                <SortAsc className="h-3.5 w-3.5" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-slate-gray/40" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-slate-gray/10">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 whitespace-nowrap text-center">
                  <div className="flex flex-col justify-center items-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-electric-blue"></div>
                      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-t-4 border-b-4 border-transparent border-opacity-50"></div>
                    </div>
                    <span className="mt-4 text-deep-ocean font-medium text-lg">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-light-sky/50 rounded-full p-4 mb-4">
                      <Search className="h-8 w-8 text-slate-gray/60" />
                    </div>
                    <h3 className="text-lg font-medium text-deep-ocean mb-1">No data found</h3>
                    <p className="text-slate-gray">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`group ${
                    row.getIsSelected() ? "bg-electric-blue/5 hover:bg-electric-blue/10" : "hover:bg-light-sky/30"
                  }`}
                >
                  <td className="px-3 py-2 max-w-[15px]">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="rounded border-slate-gray/30 text-electric-blue focus:ring-electric-blue/50"
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-sm text-slate-gray">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-gray/10">
        <div className="flex items-center gap-1 text-sm text-deep-ocean">
          <span>Showing</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="mx-1 border rounded p-1 bg-white text-deep-ocean focus:outline-none focus:ring-1 focus:ring-electric-blue"
          >
            {[10, 20, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span>of {table.getFilteredRowModel().rows.length} entries</span>
        </div>

        <div className="flex items-center">
          <div className="flex items-center gap-1 mr-4 text-sm text-deep-ocean">
            <span>Page</span>
            <strong>
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}