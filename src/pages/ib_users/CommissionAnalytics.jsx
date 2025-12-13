import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDollarSign,
  FiCalendar,
  FiTrendingUp,
  FiUsers,
  FiDownload,
  FiRefreshCw,
  FiBarChart2
} from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'commission_analytics_cache';
const CACHE_TIMESTAMP_KEY = 'commission_analytics_cache_timestamp';

// Cache helpers
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
};

const setCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const CommissionAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Data state
  const [stats, setStats] = useState({
    totalCommission: 0,
    fixedCommission: 0,
    spreadCommission: 0,
    thisMonth: 0,
    avgDaily: 0,
    activeClients: 0,
    totalTrades: 0,
    totalVolume: 0,
    totalProfit: 0
  });

  const [topSymbols, setTopSymbols] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [reportData, setReportData] = useState({
    totalTrades: 0,
    totalVolume: 0,
    avgCommissionPerTrade: 0,
    totalProfit: 0,
    bestPerformingSymbol: null,
    mostActiveSymbol: null,
    commissionToProfitRatio: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch data from API
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clearCache();
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = getCachedData();
        if (cached) {
          setStats(cached.stats || {
            totalCommission: 0,
            fixedCommission: 0,
            spreadCommission: 0,
            thisMonth: 0,
            avgDaily: 0,
            activeClients: 0,
            totalTrades: 0,
            totalVolume: 0,
            totalProfit: 0
          });
          setTopSymbols(cached.topSymbols || []);
          setRecentLedger(cached.recentLedger || []);
          setMonthlyTrend(cached.monthlyTrend || []);
          setCategoryData(cached.categoryData || []);
          setReportData(cached.reportData || {
            totalTrades: 0,
            totalVolume: 0,
            avgCommissionPerTrade: 0,
            totalProfit: 0,
            bestPerformingSymbol: null,
            mostActiveSymbol: null,
            commissionToProfitRatio: 0
          });
          setPagination(cached.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 20,
            hasNextPage: false,
            hasPrevPage: false
          });
          setLoading(false);
        }
      }

      // Fetch from API
      const response = await fetch(
        `/api/user/commission-analytics?period=${timeFilter}&page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;

        // Update state
        setStats(data.stats || {
          totalCommission: 0,
          fixedCommission: 0,
          spreadCommission: 0,
          thisMonth: 0,
          avgDaily: 0,
          activeClients: 0,
          totalTrades: 0,
          totalVolume: 0,
          totalProfit: 0
        });
        setTopSymbols(data.topSymbols || []);
        setRecentLedger(data.recentLedger || []);
        setMonthlyTrend(data.monthlyTrend || []);
        setCategoryData(data.categoryData || []);
        setReportData(data.reportData || {
          totalTrades: 0,
          totalVolume: 0,
          avgCommissionPerTrade: 0,
          totalProfit: 0,
          bestPerformingSymbol: null,
          mostActiveSymbol: null,
          commissionToProfitRatio: 0
        });
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPrevPage: false
        });

        // Cache the data
        setCachedData({
          stats: data.stats,
          topSymbols: data.topSymbols,
          recentLedger: data.recentLedger,
          monthlyTrend: data.monthlyTrend,
          categoryData: data.categoryData,
          reportData: data.reportData,
          pagination: data.pagination
        });
      }
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter, currentPage, itemsPerPage]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual refresh
  const handleRefresh = () => {
    fetchData(true);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle time filter change
  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Export ledger to CSV
  const handleExport = () => {
    try {
      const headers = ['Date', 'Account ID', 'Symbol', 'Order Type', 'Volume (Lots)', 'Open Price', 'Close Price', 'Profit', 'Commission', 'Spread Commission', 'Total Commission'];
      const rows = recentLedger.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.accountId,
        item.symbol,
        item.orderType,
        item.volumeLots.toFixed(2),
        item.openPrice.toFixed(5),
        item.closePrice.toFixed(5),
        item.profit.toFixed(2),
        item.commission.toFixed(2),
        item.spreadCommission.toFixed(2),
        item.totalCommission.toFixed(2)
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return `$${Number(value).toFixed(2)}`;
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#c8f300', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and commission breakdowns from trade history</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="px-4 py-2 bg-brand-500 text-dark-base rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {refreshing || loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {refreshing ? 'Refreshing...' : 'Loading...'}
            </>
          ) : (
            <>
              <FiRefreshCw className="h-4 w-4" />
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Commission</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {formatCurrency(stats.totalCommission)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Fixed {formatCurrency(stats.fixedCommission)} • Spread {formatCurrency(stats.spreadCommission)}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
              <FiDollarSign className="h-7 w-7 text-blue-700" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">This Month</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {formatCurrency(stats.thisMonth)}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
              <FiCalendar className="h-7 w-7 text-green-700" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-700">Avg Daily</p>
              <p className="text-3xl font-bold text-brand-900 mt-2">
                {formatCurrency(stats.avgDaily)}
              </p>
            </div>
            <div className="w-14 h-14 bg-brand-200 rounded-full flex items-center justify-center">
              <FiTrendingUp className="h-7 w-7 text-brand-700" />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Active Clients</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                {stats.activeClients}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-200 rounded-full flex items-center justify-center">
              <FiUsers className="h-7 w-7 text-orange-700" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Top 7 Symbols Section */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top 7 Symbols</h2>
          <select
            value={timeFilter}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : topSymbols.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No symbol data available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSymbols.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg">{item.symbol}</h4>
                  <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">#{index + 1}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-bold text-green-600">{formatCurrency(item.commission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trades:</span>
                    <span className="font-medium text-gray-900">{item.trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium text-gray-900">{item.volume.toFixed(2)} lots</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit:</span>
                    <span className={`font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.profit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Recent Commission Ledger Section */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Commission Ledger</h2>
          <button
            onClick={handleExport}
            disabled={recentLedger.length === 0}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="h-4 w-4" />
            Export
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : recentLedger.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No commission ledger entries
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spread</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLedger.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.accountId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.symbol}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.orderType === 'buy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {item.orderType?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.volumeLots.toFixed(2)}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(item.commission)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {formatCurrency(item.spreadCommission)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                        {formatCurrency(item.totalCommission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total entries)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminCard>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Commission Trend */}
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Commission Trend</h2>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Live Data
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No trend data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Commission']}
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#c8f300"
                    strokeWidth={2}
                    dot={{ fill: '#c8f300', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </AdminCard>

        {/* Commission by Category */}
        <AdminCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission by Category</h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiBarChart2 className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-sm">Chart will appear when trading data is available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Commission']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </AdminCard>
      </div>

      {/* Comprehensive Report Section */}
      <AdminCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Trade Analysis Report</h2>
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            From Trade History
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Total Trades:</span>
                <span className="font-semibold text-blue-900">{reportData.totalTrades || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Total Volume:</span>
                <span className="font-semibold text-blue-900">{(reportData.totalVolume || 0).toFixed(2)} lots</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Avg Commission/Trade:</span>
                <span className="font-semibold text-blue-900">{formatCurrency(reportData.avgCommissionPerTrade || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Total Profit:</span>
                <span className={`font-semibold ${(reportData.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.totalProfit || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Best Performing Symbol */}
          {reportData.bestPerformingSymbol && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Top Performer</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-900">
                  {reportData.bestPerformingSymbol.symbol}
                </div>
                <div className="text-sm text-green-700">
                  Commission: {formatCurrency(reportData.bestPerformingSymbol.commission)}
                </div>
                <div className="text-sm text-green-700">
                  Trades: {reportData.bestPerformingSymbol.trades}
                </div>
                <div className="text-sm text-green-700">
                  Profit: {formatCurrency(reportData.bestPerformingSymbol.profit)}
                </div>
              </div>
            </div>
          )}

          {/* Most Active Symbol */}
          {reportData.mostActiveSymbol && (
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 p-6 rounded-lg border border-brand-200">
              <h3 className="text-lg font-semibold text-brand-900 mb-4">Most Active</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-brand-900">
                  {reportData.mostActiveSymbol.symbol}
                </div>
                <div className="text-sm text-brand-700">
                  Total Trades: {reportData.mostActiveSymbol.trades}
                </div>
                <div className="text-sm text-brand-700">
                  Category: {reportData.mostActiveSymbol.category || 'N/A'}
                </div>
                <div className="text-sm text-brand-700">
                  Commission: {formatCurrency(reportData.mostActiveSymbol.commission || 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
};

export default CommissionAnalytics;
