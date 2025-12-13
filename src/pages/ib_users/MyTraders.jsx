import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiCalendar, FiUser, FiMail, FiPhone, FiHash } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable';

const MyTraders = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const fetchTraders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/clients/traders', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = (data.data?.traders || []).map(t => ({
          id: t.id,
          name: t.name || t.email,
          email: t.email || t.traderEmail || t.email,
          phone: t.phone || '-',
          referralCode: t.referralCode || null,
          createdAt: t.createdAt,
          referredByName: t.referredByName,
          referredByEmail: t.referredByEmail
        }));
        setRows(list);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Error fetching traders:', e);
      setRows([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTraders(); }, []);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleString(); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Traders</h1>
          <p className="text-gray-600 mt-1">All CRM traders referred by you</p>
        </div>
        <button onClick={fetchTraders} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium">
          <FiRefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <ProTable
        title="My Traders"
        rows={rows}
        columns={[
          {
            key: 'name', label: 'Name', render: (v) => (
              <div className="flex items-center gap-2"><FiUser className="h-4 w-4 text-gray-400" /><span className="font-medium">{v}</span></div>
            )
          },
          {
            key: 'email', label: 'Email', render: (v) => (
              <div className="flex items-center gap-2"><FiMail className="h-4 w-4 text-gray-400" /><span>{v}</span></div>
            )
          },
          {
            key: 'phone', label: 'Contact', render: (v) => (
              <div className="flex items-center gap-2"><FiPhone className="h-4 w-4 text-gray-400" /><span>{v || '-'}</span></div>
            )
          },
          {
            key: 'referralCode', label: 'Referral Code', render: (v) => (
              <div className="flex items-center gap-2"><FiHash className="h-3 w-3 text-gray-400" /><span className="font-mono text-sm text-brand-600">{v || 'N/A'}</span></div>
            )
          },
          {
            key: 'createdAt', label: 'Created At', render: (v) => (
              <div className="flex items-center gap-2 text-sm text-gray-600"><FiCalendar className="h-3 w-3" /><span>{formatDate(v)}</span></div>
            )
          }
        ]}
        filters={{ searchKeys: ['name', 'email', 'referralCode'] }}
        loading={loading}
        pageSize={10}
        searchPlaceholder="Search traders by name, email, referral code..."
      />
    </div>
  );
};

export default MyTraders;

