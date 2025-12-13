import React, { useState, useEffect } from 'react';
import { 
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiDollarSign,
  FiEye,
  FiEdit,
  FiSend
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import ProTable from '../../../components/common/ProTable';

const CommissionDistribution = () => {
  const [ibs, setIbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    rate_filter: 'all',
    sort_by: 'approved_at'
  });
  const [stats, setStats] = useState({
    total_approved_ibs: 0,
    total_direct_clients: 0,
    total_sub_ibs: 0,
    total_ib_balance: 0
  });
  const [rates, setRates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Fetch commission distribution data
  const fetchCommissionDistribution = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || null;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        rate_filter: filters.rate_filter,
        sort_by: filters.sort_by
      });

      const response = await fetch(`/api/admin/commission-distribution?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch commission distribution');
      }

      const result = await response.json();
      if (result.success) {
        setIbs(result.data.ibs || []);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching commission distribution:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to fetch commission distribution data',
        icon: 'error',
        confirmButtonColor: '#6242a5'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || null;
      
      if (!token) return;

      const response = await fetch('/api/admin/commission-distribution/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data || {
            total_approved_ibs: 0,
            total_direct_clients: 0,
            total_sub_ibs: 0,
            total_ib_balance: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch rates for filter
  const fetchRates = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token') || null;
      
      if (!token) return;

      const response = await fetch('/api/admin/commission-distribution/rates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRates(result.data.rates || []);
        }
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  useEffect(() => {
    fetchCommissionDistribution();
    fetchStats();
    fetchRates();
  }, [pagination.page, filters]);

  const handleView = (ib) => {
    Swal.fire({
      title: 'IB Commission Details',
      html: `
        <div class="text-left space-y-2">
          <div class="border-b pb-2">
            <p class="text-sm text-gray-600"><strong>Name:</strong> ${ib.name}</p>
            <p class="text-sm text-gray-600"><strong>Email:</strong> ${ib.email}</p>
            <p class="text-sm text-gray-600"><strong>IB Type:</strong> ${ib.ib_type || 'N/A'}</p>
            <p class="text-sm text-gray-600"><strong>IB Rate:</strong> PIP ${ib.ib_rate.toFixed(2)}</p>
          </div>
          <div class="border-b pb-2 pt-2">
            <p class="text-sm text-gray-600"><strong>Direct Clients:</strong> ${ib.direct_clients}</p>
            <p class="text-sm text-gray-600"><strong>Sub-IBs:</strong> ${ib.sub_ibs}</p>
            <p class="text-sm text-gray-600"><strong>Total Referrals:</strong> ${ib.total_referrals}</p>
          </div>
          <div class="pt-2">
            <p class="text-sm font-semibold text-purple-600"><strong>Total Commission:</strong> $${ib.commission.toFixed(2)}</p>
            <p class="text-sm text-gray-700"><strong>Fixed Commission:</strong> $${ib.fixed_commission.toFixed(2)}</p>
            <p class="text-sm text-gray-700"><strong>Spread Share Commission:</strong> $${ib.spread_share_commission.toFixed(2)}</p>
            <p class="text-sm text-gray-600"><strong>Total Balance:</strong> $${ib.total_balance.toFixed(2)}</p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#6242a5',
      width: '500px'
    });
  };

  const handleEdit = (ib) => {
    Swal.fire({
      title: 'Edit IB Commission',
      text: 'Edit functionality coming soon',
      icon: 'info',
      confirmButtonColor: '#6242a5'
    });
  };

  const handleSend = (ib) => {
    Swal.fire({
      title: 'Send Commission',
      text: 'Send commission functionality coming soon',
      icon: 'info',
      confirmButtonColor: '#6242a5'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            IB Commission Distribution
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Advanced IB Commission Management and Distribution System
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Approved IBs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_approved_ibs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Direct Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_direct_clients}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiUser className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sub-IBs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sub_ibs}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <FiUserCheck className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total IB Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(stats.total_ib_balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <select
            value={filters.rate_filter}
            onChange={(e) => setFilters(prev => ({ ...prev, rate_filter: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="all">All Rates</option>
            {rates.map(rate => (
              <option key={rate} value={rate.toString()}>PIP {rate.toFixed(2)}</option>
            ))}
          </select>

          <select
            value={filters.sort_by}
            onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="approved_at">Approval Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="rate">Rate</option>
          </select>

          <button
            onClick={() => {
              fetchCommissionDistribution();
              fetchStats();
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </AdminCard>

      {/* Table */}
      <AdminCard>
        <ProTable
          title="IB Commission Distribution"
          rows={ibs.map((ib, index) => ({
            srNo: (pagination.page - 1) * pagination.limit + index + 1,
            id: ib.id,
            name: ib.name,
            email: ib.email,
            approvedAt: ib.approved_at,
            ibType: ib.ib_type,
            ibRate: ib.ib_rate,
            directClients: ib.direct_clients,
            subIbs: ib.sub_ibs,
            totalReferrals: ib.total_referrals,
            totalBalance: ib.total_balance,
            commission: ib.commission,
            fixedCommission: ib.fixed_commission,
            spreadShareCommission: ib.spread_share_commission
          }))}
          columns={[
            { key: 'srNo', label: 'Sr No.' },
            { 
              key: 'name', 
              label: 'IB Details',
              render: (v, row) => (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-gray-500">{row.email}</div>
                  <div className="text-xs text-gray-400">Approved: {formatDate(row.approvedAt)}</div>
                </div>
              )
            },
            { 
              key: 'ibRate', 
              label: 'IB Rate',
              render: (v) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  PIP {Number(v).toFixed(2)}
                </span>
              )
            },
            { 
              key: 'directClients', 
              label: 'Direct Clients',
              render: (v) => (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {v}
                </span>
              )
            },
            { 
              key: 'subIbs', 
              label: 'Sub-IBs',
              render: (v) => (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {v}
                </span>
              )
            },
            { 
              key: 'totalReferrals', 
              label: 'Total Referrals',
              render: (v) => (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {v}
                </span>
              )
            },
            { 
              key: 'totalBalance', 
              label: 'Total Balance',
              render: (v) => `$${Number(v).toFixed(2)}`
            },
            { 
              key: 'commission', 
              label: 'Total Commission',
              render: (v) => (
                <span className="font-semibold text-purple-600">${Number(v).toFixed(2)}</span>
              )
            },
            { 
              key: 'fixedCommission', 
              label: 'Fixed Commission',
              render: (v) => `$${Number(v).toFixed(2)}`
            },
            { 
              key: 'spreadShareCommission', 
              label: 'Spread Share Commission',
              render: (v) => `$${Number(v).toFixed(2)}`
            },
            { 
              key: 'actions', 
              label: 'Actions',
              render: (v, row) => {
                const ib = ibs.find(i => i.id === row.id);
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(ib)}
                      className="text-gray-900 hover:text-blue-600 transition-colors"
                      title="View"
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(ib)}
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="Edit"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleSend(ib)}
                      className="text-orange-600 hover:text-orange-700 transition-colors"
                      title="Send"
                    >
                      <FiSend className="h-5 w-5" />
                    </button>
                  </div>
                );
              }
            }
          ]}
          filters={{
            searchKeys: ['name', 'email'],
            selects: [],
            dateKey: 'approvedAt'
          }}
          pageSize={pagination.limit}
          loading={loading}
          searchPlaceholder="Search by name or email..."
        />
      </AdminCard>
    </div>
  );
};

export default CommissionDistribution;
