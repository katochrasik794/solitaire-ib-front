import React, { useState, useEffect } from 'react';
import { FiUsers } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const ClientAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({
    level1Clients: 0,
    clientAccounts: 0,
    volumeLots: 0,
    volumeMlnUSD: 0,
    profitUSD: 0
  });
  const [volumeUnit, setVolumeUnit] = useState('mlnUSD'); // 'mlnUSD' or 'lots'

  useEffect(() => {
    fetchClientAccounts();
  }, []);

  const fetchClientAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      // Fetch clients
      const clientsResponse = await fetch('/api/user/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clientsData = await clientsResponse.json();
      
      if (clientsResponse.ok && clientsData.success) {
        const clients = clientsData.data?.clients || [];
        
        // Process clients into accounts
        const allAccounts = [];
        let level1Count = 0;
        let totalVolumeLots = 0;
        let totalVolumeMlnUSD = 0;
        let totalProfit = 0;
        
        for (const client of clients) {
          // Count level 1 clients (direct referrals)
          if (client.referredById) {
            level1Count++;
          }
          
          // Create account entries from client data
          // Use MT5 accountId for clientAccount (not Client ID)
          const accountEntry = {
            clientAccount: client.accountId || '-', // MT5 Account ID
            profit: Number(client.commission || 0),
            volumeLots: Number(client.totalLots || 0),
            volumeMlnUSD: Number(client.totalLots || 0) * 100000 / 1000000, // Approximate conversion
            clientId: client.id || client.userId || '-',
            partnerCode: client.referralCode || client.referredByCode || '-',
            signupDate: client.joinDate || client.createdAt || client.submitted_at,
            lastTradingDate: client.lastTrade || '-',
            country: client.country || '-',
            accountType: client.ibType || 'Standard'
          };
          
          allAccounts.push(accountEntry);
          
          // Aggregate stats
          totalVolumeLots += accountEntry.volumeLots;
          totalVolumeMlnUSD += accountEntry.volumeMlnUSD;
          totalProfit += accountEntry.profit;
        }
        
        setAccounts(allAccounts);
        setStats({
          level1Clients: level1Count,
          clientAccounts: allAccounts.length,
          volumeLots: totalVolumeLots,
          volumeMlnUSD: totalVolumeMlnUSD,
          profitUSD: totalProfit
        });
      }
    } catch (error) {
      console.error('Error fetching client accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const kpiCards = [
    <AdminCard key="level1">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.level1Clients}</p>
        <p className="text-sm text-gray-600 mt-1">Level 1 Clients</p>
      </div>
    </AdminCard>,
    <AdminCard key="accounts">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.clientAccounts}</p>
        <p className="text-sm text-gray-600 mt-1">Clients' accounts</p>
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
        <p className="text-sm text-gray-600 mt-1">Volume (Min. USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="profit">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.profitUSD.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Profit (USD)</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client accounts</h1>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={accounts.map(acc => ({
          clientAccount: acc.clientAccount,
          profit: acc.profit,
          volume: volumeUnit === 'mlnUSD' ? acc.volumeMlnUSD : acc.volumeLots,
          volumeLots: acc.volumeLots,
          volumeMlnUSD: acc.volumeMlnUSD,
          clientId: acc.clientId,
          partnerCode: acc.partnerCode,
          signupDate: acc.signupDate,
          lastTradingDate: acc.lastTradingDate,
          country: acc.country,
          accountType: acc.accountType
        }))}
        columns={[
          { 
            key: 'clientAccount', 
            label: 'Client account',
            sortable: true
          },
          { 
            key: 'profit', 
            label: 'Profit',
            sortable: true,
            render: (v) => Number(v).toFixed(2)
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
            key: 'clientId', 
            label: 'Client ID',
            sortable: true
          },
          { 
            key: 'partnerCode', 
            label: 'Partner code',
            sortable: true
          },
          { 
            key: 'signupDate', 
            label: 'Sign-up date',
            sortable: true,
            render: (v) => formatDate(v)
          },
          { 
            key: 'lastTradingDate', 
            label: 'Last trading date',
            sortable: true,
            render: (v) => formatDate(v)
          },
          { 
            key: 'country', 
            label: 'Country',
            sortable: true
          },
          { 
            key: 'accountType', 
            label: 'Account type',
            sortable: true
          }
        ]}
        filters={{
          searchKeys: ['clientAccount', 'clientId', 'partnerCode', 'country', 'accountType'],
          selects: [],
          dateKey: 'lastTradingDate'
        }}
        pageSize={10}
        searchPlaceholder="Search client accounts..."
        loading={loading}
      />

      {/* Allocation check button */}
      <div className="flex justify-start">
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FiUsers className="h-4 w-4" />
          <span>Allocation check</span>
        </button>
      </div>
    </div>
  );
};

export default ClientAccounts;
