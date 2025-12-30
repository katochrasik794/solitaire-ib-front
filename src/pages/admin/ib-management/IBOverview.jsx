import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiEye,
  FiUsers,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiLayers,
  FiActivity
} from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';

const IBOverview = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pending_requests: 0,
    approved_requests: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiFetch('/admin/ib-requests/profiles/approved');

        if (!response.ok) {
          throw new Error('Failed to load IB data');
        }

        const data = await response.json();
        if (isMounted) {
          setProfiles(data.data?.profiles ?? []);
        }
      } catch (err) {
        console.error('Error fetching IB overview:', err);
        if (isMounted) {
          setProfiles([]);
          setError(err.message || 'Unable to load IB data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchStats = async () => {
      try {
        const response = await apiFetch('/admin/ib-requests/stats/overview');

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setStats(data.data?.stats || { pending_requests: 0, approved_requests: 0 });
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchProfiles();
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);


  const handleViewIB = (ib) => {
    navigate(`/admin/ib-management/profiles/${ib.id}`);
  };

  const handleAddIB = () => {
    navigate('/admin/ib-management/requests');
  };

  const formatCurrency = (value, { compact = false } = {}) => {
    const amount = Number(value) || 0;
    if (compact) {
      return amount === 0 ? '0' : `${(amount / 1_000_000).toFixed(1)}M`;
    }
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totals = useMemo(() => {
    const totalIBs = profiles.length;
    const approvedIBs = profiles.filter((ib) => (ib.status || '').toLowerCase() === 'approved').length;
    const pendingIBs = profiles.filter((ib) => (ib.status || '').toLowerCase() === 'pending').length;
    const totalClients = profiles.reduce((sum, ib) => sum + (Number(ib.totalClients) || 0), 0);
    const totalVolume = profiles.reduce((sum, ib) => sum + (Number(ib.totalVolume) || 0), 0);
    const totalCommissions = profiles.reduce((sum, ib) => sum + (Number(ib.totalIBEarnings) || Number(ib.totalCommissionGenerated) || 0), 0);
    const totalLots = profiles.reduce((sum, ib) => sum + (Number(ib.totalLotsTraded) || 0), 0);
    const totalTrades = profiles.reduce((sum, ib) => sum + (Number(ib.totalTrades) || 0), 0);
    const totalReferrals = totalClients; // Referrals are typically the clients/referrals

    // Calculate volume in lots (approximate: 1 lot = $100,000 for standard lot)
    const totalVolumeLots = totalLots > 0 ? totalLots : Number((totalVolume / 100000).toFixed(1));

    // System Summary calculations
    const approvalRate = totalIBs > 0 ? ((approvedIBs / totalIBs) * 100).toFixed(1) : '0.0';
    const avgVolumePerTrade = totalTrades > 0 ? (totalVolumeLots / totalTrades).toFixed(2) : '0.00';
    const avgCommissionPerLot = totalLots > 0 ? (totalCommissions / totalLots).toFixed(2) : '0.00';
    const commissionPerTrade = totalTrades > 0 ? (totalCommissions / totalTrades).toFixed(2) : '0.00';
    const volumePerIB = approvedIBs > 0 ? (totalVolumeLots / approvedIBs).toFixed(2) : '0.00';
    const commissionPerIB = approvedIBs > 0 ? (totalCommissions / approvedIBs).toFixed(2) : '0.00';
    const referralsPerIB = approvedIBs > 0 ? (totalReferrals / approvedIBs).toFixed(1) : '0.0';

    return {
      totalIBs,
      approvedIBs,
      pendingIBs,
      totalClients,
      totalVolume,
      totalCommissions,
      totalLots,
      totalVolumeLots,
      totalTrades,
      totalReferrals,
      approvalRate,
      avgVolumePerTrade,
      avgCommissionPerLot,
      commissionPerTrade,
      volumePerIB,
      commissionPerIB,
      referralsPerIB
    };
  }, [profiles]);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'IB NAME',
      render: (val, row) => (
        <div>
          <div className="font-medium text-gray-900">{val}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (val, row) => <StatusBadge status={row.status} />
    },
    {
      key: 'joinDate',
      label: 'JOIN DATE',
      render: (val, row) =>
        row.joinDate ? new Date(row.joinDate).toLocaleDateString() : '—'
    },
    {
      key: 'approvedDate',
      label: 'APPROVED DATE',
      render: (val, row) =>
        row.approvedDate ? new Date(row.approvedDate).toLocaleDateString() : '—'
    },
    {
      key: 'usdPerLot',
      label: 'USD / LOT',
      render: (val, row) => `$${Number(row.usdPerLot || 0).toFixed(2)}`
    },
    {
      key: 'spreadPercentagePerLot',
      label: 'SPREAD %',
      render: (val, row) => `${Number(row.spreadPercentagePerLot || 0).toFixed(2)}%`
    },
    {
      key: 'totalClients',
      label: 'CLIENTS',
      render: (val, row) => Number(row.totalClients || 0)
    },
    {
      key: 'totalVolume',
      label: 'VOLUME',
      render: (val, row) => `$${formatCurrency(row.totalVolume || 0)}`
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (val, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewIB(row)}
          icon={<FiEye className="h-4 w-4" />}
          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
        >
          View
        </Button>
      )
    }
  ], []);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">IB Overview</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all Introducing Brokers</p>
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<FiPlus className="h-4 w-4" />}
          onClick={handleAddIB}
        >
          <span className="hidden sm:inline">Add New IB</span>
          <span className="sm:hidden">Add IB</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {/* Total IBs */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total IBs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : totals.totalIBs}</p>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? '...' : `${totals.approvedIBs} approved | ${stats.pending_requests || totals.pendingIBs} pending`}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        {/* Pending Requests */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : (stats.pending_requests || totals.pendingIBs)}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiClock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>

        {/* Total Commissions */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Commissions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {loading ? '...' : `$${totals.totalCommissions.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">From {loading ? '...' : (totals.totalLots || 0).toFixed(2)} lots</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        {/* Total Referrals */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Referrals</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : totals.totalReferrals}</p>
              <p className="text-xs text-gray-500 mt-1">Network growth</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600" />
            </div>
          </div>
        </AdminCard>

        {/* Approved IBs */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Approved IBs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : totals.approvedIBs}</p>
              <p className="text-xs text-gray-500 mt-1">Active partners</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiCheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            </div>
          </div>
        </AdminCard>

        {/* Total Volume (Lots) */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Volume (Lots)</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {loading ? '...' : Number(totals.totalVolumeLots).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All IB trading</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiLayers className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            </div>
          </div>
        </AdminCard>

        {/* Total Trades */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Trades</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '...' : totals.totalTrades}</p>
              <p className="text-xs text-gray-500 mt-1">All IB activity</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <FiActivity className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* IBs Table */}
      <AdminCard>
        <ProTable
          title="IB Overview"
          rows={profiles}
          columns={columns}
          loading={loading}
          pageSize={25}
          searchPlaceholder="Search IBs..."
          filters={{
            searchKeys: ['name', 'email', 'status'],
            selects: [
              {
                key: 'status',
                label: 'Status',
                options: statusOptions
              }
            ]
          }}
          emptyMessage={error ? 'Unable to load IB data' : 'No IBs found matching your criteria'}
        />
      </AdminCard>

      {/* System Summary */}
      <AdminCard>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">System Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* IB Statistics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">IB Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total IBs:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.totalIBs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.approvedIBs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : (stats.pending_requests || totals.pendingIBs)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approval Rate:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `${totals.approvalRate}%`}</span>
                </div>
              </div>
            </div>

            {/* Trading Statistics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide">Trading Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Volume:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `${Number(totals.totalVolumeLots).toFixed(2)} lots`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Trades:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.totalTrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Volume/Trade:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `${totals.avgVolumePerTrade} lots`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Referrals:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.totalReferrals}</span>
                </div>
              </div>
            </div>

            {/* Commission Statistics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Commission Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Commission:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `$${totals.totalCommissions.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Commission/Lot:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `$${totals.avgCommissionPerLot}`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission/Trade:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `$${totals.commissionPerTrade}`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network Growth:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `${totals.totalReferrals} referrals`}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active IBs:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.approvedIBs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Volume per IB:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `${totals.volumePerIB} lots`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission per IB:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : `$${totals.commissionPerIB}`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Referrals per IB:</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '...' : totals.referralsPerIB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

export default IBOverview;
