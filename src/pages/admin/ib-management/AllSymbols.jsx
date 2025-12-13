import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiSearch, FiList, FiDatabase, FiTrendingUp } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import DataTable from '../../../components/admin/DataTable';

const AllSymbols = () => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSymbols, setTotalSymbols] = useState(0);
  const [stats, setStats] = useState({
    total_symbols: 0,
    active_symbols: 0,
    total_groups: 0,
    total_types: 0
  });

  const pageSize = 100;

  // Fetch symbols data
  const fetchSymbols = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/admin/symbols?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSymbols(data.data.symbols || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalSymbols(data.data.pagination?.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch symbols');
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch symbols statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/symbols/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching symbols stats:', error);
    }
  };

  // Sync symbols from external API
  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/symbols/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Refresh data after sync
        await fetchSymbols(currentPage, searchTerm);
        await fetchStats();
      } else {
        alert('Failed to sync symbols');
      }
    } catch (error) {
      console.error('Error syncing symbols:', error);
      alert('Error syncing symbols');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSymbols(currentPage, searchTerm);
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSymbols(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchSymbols(newPage, searchTerm);
    }
  };

  const columns = [
    {
      key: 'symbol_name',
      label: 'Symbol',
      sortable: true,
      render: (symbol) => (
        <div className="font-medium text-gray-900">{symbol.symbol_name}</div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (symbol) => (
        <div className="text-gray-600">{symbol.description || '-'}</div>
      )
    },
    {
      key: 'symbol_type',
      label: 'Type',
      sortable: true,
      render: (symbol) => (
        <span className="capitalize">{symbol.symbol_type || 'forex'}</span>
      )
    },
    {
      key: 'group_name',
      label: 'Group',
      sortable: true,
      render: (symbol) => (
        <div className="text-gray-600">{symbol.group_name || '-'}</div>
      )
    },
    {
      key: 'digits',
      label: 'Digits',
      sortable: true,
      render: (symbol) => (
        <div className="text-center">{symbol.digits || 5}</div>
      )
    },
    {
      key: 'spread',
      label: 'Spread',
      sortable: true,
      render: (symbol) => (
        <div className="text-center">{symbol.spread || 0}</div>
      )
    },
    {
      key: 'contract_size',
      label: 'Contract Size',
      sortable: true,
      render: (symbol) => (
        <div className="text-right">{symbol.contract_size?.toLocaleString() || '100,000'}</div>
      )
    },
    {
      key: 'swap_long',
      label: 'Swap Long',
      sortable: true,
      render: (symbol) => (
        <div className="text-right">{symbol.swap_long || 0}</div>
      )
    },
    {
      key: 'swap_short',
      label: 'Swap Short',
      sortable: true,
      render: (symbol) => (
        <div className="text-right">{symbol.swap_short || 0}</div>
      )
    },
    {
      key: 'enable',
      label: 'Status',
      sortable: true,
      render: (symbol) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          symbol.enable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {symbol.enable ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Symbols</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage trading symbols and sync from external API</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSync}
            loading={syncing}
            icon={<FiRefreshCw className="h-4 w-4" />}
          >
            Sync from API
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Symbols</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total_symbols}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Symbols</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.active_symbols}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Groups</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">{stats.total_groups}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiDatabase className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Symbol Types</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-0.5 sm:mt-1">{stats.total_types}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiList className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Search and Filters */}
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search symbols..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {symbols.length} of {totalSymbols} symbols</span>
          </div>
        </div>
      </AdminCard>

      {/* Symbols Table */}
      <AdminCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable
              data={symbols}
              columns={columns}
              emptyMessage="No symbols found"
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
};

export default AllSymbols;