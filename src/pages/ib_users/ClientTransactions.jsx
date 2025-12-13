import React, { useState, useEffect } from 'react';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const ClientTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    profitUSD: 0,
    volumeLots: 0,
    volumeMlnUSD: 0,
    totalTransactions: 0,
    fixedCommission: 0,
    spreadCommission: 0,
    totalCommission: 0
  });
  const [volumeUnit, setVolumeUnit] = useState('mlnUSD'); // 'mlnUSD' or 'lots'

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      // Fetch trades/transactions
      const response = await fetch('/api/user/trades?pageSize=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        const trades = data.data?.trades || [];
        
        // Process transactions
        const processedTransactions = trades.map(trade => {
          const volumeLots = Number(trade.volume_lots || trade.lots || 0);
          const profit = Number(trade.profit || 0);
          const spread = Number(trade.spread || 0);
          const fixedCommission = Number(trade.fixed_commission || trade.ib_commission || 0);
          const spreadCommission = Number(trade.spread_commission || 0);
          const totalCommission = fixedCommission + spreadCommission;
          
          return {
            clientAccount: trade.account_id || trade.mt5_account_id || '-',
            date: trade.close_time || trade.synced_at || trade.updated_at || trade.date,
            instrument: trade.symbol || '-',
            spread: spread.toFixed(2),
            volumeLots: volumeLots,
            volumeMlnUSD: volumeLots * 100000 / 1000000, // Approximate conversion
            profit: profit,
            fixedCommission: fixedCommission,
            spreadCommission: spreadCommission,
            totalCommission: totalCommission
          };
        });
        
        setTransactions(processedTransactions);
        
        // Calculate stats
        const totalProfit = processedTransactions.reduce((sum, t) => sum + t.profit, 0);
        const totalVolumeLots = processedTransactions.reduce((sum, t) => sum + t.volumeLots, 0);
        const totalVolumeMlnUSD = processedTransactions.reduce((sum, t) => sum + t.volumeMlnUSD, 0);
        const totalFixedCommission = processedTransactions.reduce((sum, t) => sum + t.fixedCommission, 0);
        const totalSpreadCommission = processedTransactions.reduce((sum, t) => sum + t.spreadCommission, 0);
        const totalCommission = totalFixedCommission + totalSpreadCommission;
        
        setStats({
          profitUSD: totalProfit,
          volumeLots: totalVolumeLots,
          volumeMlnUSD: totalVolumeMlnUSD,
          totalTransactions: processedTransactions.length,
          fixedCommission: totalFixedCommission,
          spreadCommission: totalSpreadCommission,
          totalCommission: totalCommission
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const kpiCards = [
    <AdminCard key="profit">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.profitUSD.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Profit (USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-lots">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeLots.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (lots)</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-mln">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeMlnUSD.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (Mln. USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="total-commission">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-600">${stats.totalCommission.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Total Commission</p>
        <p className="text-xs text-gray-500 mt-0.5">Fixed ${stats.fixedCommission.toFixed(2)} • Spread ${stats.spreadCommission.toFixed(2)}</p>
      </div>
    </AdminCard>,
    <AdminCard key="transactions">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
        <p className="text-sm text-gray-600 mt-1">Transactions</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client transactions</h1>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={transactions.map(t => ({
          clientAccount: t.clientAccount,
          date: t.date,
          instrument: t.instrument,
          spread: t.spread,
          volume: volumeUnit === 'mlnUSD' ? t.volumeMlnUSD : t.volumeLots,
          volumeLots: t.volumeLots,
          volumeMlnUSD: t.volumeMlnUSD,
          profit: t.profit,
          fixedCommission: t.fixedCommission,
          spreadCommission: t.spreadCommission,
          totalCommission: t.totalCommission
        }))}
        columns={[
          { 
            key: 'clientAccount', 
            label: 'Client account',
            sortable: true
          },
          { 
            key: 'date', 
            label: 'Date',
            sortable: true,
            render: (v) => formatDate(v)
          },
          { 
            key: 'instrument', 
            label: 'Instrument',
            sortable: true
          },
          { 
            key: 'spread', 
            label: 'Spread',
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
                    Mln. USD
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
          },
          { 
            key: 'profit', 
            label: 'Profit',
            sortable: true,
            render: (v) => (
              <span className={Number(v) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                ${Number(v).toFixed(2)}
              </span>
            )
          },
          { 
            key: 'fixedCommission', 
            label: 'Fixed Commission',
            sortable: true,
            render: (v) => `$${Number(v || 0).toFixed(2)}`
          },
          { 
            key: 'spreadCommission', 
            label: 'Spread Commission',
            sortable: true,
            render: (v) => `$${Number(v || 0).toFixed(2)}`
          },
          { 
            key: 'totalCommission', 
            label: 'Total Commission',
            sortable: true,
            render: (v) => (
              <span className="font-semibold text-green-700">
                ${Number(v || 0).toFixed(2)}
              </span>
            )
          }
        ]}
        filters={{
          searchKeys: ['clientAccount', 'instrument'],
          selects: [],
          dateKey: 'date'
        }}
        pageSize={10}
        searchPlaceholder="Search transactions..."
        loading={loading}
      />
    </div>
  );
};

export default ClientTransactions;
