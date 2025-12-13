import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import ProTable from '../../components/common/ProTable.jsx';

const MyCommission = () => {
  const [loading, setLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [commission, setCommission] = useState({
    total: 0,
    fixed: 0,
    spreadShare: 0,
    paid: 0,
    withdrawable: 0
  });
  const [trades, setTrades] = useState({ trades: [], total: 0, page: 1, pageSize: 50 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [mt5Accounts, setMt5Accounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [volumeUnit, setVolumeUnit] = useState('mlnUSD');
  const [tradeError, setTradeError] = useState('');

  useEffect(() => {
    fetchCommission();
    fetchWithdrawalsPaid();
    fetchAccounts();
    fetchMT5Accounts();
    fetchAllTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only fetch if accountId is valid (not empty, not '-')
    if (selectedAccountId && selectedAccountId !== '-' && selectedAccountId.trim() !== '') {
      fetchTrades();
    } else {
      // Clear trades if no valid account selected
      setTrades({ trades: [], total: 0, page: 1, pageSize });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, selectedAccountId]);

  const fetchCommission = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/commission', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const d = data.data || {};
        const total = Number(d.total || 0);
        const fixed = Number(d.fixed || 0);
        const spreadShare = Number(d.spreadShare || 0);
        console.log('[MyCommission] Fetched commission:', { total, fixed, spreadShare });
        setCommission(prev => {
          const newCommission = {
            ...prev,
            total,
            fixed,
            spreadShare,
          };
          // Recalculate withdrawable if we have the total
          if (total > 0 && prev.paid !== undefined) {
            newCommission.withdrawable = Math.max(total - prev.paid, 0);
          }
          return newCommission;
        });
      } else {
        console.warn('[MyCommission] Commission API returned error:', data);
      }
    } catch (error) {
      console.error('Error fetching commission:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalsPaid = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/withdrawals/summary?period=3650', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const paid = Number(json.data?.summary?.totalPaid || 0);
        console.log('[MyCommission] Fetched withdrawals paid:', paid);
        setCommission(prev => {
          // Only update paid and withdrawable, don't touch other values
          const total = prev.total || 0;
          return {
            ...prev,
            paid,
            withdrawable: Math.max(total - paid, 0)
          };
        });
      }
    } catch (error) {
      console.error('[MyCommission] Error fetching withdrawals:', error);
    }
  };

  const fetchMT5Accounts = async () => {
    try {
      setAccountsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      // Get accounts from clients endpoint (referred users' accounts) - same as ClientAccounts
      const res = await fetch('/api/user/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const clients = json.data?.clients || [];
        console.log('[MyCommission] Received clients from API:', clients.length, 'clients');
        if (clients.length > 0) {
          console.log('[MyCommission] First client data:', {
            email: clients[0].email,
            accountId: clients[0].accountId,
            country: clients[0].country,
            id: clients[0].id
          });
        }
        // Process clients into MT5 accounts list (exactly like ClientAccounts)
        const allAccounts = [];
        for (const client of clients) {
          // Create account entries from client data
          // Use MT5 accountId for clientAccount (not Client ID)
          const accountEntry = {
            clientAccount: client.accountId || '-', // MT5 Account ID
            profit: Number(client.commission || 0),
            volumeLots: Number(client.totalLots || 0),
            volumeMlnUSD: Number(client.totalLots || 0) * 100000 / 1000000,
            clientId: client.id || client.userId || '-',
            partnerCode: client.referralCode || client.referredByCode || '-',
            signupDate: client.joinDate || client.createdAt || client.submitted_at,
            lastTradingDate: client.lastTrade || '-',
            country: client.country || '-',
            accountType: client.ibType || 'Standard'
          };
          allAccounts.push(accountEntry);
        }
        console.log('[MyCommission] Processed accounts:', allAccounts.length, 'accounts');
        if (allAccounts.length > 0) {
          console.log('[MyCommission] First account entry:', {
            clientAccount: allAccounts[0].clientAccount,
            country: allAccounts[0].country
          });
        }
        setMt5Accounts(allAccounts);

        // Also set availableAccounts for dropdown
        const accountSet = new Set();
        clients.forEach(client => {
          if (client.accountId) {
            accountSet.add(String(client.accountId));
          }
        });
        const accounts = Array.from(accountSet).map(accountId => ({
          accountId,
          label: `${accountId}`
        }));
        setAvailableAccounts(accounts);
        if (accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accounts[0].accountId);
        }
      } else {
        // Fallback to overview endpoint if clients endpoint doesn't work
        const overviewRes = await fetch('/api/user/overview?period=3650', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const overviewJson = await overviewRes.json();
        if (overviewRes.ok && overviewJson.success) {
          const accounts = (overviewJson.data?.accounts || []).map(a => ({
            accountId: a.accountId,
            label: `${a.accountId}${a.groupId ? ` - ${a.groupId}` : ''}`
          }));
          setAvailableAccounts(accounts);
          if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].accountId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching MT5 accounts:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    // This is kept for backward compatibility with the dropdown
    // The actual MT5 accounts are fetched in fetchMT5Accounts
    fetchMT5Accounts();
  };

  const fetchAllTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');

      // Fetch all trades/transactions
      const response = await fetch('/api/user/trades?pageSize=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const trades = data.data?.trades || [];

        // Process transactions (like ClientTransactions)
        const processedTransactions = trades.map(trade => {
          const volumeLots = Number(trade.volume_lots || trade.lots || 0);
          const profit = Number(trade.profit || 0);
          const spread = Number(trade.spread || 0);

          return {
            clientAccount: trade.account_id || trade.mt5_account_id || '-',
            date: trade.close_time || trade.synced_at || trade.updated_at || trade.date,
            instrument: trade.symbol || '-',
            spread: spread.toFixed(2),
            volumeLots: volumeLots,
            volumeMlnUSD: volumeLots * 100000 / 1000000,
            profit: profit
          };
        });

        setTransactions(processedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
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

  const fetchTrades = async () => {
    // Validate accountId - don't proceed if empty, '-', or invalid
    if (!selectedAccountId || selectedAccountId === '-' || selectedAccountId.trim() === '') {
      setTrades({ trades: [], total: 0, page: 1, pageSize });
      return;
    }

    try {
      setTradesLoading(true);
      setTradeError('');

      const MT5_API_BASE = 'https://metaapi.Soliataire Cabinet.com';
      // Use wide date window like admin side
      const fromDate = '2024-01-01';
      const toDate = '2085-12-31';
      // Fetch all trades first, then paginate client-side
      const apiUrl = `${MT5_API_BASE}/api/client/tradehistory/trades?accountId=${encodeURIComponent(selectedAccountId)}&page=1&pageSize=100000&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;

      console.log('[fetchTrades] Fetching from:', apiUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(apiUrl, {
        headers: { accept: '*/*' },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        console.error('[fetchTrades] API error:', response.status, message);
        throw new Error(message || `Failed to fetch trade history (${response.status})`);
      }

      const payload = await response.json().catch(() => ({}));
      console.log('[fetchTrades] API response:', payload);
      const items = Array.isArray(payload?.Items) ? payload.Items : [];
      console.log('[fetchTrades] Items count:', items.length);

      // Get commission rates from IB profile (group assignments)
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      let usdPerLot = 0;
      let spreadPct = 0;
      const commissionStructures = [];

      try {
        // Try to get commission structure from dashboard endpoint
        const dashboardRes = await fetch('/api/user/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success && dashboardData.data?.commissionStructures?.length > 0) {
          commissionStructures.push(...dashboardData.data.commissionStructures);
          // Get the first commission structure as default (or find the matching one by group)
          const structure = dashboardData.data.commissionStructures[0];
          usdPerLot = Number(structure.usdPerLot || 0);
          // Note: dashboard returns spreadShare, not spreadPercentage
          spreadPct = Number(structure.spreadShare || structure.spreadPercentage || 0);
          console.log('[fetchTrades] Loaded commission structures:', commissionStructures.length, 'Default rates - usdPerLot:', usdPerLot, 'spreadPct:', spreadPct);
        } else {
          console.warn('[fetchTrades] No commission structures found in dashboard response');
        }
      } catch (err) {
        console.error('[fetchTrades] Could not fetch commission structure:', err);
      }

      // Helper to find commission structure by group (if available in trade data)
      const getCommissionForGroup = (groupName) => {
        if (!groupName || commissionStructures.length === 0) {
          return { usdPerLot, spreadPct };
        }
        const groupLower = String(groupName).toLowerCase();
        const match = commissionStructures.find(s => {
          const groupId = String(s.groupId || '').toLowerCase();
          const groupName = String(s.groupName || '').toLowerCase();
          return groupId === groupLower || groupName === groupLower ||
            groupId.includes(groupLower) || groupName.includes(groupLower);
        });
        if (match) {
          return {
            usdPerLot: Number(match.usdPerLot || 0),
            spreadPct: Number(match.spreadShare || match.spreadPercentage || 0)
          };
        }
        return { usdPerLot, spreadPct };
      };

      // Map trades to our format - filter for closed trades
      // API response structure: { DealId, OrderId, PositionId, Login, Symbol, OrderType, VolumeLots, Price, Profit, Commission, Swap, CloseTime, Comment, OpenTradeTime }
      const mapped = items
        .filter(t => {
          const type = String(t?.OrderType || '').toLowerCase();
          if (type !== 'buy' && type !== 'sell') return false; // only actual trades
          const volumeLots = Number(t?.VolumeLots || 0);
          const hasCloseTime = Boolean(t?.CloseTime);
          // Only include trades with CloseTime (closed trades) and valid volume
          if (!hasCloseTime || volumeLots <= 0) return false;
          return true;
        })
        .map(t => {
          // Use VolumeLots directly from API (already in lots)
          const lots = Number(t?.VolumeLots || 0);
          const profit = Number(t?.Profit || 0);
          const orderId = String(t?.OrderId || t?.DealId || '');

          // Try to get group from trade comment or use default
          const tradeGroup = t?.Comment || t?.Group || null;
          const rates = getCommissionForGroup(tradeGroup);
          const tradeUsdPerLot = rates.usdPerLot;
          const tradeSpreadPct = rates.spreadPct;

          // Compute fixed IB commission per-lot
          // Fixed commission = lots * USD per lot
          const fixedCommission = lots * tradeUsdPerLot;
          // Spread commission = lots * (spread percentage / 100)
          // Note: spreadPct is already a percentage (e.g., 50 means 50%)
          const spreadCommission = lots * (tradeSpreadPct / 100);

          if (lots > 0 && (fixedCommission > 0 || spreadCommission > 0)) {
            console.log(`[fetchTrades] Trade commission: lots=${lots}, group=${tradeGroup}, usdPerLot=${tradeUsdPerLot}, spreadPct=${tradeSpreadPct}, fixed=${fixedCommission.toFixed(2)}, spread=${spreadCommission.toFixed(2)}`);
          }

          // Extract close time - API returns ISO format like "2025-11-14T09:28:34.0000000Z"
          let closeTime = null;
          const rawClose = t?.CloseTime;
          if (rawClose) {
            if (typeof rawClose === 'string') {
              // Already in ISO format, use directly
              closeTime = rawClose;
            } else if (typeof rawClose === 'number') {
              const n = Number(rawClose);
              const ms = n > 1e12 ? n : n * 1000; // seconds -> ms
              closeTime = new Date(ms).toISOString();
            }
          }

          return {
            dealId: orderId,
            mt5Account: String(selectedAccountId),
            symbol: t?.Symbol || '-',
            lots: Number(lots || 0),
            profit: Number(profit || 0),
            fixedCommission: Number(fixedCommission || 0),
            spreadCommission: Number(spreadCommission || 0),
            ibCommission: Number(fixedCommission + spreadCommission || 0),
            closeTime: closeTime
          };
        });

      console.log('[fetchTrades] Mapped trades count:', mapped.length);
      if (mapped.length > 0) {
        console.log('[fetchTrades] First mapped trade:', mapped[0]);
      } else if (items.length > 0) {
        console.warn('[fetchTrades] NO TRADES MAPPED! First raw item:', items[0]);
        console.warn('[fetchTrades] Item keys:', Object.keys(items[0] || {}));
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paged = mapped.slice(start, end);

      console.log('[fetchTrades] Setting trades - paged:', paged.length, 'total:', mapped.length);

      setTrades({
        trades: paged,
        total: mapped.length,
        page,
        pageSize
      });

      // Don't update commission summary from individual account trades
      // Commission should come from the API endpoint which calculates from ALL trades
      // This is just for displaying trades for the selected account
      // setCommission should NOT be called here to avoid overwriting the correct values
    } catch (error) {
      console.error('[fetchTrades] Error:', error);
      setTradeError(error.message || 'Failed to fetch trade history');
      setTrades({ trades: [], total: 0, page: 1, pageSize });
    } finally {
      setTradesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Commission</h1>
        <p className="text-gray-600 mt-1">View your commission earnings and history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <AdminCard>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <FiDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${commission.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <FiDollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Fixed Commission</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${commission.fixed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-2">
              <FiTrendingUp className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Spread Share</p>
              <p className="text-2xl font-bold text-brand-600 mt-1">
                ${commission.spreadShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <FiCalendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Withdrawable Balance</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                ${Number(commission.withdrawable || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* MT5 Accounts List - Like ClientAccounts */}
      <AdminCard header="MT5 Accounts" icon={<FiDollarSign className="h-5 w-5" />}>
        <ProTable
          rows={mt5Accounts.map(acc => ({
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
                      className={`px-2 py-0.5 rounded text-xs ${volumeUnit === 'mlnUSD'
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
                      className={`px-2 py-0.5 rounded text-xs ${volumeUnit === 'lots'
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
          loading={accountsLoading}
        />
      </AdminCard>

      {/* Transaction History - Like ClientTransactions */}
      <AdminCard header="Transaction History" icon={<FiTrendingUp className="h-5 w-5" />}>
        <ProTable
          rows={transactions.map(t => ({
            clientAccount: t.clientAccount,
            date: t.date,
            instrument: t.instrument,
            spread: t.spread,
            volume: volumeUnit === 'mlnUSD' ? t.volumeMlnUSD : t.volumeLots,
            volumeLots: t.volumeLots,
            volumeMlnUSD: t.volumeMlnUSD,
            profit: t.profit
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
                      className={`px-2 py-0.5 rounded text-xs ${volumeUnit === 'mlnUSD'
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
                      className={`px-2 py-0.5 rounded text-xs ${volumeUnit === 'lots'
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
              render: (v) => Number(v).toFixed(2)
            }
          ]}
          filters={{
            searchKeys: ['clientAccount', 'instrument'],
            selects: [],
            dateKey: 'date'
          }}
          pageSize={10}
          searchPlaceholder="Search transactions..."
          loading={transactionsLoading}
        />
      </AdminCard>

      {/* Commission History */}
      {tradeError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {tradeError}
        </div>
      )}
      <ProTable
        title="Trade History"
        rows={trades.trades}
        columns={[
          { key: 'dealId', label: 'Deal ID' },
          { key: 'mt5Account', label: 'MT5 Account' },
          { key: 'symbol', label: 'Symbol' },
          { key: 'lots', label: 'Lots', render: (v) => Number(v).toFixed(2) },
          {
            key: 'profit', label: 'Profit', render: (v) => (
              <span className={Number(v) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                ${Number(v).toFixed(2)}
              </span>
            )
          },
          { key: 'fixedCommission', label: 'Fixed Commission', render: (v) => `$${Number(v).toFixed(2)}` },
          { key: 'spreadCommission', label: 'Spread Commission', render: (v) => `$${Number(v).toFixed(2)}` },
          { key: 'ibCommission', label: 'IB Commission', render: (v) => `$${Number(v).toFixed(2)}` },
          {
            key: 'closeTime', label: 'Close Time', render: (v) => {
              try { return new Date(v).toLocaleString(); } catch { return v || '-'; }
            }
          }
        ]}
        filters={{
          searchKeys: ['dealId', 'symbol', 'mt5Account', 'group'],
          selects: [],
          dateKey: 'closeTime'
        }}
        pageSize={trades.pageSize}
        loading={tradesLoading}
        searchPlaceholder="Search trades..."
      />

      {/* Simple pager + actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); fetchTrades(); }}
          >
            {[50, 100, 200].map(s => (<option key={s} value={s}>{s}/page</option>))}
          </select>
          <button className="px-2 py-1 border rounded text-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <span className="text-sm text-gray-600">Page {trades.page}</span>
          <button className="px-2 py-1 border rounded text-sm" disabled={(trades.page * trades.pageSize) >= trades.total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
        <button className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-dark-base rounded text-sm inline-flex items-center gap-2" onClick={() => fetchTrades()}>
          <FiRefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
    </div>
  );
};

export default MyCommission;
