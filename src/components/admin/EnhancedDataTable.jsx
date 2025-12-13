import React, { useState, useMemo } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiChevronUp, 
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import Button from '../common/Button';
import StatusBadge from './StatusBadge';

const EnhancedDataTable = ({
  data = [],
  columns = [],
  searchable = true,
  filterable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  onExport,
  onFilterChange,
  onPageChange,
  totalCount,
  currentPage: externalCurrentPage,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [internalPage, setInternalPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Use external page if provided (server-side pagination), otherwise use internal
  const currentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalPage;
  const isServerSidePagination = externalCurrentPage !== undefined && onPageChange !== undefined;

  // Filter data based on search term (only for client-side filtering)
  const filteredData = useMemo(() => {
    // If server-side pagination, don't filter - server already did it
    if (isServerSidePagination) return data;
    
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const value = item[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns, isServerSidePagination]);

  // Sort data
  const sortedData = useMemo(() => {
    // If no sort config, just return filtered data
    if (!sortConfig.key) return filteredData;

    // If data is empty, return it
    if (filteredData.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested values
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle date strings
      if (typeof aValue === 'string' && !isNaN(Date.parse(aValue))) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data (only for client-side pagination)
  const paginatedData = useMemo(() => {
    if (!pagination || isServerSidePagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination, isServerSidePagination]);

  // Calculate totals - use totalCount for server-side, sortedData.length for client-side
  const totalItems = isServerSidePagination ? (totalCount || data.length) : sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = isServerSidePagination 
    ? (currentPage - 1) * pageSize + 1 
    : (currentPage - 1) * pageSize;
  const endIndex = isServerSidePagination
    ? Math.min(currentPage * pageSize, totalItems)
    : Math.min(startIndex + pageSize, sortedData.length);
  
  const displayData = isServerSidePagination ? sortedData : paginatedData;

  // Debug logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('EnhancedDataTable Debug:', {
      dataLength: data.length,
      filteredDataLength: filteredData.length,
      sortedDataLength: sortedData.length,
      displayDataLength: displayData.length,
      isServerSidePagination,
      totalCount,
      currentPage,
      pageSize
    });
  }

  const handlePageChange = (newPage) => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    handlePageChange(1); // Reset to first page on sort
  };

  const handleExport = () => {
    if (onExport) {
      onExport(sortedData);
    } else {
      // Default CSV export
      const headers = columns.map(col => col.label).join(',');
      const rows = sortedData.map(item => 
        columns.map(col => {
          const value = item[col.key];
          return value != null ? String(value).replace(/,/g, ';') : '';
        }).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FiChevronUp className="h-4 w-4 text-gray-400 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FiChevronUp className="h-4 w-4 text-blue-600" />
      : <FiChevronDown className="h-4 w-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {searchable && (
          <div className="relative flex-1 w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handlePageChange(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {filterable && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={<FiFilter className="h-4 w-4" />}
              onClick={() => {
                setShowFilters(!showFilters);
                if (onFilterChange) onFilterChange(!showFilters);
              }}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Filter</span>
            </Button>
          )}

          {exportable && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={<FiDownload className="h-4 w-4" />}
              onClick={handleExport}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                      column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable !== false && (
                        <span className="flex-shrink-0">
                          {getSortIcon(column.key)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-gray-400 mb-2">{emptyMessage}</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((item, rowIndex) => (
                  <tr 
                    key={item.id || rowIndex} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={`${item.id || rowIndex}-${column.key}-${colIndex}`} 
                        className={`px-6 py-4 ${column.key === 'actions' ? 'whitespace-nowrap' : ''}`}
                      >
                        <div className="text-sm text-gray-900">
                          {column.render ? column.render(item) : (
                            <>
                              {column.key === 'status' ? (
                                <StatusBadge status={item[column.key]} />
                              ) : (
                                <span>{item[column.key] ?? '-'}</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && displayData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex}</span> to{' '}
            <span className="font-medium">{endIndex}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <FiChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDataTable;

