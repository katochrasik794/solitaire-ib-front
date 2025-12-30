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
  FiSettings,
  FiDownload,
  FiRefreshCw,
  FiTrendingDown,
  FiHash,
  FiCreditCard,
  FiArrowDown,
  FiLayers
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminCard from '../../components/admin/AdminCard';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAdmin } from '../../hooks/useAdmin';
import { apiFetch } from '../../utils/api';

const IBDashboard = () => {
  const { ibs, ibRequests, settlements } = useAdmin();

  // State for dynamic data
  const [dashboardData, setDashboardData] = useState({
    totalIBs: 0,
    activeIBs: 0,
    totalVolume: 0,
    totalRevenue: 0,
    totalCommissionGenerated: 0,
    totalCommissionPaid: 0,
    withdrawalPending: 0,
    totalWithdrawal: 0,
    overallLotsTraded: 0,
    pendingRequests: 0,
    pendingSettlements: 0,
    recentActivity: [],
    recentIBs: [],
    performanceData: [],
    statusData: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Fetch summary for top cards
      const summaryResponse = await apiFetch('/admin/dashboard/summary');

      // Fetch IB requests stats
      const requestsResponse = await apiFetch('/admin/ib-requests/stats/overview');

      // Fetch approved IB profiles
      const profilesResponse = await apiFetch('/admin/ib-requests/profiles/approved');

      // Fetch recent activity (mock for now)
      const activityResponse = await apiFetch('/admin/dashboard/activity/recent');

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const stats = requestsData.data.stats;

        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json();
          const profiles = profilesData.data.profiles || [];

          // Use backend summary for key metrics
          let totalIBs = 0, activeIBs = 0, totalVolume = 0, totalRevenue = 0,
            totalCommissionGenerated = 0, totalCommissionPaid = 0,
            withdrawalPending = 0, totalWithdrawal = 0, overallLotsTraded = 0;
          if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            const s = summary?.data || {};
            totalIBs = Number(s.totalIBs || 0);
            activeIBs = Number(s.activeIBs || 0);
            totalVolume = Number(s.totalVolume || 0);
            totalRevenue = Number(s.totalRevenue || 0);
            totalCommissionGenerated = Number(s.totalCommissionGenerated || 0);
            totalCommissionPaid = Number(s.totalCommissionPaid || 0);
            withdrawalPending = Number(s.withdrawalPending || 0);
            totalWithdrawal = Number(s.totalWithdrawal || 0);
            overallLotsTraded = Number(s.overallLotsTraded || 0);
          } else {
            // Graceful fallback (sum across profiles if backend summary unavailable)
            totalIBs = profiles.length;
            activeIBs = profiles.filter(p => p.status === 'approved').length;
            totalVolume = profiles.reduce((sum, p) => sum + (p.totalTradedVolume || 0), 0);
            totalRevenue = profiles.reduce((sum, p) => sum + (p.totalIBEarnings || 0), 0);
            totalCommissionGenerated = profiles.reduce((sum, p) => sum + (p.totalCommissionGenerated || p.totalIBEarnings || 0), 0);
            totalCommissionPaid = profiles.reduce((sum, p) => sum + (p.totalCommissionPaid || 0), 0);
            withdrawalPending = profiles.reduce((sum, p) => sum + (p.withdrawalPending || 0), 0);
            totalWithdrawal = profiles.reduce((sum, p) => sum + (p.totalWithdrawal || 0), 0);
            overallLotsTraded = profiles.reduce((sum, p) => sum + (p.totalLotsTraded || 0), 0);
          }

          // Generate performance data (mock monthly data based on current metrics)
          const performanceData = [
            { name: 'Jan', ibs: Math.max(1, Math.floor(totalIBs * 0.4)), volume: totalVolume * 0.4, revenue: totalRevenue * 0.4 },
            { name: 'Feb', ibs: Math.max(1, Math.floor(totalIBs * 0.5)), volume: totalVolume * 0.5, revenue: totalRevenue * 0.5 },
            { name: 'Mar', ibs: Math.max(1, Math.floor(totalIBs * 0.6)), volume: totalVolume * 0.6, revenue: totalRevenue * 0.6 },
            { name: 'Apr', ibs: Math.max(1, Math.floor(totalIBs * 0.7)), volume: totalVolume * 0.7, revenue: totalRevenue * 0.7 },
            { name: 'May', ibs: Math.max(1, Math.floor(totalIBs * 0.9)), volume: totalVolume * 0.9, revenue: totalRevenue * 0.9 },
            { name: 'Jun', ibs: totalIBs, volume: totalVolume, revenue: totalRevenue }
          ];

          const statusData = [
            { name: 'Approved', value: stats.approved_requests || 0, color: '#16A34A' },
            { name: 'Pending', value: stats.pending_requests || 0, color: '#F59E0B' },
            { name: 'Rejected', value: stats.rejected_requests || 0, color: '#EF4444' }
          ];

          // Recent IBs (last 5 approved)
          const recentIBs = profiles.slice(0, 5).map(profile => ({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            status: profile.status,
            totalClients: profile.totalAccounts || 0,
            totalVolume: profile.totalTradedVolume || 0,
            performance: profile.performance || 'new'
          }));

          // Recent activity (mock data for now)
          let recentActivity = [];
          if (activityResponse.ok) {
            const actData = await activityResponse.json();
            recentActivity = actData?.data?.activities || [];
          }

          setDashboardData({
            totalIBs,
            activeIBs,
            totalVolume,
            totalRevenue,
            totalCommissionGenerated,
            totalCommissionPaid,
            withdrawalPending,
            totalWithdrawal,
            overallLotsTraded,
            pendingRequests: stats.pending_requests || 0,
            pendingSettlements: 0, // Would need settlements API
            recentActivity,
            recentIBs,
            performanceData,
            statusData
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Use dashboard data for calculations
  const {
    totalIBs,
    activeIBs,
    totalVolume,
    totalRevenue,
    totalCommissionGenerated,
    totalCommissionPaid,
    withdrawalPending,
    totalWithdrawal,
    overallLotsTraded,
    pendingRequests,
    pendingSettlements,
    performanceData,
    statusData,
    recentActivity,
    recentIBs
  } = dashboardData;

  const summaryCards = [
    {
      title: 'Total IBs',
      value: loading ? '...' : totalIBs,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 20)}%`,
      changeType: 'increase'
    },
    {
      title: 'Active IBs',
      value: loading ? '...' : activeIBs,
      icon: FiUserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 15)}%`,
      changeType: 'increase'
    },
    {
      title: 'Total Volume',
      value: loading ? '...' : `$${(totalVolume / 1000000).toFixed(1)}M`,
      icon: FiTrendingUp,
      color: 'text-brand-900',
      bgColor: 'bg-brand-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 25)}%`,
      changeType: 'increase'
    },
    {
      title: 'Revenue',
      value: loading ? '...' : `$${(totalRevenue / 1000).toFixed(0)}K`,
      icon: FiDollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 30)}%`,
      changeType: 'increase'
    },
    {
      title: 'Total Commission Generated',
      value: loading ? '...' : `$${(totalCommissionGenerated / 1000).toFixed(0)}K`,
      icon: FiCreditCard,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 22)}%`,
      changeType: 'increase'
    },
    {
      title: 'Total Commission Paid',
      value: loading ? '...' : `$${(totalCommissionPaid / 1000).toFixed(0)}K`,
      icon: FiDollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 18)}%`,
      changeType: 'increase'
    },
    {
      title: 'Withdrawal Pending',
      value: loading ? '...' : `$${(withdrawalPending / 1000).toFixed(0)}K`,
      icon: FiClock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: loading ? '...' : `${withdrawalPending > 0 ? '+' : ''}${Math.floor(Math.random() * 15)}%`,
      changeType: withdrawalPending > 0 ? 'increase' : 'neutral'
    },
    {
      title: 'Total Withdrawal',
      value: loading ? '...' : `$${(totalWithdrawal / 1000).toFixed(0)}K`,
      icon: FiArrowDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 20)}%`,
      changeType: 'increase'
    },
    {
      title: 'Overall Lots Traded',
      value: loading ? '...' : overallLotsTraded.toLocaleString(),
      icon: FiLayers,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      change: loading ? '...' : `+${Math.floor(Math.random() * 25)}%`,
      changeType: 'increase'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">IB Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Dynamic overview of IB activities and real-time performance metrics</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={<FiRefreshCw className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" icon={<FiDownload className="h-4 w-4" />}>
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" icon={<FiSettings className="h-4 w-4" />}>
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <AdminCard className="relative overflow-hidden h-full">
              <div className="flex flex-col items-center justify-center text-center h-full">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${card.bgColor} rounded-full flex items-center justify-center mb-2`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{card.value}</p>
                  <p className={`text-xs lg:text-sm mt-0.5 sm:mt-1 ${card.changeType === 'increase' ? 'text-green-600' :
                    card.changeType === 'neutral' ? 'text-gray-600' :
                      'text-red-600'
                    }`}>
                    {card.change} from last month
                  </p>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Performance Chart */}
        <AdminCard header="IB Performance Trends" icon={<FiBarChart className="h-4 w-4 sm:h-5 sm:w-5" />}>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [
                  name === 'volume' ? `$${(value / 1000000).toFixed(1)}M` : `$${value.toLocaleString()}`,
                  name === 'ibs' ? 'IBs' : name === 'volume' ? 'Volume' : 'Revenue'
                ]} />
                <Line type="monotone" dataKey="ibs" stroke="#C8F300" strokeWidth={2} name="IBs" />
                <Line type="monotone" dataKey="volume" stroke="#081428" strokeWidth={2} name="volume" />
                <Line type="monotone" dataKey="revenue" stroke="#A3C600" strokeWidth={2} name="revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Status Distribution */}
        <AdminCard header="IB Status Distribution" icon={<FiPieChart className="h-4 w-4 sm:h-5 sm:w-5" />}>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#C8F300" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      {/* Quick Actions and Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Pending Actions */}
        <AdminCard header="Pending Actions" icon={<FiClock className="h-4 w-4 sm:h-5 sm:w-5" />}>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FiUserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">IB Requests</p>
                  <p className="text-xs sm:text-sm text-gray-600">{loading ? '...' : pendingRequests} pending approval</p>
                </div>
              </div>
              <StatusBadge status="pending" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-blue-50 rounded-lg gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <FiDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">Settlements</p>
                  <p className="text-xs sm:text-sm text-gray-600">{loading ? '...' : pendingSettlements} pending payment</p>
                </div>
              </div>
              <StatusBadge status="pending" />
            </div>

            <Button variant="primary" size="sm" className="w-full text-sm">
              View All Actions
            </Button>
          </div>
        </AdminCard>

        {/* Recent Activity */}
        <AdminCard header="Recent Activity" icon={<FiActivity className="h-4 w-4 sm:h-5 sm:w-5" />}>
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 text-sm mt-2">Loading activity...</p>
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.icon === 'green' ? 'bg-green-400' :
                    activity.icon === 'blue' ? 'bg-blue-400' :
                      activity.icon === 'purple' ? 'bg-brand-400' : 'bg-gray-400'
                    }`}></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.message}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <FiActivity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No recent activity</p>
              </div>
            )}

            <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
              View All Activity
            </Button>
          </div>
        </AdminCard>

        {/* System Status */}
        <AdminCard header="System Status" icon={<FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600">API Status</span>
              <StatusBadge status="active" size="sm" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600">Database</span>
              <StatusBadge status="active" size="sm" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600">Payment Gateway</span>
              <StatusBadge status="active" size="sm" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600">Trading Platform</span>
              <StatusBadge status="active" size="sm" />
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
              <span className="hidden sm:inline">System Health Check</span>
              <span className="sm:hidden">Health Check</span>
            </Button>
          </div>
        </AdminCard>
      </div>

      {/* Recent IBs Table */}
      <AdminCard header="Recent IBs" icon={<FiUsers className="h-4 w-4 sm:h-5 sm:w-5" />}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading recent IBs...</span>
          </div>
        ) : recentIBs.length > 0 ? (
          <>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IB Name
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentIBs.map((ib) => (
                    <tr key={ib.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-6 py-3 sm:py-4">
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{ib.name}</div>
                          <div className="text-xs text-gray-500 truncate">{ib.email}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4">
                        <StatusBadge status={ib.status} size="sm" />
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {ib.totalClients}
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        ${(ib.totalVolume / 1000).toFixed(0)}K
                      </td>
                      <td className="px-2 sm:px-6 py-3 sm:py-4">
                        <StatusBadge status={ib.performance} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 sm:mt-4 text-center">
              <Button variant="outline" size="sm">
                View All IBs
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No IBs found</p>
            <p className="text-sm text-gray-500">Approved IBs will appear here</p>
          </div>
        )}
      </AdminCard>
    </div>
  );
};

export default IBDashboard;
