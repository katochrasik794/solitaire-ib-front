import React, { useEffect, useState, useMemo } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import ProTable from '../../../components/common/ProTable';

const TradersProfile = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchData = async (opts = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const p = new URLSearchParams();
      p.set('page', String(opts.page || page));
      p.set('limit', String(opts.limit || limit));
      if ((opts.search ?? search).trim()) p.set('search', (opts.search ?? search).trim());
      const res = await fetch(`/api/admin/traders?${p.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const list = (json.data?.items || []).map(it => ({
          id: it.ref_id,
          traderEmail: it.trader_email,
          traderName: it.trader_name || '-',
          traderPhone: it.trader_phone || '-',
          referredByName: it.referred_by_name,
          referredByEmail: it.referred_by_email,
          referredByPhone: it.referred_by_phone || '-',
          referredByCode: it.referred_by_code,
          referralCode: it.referral_code,
          source: it.source,
          createdAt: it.created_at
        }));
        setRows(list);
        setPage(json.data.page || 1);
        setLimit(json.data.limit || 20);
        setTotal(json.data.total || list.length);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Fetch traders error:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData({ page: 1 }); }, []);

  const columns = useMemo(() => ([
    { key: 'traderName', label: 'Trader Name' },
    { key: 'traderEmail', label: 'Trader Email' },
    { key: 'traderPhone', label: 'Contact' },
    { key: 'referredByName', label: 'Referred By', render: (val, row) => (
      <div className="flex flex-col">
        <span className="font-medium">{val || 'N/A'}</span>
        <span className="text-xs text-gray-600">{row.referredByEmail || ''}</span>
        <span className="text-xs text-gray-600">{row.referredByPhone || ''}</span>
        {row.referredByCode && (<span className="text-xs text-gray-500 font-mono">Code: {row.referredByCode}</span>)}
      </div>
    ) },
    { key: 'referralCode', label: 'Referral Code', render: (v) => <span className="font-mono text-purple-600">{v}</span> },
    { key: 'source', label: 'Source' },
    { key: 'createdAt', label: 'Created At', render: (v) => new Date(v).toLocaleString() }
  ]), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traders Profile</h1>
          <p className="text-gray-600">All CRM-referred traders from ib_referrals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
            <FiSearch className="h-4 w-4 text-gray-500" />
            <input
              className="ml-2 outline-none text-sm"
              placeholder="Search email, referrer name, code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchData({ page: 1 }); }}
            />
          </div>
          <button
            onClick={() => fetchData({ page: 1 })}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-medium"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <AdminCard>
        <ProTable
          title="Traders"
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={limit}
          page={page}
          total={total}
          onPageChange={(p) => { setPage(p); fetchData({ page: p }); }}
        />
      </AdminCard>
    </div>
  );
};

export default TradersProfile;
