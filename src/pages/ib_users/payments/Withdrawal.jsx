import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiDollarSign, FiInfo } from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import ProTable from '../../../components/common/ProTable.jsx';

const Withdrawal = () => {
  const [formData, setFormData] = useState({ amount: '', paymentMethod: '', accountDetails: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({ available: 0, pending: 0, totalPaid: 0, totalEarned: 0 });
  const [pending, setPending] = useState([]);
  const [processed, setProcessed] = useState([]); // approved + rejected

  useEffect(() => {
    fetchSummary();
    fetchTables();
  }, []);

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/withdrawals/summary?period=3650', { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok && json.success) {
        const s = json.data?.summary || {};
        setSummary({
          available: Number(s.available || 0),
          pending: Number(s.pending || 0),
          totalPaid: Number(s.totalPaid || 0),
          totalEarned: Number(s.totalEarned || 0)
        });
        const methods = json.data?.paymentMethods || [];
        setPaymentMethods(methods);
        if (methods.length) {
          setFormData(prev => ({
            ...prev,
            paymentMethod: methods[0].id,
            accountDetails: methods[0].details
          }));
        }
      }
    } catch (e) {
      console.error('Fetch withdrawal summary error:', e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const [pRes, aRes, rRes, paidRes, compRes] = await Promise.all([
        fetch('/api/user/withdrawals?status=pending', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user/withdrawals?status=approved', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user/withdrawals?status=rejected', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user/withdrawals?status=paid', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user/withdrawals?status=completed', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const p = (await pRes.json())?.data?.withdrawals || [];
      const a = (await aRes.json())?.data?.withdrawals || [];
      const r = (await rRes.json())?.data?.withdrawals || [];
      const paid = (await paidRes.json())?.data?.withdrawals || [];
      const comp = (await compRes.json())?.data?.withdrawals || [];
      setPending(p);
      // Mark statuses for clarity
      setProcessed([
        ...a.map(x => ({ ...x, _status: 'approved' })),
        ...paid.map(x => ({ ...x, _status: 'paid' })),
        ...comp.map(x => ({ ...x, _status: 'completed' })),
        ...r.map(x => ({ ...x, _status: 'rejected' }))
      ]);
    } catch (e) {
      console.error('Fetch withdrawals error:', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: formData.amount, paymentMethod: formData.paymentMethod, accountDetails: formData.accountDetails })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await Promise.all([fetchSummary(), fetchTables()]);
        Swal.fire({
          title: 'Success!',
          text: 'Withdrawal request submitted successfully!',
          icon: 'success',
          confirmButtonColor: '#c8f300'
        });
        setFormData({ amount: '', paymentMethod: 'usdt-trc20', accountDetails: '' });
      } else {
        Swal.fire({
          title: 'Error',
          text: json.message || 'Failed to submit withdrawal request',
          icon: 'error',
          confirmButtonColor: '#c8f300'
        });
      }
    } catch (e) {
      console.error('Submit withdrawal error:', e);
      Swal.fire({
        title: 'Error',
        text: 'Failed to submit withdrawal request',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
        <p className="text-gray-600 mt-1">Request a withdrawal of your commission earnings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <AdminCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder="Enter withdrawal amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    const value = e.target.value;
                    const selectedMethod = paymentMethods.find(m => String(m.id) === String(value));
                    setFormData(prev => ({
                      ...prev,
                      paymentMethod: value,
                      accountDetails: selectedMethod?.details || ''
                    }));
                  }}
                  required
                  disabled={paymentMethods.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {paymentMethods.length === 0 ? (
                    <option value="">No approved payment method found</option>
                  ) : (
                    paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.method}
                      </option>
                    ))
                  )}
                </select>
                {paymentMethods.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No approved payment method on file. Please add one in Payment Methods and get it approved.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Details</label>
                <input
                  type="text"
                  name="accountDetails"
                  value={formData.accountDetails}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !formData.amount || Number(formData.amount) <= 0 || paymentMethods.length === 0}
                className="w-full bg-brand-500 text-dark-base hover:bg-brand-600 font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </Button>
            </form>
          </AdminCard>
        </div>

        {/* Info Card */}
        <div>
          <AdminCard>
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <FiInfo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Withdrawal Information</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Minimum withdrawal: $50</li>
                  <li>• Processing time: 3-5 business days</li>
                  <li>• All withdrawals are subject to verification</li>
                  <li>• Please ensure account details are correct</li>
                </ul>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Available Balance</span>
              <FiDollarSign className="h-5 w-5 text-green-600" />
            </div>
            {summaryLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">${summary.available.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Pending: ${summary.pending.toFixed(2)}</p>
                {summary.totalEarned > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Total Earned: ${summary.totalEarned.toFixed(2)}</p>
                )}
              </>
            )}
          </AdminCard>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6">
        <ProTable
          title="Pending Withdrawal Requests"
          rows={pending.map(r => ({ id: r.id, created_at: r.created_at, amount: Number(r.amount || 0), method: r.method, account: r.account_details }))}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'created_at', label: 'Date', render: v => (v ? new Date(v).toLocaleString() : '-') },
            { key: 'amount', label: 'Amount', render: v => `$${Number(v).toFixed(2)}` },
            { key: 'method', label: 'Method' },
            { key: 'account', label: 'Account' }
          ]}
          filters={{ searchKeys: ['id', 'method', 'account'], dateKey: 'created_at', selects: [] }}
          pageSize={10}
          searchPlaceholder="Search pending..."
        />

        <ProTable
          title="Withdrawal History"
          rows={processed.map(r => ({
            id: r.id,
            created_at: r.created_at,
            amount: Number(r.amount || 0),
            method: r.method,
            account: r.account_details,
            status: (r._status || r.status || '').toString().toUpperCase(),
            transaction_id: r.transaction_id || '-'
          }))}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'created_at', label: 'Date', render: v => (v ? new Date(v).toLocaleString() : '-') },
            { key: 'amount', label: 'Amount', render: v => `$${Number(v).toFixed(2)}` },
            { key: 'method', label: 'Method' },
            { key: 'account', label: 'Account' },
            {
              key: 'status', label: 'Status', render: v => {
                const statusLower = String(v).toLowerCase();
                let bgColor = 'bg-gray-100 text-gray-700';
                if (statusLower === 'approved' || statusLower === 'paid' || statusLower === 'completed') {
                  bgColor = 'bg-green-100 text-green-700';
                } else if (statusLower === 'rejected') {
                  bgColor = 'bg-red-100 text-red-700';
                } else if (statusLower === 'pending') {
                  bgColor = 'bg-yellow-100 text-yellow-700';
                }
                return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor}`}>{v}</span>;
              }
            },
            {
              key: 'transaction_id', label: 'Transaction ID', render: v => (
                v && v !== '-' ? (
                  <span className="text-xs font-mono text-gray-700">{v}</span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )
              )
            }
          ]}
          filters={{ searchKeys: ['id', 'method', 'account', 'status', 'transaction_id'], dateKey: 'created_at', selects: [] }}
          pageSize={10}
          searchPlaceholder="Search withdrawal history..."
        />
      </div>
    </div>
  );
};

export default Withdrawal;
