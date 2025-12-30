import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiUserCheck,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart,
  FiPieChart,
  FiDownload,
  FiRefreshCw,
  FiCreditCard,
  FiGift,
  FiCalendar,
  FiEye,
  FiX,
  FiMail,
  FiPhone,
  FiUser,
  FiHash
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminCard from '../../../components/admin/AdminCard';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';

const IBReports = () => {
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customDateRange, setCustomDateRange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [summary, setSummary] = useState(null);
  const [commissionTrends, setCommissionTrends] = useState([]);
  const [volumeTrends, setVolumeTrends] = useState([]);
  const [clientGrowth, setClientGrowth] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [rewardClaims, setRewardClaims] = useState([]);
  const [selectedIB, setSelectedIB] = useState(null);
  const [ibDetails, setIbDetails] = useState(null);
  const [ibClients, setIbClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch all report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (customDateRange && fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('period', period);
      }

      const [
        summaryRes,
        commissionRes,
        volumeRes,
        clientRes,
        withdrawalRes,
        performersRes,
        rewardsRes
      ] = await Promise.all([
        apiFetch(`/admin/ib-reports/summary?${params}`),
        apiFetch(`/admin/ib-reports/commission-trends?${params}&groupBy=day`),
        apiFetch(`/admin/ib-reports/trading-volume?${params}&groupBy=day`),
        apiFetch(`/admin/ib-reports/client-growth?${params}&groupBy=day`),
        apiFetch(`/admin/ib-reports/withdrawals?${params}&groupBy=day`),
        apiFetch(`/admin/ib-reports/top-performers?${params}&limit=20`),
        apiFetch(`/admin/ib-reports/reward-claims?${params}`)
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }

      if (commissionRes.ok) {
        const commissionData = await commissionRes.json();
        setCommissionTrends(commissionData.data?.trends || []);
      }

      if (volumeRes.ok) {
        const volumeData = await volumeRes.json();
        setVolumeTrends(volumeData.data?.trends || []);
      }

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClientGrowth(clientData.data?.growth || []);
      }

      if (withdrawalRes.ok) {
        const withdrawalData = await withdrawalRes.json();
        setWithdrawals(withdrawalData.data?.trends || []);
      }

      if (performersRes.ok) {
        const performersData = await performersRes.json();
        setTopPerformers(performersData.data?.performers || []);
      }

      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewardClaims(rewardsData.data?.stats || []);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set empty states on error to prevent crashes
      if (!summary) setSummary(null);
      if (commissionTrends.length === 0) setCommissionTrends([]);
      if (volumeTrends.length === 0) setVolumeTrends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period, fromDate, toDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const handleExport = async (type = 'summary') => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (customDateRange && fromDate && toDate) {
        params.append('fromDate', fromDate);
        params.append('toDate', toDate);
      } else {
        params.append('period', period);
      }
      params.append('type', type);

      const response = await apiFetch(`/admin/ib-reports/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ib-reports-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleViewDetails = async (ibId) => {
    if (!ibId) return;

    try {
      setLoadingDetails(true);
      setLoadingClients(true);
      setSelectedIB(ibId);
      const token = localStorage.getItem('adminToken');

      // Fetch IB profile details and clients in parallel
      const [profileResponse, clientsResponse] = await Promise.all([
        fetch(`/api/admin/ib-requests/profiles/${ibId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/ib-requests/profiles/${ibId}/referred-users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        if (data.success && data.data?.profile) {
          const profile = data.data.profile;
          setIbDetails({
            fullName: profile.fullName || profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            status: profile.status || '',
            ibType: profile.ibType || profile.ib_type || '',
            referralCode: profile.referralCode || profile.referral_code || '',
            commissionData: profile.commissionData || null,
            accountStats: profile.accountStats || null,
            usdPerLot: profile.usdPerLot || profile.usd_per_lot || 0,
            spreadPercentagePerLot: profile.spreadPercentagePerLot || profile.spread_percentage_per_lot || 0
          });
        }
      } else {
        console.error('Failed to fetch IB details');
        alert('Failed to load IB details. Please try again.');
      }

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        if (clientsData.success && clientsData.data?.users) {
          setIbClients(clientsData.data.users || []);
        }
      } else {
        console.error('Failed to fetch clients');
        setIbClients([]);
      }
    } catch (error) {
      console.error('Error fetching IB details:', error);
      alert('Error loading IB details. Please try again.');
    } finally {
      setLoadingDetails(false);
      setLoadingClients(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedIB(null);
    setIbDetails(null);
    setIbClients([]);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // KPI Cards
  const kpiCards = summary ? [
    <AdminCard key="total-ibs">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{formatNumber(summary.ibs?.total || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Total IBs</p>
        <p className="text-xs text-gray-500 mt-1">{summary.ibs?.active || 0} Active</p>
      </div>
    </AdminCard>,
    <AdminCard key="total-commission">
      <div className="text-center">
        <p className="text-3xl font-bold text-brand-600">{formatCurrency(summary.commission?.total || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Total Commission</p>
        <p className="text-xs text-gray-500 mt-1">
          Fixed: {formatCurrency(summary.commission?.fixed || 0)} | Spread: {formatCurrency(summary.commission?.spread || 0)}
        </p>
      </div>
    </AdminCard>,
    <AdminCard key="total-volume">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.volume?.totalUsd || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Total Volume</p>
        <p className="text-xs text-gray-500 mt-1">{formatNumber(summary.volume?.totalLots || 0)} Lots</p>
      </div>
    </AdminCard>,
    <AdminCard key="total-clients">
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-600">{formatNumber(summary.clients?.total || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Total Clients</p>
        <p className="text-xs text-gray-500 mt-1">
          {summary.clients?.newInPeriod || 0} New | {summary.clients?.ibsWithClients || 0} IBs
        </p>
      </div>
    </AdminCard>,
    <AdminCard key="withdrawals">
      <div className="text-center">
        <p className="text-3xl font-bold text-orange-600">{formatCurrency(summary.withdrawals?.pending || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Pending Withdrawals</p>
        <p className="text-xs text-gray-500 mt-1">{summary.withdrawals?.pendingCount || 0} Requests</p>
      </div>
    </AdminCard>,
    <AdminCard key="rewards">
      <div className="text-center">
        <p className="text-3xl font-bold text-pink-600">{formatNumber(summary.rewards?.total || 0)}</p>
        <p className="text-sm text-gray-600 mt-1">Reward Claims</p>
        <p className="text-xs text-gray-500 mt-1">{summary.rewards?.pending || 0} Pending</p>
      </div>
    </AdminCard>
  ] : [];

  // Chart colors
  const COLORS = ['#c8f300', '#16A34A', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

  // Status distribution data for pie chart
  const statusData = summary ? [
    { name: 'Approved', value: summary.ibs?.active || 0, color: '#16A34A' },
    { name: 'Pending', value: summary.ibs?.pending || 0, color: '#F59E0B' },
    { name: 'Rejected', value: summary.ibs?.rejected || 0, color: '#EF4444' },
    { name: 'Banned', value: summary.ibs?.banned || 0, color: '#6B7280' }
  ].filter(item => item.value > 0) : [];

  // Reward claims data for pie chart
  const rewardClaimsData = rewardClaims.map((item, index) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IB Reports</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive analytics and insights for IB performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleExport('summary')}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Time Period Filter */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['today', '7d', '30d', '90d', 'month', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setCustomDateRange(false);
                  setFromDate('');
                  setToDate('');
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p && !customDateRange
                  ? 'bg-brand-500 text-dark-base'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : p === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
            <button
              onClick={() => setCustomDateRange(!customDateRange)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${customDateRange
                ? 'bg-brand-500 text-dark-base'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Custom Range
            </button>
          </div>
          {customDateRange && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </AdminCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <AdminCard key={i}>
              <div className="text-center">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            </AdminCard>
          ))
        ) : (
          kpiCards
        )}
      </div>

      {/* Data Tables */}
      <div className="space-y-6">
        {/* Top Performers Table */}
        <AdminCard
          header="Top Performers"
          icon={<FiTrendingUp className="h-5 w-5" />}
          className="overflow-hidden"
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleExport('top-performers')}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FiDownload className="h-4 w-4" />
              Export
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No top performers data available for the selected period</p>
            </div>
          ) : (
            <ProTable
              rows={topPerformers.map(p => ({
                ibId: p.ibId,
                ibName: p.ibName,
                ibEmail: p.ibEmail,
                ibStatus: p.ibStatus,
                totalCommission: p.totalCommission,
                fixedCommission: p.fixedCommission,
                spreadCommission: p.spreadCommission,
                totalVolumeLots: p.totalVolumeLots,
                totalVolumeUsd: p.totalVolumeUsd,
                totalClients: p.totalClients,
                totalTrades: p.totalTrades
              }))}
              columns={[
                { key: 'ibName', label: 'IB Name', sortable: true },
                { key: 'ibEmail', label: 'Email', sortable: true },
                {
                  key: 'ibStatus', label: 'Status', sortable: true, render: (v) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'approved' ? 'bg-green-100 text-green-800' :
                      v === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {v ? v.charAt(0).toUpperCase() + v.slice(1) : '-'}
                    </span>
                  )
                },
                { key: 'totalCommission', label: 'Total Commission', sortable: true, render: (v) => formatCurrency(v) },
                { key: 'totalVolumeUsd', label: 'Total Volume', sortable: true, render: (v) => formatCurrency(v) },
                { key: 'totalClients', label: 'Clients', sortable: true },
                { key: 'totalTrades', label: 'Trades', sortable: true },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  render: (v, row) => (
                    <button
                      onClick={() => handleViewDetails(row.ibId)}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FiEye className="h-4 w-4" />
                      View
                    </button>
                  )
                }
              ]}
              filters={{
                searchKeys: ['ibName', 'ibEmail'],
                selects: [
                  {
                    key: 'ibStatus',
                    label: 'Status',
                    options: [
                      { value: 'approved', label: 'Approved' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'rejected', label: 'Rejected' }
                    ]
                  }
                ]
              }}
              pageSize={10}
              searchPlaceholder="Search by IB name or email..."
              loading={false}
            />
          )}
        </AdminCard>

        {/* Commission Breakdown Table */}
        <AdminCard
          header="Commission Breakdown"
          icon={<FiDollarSign className="h-5 w-5" />}
          className="overflow-hidden"
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleExport('commission')}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FiDownload className="h-4 w-4" />
              Export
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No commission data available for the selected period</p>
            </div>
          ) : (
            <ProTable
              rows={topPerformers.map(p => ({
                ibId: p.ibId,
                ibName: p.ibName,
                ibEmail: p.ibEmail,
                totalCommission: p.totalCommission,
                fixedCommission: p.fixedCommission,
                spreadCommission: p.spreadCommission
              }))}
              columns={[
                { key: 'ibName', label: 'IB Name', sortable: true },
                { key: 'ibEmail', label: 'Email', sortable: true },
                { key: 'totalCommission', label: 'Total Commission', sortable: true, render: (v) => formatCurrency(v) },
                { key: 'fixedCommission', label: 'Fixed Commission', sortable: true, render: (v) => formatCurrency(v) },
                { key: 'spreadCommission', label: 'Spread Commission', sortable: true, render: (v) => formatCurrency(v) },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  render: (v, row) => (
                    <button
                      onClick={() => handleViewDetails(row.ibId)}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <FiEye className="h-4 w-4" />
                      View
                    </button>
                  )
                }
              ]}
              filters={{
                searchKeys: ['ibName', 'ibEmail']
              }}
              pageSize={10}
              searchPlaceholder="Search by IB name or email..."
              loading={false}
            />
          )}
        </AdminCard>
      </div>

      {/* Charts Row 1: Commission Trends & Trading Volume */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Commission Trends */}
        <AdminCard header="Commission Trends" icon={<FiBarChart className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : commissionTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={commissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#c8f300" strokeWidth={2} name="Total Commission" />
                <Line type="monotone" dataKey="fixed" stroke="#16A34A" strokeWidth={2} name="Fixed Commission" />
                <Line type="monotone" dataKey="spread" stroke="#F59E0B" strokeWidth={2} name="Spread Commission" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No commission data available for the selected period
            </div>
          )}
        </AdminCard>

        {/* Trading Volume */}
        <AdminCard header="Trading Volume Trends" icon={<FiTrendingUp className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : volumeTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={volumeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="volumeUsd" stroke="#16A34A" fill="#16A34A" fillOpacity={0.6} name="Volume (USD)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No volume data available for the selected period
            </div>
          )}
        </AdminCard>
      </div>

      {/* Charts Row 2: Status Distribution & Client Growth */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* IB Status Distribution */}
        <AdminCard header="IB Status Distribution" icon={<FiPieChart className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No status data available
            </div>
          )}
        </AdminCard>

        {/* Client Growth */}
        <AdminCard header="Client Growth" icon={<FiUsers className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : clientGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newClients" fill="#3B82F6" name="New Clients" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No client growth data available for the selected period
            </div>
          )}
        </AdminCard>
      </div>

      {/* Charts Row 3: Withdrawals & Reward Claims */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Withdrawal Analysis */}
        <AdminCard header="Withdrawal Analysis" icon={<FiCreditCard className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : withdrawals.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={withdrawals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                <Bar dataKey="paid" stackId="a" fill="#16A34A" name="Paid" />
                <Bar dataKey="completed" stackId="a" fill="#3B82F6" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No withdrawal data available for the selected period
            </div>
          )}
        </AdminCard>

        {/* Reward Claims */}
        <AdminCard header="Reward Claims Status" icon={<FiGift className="h-5 w-5" />}>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : rewardClaimsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={rewardClaimsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rewardClaimsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No reward claims data available for the selected period
            </div>
          )}
        </AdminCard>
      </div>

      {/* Top Performers Chart */}
      <AdminCard header="Top Performers by Commission" icon={<FiTrendingUp className="h-5 w-5" />}>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : topPerformers.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topPerformers.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="ibName" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="totalCommission" fill="#c8f300" name="Total Commission" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No top performers data available for the selected period
          </div>
        )}
      </AdminCard>

      {/* IB Details Modal */}
      {selectedIB && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">IB Profile Details</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              ) : ibDetails ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <AdminCard>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <FiUser className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium text-gray-900">{ibDetails.fullName || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMail className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{ibDetails.email || '-'}</p>
                        </div>
                      </div>
                      {ibDetails.phone && (
                        <div className="flex items-center gap-3">
                          <FiPhone className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">{ibDetails.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <FiUserCheck className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ibDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ibDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {ibDetails.status ? ibDetails.status.charAt(0).toUpperCase() + ibDetails.status.slice(1) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiBarChart className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">IB Type</p>
                          <p className="font-medium text-gray-900">{ibDetails.ibType || '-'}</p>
                        </div>
                      </div>
                      {ibDetails.referralCode && (
                        <div className="flex items-center gap-3">
                          <FiHash className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm text-gray-600">Referral Code</p>
                            <p className="font-medium text-gray-900">{ibDetails.referralCode}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AdminCard>

                  {/* Commission Data */}
                  {ibDetails.commissionData && (
                    <AdminCard>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Commission</p>
                          <p className="text-2xl font-bold text-brand-600">{formatCurrency(ibDetails.commissionData.totalCommission || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fixed Commission</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(ibDetails.commissionData.fixedCommission || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Spread Commission</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(ibDetails.commissionData.spreadCommission || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Trades</p>
                          <p className="text-xl font-semibold text-gray-900">{formatNumber(ibDetails.commissionData.totalTrades || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Lots</p>
                          <p className="text-xl font-semibold text-gray-900">{formatNumber(ibDetails.commissionData.totalLots || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="text-sm font-medium text-gray-700">
                            {ibDetails.commissionData.lastUpdated ? new Date(ibDetails.commissionData.lastUpdated).toLocaleString() : '-'}
                          </p>
                        </div>
                      </div>
                    </AdminCard>
                  )}

                  {/* Account Stats */}
                  {ibDetails.accountStats && (
                    <AdminCard>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Accounts</p>
                          <p className="text-xl font-semibold text-gray-900">{formatNumber(ibDetails.accountStats.totalAccounts || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Balance</p>
                          <p className="text-xl font-semibold text-gray-900">{formatCurrency(ibDetails.accountStats.totalBalance || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Equity</p>
                          <p className="text-xl font-semibold text-gray-900">{formatCurrency(ibDetails.accountStats.totalEquity || 0)}</p>
                        </div>
                      </div>
                    </AdminCard>
                  )}

                  {/* Commission Structure */}
                  {ibDetails.usdPerLot > 0 && (
                    <AdminCard>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Structure</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">USD per Lot</p>
                          <p className="text-lg font-semibold text-gray-900">${(ibDetails.usdPerLot || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Spread Percentage per Lot</p>
                          <p className="text-lg font-semibold text-gray-900">{(ibDetails.spreadPercentagePerLot || 0).toFixed(2)}%</p>
                        </div>
                      </div>
                    </AdminCard>
                  )}

                  {/* Client List */}
                  <AdminCard>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client List ({ibClients.length})</h3>
                    {loadingClients ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
                      </div>
                    ) : ibClients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (Lots)</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ibClients.map((client, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{client.email || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{client.name || client.full_name || '-'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  <span className={`px-2 py-1 text-xs rounded-full ${client.source === 'ib_request' ? 'bg-blue-100 text-blue-800' :
                                    client.source === 'ib_referrals' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {client.source === 'ib_request' ? 'IB Request' :
                                      client.source === 'ib_referrals' ? 'Referral' :
                                        client.source || 'Unknown'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {client.join_date ? new Date(client.join_date).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatNumber(client.volume_lots || 0)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(client.commission || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No clients found for this IB.</p>
                      </div>
                    )}
                  </AdminCard>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No details available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IBReports;

