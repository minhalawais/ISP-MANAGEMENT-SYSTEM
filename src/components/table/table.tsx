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
import { useVirtual } from "react-virtual"
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
}

export function Table<T>({
  data,
  columns,
  selectedRows: externalSelectedRows,
  setSelectedRows: setExternalSelectedRows,
  handleToggleStatus,
  isLoading = false,
}: TableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [localGlobalFilter, setLocalGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
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
  })

  // Debounced search handlers with reduced delay
  const debouncedGlobalSearch = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value)
      }, 150), // Reduced from 300ms to 150ms
    [],
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

  // Update external selected rows when row selection changes
  useEffect(() => {
    if (setExternalSelectedRows) {
      const selectedIds = Object.keys(rowSelection).map(
        (index) => (table.getRowModel().rows[Number.parseInt(index)].original as any).id,
      )
      setExternalSelectedRows(selectedIds)
    }
  }, [rowSelection, table, setExternalSelectedRows])

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const { rows } = table.getRowModel()
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10,
  })
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0

  const selectedRowsData = useMemo(() => {
    return Object.keys(rowSelection).map((key) => rows[Number.parseInt(key)].original)
  }, [rowSelection, rows])

  // Get current column filter value (use local state for immediate feedback)
  const getColumnFilterValue = useCallback((columnId: string) => {
    return localColumnFilters[columnId] || ""
  }, [localColumnFilters])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-gray/10">
        <div className="relative w-full lg:w-auto flex-1 max-w-md">
          <div className="relative">
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

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters
                ? "bg-electric-blue/10 text-electric-blue border-electric-blue/30"
                : "bg-white text-slate-gray border-slate-gray/20 hover:bg-light-sky/50"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          <CSVLink
            data={selectedRowsData}
            filename="selected_rows.csv"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              selectedRowsData.length === 0
                ? "bg-slate-gray/10 text-slate-gray/50 cursor-not-allowed"
                : "bg-electric-blue text-white hover:bg-btn-hover shadow-sm"
            }`}
          >
            <FileDown className="h-4 w-4" />
            <span>Export {selectedRowsData.length > 0 ? `(${selectedRowsData.length})` : ""}</span>
          </CSVLink>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-gray/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {columns
            .filter((col) => col.accessorKey && col.header !== "Actions")
            .map((column) => {
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
                      onChange={(e) => handleColumnFilterChange(columnId, e.target.value)}
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
      )}

      <div
        ref={tableContainerRef}
        className="overflow-auto bg-white rounded-lg shadow-md max-h-[calc(100vh-280px)] custom-scrollbar border border-slate-gray/10"
      >
        <table className="min-w-full divide-y divide-slate-gray/10">
          <thead className="bg-light-sky sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider">
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
                    className="px-6 py-3.5 text-left text-xs font-medium text-deep-ocean uppercase tracking-wider"
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
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      className={`group ${
                        row.getIsSelected() ? "bg-electric-blue/5 hover:bg-electric-blue/10" : "hover:bg-light-sky/30"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={row.getIsSelected()}
                          onChange={row.getToggleSelectedHandler()}
                          className="rounded border-slate-gray/30 text-electric-blue focus:ring-electric-blue/50"
                        />
                      </td>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-slate-gray">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </>
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