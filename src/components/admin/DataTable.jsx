import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiCheck, FiX } from 'react-icons/fi';
import Button from '../common/Button';
import StatusBadge from './StatusBadge';

const DataTable = ({
  data = [],
  columns = [],
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search term
  const filteredData = data.filter(item =>
    columns.some(column => {
      const value = column.render ? column.render(item) : item[column.key];
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(sortedData.map(item => item.id));
      setSelectedRows(allIds);
      onSelectionChange?.(allIds);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(newSelected);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
            {searchable && (
              <div className="relative flex-1 w-full">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {filterable && (
                <Button variant="outline" size="sm" icon={<FiFilter className="h-4 w-4" />} className="flex-1 sm:flex-none">
                  <span className="hidden sm:inline">Filter</span>
                  <span className="sm:hidden">Filters</span>
                </Button>
              )}

              {exportable && (
                <Button variant="outline" size="sm" icon={<FiDownload className="h-4 w-4" />} className="flex-1 sm:flex-none">
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
            </div>
          </div>

          {selectable && selectedRows.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedRows.size} selected
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {selectable && (
                  <th className="px-2 sm:px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                )}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm">{column.label}</span>
                      {column.sortable !== false && (
                        <span className="text-xs">{getSortIcon(column.key)}</span>
                      )}
                    </div>
                  </th>
                ))}

                {!columns.some(col => col.key === 'actions' || col.key === 'action') && (
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-auto">
                    <span className="text-xs sm:text-sm">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (columns.some(col => col.key === 'actions' || col.key === 'action') ? 0 : 1)}
                    className="px-2 sm:px-6 py-8 sm:py-12 text-center text-sm text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {selectable && (
                      <td className="px-2 sm:px-6 py-3 sm:py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    )}

                    {columns.map((column, index) => (
                      <td key={`${item.id}-${column.key}-${index}`} className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-sm text-gray-900 min-w-0">
                          {column.render ? column.render(item) : (
                            <>
                              {column.key === 'status' ? (
                                <StatusBadge status={item[column.key]} size="sm" />
                              ) : (
                                <span className="break-words">{item[column.key]}</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    ))}

                    {!columns.some(col => col.key === 'actions' || col.key === 'action') && (
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-sm font-medium w-20 sm:w-auto">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<FiEye className="h-4 w-4" />}
                              onClick={() => onView(item)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="View"
                            />
                          )}

                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<FiEdit className="h-4 w-4" />}
                              onClick={() => onEdit(item)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Edit"
                            />
                          )}

                          {onApprove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<FiCheck className="h-4 w-4" />}
                              onClick={() => onApprove(item)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Approve"
                            />
                          )}

                          {onReject && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<FiX className="h-4 w-4" />}
                              onClick={() => onReject(item)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Reject"
                            />
                          )}

                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<FiTrash2 className="h-4 w-4" />}
                              onClick={() => onDelete(item)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete"
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination could be added here */}
      {sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-sm text-gray-700 pt-3 sm:pt-4">
          <div className="text-center sm:text-left">
            Showing {sortedData.length} of {data.length} results
          </div>
          {/* Add pagination component here if needed */}
        </div>
      )}
    </div>
  );
};

export default DataTable;
