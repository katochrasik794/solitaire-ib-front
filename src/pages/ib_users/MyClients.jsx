import React, { useState, useEffect } from 'react';
import { FiUsers, FiRefreshCw, FiCalendar, FiHash, FiUser, FiMail } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import ProTable from '../../components/common/ProTable';

const MyClients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const rows = (data.data?.clients || []).map((c) => ({
          id: c.id || c.userId,
          name: c.name,
          email: c.email,
          status: c.status || 'pending',
          ibType: c.ibType || 'N/A',
          referralCode: c.referralCode || 'N/A',
          referredByName: c.referredByName || 'You',
          referredByCode: c.referredByCode || null,
          joinDate: c.joinDate,
          approvedDate: c.approvedDate,
          commission: c.commission || 0,
          totalLots: c.totalLots || 0,
          accountCount: c.accountCount || 0,
          usdPerLot: c.usdPerLot || 0,
          spreadPercentage: c.spreadPercentage || 0,
          lastTrade: c.lastTrade
        }));
        setClients(rows);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-gray-600 mt-1">Manage and view your referred clients and their details</p>
        </div>
        <button
          onClick={fetchClients}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <ProTable
        title="My Clients"
        rows={clients}
        columns={[
          { 
            key: 'name', 
            label: 'Name',
            render: (val, row) => (
              <div className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{val}</span>
              </div>
            )
          },
          { 
            key: 'email', 
            label: 'Email',
            render: (val) => (
              <div className="flex items-center gap-2">
                <FiMail className="h-4 w-4 text-gray-400" />
                <span>{val}</span>
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (val) => (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                val === 'approved' ? 'bg-green-100 text-green-800' : 
                val === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                val === 'rejected' ? 'bg-red-100 text-red-800' :
                val === 'trader' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {val === 'trader' ? 'TRADER' : (val || 'pending')}
              </span>
            )
          },
          {
            key: 'referralCode',
            label: 'Referral Code',
            render: (val) => (
              <div className="flex items-center gap-2">
                <FiHash className="h-3 w-3 text-gray-400" />
                <span className="font-mono text-sm font-medium text-purple-600">{val || 'N/A'}</span>
              </div>
            )
          },
          {
            key: 'referredByName',
            label: 'Referred By',
            render: (val, row) => (
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{val || 'N/A'}</span>
                {row.referredByEmail && (
                  <span className="text-xs text-gray-600">{row.referredByEmail}</span>
                )}
                {row.referredByPhone && (
                  <span className="text-xs text-gray-600">{row.referredByPhone}</span>
                )}
                {row.referredByCode && (
                  <span className="text-xs text-gray-500 font-mono">Code: {row.referredByCode}</span>
                )}
              </div>
            )
          },
          {
            key: 'joinDate',
            label: 'Submitted At',
            render: (val) => (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-3 w-3" />
                <span>{formatDate(val)}</span>
              </div>
            )
          },
          {
            key: 'approvedDate',
            label: 'Approved At',
            render: (val) => (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiCalendar className="h-3 w-3" />
                <span>{formatDate(val)}</span>
              </div>
            )
          },
          {
            key: 'commission',
            label: 'Commission',
            render: (val) => (
              <span className="font-semibold text-green-600">{formatCurrency(val)}</span>
            )
          },
          {
            key: 'totalLots',
            label: 'Volume (Lots)',
            render: (val) => (
              <span className="text-sm text-gray-700">{Number(val || 0).toFixed(2)}</span>
            )
          },
          {
            key: 'accountCount',
            label: 'Accounts',
            render: (val) => (
              <span className="text-sm text-gray-700">{val || 0}</span>
            )
          }
        ]}
        filters={{
          searchKeys: ['name', 'email', 'referralCode', 'referredByName', 'referredByEmail', 'ibType']
        }}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search clients by name, email, referral code..."
      />
    </div>
  );
};

export default MyClients;
