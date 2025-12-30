import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw, FiList, FiDatabase, FiTrendingUp } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';

const AllSymbols = () => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    step: '',
    progress: 0,
    current: 0,
    total: 0,
    synced: 0,
    failed: 0
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [stats, setStats] = useState({
    total_symbols: 0,
    active_symbols: 0,
    total_groups: 0,
    total_types: 0
  });

  // Fetch all symbols data (ProTable handles pagination client-side)
  const fetchSymbols = async () => {
    try {
      setLoading(true);
      // Fetch all symbols - ProTable will handle pagination
      const response = await apiFetch('/admin/symbols?page=1&limit=10000');

      if (response.ok) {
        const data = await response.json();
        setSymbols(data.data.symbols || []);
      } else {
        console.error('Failed to fetch symbols');
        setSymbols([]);
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
      setSymbols([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch symbols statistics
  const fetchStats = async () => {
    try {
      const response = await apiFetch('/admin/symbols/stats');

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching symbols stats:', error);
    }
  };

  // Sync symbols from external API with progress tracking
  const handleSync = async () => {
    try {
      setSyncing(true);
      setShowProgressModal(true);
      setSyncProgress({
        step: 'Starting sync...',
        progress: 0,
        current: 0,
        total: 0,
        synced: 0,
        failed: 0
      });

      // Get API base URL using the helper function
      const { getApiBaseUrl } = await import('../../../utils/api');
      const baseUrl = getApiBaseUrl();
      
      const token = localStorage.getItem('adminToken');
      
      // Use fetch with streaming for Server-Sent Events (SSE)
      const response = await fetch(`${baseUrl}/admin/symbols/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Stream ended - check if we have any remaining data
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.step === 'completed' && data.result) {
                      setSyncProgress({
                        step: data.result.message || 'Sync completed!',
                        progress: 100,
                        current: data.result.total || 0,
                        total: data.result.total || 0,
                        synced: data.result.synced || 0,
                        failed: data.result.failed || 0
                      });
                      setTimeout(async () => {
                        setShowProgressModal(false);
                        setSyncing(false);
                        await fetchSymbols();
                        await fetchStats();
                      }, 1500);
                    }
                  } catch (parseError) {
                    console.error('Error parsing final progress data:', parseError);
                  }
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.step === 'completed' && data.result) {
                  setSyncProgress({
                    step: data.result.message || 'Sync completed!',
                    progress: 100,
                    current: data.result.total || 0,
                    total: data.result.total || 0,
                    synced: data.result.synced || 0,
                    failed: data.result.failed || 0
                  });
                  
                  // Wait a moment to show completion, then refresh
                  setTimeout(async () => {
                    setShowProgressModal(false);
                    setSyncing(false);
                    await fetchSymbols();
                    await fetchStats();
                  }, 1500);
                  reader.cancel();
                  return;
                } else if (data.step === 'error') {
                  setSyncProgress(prev => ({
                    ...prev,
                    step: `Error: ${data.error || 'Unknown error'}`,
                    progress: 0
                  }));
                  setTimeout(() => {
                    setShowProgressModal(false);
                    setSyncing(false);
                  }, 3000);
                  reader.cancel();
                  return;
                } else {
                  // Update progress
                  setSyncProgress({
                    step: data.step || 'Processing...',
                    progress: data.progress || 0,
                    current: data.current || 0,
                    total: data.total || 0,
                    synced: data.synced || 0,
                    failed: data.failed || 0
                  });
                }
              } catch (parseError) {
                console.error('Error parsing progress data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error syncing symbols:', error);
      setSyncProgress(prev => ({
        ...prev,
        step: `Error: ${error.message}`,
        progress: 0
      }));
      setTimeout(() => {
        setShowProgressModal(false);
        setSyncing(false);
      }, 3000);
    }
  };

  useEffect(() => {
    fetchSymbols();
    fetchStats();
  }, []);

  const columns = useMemo(() => [
    {
      key: 'symbol_name',
      label: 'Symbol',
      render: (val) => <div className="font-medium text-gray-900">{val}</div>
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <div className="text-gray-600">{val || '-'}</div>
    },
    {
      key: 'symbol_type',
      label: 'Type',
      render: (val) => <span className="capitalize">{val || 'forex'}</span>
    },
    {
      key: 'group_name',
      label: 'Group',
      render: (val) => <div className="text-gray-600">{val || '-'}</div>
    },
    {
      key: 'digits',
      label: 'Digits',
      render: (val) => <div className="text-center">{val || 5}</div>
    },
    {
      key: 'spread',
      label: 'Spread',
      render: (val) => <div className="text-center">{val || 0}</div>
    },
    {
      key: 'contract_size',
      label: 'Contract Size',
      render: (val) => <div className="text-right">{val?.toLocaleString() || '100,000'}</div>
    },
    {
      key: 'swap_long',
      label: 'Swap Long',
      render: (val) => <div className="text-right">{val || 0}</div>
    },
    {
      key: 'swap_short',
      label: 'Swap Short',
      render: (val) => <div className="text-right">{val || 0}</div>
    },
    {
      key: 'enable',
      label: 'Status',
      render: (val, row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.enable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.enable ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], []);

  // Convert stats to KPIs format for ProTable (array of React elements)
  const kpis = useMemo(() => [
    <AdminCard key="total-symbols">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Symbols</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total_symbols}</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
          <FiList className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
      </div>
    </AdminCard>,
    <AdminCard key="active-symbols">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Symbols</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.active_symbols}</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
          <FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
        </div>
      </div>
    </AdminCard>,
    <AdminCard key="total-groups">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Groups</p>
          <p className="text-xl sm:text-2xl font-bold text-brand-600 mt-0.5 sm:mt-1">{stats.total_groups}</p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
          <FiDatabase className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600" />
        </div>
      </div>
    </AdminCard>,
    <AdminCard key="symbol-types">
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
  ], [stats]);

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

      {/* Symbols Table with ProTable */}
      <AdminCard>
        <ProTable
          title="All Symbols"
          kpis={kpis}
          rows={symbols}
          columns={columns}
          loading={loading}
          pageSize={100}
          searchPlaceholder="Search symbols..."
          filters={{
            searchKeys: ['symbol_name', 'description', 'symbol_type', 'group_name']
          }}
        />
      </AdminCard>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Syncing Symbols</h3>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{syncProgress.step}</span>
                <span className="text-sm font-medium text-gray-700">{syncProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${syncProgress.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Progress Details */}
            {syncProgress.total > 0 && (
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className="font-medium">
                    {syncProgress.current} / {syncProgress.total} symbols
                  </span>
                </div>
                {syncProgress.synced > 0 && (
                  <div className="flex justify-between">
                    <span>Successfully saved:</span>
                    <span className="font-medium text-green-600">{syncProgress.synced}</span>
                  </div>
                )}
                {syncProgress.failed > 0 && (
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">{syncProgress.failed}</span>
                  </div>
                )}
              </div>
            )}

            {/* Close button (only show if error or completed) */}
            {(syncProgress.progress === 100 || syncProgress.step.includes('Error')) && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => {
                    setShowProgressModal(false);
                    setSyncing(false);
                    if (syncProgress.progress === 100) {
                      fetchSymbols();
                      fetchStats();
                    }
                  }}
                  variant="primary"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSymbols;