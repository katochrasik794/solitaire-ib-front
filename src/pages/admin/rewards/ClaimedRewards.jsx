import React, { useState, useEffect } from 'react';
import { FiEye, FiDownload, FiRefreshCw } from 'react-icons/fi';
import ProTable from '../../../components/common/ProTable.jsx';
import AdminCard from '../../../components/admin/AdminCard';
import Badge from '../../../components/common/Badge';
import RewardClaimDetails from './RewardClaimDetails';

const ClaimedRewards = () => {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    fulfilled: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    ibRequestId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 1000, // Fetch large dataset, ProTable handles client-side pagination
    total: 0,
    totalPages: 1
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchClaims();
    fetchStats();
  }, [filters]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      });
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.ibRequestId) {
        params.append('ibRequestId', filters.ibRequestId);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/admin/rewards/claims?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setClaims(data.data?.claims || []);
        setPagination(prev => ({
          ...prev,
          total: data.data?.total || 0,
          totalPages: data.data?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/rewards/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStats({
          total: data.data?.total || 0,
          pending: data.data?.byStatus?.pending || 0,
          approved: data.data?.byStatus?.approved || 0,
          fulfilled: data.data?.byStatus?.fulfilled || 0,
          rejected: data.data?.byStatus?.rejected || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowDetailsModal(true);
  };

  const handleStatusUpdate = () => {
    fetchClaims();
    fetchStats();
  };

  const handleExport = () => {
    // Export to CSV
    const headers = ['Claim ID', 'IB Name', 'IB Email', 'Reward', 'Claimant Name', 'Claimant Email', 'Status', 'Claimed Date'];
    const rows = claims.map(claim => [
      claim.id,
      claim.ibName,
      claim.ibEmail,
      claim.rewardDescription,
      claim.claimantName,
      claim.claimantEmail,
      claim.status,
      new Date(claim.claimedAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reward-claims-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      fulfilled: 'info',
      rejected: 'danger'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const kpiCards = [
    <AdminCard key="total">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        <p className="text-sm text-gray-600 mt-1">Total Claims</p>
      </div>
    </AdminCard>,
    <AdminCard key="pending">
      <div className="text-center">
        <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        <p className="text-sm text-gray-600 mt-1">Pending</p>
      </div>
    </AdminCard>,
    <AdminCard key="approved">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        <p className="text-sm text-gray-600 mt-1">Approved</p>
      </div>
    </AdminCard>,
    <AdminCard key="fulfilled">
      <div className="text-center">
        <p className="text-3xl font-bold text-blue-600">{stats.fulfilled}</p>
        <p className="text-sm text-gray-600 mt-1">Fulfilled</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claimed Rewards</h1>
          <p className="text-gray-600 mt-1">Manage and track all reward claims</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => { fetchClaims(); fetchStats(); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={claims.map(claim => ({
          ...claim,
          addressFormatted: claim.address?.formatted || 'N/A'
        }))}
        columns={[
          {
            key: 'id',
            label: 'Claim ID',
            sortable: true
          },
          {
            key: 'ibName',
            label: 'IB Name',
            sortable: true,
            render: (v, row) => (
              <div>
                <p className="font-medium text-gray-900">{v}</p>
                <p className="text-xs text-gray-500">{row.ibEmail}</p>
              </div>
            )
          },
          {
            key: 'rewardDescription',
            label: 'Reward',
            sortable: true,
            render: (v, row) => (
              <div>
                <p className="font-medium text-gray-900">{v}</p>
                <p className="text-xs text-gray-500">{row.rewardValue} MLN</p>
              </div>
            )
          },
          {
            key: 'claimantName',
            label: 'Claimant',
            sortable: true,
            render: (v, row) => (
              <div>
                <p className="font-medium text-gray-900">{v}</p>
                <p className="text-xs text-gray-500">{row.claimantEmail}</p>
                <p className="text-xs text-gray-500">{row.claimantPhone}</p>
              </div>
            )
          },
          {
            key: 'addressFormatted',
            label: 'Address',
            sortable: false,
            render: (v) => (
              <span className="text-sm text-gray-600">{v}</span>
            )
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (v) => getStatusBadge(v)
          },
          {
            key: 'totalVolumeMln',
            label: 'Volume (MLN)',
            sortable: true,
            render: (v) => Number(v || 0).toFixed(2)
          },
          {
            key: 'claimedAt',
            label: 'Claimed Date',
            sortable: true,
            render: (v) => new Date(v).toLocaleDateString()
          },
          {
            key: 'actions',
            label: 'Actions',
            sortable: false,
            render: (v, row) => (
              <button
                onClick={() => handleViewDetails(row)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center gap-1"
              >
                <FiEye className="h-4 w-4" />
                View
              </button>
            )
          }
        ]}
        filters={{
          searchKeys: ['ibName', 'ibEmail', 'claimantName', 'claimantEmail', 'rewardDescription'],
          selects: [
            {
              key: 'status',
              label: 'All Status',
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'fulfilled', label: 'Fulfilled' },
                { value: 'rejected', label: 'Rejected' }
              ]
            }
          ],
          dateKey: 'claimedAt'
        }}
        pageSize={pagination.pageSize}
        searchPlaceholder="Search claims..."
        loading={loading}
      />

      {showDetailsModal && selectedClaim && (
        <RewardClaimDetails
          claim={selectedClaim}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedClaim(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default ClaimedRewards;

