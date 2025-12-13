import React, { useState, useEffect } from 'react';
import { FiInfo } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const TransactionsPending = () => {
  const [loading, setLoading] = useState(true);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [stats, setStats] = useState({
    volumeLots: 0,
    volumeMlnUSD: 0,
    pendingCount: 0
  });
  const [volumeUnit, setVolumeUnit] = useState('mlnUSD'); // 'mlnUSD' or 'lots'

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      // Fetch all trades and filter for pending ones (not yet paid)
      // Pending transactions are those that haven't been included in a withdrawal
      const response = await fetch('/api/user/trades?pageSize=10000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        const trades = data.data?.trades || [];
        
        // Fetch withdrawals to determine which transactions are already paid
        const withdrawalsResponse = await fetch('/api/user/withdrawals', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const withdrawalsData = await withdrawalsResponse.json();
        const paidWithdrawals = withdrawalsData.success ? (withdrawalsData.data?.withdrawals || []).filter(w => 
          w.status === 'paid' || w.status === 'completed'
        ) : [];
        
        // Group transactions by client account
        const accountMap = new Map();
        
        trades.forEach(trade => {
          const accountId = trade.account_id || trade.mt5_account_id || 'unknown';
          const volumeLots = Number(trade.volume_lots || trade.lots || 0);
          const profit = Number(trade.profit || 0);
          const commission = Number(trade.ib_commission || 0);
          
          if (!accountMap.has(accountId)) {
            accountMap.set(accountId, {
              clientAccount: accountId,
              pendingCount: 0,
              volumeLots: 0,
              volumeMlnUSD: 0,
              profit: 0
            });
          }
          
          const account = accountMap.get(accountId);
          account.pendingCount += 1;
          account.volumeLots += volumeLots;
          account.volumeMlnUSD += volumeLots * 100000 / 1000000;
          account.profit += profit;
        });
        
        const transactions = Array.from(accountMap.values());
        setPendingTransactions(transactions);
        
        // Calculate stats
        const totalVolumeLots = transactions.reduce((sum, t) => sum + t.volumeLots, 0);
        const totalVolumeMlnUSD = transactions.reduce((sum, t) => sum + t.volumeMlnUSD, 0);
        const totalPendingCount = transactions.reduce((sum, t) => sum + t.pendingCount, 0);
        
        setStats({
          volumeLots: totalVolumeLots,
          volumeMlnUSD: totalVolumeMlnUSD,
          pendingCount: totalPendingCount
        });
      }
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    <AdminCard key="volume-lots">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeLots.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (lots)</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-mln">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeMlnUSD.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (Min. USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="pending-count">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.pendingCount}</p>
        <p className="text-sm text-gray-600 mt-1">Pending transactions count</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions pending payment</h1>
      </div>

      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          Reward for these transactions will be paid to you within 24 hours.
        </p>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={pendingTransactions.map(t => ({
          clientAccount: t.clientAccount,
          pendingCount: t.pendingCount,
          volume: volumeUnit === 'mlnUSD' ? t.volumeMlnUSD : t.volumeLots,
          volumeLots: t.volumeLots,
          volumeMlnUSD: t.volumeMlnUSD
        }))}
        columns={[
          { 
            key: 'clientAccount', 
            label: 'Client account',
            sortable: true
          },
          { 
            key: 'pendingCount', 
            label: 'Pending transactions count',
            sortable: true
          },
          { 
            key: 'volume', 
            label: 'Volume',
            sortable: true,
            headerRender: (sortBy) => (
              <div className="flex flex-col items-center gap-1">
                <span>Volume</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVolumeUnit('mlnUSD');
                    }}
                    className={`px-2 py-0.5 rounded text-xs ${
                      volumeUnit === 'mlnUSD' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Min. USD
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVolumeUnit('lots');
                    }}
                    className={`px-2 py-0.5 rounded text-xs ${
                      volumeUnit === 'lots' 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    Lots
                  </button>
                </div>
                {sortBy?.key === 'volume' && (sortBy.dir === 'asc' ? ' ▲' : ' ▼')}
              </div>
            ),
            render: (v, row) => (
              volumeUnit === 'mlnUSD' ? Number(row.volumeMlnUSD || 0).toFixed(4) : Number(row.volumeLots || 0).toFixed(4)
            )
          }
        ]}
        filters={{
          searchKeys: ['clientAccount'],
          selects: [],
          dateKey: null
        }}
        pageSize={10}
        searchPlaceholder="Search client accounts..."
        loading={loading}
      />
    </div>
  );
};

export default TransactionsPending;
