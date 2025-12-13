import React, { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiCalendar,
  FiTrendingDown,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCopy,
  FiX
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import EnhancedDataTable from '../../../components/admin/EnhancedDataTable';

// Approval Modal Component
const ApprovalModal = ({ isOpen, onClose, withdrawal, onComplete }) => {
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTransactionId('');
    }
  }, [isOpen]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      title: 'Copied!',
      text: 'Details copied to clipboard',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      confirmButtonColor: '#6242a5'
    });
  };

  const handleComplete = async () => {
    if (!transactionId.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Please enter a transaction ID',
        icon: 'error',
        confirmButtonColor: '#6242a5'
      });
      return;
    }

    setSubmitting(true);
    try {
      await onComplete(withdrawal.id, transactionId.trim());
      onClose();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !withdrawal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Approve Withdrawal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Withdrawal Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">IB Name:</span>
                <span className="text-sm font-semibold text-gray-900">{withdrawal.full_name || withdrawal.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Amount:</span>
                <span className="text-sm font-semibold text-green-600">${parseFloat(withdrawal.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                <span className="text-sm font-semibold text-gray-900">{withdrawal.method || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Account Details:</span>
                  <button
                    onClick={() => handleCopy(withdrawal.account_details || '')}
                    className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm"
                  >
                    <FiCopy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-sm text-gray-700 font-mono break-all">
                  {withdrawal.account_details || 'N/A'}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Request Date:</span>
                <span className="text-sm text-gray-700">{new Date(withdrawal.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID after completing manual payment"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the transaction ID after completing the manual payment transaction
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleComplete}
              disabled={submitting || !transactionId.trim()}
            >
              {submitting ? 'Completing...' : 'Complete Transaction'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IBWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [stats, setStats] = useState({
    total_withdrawals: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_amount: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, withdrawal: null });

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status
      });

      const response = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.data.withdrawals);
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/withdrawals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
  }, [pagination.page, filters]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (withdrawal) => (
        <span className="font-mono text-sm text-gray-900">#{withdrawal.id}</span>
      )
    },
    {
      key: 'ib_name',
      label: 'IB Name',
      sortable: true,
      render: (withdrawal) => (
        <span className="font-medium text-gray-900">{withdrawal.full_name || withdrawal.email}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm font-medium text-green-600">
          ${parseFloat(withdrawal.amount || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Payment Method',
      sortable: true,
      render: (withdrawal) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {withdrawal.method || 'N/A'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Requested Date',
      sortable: true,
      render: (withdrawal) => (
        <span className="text-sm text-gray-700">
          {new Date(withdrawal.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (withdrawal) => (
        <StatusBadge status={withdrawal.status || 'pending'} />
      )
    },
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      sortable: false,
      render: (withdrawal) => (
        withdrawal.transaction_id ? (
          <span className="text-sm font-mono text-gray-700">{withdrawal.transaction_id}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (withdrawal) => (
        <div className="flex items-center gap-2">
          {withdrawal.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(withdrawal)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(withdrawal.id)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const handleApprove = (withdrawal) => {
    setApprovalModal({ isOpen: true, withdrawal });
  };

  const handleCompleteTransaction = async (id, transactionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId })
      });

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Withdrawal approved and transaction completed successfully',
          icon: 'success',
          confirmButtonColor: '#6242a5'
        });
        fetchWithdrawals();
        fetchStats();
      } else {
        throw new Error(data.message || 'Failed to complete transaction');
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to complete transaction',
        icon: 'error',
        confirmButtonColor: '#6242a5'
      });
      throw error;
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchWithdrawals();
        fetchStats();
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            IB Withdrawals
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage IB withdrawal requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FiDownload className="h-4 w-4" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<FiRefreshCw className="h-4 w-4" />}
            onClick={fetchWithdrawals}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_withdrawals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(stats.total_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FiTrendingDown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="relative flex-1 w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by IB name or ID..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </AdminCard>

      {/* Withdrawals Table */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Withdrawal Requests ({pagination.total} total)
          </h2>
        </div>
        <EnhancedDataTable
          data={withdrawals}
          columns={columns}
          searchable={false}
          filterable={false}
          exportable={true}
          pagination={true}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          currentPage={pagination.page}
          loading={loading}
          emptyMessage="No withdrawal requests found"
          onPageChange={(newPage) => {
            setPagination(prev => ({ ...prev, page: newPage }));
          }}
        />
      </AdminCard>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, withdrawal: null })}
        withdrawal={approvalModal.withdrawal}
        onComplete={handleCompleteTransaction}
      />
    </div>
  );
};

export default IBWithdrawals;

