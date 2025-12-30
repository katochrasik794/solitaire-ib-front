import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiTrash2,
  FiServer,
  FiTrendingUp,
  FiX
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import EnhancedDataTable from '../../../components/admin/EnhancedDataTable';
import { apiFetch } from '../../../utils/api';

const TradingGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    search: ''
  });
  const [stats, setStats] = useState({
    total_groups: 0,
    oxo_a_groups: 0,
    oxo_b_groups: 0,
    active_groups: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Fetch trading groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      // Try multiple token storage keys for compatibility
      const token = localStorage.getItem('adminToken') ||
        localStorage.getItem('admin_token') ||
        null;

      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search
      });

      const response = await apiFetch(`/admin/trading-groups?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch trading groups');
      }

      const result = await response.json();
      if (result.success) {
        setGroups(result.data.groups || []);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching trading groups:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch trading groups',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      // Try multiple token storage keys for compatibility
      const token = localStorage.getItem('adminToken') ||
        localStorage.getItem('admin_token') ||
        null;

      if (!token) {
        console.warn('No token found for stats request');
        return;
      }

      const response = await apiFetch('/admin/trading-groups/stats');

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized - token may be expired');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Sync from API
  const handleSyncFromAPI = async () => {
    const confirmResult = await Swal.fire({
      title: 'Sync Groups from API?',
      text: 'This will update all trading groups from the external API',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6242a5',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, sync now',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setSyncing(true);
      // Try multiple token storage keys for compatibility
      const token = localStorage.getItem('adminToken') ||
        localStorage.getItem('admin_token') ||
        null;

      if (!token) {
        await Swal.fire({
          title: 'Authentication Required',
          text: 'Please login again to continue',
          icon: 'warning',
          confirmButtonColor: '#c8f300'
        });
        // Redirect to login if on admin page
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        return;
      }

      const response = await apiFetch('/admin/trading-groups/sync', {
        method: 'POST',
        body: JSON.stringify({
          apiUrl: '/api/Groups'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await Swal.fire({
            title: 'Session Expired',
            text: 'Please login again to continue',
            icon: 'warning',
            confirmButtonColor: '#c8f300'
          });
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin_token');
          window.location.href = '/admin/login';
          return;
        }

        const errorData = await response.json().catch(() => ({ message: 'Failed to sync groups' }));
        throw new Error(errorData.message || 'Failed to sync groups');
      }

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          title: 'Success!',
          text: result.message || 'Groups synced successfully',
          icon: 'success',
          confirmButtonColor: '#c8f300',
          timer: 2000
        });

        // Refresh data
        fetchGroups();
        fetchStats();
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing groups:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to sync groups from API',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setSyncing(false);
    }
  };

  // View group details
  const handleViewDetails = async (id) => {
    try {
      // Try multiple token storage keys for compatibility
      const token = localStorage.getItem('adminToken') ||
        localStorage.getItem('admin_token') ||
        null;

      if (!token) {
        Swal.fire({
          title: 'Authentication Required',
          text: 'Please login again',
          icon: 'warning',
          confirmButtonColor: '#c8f300'
        });
        return;
      }

      const response = await fetch(`/api/admin/trading-groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }

      const result = await response.json();
      if (result.success) {
        setSelectedGroup(result.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch group details',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    }
  };

  // Delete group
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this trading group?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // Try multiple token storage keys for compatibility
      const token = localStorage.getItem('adminToken') ||
        localStorage.getItem('admin_token') ||
        null;

      if (!token) {
        Swal.fire({
          title: 'Authentication Required',
          text: 'Please login again',
          icon: 'warning',
          confirmButtonColor: '#c8f300'
        });
        return;
      }

      const response = await fetch(`/api/admin/trading-groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      const deleteResult = await response.json();
      if (deleteResult.success) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Trading group deleted successfully',
          icon: 'success',
          confirmButtonColor: '#c8f300',
          timer: 2000
        });

        fetchGroups();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete trading group',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [pagination.page, filters.search]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchGroups();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (group) => (
        <span className="font-mono text-sm text-gray-900">#{group.id}</span>
      )
    },
    {
      key: 'name',
      label: 'Group Name',
      sortable: true,
      render: (group) => (
        <span className="font-medium text-gray-900">{group.name || group.group_id}</span>
      )
    },
    {
      key: 'group_path',
      label: 'Group Path',
      sortable: true,
      render: (group) => (
        <span className="text-sm font-medium text-blue-600">{group.group_path || group.group_id || '-'}</span>
      )
    },
    {
      key: 'server',
      label: 'Server',
      sortable: true,
      render: (group) => (
        <span className="text-sm text-gray-700">{group.server || 'N/A'}</span>
      )
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (group) => (
        <span className="text-sm text-gray-700">{group.company || '-'}</span>
      )
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      render: (group) => (
        <span className="text-sm text-gray-700">{group.currency || '0'}</span>
      )
    },
    {
      key: 'margin_call',
      label: 'Margin Call',
      sortable: true,
      render: (group) => (
        <span className="text-sm font-medium text-gray-900">
          {group.margin_call ? `${parseFloat(group.margin_call).toFixed(0)}%` : 'N/A'}
        </span>
      )
    },
    {
      key: 'stop_out',
      label: 'Stop Out',
      sortable: true,
      render: (group) => (
        <span className="text-sm font-medium text-gray-900">
          {group.stop_out ? `${parseFloat(group.stop_out).toFixed(0)}%` : 'N/A'}
        </span>
      )
    },
    {
      key: 'trade_flags',
      label: 'Trade Flags',
      sortable: true,
      render: (group) => (
        <span className="font-mono text-sm text-gray-700">{group.trade_flags || '16'}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (group) => {
        if (!group.created_at) return '-';
        const date = new Date(group.created_at);
        return (
          <span className="text-sm text-gray-700">
            {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (group) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetails(group.id)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(group.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
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
            Trading Account Groups
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage trading groups and their configurations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            icon={<FiRefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />}
            onClick={handleSyncFromAPI}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync from API'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FiRefreshCw className="h-4 w-4" />}
            onClick={() => {
              fetchGroups();
              fetchStats();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TOTAL GROUPS</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_groups}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">OXO_A GROUPS</p>
              <p className="text-2xl font-bold text-gray-900">{stats.oxo_a_groups}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiServer className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">OXO_B GROUPS</p>
              <p className="text-2xl font-bold text-gray-900">{stats.oxo_b_groups}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <FiServer className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-green-600">{stats.active_groups}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiTrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search groups by name, path, ID, or description..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>
      </AdminCard>

      {/* Groups Table */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Trading Account Groups ({pagination.total} total)
          </h2>
        </div>
        <EnhancedDataTable
          data={groups}
          columns={columns}
          searchable={false}
          filterable={false}
          exportable={true}
          pagination={true}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          currentPage={pagination.page}
          loading={loading}
          emptyMessage="No trading groups found"
          onPageChange={(newPage) => {
            setPagination(prev => ({ ...prev, page: newPage }));
          }}
        />
      </AdminCard>

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Group Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedGroup(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Group Name</p>
                    <p className="text-base font-medium text-gray-900 bg-yellow-50 px-3 py-2 rounded">
                      {selectedGroup.name || selectedGroup.group_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Group Path</p>
                    <p className="text-base font-medium text-blue-600">{selectedGroup.group_path || selectedGroup.group_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Server</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.server || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.company || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currency</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.currency || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currency Digits</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.currency_digits || '2'}</p>
                  </div>
                </div>
              </div>

              {/* Trading Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Margin Call</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.margin_call ? `${parseFloat(selectedGroup.margin_call).toFixed(0)}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Stop Out</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.stop_out ? `${parseFloat(selectedGroup.stop_out).toFixed(0)}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trade Flags</p>
                    <p className="text-base font-medium text-gray-900 font-mono">{selectedGroup.trade_flags || '16'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auth Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.auth_mode || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Min Password</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.min_password_chars || '8'} chars</p>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.website || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Support Page</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.support_page || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Support Email</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.support_email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedGroup.created_at ? new Date(selectedGroup.created_at).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Updated</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedGroup.updated_at ? new Date(selectedGroup.updated_at).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Group ID</p>
                    <p className="text-base font-medium text-gray-900 font-mono">{selectedGroup.id}</p>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reports Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.reports_mode || '1'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Margin Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.margin_mode || '2'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Demo Leverage</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.demo_leverage || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">News Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.news_mode || '2'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Margin Free Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.margin_free_mode || '1'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Demo Deposit</p>
                    <p className="text-base font-medium text-gray-900">
                      ${parseFloat(selectedGroup.demo_deposit || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mail Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.mail_mode || '1'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Margin SO Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.margin_so_mode || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trade Transfer Mode</p>
                    <p className="text-base font-medium text-gray-900">{selectedGroup.trade_transfer_mode || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Users in Group */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users in Group</h3>
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiUsers className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">No users in this group.</p>
                    <p className="text-sm text-gray-500 mt-1">This group doesn't have any users assigned yet.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedGroup(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingGroups;
