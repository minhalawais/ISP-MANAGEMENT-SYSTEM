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
  type SortingState,
} from "@tanstack/react-table"
import {
  Search,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  ChevronDown,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react"
import { CSVLink } from "react-csv"
import debounce from "lodash/debounce"
import { rankItem } from "@tanstack/match-sorter-utils"
import type { CrudFilterState, FilterValue, QuickFilterDef } from "../../types/crudFilters.ts"
import { CrudTableToolbar } from "../crud/CrudTableToolbar.tsx"
import { CrudAdvancedFiltersPanel } from "../crud/CrudAdvancedFiltersPanel.tsx"
import "./table.css"

// Define fuzzy search filter function
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

interface TableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  selectedRows?: string[]
  setSelectedRows?: (rows: string[]) => void
  handleToggleStatus?: (id: string, currentStatus: boolean) => void
  isLoading?: boolean
  serverMode?: boolean
  totalCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  onGlobalSearch?: (q: string) => void
  onColumnFiltersChangeExternal?: (filters: ColumnFiltersState) => void
  quickFilters?: QuickFilterDef[]
  filterState?: CrudFilterState
  onQuickFilterChange?: (field: string, value: FilterValue) => void
  onClearFilters?: () => void
  hasActiveFilters?: boolean
  inlineFilterFields?: string[]
}

