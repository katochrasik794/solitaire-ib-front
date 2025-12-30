import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiInfo,
  FiSearch,
  FiFilter,
  FiX,
  FiCloud,
  FiAlertTriangle,
  FiGrid,
  FiDatabase
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import EnhancedDataTable from '../../../components/admin/EnhancedDataTable';
import { SymbolModal } from '../../../components/modals/SymbolModal';
import { apiFetch } from '../../../utils/api';

const SymbolsPipValues = () => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({
    Forex: false,
    Stocks: false,
    Commodities: false,
    Indices: false,
    Cryptocurrencies: false,
    all: false
  });
  const [stats, setStats] = useState({
    total_symbols: 0,
    configured_pip_lot: 0,
    overrides: 0,
    categories: []
  });
  const [filters, setFilters] = useState({
    category: 'all',
    group: 'all',
    status: 'all',
    search: ''
  });
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1
  });
  const [dbConnection, setDbConnection] = useState('OK');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch symbols
  const fetchSymbols = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        category: filters.category,
        group: filters.group,
        status: filters.status,
        search: filters.search
      });

      const response = await apiFetch(`/admin/symbols-with-categories?${params}`);

      if (response.ok) {
        const data = await response.json();
        const symbolsData = data.data?.symbols || [];
        console.log('Fetched symbols:', symbolsData.length, 'Total:', data.data?.pagination?.total);
        setSymbols(symbolsData);
        setPagination(prev => ({
          ...prev,
          total: data.data?.pagination?.total || 0,
          totalPages: data.data?.pagination?.totalPages || 1,
          limit: data.data?.pagination?.limit || 100
        }));
      } else {
        console.error('Failed to fetch symbols:', response.status);
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await apiFetch('/admin/symbols-with-categories/stats');

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        if (data.data.stats.categories) {
          setCategories(data.data.stats.categories);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await apiFetch('/admin/symbols-with-categories/groups');

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Check database connection
  const checkConnection = async () => {
    try {
      const response = await apiFetch('/admin/symbols-with-categories/test/connection');

      if (response.ok) {
        const data = await response.json();
        setDbConnection(data.data.connection || 'OK');
      }
    } catch (error) {
      setDbConnection('ERROR');
    }
  };

  // Sync from API by category
  const handleSync = async (category = null) => {
    try {
      setSyncing(prev => ({ ...prev, [category || 'all']: true }));
      const response = await apiFetch('/admin/symbols-with-categories/sync', {
        method: 'POST',
        body: JSON.stringify({ category })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        await fetchSymbols();
        await fetchStats();
        await fetchGroups();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to sync symbols' }));
        alert(errorData.message || 'Failed to sync symbols');
      }
    } catch (error) {
      console.error('Error syncing symbols:', error);
      alert(`Error syncing symbols: ${error.message}`);
    } finally {
      setSyncing(prev => ({ ...prev, [category || 'all']: false }));
    }
  };

  // Handle edit - open modal
  const handleEdit = (symbol) => {
    setSelectedSymbol(symbol);
    setIsModalOpen(true);
  };

  // Handle save - update symbol via API
  const handleSave = async (id, updateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/symbols-with-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        Swal.fire({
          title: 'Success!',
          text: 'Symbol updated successfully',
          icon: 'success',
          confirmButtonColor: '#c8f300',
          timer: 2000,
          showConfirmButton: true
        }).then(() => {
          // Refresh data
          fetchSymbols();
          fetchStats();
          setIsModalOpen(false);
          setSelectedSymbol(null);
        });
      } else {
        throw new Error(result.message || 'Failed to update symbol');
      }
    } catch (error) {
      console.error('Error updating symbol:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update symbol. Please try again.',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
      throw error;
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (id, symbolName) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the symbol "${symbolName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/symbols-with-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Show success message
        Swal.fire({
          title: 'Deleted!',
          text: 'Symbol deleted successfully',
          icon: 'success',
          confirmButtonColor: '#c8f300',
          timer: 2000,
          showConfirmButton: true
        }).then(() => {
          fetchSymbols();
          fetchStats();
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete symbol' }));
        throw new Error(errorData.message || 'Failed to delete symbol');
      }
    } catch (error) {
      console.error('Error deleting symbol:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to delete symbol. Please try again.',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/admin/symbols-with-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchSymbols();
        await fetchStats();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
        throw new Error(errorData.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to update status. Please try again.',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      fetchSymbols();
    }
  }, [filters]);

  useEffect(() => {
    fetchSymbols();
  }, [pagination.page]);

  useEffect(() => {
    fetchStats();
    fetchGroups();
    checkConnection();
  }, []);

  const columns = [
    {
      key: 'symbol',
      label: 'SYMBOL',
      sortable: true,
      render: (symbol) => (
        <span className="font-mono font-medium text-gray-900">{symbol.symbol}</span>
      )
    },
    {
      key: 'spread',
      label: 'SPREAD',
      sortable: true,
      render: (symbol) => {
        const spread = parseFloat(symbol.spread) || 0;
        // Format spread with appropriate decimals (usually 5-6 decimals for forex/crypto)
        const decimals = spread < 0.001 ? 6 : (spread < 1 ? 5 : 2);
        return (
          <span className="text-sm font-medium text-gray-900">
            {spread.toFixed(decimals)}
          </span>
        );
      }
    },
    {
      key: 'category',
      label: 'CATEGORY',
      sortable: true,
      render: (symbol) => (
        <span className="text-sm text-gray-700">{symbol.category || '-'}</span>
      )
    },
    {
      key: 'pip_per_lot',
      label: 'PIP/LOT',
      sortable: true,
      render: (symbol) => {
        const pipPerLot = parseFloat(symbol.pip_per_lot) || 1.00;
        return (
          <span className="text-sm font-medium text-gray-900">
            {pipPerLot.toFixed(2)} pip
          </span>
        );
      }
    },
    {
      key: 'pip_value',
      label: 'PIP VALUE',
      sortable: true,
      render: (symbol) => {
        const pipValue = parseFloat(symbol.pip_value) || 0.00;
        return (
          <span className="text-sm font-medium text-green-600">
            USD{pipValue.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: 'commission',
      label: 'COMMISSION',
      sortable: true,
      render: (symbol) => {
        const commission = parseFloat(symbol.commission) || 0.00;
        return (
          <span className="text-sm font-medium text-green-600">
            USD{commission.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: 'currency',
      label: 'CURRENCY',
      sortable: true,
      render: (symbol) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {symbol.currency || 'USD'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (symbol) => {
        const isActive = (symbol.status || 'active') === 'active';
        const isToggling = togglingId === symbol.id;

        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => handleStatusToggle(symbol.id, symbol.status || 'active')}
              disabled={isToggling}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
            <span className={`ml-3 text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {isToggling ? 'Updating...' : (isActive ? 'Active' : 'Inactive')}
            </span>
          </label>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      sortable: false,
      render: (symbol) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<FiEdit className="h-4 w-4" />}
            onClick={() => handleEdit(symbol)}
            className="text-blue-600 hover:text-blue-700"
            title="Edit"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<FiTrash2 className="h-4 w-4" />}
            onClick={() => handleDelete(symbol.id, symbol.symbol)}
            loading={deletingId === symbol.id}
            disabled={deletingId === symbol.id}
            className="text-red-600 hover:text-red-700"
            title="Delete"
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Configure symbols, categories, and pip values ({stats.total_symbols} symbols loaded)
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => alert('Add symbol functionality coming soon')}
          >
            + Add Symbol
          </Button>
        </div>
      </div>

      {/* Category Sync Buttons */}
      <AdminCard>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">Sync Symbols by Category</h2>
            <p className="text-sm text-gray-600 mt-1">Sync symbols from API category by category</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleSync('Forex')}
              loading={syncing.Forex}
              icon={<FiRefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              1) Sync Forex
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleSync('Commodities')}
              loading={syncing.Commodities}
              icon={<FiRefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              2) Sync Commodities
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleSync('Indices')}
              loading={syncing.Indices}
              icon={<FiRefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              3) Sync Indices
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleSync('Cryptocurrencies')}
              loading={syncing.Cryptocurrencies}
              icon={<FiRefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              4) Sync Cryptocurrencies
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleSync('Stocks')}
              loading={syncing.Stocks}
              icon={<FiRefreshCw className="h-4 w-4" />}
              className="w-full"
            >
              5) Sync Stocks
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Symbols</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_symbols || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiCloud className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Configured Pip/Lot</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {stats.configured_pip_lot ? parseFloat(stats.configured_pip_lot).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Overrides</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.overrides || 0}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiAlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Categories</p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {stats.categories?.slice(0, 6).join(', ') || 'None'}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiGrid className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters and Search */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.group}
            onChange={(e) => setFilters(prev => ({ ...prev, group: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="relative flex-1 w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => alert('Add symbol functionality coming soon')}
          >
            + Add Symbol
          </Button>
        </div>
      </AdminCard>

      {/* Debug Info Bar */}
      <AdminCard className="bg-blue-50 border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-blue-900">Debug Info:</span>
            <span className="text-blue-700">
              Total symbols loaded: {stats.total_symbols || 0} | Database connection: {dbConnection} |
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Symbol count:', stats.total_symbols);
                alert(`Total symbols: ${stats.total_symbols}`);
              }}
              className="text-xs"
            >
              Log Symbol Count
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Search test:', filters.search);
                alert(`Search: ${filters.search || '(empty)'}`);
              }}
              className="text-xs"
            >
              Test Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({
                  category: 'all',
                  group: 'all',
                  status: 'all',
                  search: ''
                });
              }}
              className="text-xs"
              icon={<FiX className="h-3 w-3" />}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </AdminCard>

      {/* Symbols Table */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Symbols ({pagination.total} total)
          </h2>
          <Button
            variant="outline"
            size="sm"
            icon={<FiInfo className="h-4 w-4" />}
          >
            Preview
          </Button>
        </div>
        <EnhancedDataTable
          data={symbols}
          columns={columns}
          searchable={false}
          filterable={false}
          exportable={true}
          pagination={true}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          currentPage={pagination.page}
          loading={loading}
          emptyMessage="No symbols found"
          onPageChange={(newPage) => {
            setPagination(prev => ({ ...prev, page: newPage }));
          }}
          onExport={(data) => {
            // Export all filtered data from server
            const exportData = symbols.length > 0 ? symbols : data;
            console.log('Exporting symbols:', exportData.length);
            // You can implement actual CSV export here
          }}
        />
      </AdminCard>

      {/* Edit Symbol Modal */}
      <SymbolModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSymbol(null);
        }}
        symbol={selectedSymbol}
        categories={categories}
        onSave={handleSave}
      />
    </div>
  );
};

export default SymbolsPipValues;
