import React, { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiBarChart,
  FiFilter,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const WithdrawalHistoryReports = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalWithdrawals: 0,
    totalAmount: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    completed: 0,
    rejected: 0
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [dateRange, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Build query params
      const params = new URLSearchParams();
      if (dateRange.from) params.append('fromDate', dateRange.from);
      if (dateRange.to) params.append('toDate', dateRange.to);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '10000'); // Get all for reporting

      const response = await apiFetch(`/admin/withdrawals?${params}`);

      const data = await response.json();
      if (data.success) {
        const allWithdrawals = data.data.withdrawals || [];
        setWithdrawals(allWithdrawals);

        // Calculate summary statistics
        const stats = {
          totalWithdrawals: allWithdrawals.length,
          totalAmount: allWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0),
          pending: allWithdrawals.filter(w => w.status?.toLowerCase() === 'pending').length,
          approved: allWithdrawals.filter(w => w.status?.toLowerCase() === 'approved').length,
          paid: allWithdrawals.filter(w => w.status?.toLowerCase() === 'paid').length,
          completed: allWithdrawals.filter(w => w.status?.toLowerCase() === 'completed').length,
          rejected: allWithdrawals.filter(w => w.status?.toLowerCase() === 'rejected').length
        };
        setSummary(stats);

        // Calculate per-user statistics
        const userMap = new Map();
        allWithdrawals.forEach(w => {
          const userId = w.ib_request_id;
          const userName = w.full_name || w.email || `IB #${userId}`;
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              userId,
              userName,
              totalWithdrawals: 0,
              totalAmount: 0,
              pending: 0,
              approved: 0,
              paid: 0,
              completed: 0,
              rejected: 0
            });
          }
          const userStat = userMap.get(userId);
          userStat.totalWithdrawals++;
          userStat.totalAmount += Number(w.amount || 0);
          const status = w.status?.toLowerCase();
          if (status === 'pending') userStat.pending++;
          else if (status === 'approved') userStat.approved++;
          else if (status === 'paid') userStat.paid++;
          else if (status === 'completed') userStat.completed++;
          else if (status === 'rejected') userStat.rejected++;
        });
        setUserStats(Array.from(userMap.values()).sort((a, b) => b.totalAmount - a.totalAmount));
      }
    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusChartData = [
    { name: 'Pending', value: summary.pending, color: '#F59E0B' },
    { name: 'Approved', value: summary.approved, color: '#10B981' },
    { name: 'Paid', value: summary.paid, color: '#3B82F6' },
    { name: 'Completed', value: summary.completed, color: '#c8f300' },
    { name: 'Rejected', value: summary.rejected, color: '#EF4444' }
  ];

  const userChartData = userStats.slice(0, 10).map(u => ({
    name: u.userName.length > 20 ? u.userName.substring(0, 20) + '...' : u.userName,
    amount: u.totalAmount
  }));

  const monthlyData = (() => {
    const monthly = {};
    withdrawals.forEach(w => {
      const date = new Date(w.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthly[monthKey].amount += Number(w.amount || 0);
      monthly[monthKey].count++;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal History Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive withdrawal analytics and reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<FiRefreshCw className="h-4 w-4" />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<FiDownload className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-5 w-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="h-5 w-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </AdminCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalWithdrawals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${summary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-brand-600">{summary.completed + summary.paid}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawals by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Withdrawal Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="amount" fill="#c8f300" name="Amount ($)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </AdminCard>
      </div>

      {/* Top Users Chart */}
      {userStats.length > 0 && (
        <AdminCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Users by Withdrawal Amount</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={userChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="amount" fill="#10B981" name="Total Amount ($)" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </AdminCard>
      )}

      {/* Per User Statistics Table */}
      <AdminCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawals by User</h3>
        <ProTable
          rows={userStats}
          columns={[
            { key: 'userName', label: 'IB Name', sortable: true },
            { key: 'totalWithdrawals', label: 'Total Requests', sortable: true },
            { key: 'totalAmount', label: 'Total Amount', sortable: true, render: v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { key: 'pending', label: 'Pending', sortable: true },
            { key: 'approved', label: 'Approved', sortable: true },
            { key: 'paid', label: 'Paid', sortable: true },
            { key: 'completed', label: 'Completed', sortable: true },
            { key: 'rejected', label: 'Rejected', sortable: true }
          ]}
          filters={{ searchKeys: ['userName'], dateKey: null, selects: [] }}
          pageSize={20}
          searchPlaceholder="Search by user name..."
          loading={loading}
        />
      </AdminCard>

      {/* All Withdrawals Table */}
      <AdminCard>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Withdrawals</h3>
        <ProTable
          rows={withdrawals.map(w => ({
            id: w.id,
            ibName: w.full_name || w.email || `IB #${w.ib_request_id}`,
            amount: Number(w.amount || 0),
            method: w.method || 'N/A',
            status: w.status || 'pending',
            transactionId: w.transaction_id || '-',
            createdAt: w.created_at,
            updatedAt: w.updated_at || w.created_at
          }))}
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { key: 'ibName', label: 'IB Name', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true, render: v => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { key: 'method', label: 'Payment Method', sortable: true },
            {
              key: 'status', label: 'Status', sortable: true, render: v => {
                const statusLower = String(v).toLowerCase();
                let bgColor = 'bg-gray-100 text-gray-700';
                if (statusLower === 'approved' || statusLower === 'paid' || statusLower === 'completed') {
                  bgColor = 'bg-green-100 text-green-700';
                } else if (statusLower === 'rejected') {
                  bgColor = 'bg-red-100 text-red-700';
                } else if (statusLower === 'pending') {
                  bgColor = 'bg-yellow-100 text-yellow-700';
                }
                return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor}`}>{String(v).toUpperCase()}</span>;
              }
            },
            {
              key: 'transactionId', label: 'Transaction ID', sortable: false, render: v => (
                v && v !== '-' ? (
                  <span className="text-xs font-mono text-gray-700">{v}</span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )
              )
            },
            { key: 'createdAt', label: 'Request Date', sortable: true, render: v => v ? new Date(v).toLocaleString() : '-' },
            { key: 'updatedAt', label: 'Last Updated', sortable: true, render: v => v ? new Date(v).toLocaleString() : '-' }
          ]}
          filters={{ searchKeys: ['ibName', 'method', 'transactionId'], dateKey: 'createdAt', selects: [] }}
          pageSize={20}
          searchPlaceholder="Search withdrawals..."
          loading={loading}
        />
      </AdminCard>
    </div>
  );
};

export default WithdrawalHistoryReports;