export function Table<T>({
  data,
  columns,
  selectedRows: externalSelectedRows,
  setSelectedRows: setExternalSelectedRows,
  handleToggleStatus,
  isLoading = false,
  serverMode = false,
  totalCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sorting: externalSorting,
  onSortingChange,
  onGlobalSearch,
  onColumnFiltersChangeExternal,
  quickFilters,
  filterState,
  onQuickFilterChange,
  onClearFilters,
  hasActiveFilters,
  inlineFilterFields = [],
}: TableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [localGlobalFilter, setLocalGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, string>>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [distinctValues, setDistinctValues] = useState<Record<string, Set<any>>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [sorting, setSorting] = useState<SortingState>(externalSorting ?? [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { fuzzy: fuzzyFilter },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? (updater as any)(sorting) : (updater as SortingState)
      setSorting(next)
      if (serverMode && onSortingChange) onSortingChange(next)
    },
    globalFilterFn: fuzzyFilter,
    state: {
      rowSelection,
      globalFilter,
      columnFilters,
      sorting,
      pagination: serverMode && pageIndex !== undefined && pageSize !== undefined ? { pageIndex, pageSize } : undefined,
    },
    manualPagination: serverMode,
    pageCount:
      serverMode && totalCount !== undefined && (pageSize ?? 10) > 0
        ? Math.max(1, Math.ceil(totalCount / (pageSize as number)))
        : undefined,
    initialState: { pagination: { pageSize: pageSize ?? 20 } },
  })

  const debouncedGlobalSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (serverMode && onGlobalSearch) {
          onGlobalSearch(value)
        } else {
          setGlobalFilter(value)
        }
      }, 250),
    [serverMode, onGlobalSearch],
  )

  const debouncedColumnSearch = useMemo(
    () =>
      debounce((columnId: string, value: string) => {
        setColumnFilters((prev) => {
          const existingFilter = prev.find((filter) => filter.id === columnId)
          if (value === "") {
            return prev.filter((filter) => filter.id !== columnId)
          }
          if (existingFilter) {
            return prev.map((filter) => (filter.id === columnId ? { ...filter, value } : filter))
          } else {
            return [...prev, { id: columnId, value }]
          }
        })
      }, 150),
    [],
  )

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setLocalGlobalFilter(value)
      debouncedGlobalSearch(value)
    },
    [debouncedGlobalSearch],
  )

  const handleColumnFilterChange = useCallback(
    (columnId: string, value: string) => {
      setLocalColumnFilters((prev) => ({ ...prev, [columnId]: value }))
      if (serverMode && onColumnFiltersChangeExternal) {
        const next: ColumnFiltersState = Object.entries({ ...localColumnFilters, [columnId]: value })
          .filter(([, v]) => v !== "")
          .map(([id, v]) => ({ id, value: v as string }))
        onColumnFiltersChangeExternal(next)
      } else {
        debouncedColumnSearch(columnId, value)
      }
    },
    [debouncedColumnSearch, serverMode, onColumnFiltersChangeExternal, localColumnFilters],
  )

  useEffect(() => {
    return () => {
      debouncedGlobalSearch.cancel()
      debouncedColumnSearch.cancel()
    }
  }, [debouncedGlobalSearch, debouncedColumnSearch])

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

  useEffect(() => {
    if (!serverMode) return
    const p = table.getState().pagination
    if (onPageChange) onPageChange(p.pageIndex)
    if (onPageSizeChange) onPageSizeChange(p.pageSize)
  }, [serverMode, table.getState().pagination.pageIndex, table.getState().pagination.pageSize])

  useEffect(() => {
    if (setExternalSelectedRows) {
      const selectedIds = Object.keys(rowSelection).map(
        (index) => (table.getRowModel().rows[Number.parseInt(index)].original as any).id,
      )
      setExternalSelectedRows(selectedIds)
    }
  }, [rowSelection, table, setExternalSelectedRows])

  const { rows } = table.getRowModel()

  const selectedRowsData = useMemo(() => {
    return Object.keys(rowSelection).map((key) => rows[Number.parseInt(key)].original)
  }, [rowSelection, rows])

  const getColumnFilterValue = useCallback(
    (columnId: string) => {
      return localColumnFilters[columnId] || ""
    },
    [localColumnFilters],
  )

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
                      indeterminate={table.getIsSomeRowsSelected()}
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
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                      className="rounded border-slate-gray/30 text-electric-blue focus:ring-electric-blue/50"
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 whitespace-nowrap text-sm text-slate-gray">
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
        const newPageSize = Number(e.target.value);
        table.setPageSize(newPageSize);
        if (serverMode && onPageSizeChange) {
          onPageSizeChange(newPageSize);
          table.setPageIndex(0); // Reset to first page when page size changes
        }
      }}
      className="mx-1 border rounded p-1 bg-white text-deep-ocean focus:outline-none focus:ring-1 focus:ring-electric-blue"
    >
      {[10, 20, 50, 100].map((ps) => (
        <option key={ps} value={ps}>
          {ps}
        </option>
      ))}
    </select>
    <span>
      of {serverMode && totalCount !== undefined ? totalCount : table.getFilteredRowModel().rows.length} entries
    </span>
  </div>

  <div className="flex items-center">
    <div className="flex items-center gap-1 mr-4 text-sm text-deep-ocean">
      <span>Page</span>
      <strong>
        {table.getState().pagination.pageIndex + 1} of{" "}
        {serverMode && totalCount !== undefined && table.getState().pagination.pageSize > 0
          ? Math.max(1, Math.ceil(totalCount / table.getState().pagination.pageSize))
          : table.getPageCount()}
      </strong>
    </div>

    <div className="flex items-center gap-1">
      <button
        className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={() => {
          table.setPageIndex(0);
          if (serverMode && onPageChange) onPageChange(0);
        }}
        disabled={table.getState().pagination.pageIndex === 0}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={() => {
          const newPageIndex = Math.max(0, table.getState().pagination.pageIndex - 1);
          table.setPageIndex(newPageIndex);
          if (serverMode && onPageChange) onPageChange(newPageIndex);
        }}
        disabled={table.getState().pagination.pageIndex === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={() => {
          const newPageIndex = table.getState().pagination.pageIndex + 1;
          table.setPageIndex(newPageIndex);
          if (serverMode && onPageChange) onPageChange(newPageIndex);
        }}
        disabled={
          serverMode && totalCount !== undefined
            ? (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize >= totalCount
            : !table.getCanNextPage()
        }
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        className="p-1.5 rounded-md border border-slate-gray/20 text-deep-ocean hover:bg-light-sky disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={() => {
          const lastPageIndex = serverMode && totalCount !== undefined
            ? Math.max(0, Math.ceil(totalCount / table.getState().pagination.pageSize) - 1)
            : table.getPageCount() - 1;
          table.setPageIndex(lastPageIndex);
          if (serverMode && onPageChange) onPageChange(lastPageIndex);
        }}
        disabled={
          serverMode && totalCount !== undefined
            ? (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize >= totalCount
            : !table.getCanNextPage()
        }
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
    </div>
  )
}
