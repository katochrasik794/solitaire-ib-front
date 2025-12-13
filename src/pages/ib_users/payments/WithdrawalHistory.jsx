import React, { useEffect, useState } from 'react';
import ProTable from '../../../components/common/ProTable.jsx';
import AdminCard from '../../../components/admin/AdminCard';

export default function WithdrawalHistory() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('userToken');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/user/withdrawals?status=pending', { headers }),
      fetch('/api/user/withdrawals?status=approved', { headers }),
      fetch('/api/user/withdrawals?status=rejected', { headers })
    ]).then(async ([p,a,r]) => {
      setPending((await p.json())?.data?.withdrawals || []);
      setApproved((await a.json())?.data?.withdrawals || []);
      setRejected((await r.json())?.data?.withdrawals || []);
    }).catch(()=>{});
  }, []);

  const cols = [
    { key: 'id', label: 'ID' },
    { key: 'created_at', label: 'Date', render: v => (v ? new Date(v).toLocaleString() : '-') },
    { key: 'amount', label: 'Amount', render: v => `$${Number(v).toFixed(2)}` },
    { key: 'method', label: 'Method' },
    { key: 'account_details', label: 'Account' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal History</h1>
        <p className="text-gray-600 mt-1">Track all your withdrawal requests</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ProTable
          title="Pending Withdrawal Requests"
          rows={pending}
          columns={cols}
          filters={{ searchKeys: ['id','method','account_details'], dateKey: 'created_at', selects: [] }}
          pageSize={10}
          searchPlaceholder="Search pending..."
        />

        <ProTable
          title="Processed Withdrawals (Approved/Rejected)"
          rows={[...approved, ...rejected]}
          columns={[...cols, { key: 'status', label: 'Status' }]}
          filters={{ searchKeys: ['id','method','account_details'], dateKey: 'created_at', selects: [] }}
          pageSize={10}
          searchPlaceholder="Search processed..."
        />
      </div>
    </div>
  );
}

