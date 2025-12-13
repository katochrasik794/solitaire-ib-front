import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiEye,
  FiUserPlus,
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
import DataTable from '../../../components/admin/DataTable';

const IBOverview = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/ib-requests/profiles/approved', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

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
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/ib-requests/stats/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

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

  const filteredIBs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return profiles.filter((ib) => {
      const matchesSearch = !term ||
        (ib.name && ib.name.toLowerCase().includes(term)) ||
        (ib.email && ib.email.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === 'all' ||
        (ib.status && ib.status.toLowerCase() === statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [profiles, searchTerm, statusFilter]);

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

  const columns = [
    {
      key: 'name',
      label: 'IB Name',
      sortable: true,
      render: (ib) => (
        <div>
          <div className="font-medium text-gray-900">{ib.name}</div>
          <div className="text-sm text-gray-500">{ib.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (ib) => <StatusBadge status={ib.status} />
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (ib) =>
        ib.joinDate ? new Date(ib.joinDate).toLocaleDateString() : '—'
    },
    {
      key: 'approvedDate',
      label: 'Approved Date',
      sortable: true,
      render: (ib) =>
        ib.approvedDate ? new Date(ib.approvedDate).toLocaleDateString() : '—'
    },
    {
      key: 'usdPerLot',
      label: 'USD / Lot',
      sortable: true,
      render: (ib) => `$${Number(ib.usdPerLot || 0).toFixed(2)}`
    },
    {
      key: 'spreadPercentagePerLot',
      label: 'Spread %',
      sortable: true,
      render: (ib) => `${Number(ib.spreadPercentagePerLot || 0).toFixed(2)}%`
    },
    {
      key: 'totalClients',
      label: 'Clients',
      sortable: true,
      render: (ib) => Number(ib.totalClients || 0)
    },
    {
      key: 'totalVolume',
      label: 'Volume',
      sortable: true,
      render: (ib) => `$${formatCurrency(ib.totalVolume || 0)}`
    }
  ];

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

      {/* Filters and Search */}
      <AdminCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search IBs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent w-full sm:w-auto"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" icon={<FiFilter className="h-4 w-4" />}>
                <span className="hidden sm:inline">More Filters</span>
                <span className="sm:hidden">Filters</span>
              </Button>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* IBs Table */}
      <AdminCard>
        <DataTable
          data={filteredIBs}
          columns={columns}
          searchable={false}
          filterable={false}
          exportable={false}
          loading={loading}
          onView={handleViewIB}
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
