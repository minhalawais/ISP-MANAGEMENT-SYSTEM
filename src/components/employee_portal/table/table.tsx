import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  RowSelectionState,
  FilterFn,
} from '@tanstack/react-table';
import { useVirtual } from 'react-virtual';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaChevronDown } from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import debounce from 'lodash/debounce';
import { rankItem } from '@tanstack/match-sorter-utils';
import './table.css';

// Define fuzzy search filter function
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  selectedRows?: string[];
  setSelectedRows?: (rows: string[]) => void;
  handleToggleStatus?: (id: string, currentStatus: boolean) => void;
}

export function Table<T>({ 
  data, 
  columns,
  selectedRows: externalSelectedRows,
  setSelectedRows: setExternalSelectedRows,
  handleToggleStatus 
}: TableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [activeSearchColumn, setActiveSearchColumn] = useState<string | null>(null);
  const [distinctValues, setDistinctValues] = useState<Record<string, Set<any>>>({});

  // Memoize the filtered data
  const filteredData = useMemo(() => {
    if (!globalFilter && Object.keys(columnFilters).length === 0) return data;

    return data.filter(row => {
      // Check global filter
      if (globalFilter) {
        const matchesGlobal = Object.values(row as any)
          .some(value => 
            String(value).toLowerCase().includes(globalFilter.toLowerCase())
          );
        if (!matchesGlobal) return false;
      }

      // Check column filters
      for (const [columnId, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue;
        const cellValue = String((row as any)[columnId] || '').toLowerCase();
        if (!cellValue.includes(filterValue.toLowerCase())) return false;
      }

      return true;
    });
  }, [data, globalFilter, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  // Debounced search handlers
  const debouncedGlobalSearch = useMemo(
    () => debounce((value: string) => {
      setGlobalFilter(value);
    }, 300),
    []
  );

  const debouncedColumnSearch = useMemo(
    () => debounce((columnId: string, value: string) => {
      setColumnFilters(prev => ({
        ...prev,
        [columnId]: value,
      }));
    }, 300),
    []
  );

  // Cleanup debounced functions
  useEffect(() => {
    return () => {
      debouncedGlobalSearch.cancel();
      debouncedColumnSearch.cancel();
    };
  }, []);

  // Calculate distinct values for column filters
  useEffect(() => {
    const newDistinctValues: Record<string, Set<any>> = {};
    columns.forEach((column) => {
      if (typeof column.accessorKey === 'string') {
        newDistinctValues[column.accessorKey] = new Set(
          data.map((row) => (row as any)[column.accessorKey as string]).filter(Boolean)
        );
      }
    });
    setDistinctValues(newDistinctValues);
  }, [data, columns]);

  // Update external selected rows when row selection changes
  useEffect(() => {
    if (setExternalSelectedRows) {
      const selectedIds = Object.keys(rowSelection).map(
        index => (table.getRowModel().rows[parseInt(index)].original as any).id
      );
      setExternalSelectedRows(selectedIds);
    }
  }, [rowSelection, table]);

  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 10,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  const selectedRowsData = useMemo(() => {
    return Object.keys(rowSelection).map((key) => rows[parseInt(key)].original);
  }, [rowSelection, rows]);

  const toggleColumnSearch = useCallback((columnId: string) => {
    setActiveSearchColumn(prev => prev === columnId ? null : columnId);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            onChange={(e) => debouncedGlobalSearch(e.target.value)}
            className="px-4 py-2 border rounded-md pr-10 bg-[#F1F0E8] text-[#89A8B2]"
            placeholder="Global search..."
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#89A8B2]" />
        </div>
        <CSVLink
          data={selectedRowsData}
          filename="selected_rows.csv"
          className="bg-[#89A8B2] text-white px-4 py-2 rounded-md hover:bg-[#B3C8CF] transition duration-300"
        >
          Export Selected
        </CSVLink>
      </div>

      <div ref={tableContainerRef} className="overflow-auto bg-white rounded-lg shadow max-h-[600px] custom-scrollbar">
        <table className="min-w-full divide-y divide-[#E5E1DA]">
          <thead className="bg-[#B3C8CF] sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#89A8B2] uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={table.getIsAllRowsSelected()}
                    onChange={table.getToggleAllRowsSelectedHandler()}
                  />
                </th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-[#89A8B2] uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center cursor-pointer"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() ? (
                              header.column.getIsSorted() === 'desc' ? (
                                <FaSortDown className="ml-1" />
                              ) : (
                                <FaSortUp className="ml-1" />
                              )
                            ) : (
                              <FaSort className="ml-1" />
                            )}
                          </div>
                          {header.column.columnDef.header !== 'Actions' && (
                            <FaSearch
                              className="cursor-pointer text-[#89A8B2]"
                              onClick={() => toggleColumnSearch(header.column.id)}
                            />
                          )}
                        </div>
                        {activeSearchColumn === header.column.id && header.column.columnDef.header !== 'Actions' && (
                          <div className="relative mt-1">
                            <input
                              type="text"
                              onChange={(e) => debouncedColumnSearch(header.column.id, e.target.value)}
                              placeholder={`Search ${header.column.columnDef.header as string}...`}
                              className="px-2 py-1 text-sm border rounded-md w-full bg-[#F1F0E8] text-[#89A8B2]"
                              list={`options-${header.column.id}`}
                            />
                            <datalist id={`options-${header.column.id}`}>
                              {Array.from(distinctValues[header.column.id] || []).map((value) => (
                                <option key={value} value={value} />
                              ))}
                            </datalist>
                            <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#89A8B2]" />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-[#F1F0E8] divide-y divide-[#E5E1DA]">
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={row.getIsSelected()}
                      onChange={row.getToggleSelectedHandler()}
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-[#89A8B2]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1 bg-[#B3C8CF] text-[#89A8B2]"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="border rounded p-1 bg-[#B3C8CF] text-[#89A8B2]"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="border rounded p-1 bg-[#B3C8CF] text-[#89A8B2]"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="border rounded p-1 bg-[#B3C8CF] text-[#89A8B2]"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
          <span className="flex items-center gap-1 text-[#89A8B2]">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </span>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="border rounded p-1 bg-[#F1F0E8] text-[#89A8B2]"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}