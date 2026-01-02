'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

/**
 * Column Definition
 */
export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * DataTable Props
 */
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRefresh?: () => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showRefresh?: boolean;
  showExport?: boolean;
  rowClassName?: (row: T) => string;
  rowKey?: (row: T) => string;
}

/**
 * Reusable DataTable Component
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available',
  pagination,
  onPageChange,
  onLimitChange,
  onSearch,
  onSort,
  onRefresh,
  onExport,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showRefresh = true,
  showExport = false,
  rowClassName,
  rowKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  /**
   * Handle column sort
   */
  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(key, newDirection);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    if (onPageChange && pagination) {
      if (page >= 1 && page <= pagination.totalPages) {
        onPageChange(page);
      }
    }
  };

  /**
   * Handle limit change
   */
  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = parseInt(e.target.value, 10);
    if (onLimitChange) {
      onLimitChange(limit);
    }
  };

  /**
   * Get nested value from object
   */
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  /**
   * Render cell content
   */
  const renderCell = (column: Column<T>, row: T) => {
    const value = getNestedValue(row, column.key);
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return value !== null && value !== undefined ? String(value) : '-';
  };

  /**
   * Get row key
   */
  const getRowKey = (row: T, index: number): string => {
    if (rowKey) {
      return rowKey(row);
    }
    return row.id || String(index);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(showSearch || showRefresh || showExport) && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            {showSearch && (
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {showRefresh && onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-3 border-2 border-gray-200 hover:border-green-400 rounded-xl transition-all"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {showExport && onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 hover:border-green-400 rounded-xl font-bold text-gray-900 transition-all"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={`px-6 py-4 text-${column.align || 'left'} text-sm font-black text-gray-900 ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortKey === column.key && (
                        <span className="text-green-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                      <p className="text-gray-600 font-semibold">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-600 font-bold">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={getRowKey(row, index)}
                    className={`hover:bg-gray-50 transition-colors ${
                      rowClassName ? rowClassName(row) : ''
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-${column.align || 'left'}`}
                      >
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && !isLoading && data.length > 0 && (
          <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Rows per page:</span>
                <select
                  value={pagination.limit}
                  onChange={handleLimitChange}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-gray-900 focus:outline-none focus:border-green-400"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page info */}
              <div className="text-sm font-semibold text-gray-700">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>

              {/* Page controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="First page"
                >
                  <ChevronsLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border-2 border-gray-200 rounded-lg hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Last page"
                >
                  <ChevronsRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;