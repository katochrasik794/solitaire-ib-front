import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiActivity, FiMoreVertical, FiInfo, FiEye, FiEdit, FiSend } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

// Cache management
const CACHE_KEYS = {
  ACCOUNT_DATA: 'account_overview_data',
  WITHDRAWAL_DATA: 'withdrawal_summary_data',
  TIMESTAMP: 'cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }
  return null;
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

const clearCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const AccountOverview = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    totalEquity: 0,
    accountStatus: 'IB Approved'
  });
  const [accounts, setAccounts] = useState([]);
  const [commissionTable, setCommissionTable] = useState([]);
  const [commissionInfo, setCommissionInfo] = useState({
    standard: '1.00 pip',
    commissionType: 'Commission per lot'
  });
  const [commissionByType, setCommissionByType] = useState({ Standard: null, Pro: null });
  const [summary, setSummary] = useState({ totalTrades: 0, totalLots: 0, totalProfit: 0, totalCommission: 0 });
  const [ibInfo, setIbInfo] = useState({ fullName: '', email: '', phone: '', approvedDate: null, referralCode: '', commissionStructure: null });
  const [editingReferralCode, setEditingReferralCode] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [updatingReferralCode, setUpdatingReferralCode] = useState(false);
  const [withdrawSummary, setWithdrawSummary] = useState({ summary: { totalEarned: 0, totalPaid: 0, pending: 0, available: 0 } });

  useEffect(() => {
    // Check for cached data first
    loadCachedData();
    fetchAccountData();
    fetchWithdrawalsSummary();
  }, []);

  // Check for cached data and load it immediately
  const loadCachedData = () => {
    try {
      const cachedAccountData = getCachedData(CACHE_KEYS.ACCOUNT_DATA);
      const cachedWithdrawalData = getCachedData(CACHE_KEYS.WITHDRAWAL_DATA);
      
      if (cachedAccountData) {
        setStats(cachedAccountData.stats || { totalAccounts: 0, totalBalance: 0, totalEquity: 0, accountStatus: 'IB Approved' });
        setAccounts(cachedAccountData.accounts || []);
        setCommissionTable(cachedAccountData.commissionTable || []);
        setCommissionInfo(cachedAccountData.commissionInfo || { standard: '1.00 pip', commissionType: 'Commission per lot' });
        setCommissionByType(cachedAccountData.commissionByType || { Standard: null, Pro: null });
        setSummary(cachedAccountData.summary || { totalTrades: 0, totalLots: 0, totalProfit: 0, totalCommission: 0 });
        setIbInfo(cachedAccountData.ibInfo || { fullName: '', email: '', phone: '', approvedDate: null, referralCode: '', commissionStructure: null });
        setReferralCodeInput(cachedAccountData.ibInfo?.referralCode || '');
      }
      
      if (cachedWithdrawalData) {
        setWithdrawSummary(cachedWithdrawalData || { summary: { totalEarned: 0, totalPaid: 0, pending: 0, available: 0 } });
      }
      
      if (cachedAccountData || cachedWithdrawalData) {
        setDataLoaded(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const fetchAccountData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/overview?period=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const d = json.data || {};
        
        // Process and cache account data
        const detectType = (g) => {
          const s = (g || '').toString().toLowerCase();
          return s.includes('pro') ? 'Pro' : 'Standard';
        };
        const std = d.commissionByType?.Standard || null;
        const pro = d.commissionByType?.Pro || null;
        
        const processedAccounts = (d.accounts || []).map(a => {
          const type = detectType(a.groupId || a.group);
          const rate = type === 'Pro' ? pro : std;
          
          // Use actual commission values from backend if available
          const fixedCommission = Number(a.ibCommission || 0);
          const spreadCommission = Number(a.spreadCommissionAmount || 0);
          const totalCommission = Number(a.commissionTotal || a.ibCommissionTotal || (fixedCommission + spreadCommission));
          
          return {
            id: a.accountId,
            balance: a.balance,
            equity: a.equity,
            currency: 'USD',
            leverage: '-',
            status: 'Active',
            commissionRate: rate ? `$${(rate.usdPerLot || 0).toFixed(2)} per lot • ${(rate.spreadShare || 0).toFixed(2)}% share` : 'N/A',
            accountType: type,
            commissionEarned: totalCommission,
            commissionFixed: fixedCommission,
            commissionSpread: spreadCommission,
            hasCommission: !!rate
          };
        });

        const processedCommissionTable = (d.groups || []).map((g, idx) => {
          const totalLots = Number(g.totalLots || 0);
          const usdPerLot = Number(g.usdPerLot || 0);
          const spreadPct = Number(g.spreadSharePercentage || 0);
          const fixedComm = Number(g.totalCommission || 0);
          const spreadComm = Number(g.spreadCommission || 0) || (totalLots * (spreadPct / 100));
          const totalComm = Number(g.commissionTotal || 0) || (fixedComm + spreadComm);
          
          return {
            id: idx + 1,
            accountId: g.groupName,
            accountName: g.groupName,
            ibRate: usdPerLot,
            directClients: 0,
            subIbs: 0,
            totalReferrals: 0,
            totalBalance: Number(g.totalBalance || 0),
            commission: totalComm,
            fixedCommission: fixedComm,
            spreadCommission: spreadComm
          };
        });

        const accountData = {
          stats: d.stats || { totalAccounts: 0, totalBalance: 0, totalEquity: 0, accountStatus: '—' },
          accounts: processedAccounts,
          commissionTable: processedCommissionTable,
          commissionInfo: d.commissionInfo || { standard: '-', commissionType: '-' },
          commissionByType: d.commissionByType || { Standard: null, Pro: null },
          summary: d.summary || { totalTrades: 0, totalLots: 0, totalProfit: 0, totalCommission: 0 },
          ibInfo: d.ibInfo || {}
        };

        // Update state
        setStats(accountData.stats);
        setAccounts(accountData.accounts);
        setCommissionTable(accountData.commissionTable);
        setCommissionInfo(accountData.commissionInfo);
        setCommissionByType(accountData.commissionByType);
        setSummary(accountData.summary);
        setIbInfo(accountData.ibInfo);
        setReferralCodeInput(accountData.ibInfo.referralCode || '');

        // Cache the data
        setCachedData(CACHE_KEYS.ACCOUNT_DATA, accountData);
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalsSummary = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const res = await fetch('/api/user/withdrawals/summary?period=30', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const withdrawalData = json.data || { summary: { totalEarned: 0, totalPaid: 0, pending: 0, available: 0 } };
        setWithdrawSummary(withdrawalData);
        setCachedData(CACHE_KEYS.WITHDRAWAL_DATA, withdrawalData);
      }
    } catch (e) {
      console.error('Withdrawal summary fetch error:', e);
    }
  };

  // Clear cache and refresh data
  const refreshData = () => {
    clearCache();
    setDataLoaded(false);
    setLoading(true);
    fetchAccountData();
    fetchWithdrawalsSummary();
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'commission', label: 'Commission Info' }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const handleView = (item) => {
    console.log('View:', item);
  };

  const handleEdit = (item) => {
    console.log('Edit:', item);
  };

  const handleSend = (item) => {
    console.log('Send:', item);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Overview</h1>
          <p className="text-gray-600 mt-1">View your account summary and trading accounts</p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#6242a5] text-[#6242a5]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards - Light */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* IB Balance (Earnings - Approved Withdrawals) */}
            <AdminCard className="bg-green-50 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">IB Balance</p>
                  {loading && !dataLoaded ? (
                    <div className="h-7 w-28 bg-green-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-green-900">
                      ${(
                        Number(withdrawSummary?.summary?.totalEarned || 0) -
                        Number(withdrawSummary?.summary?.totalPaid || 0)
                      ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <FiDollarSign className="h-7 w-7 text-green-700" />
                </div>
              </div>
            </AdminCard>

            {/* Total IB Withdrawals (Approved) */}
            <AdminCard className="bg-orange-50 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Total IB Withdrawals</p>
                  {loading ? (
                    <div className="h-7 w-24 bg-orange-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-orange-900">
                      ${Number(withdrawSummary?.summary?.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                  <FiActivity className="h-7 w-7 text-orange-700" />
                </div>
              </div>
            </AdminCard>

            {/* Total IB Earnings */}
            <AdminCard className="bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total IB Earnings</p>
                  {loading ? (
                    <div className="h-7 w-24 bg-blue-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-900">
                      ${Number(withdrawSummary?.summary?.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiDollarSign className="h-7 w-7 text-blue-700" />
                </div>
              </div>
            </AdminCard>

            {/* Account Status */}
            <AdminCard className="bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 text-sm font-medium">Account Status</p>
                  <p className="text-xl font-bold capitalize text-emerald-900">{String(stats.accountStatus || '').toLowerCase()}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FiActivity className="h-7 w-7 text-emerald-700" />
                </div>
              </div>
            </AdminCard>
          </div>

          {/* Earnings Cards (from approved groups) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* IB Commission Earned */}
            <AdminCard className="bg-green-50 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">IB Commission Earned</p>
                  {loading ? (
                    <div className="h-6 w-24 bg-green-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-green-900">${Number(summary.totalCommission || 0).toFixed(2)}</p>
                  )}
                  {!loading && (
                    <div className="mt-1 text-xs text-green-700/80">
                      <span className="inline-block mr-2">Fixed ${Number(summary.fixedCommission || 0).toFixed(2)}</span>
                      <span className="inline-block">Spread ${Number(summary.spreadCommission || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <FiTrendingUp className="h-8 w-8 text-green-700" />
              </div>
            </AdminCard>
            {/* Spacer for alignment */}
            <div className="hidden lg:block" />
          </div>

          {/* Trades + Lots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminCard className="bg-orange-50 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Total Trades</p>
                  {loading ? (
                    <div className="h-6 w-16 bg-orange-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-900">{Number(summary.totalTrades || 0).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </AdminCard>

            <AdminCard className="bg-teal-50 border border-teal-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-700 text-sm font-medium">Traded Lots</p>
                  {loading ? (
                    <div className="h-6 w-16 bg-teal-200/60 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-teal-900">{Number(summary.totalLots || 0).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </AdminCard>
          </div>

          {/* IB Information */}
          <AdminCard>
            <div className="flex items-center gap-2 mb-6">
              <FiUsers className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">IB Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="text-gray-900">{loading ? <span className="inline-block h-4 w-40 bg-gray-200 rounded animate-pulse" /> : (ibInfo.fullName || '-')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-gray-900">{loading ? <span className="inline-block h-4 w-48 bg-gray-200 rounded animate-pulse" /> : (ibInfo.email || '-')}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="text-gray-900">{loading ? <span className="inline-block h-4 w-24 bg-gray-200 rounded animate-pulse" /> : (ibInfo.phone || 'N/A')}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Structures</label>
                  {loading ? (
                    <span className="inline-block h-5 w-24 bg-purple-100 rounded animate-pulse" />
                  ) : (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {ibInfo.commissionStructure || '—'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                  <div className="text-gray-900">{loading ? <span className="inline-block h-4 w-28 bg-gray-200 rounded animate-pulse" /> : (ibInfo.approvedDate ? new Date(ibInfo.approvedDate).toLocaleDateString() : '-')}</div>
                </div>
                {ibInfo.referralCode && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {ibInfo.fullName}'s Referral Code
                      </label>
                      {!editingReferralCode && (
                        <button
                          type="button"
                          onClick={() => setEditingReferralCode(true)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingReferralCode ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={referralCodeInput}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                              if (value.length <= 8) {
                                setReferralCodeInput(value);
                              }
                            }}
                            maxLength={8}
                            className="flex-1 text-gray-900 font-mono font-semibold text-lg bg-gray-50 px-3 py-1.5 rounded border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter referral code (max 8 chars)"
                            disabled={updatingReferralCode}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!referralCodeInput.trim()) {
                                alert('Referral code cannot be empty');
                                return;
                              }
                              if (referralCodeInput.trim().length > 8) {
                                alert('Referral code must be 8 characters or less');
                                return;
                              }
                              if (referralCodeInput.trim().toUpperCase() === ibInfo.referralCode) {
                                setEditingReferralCode(false);
                                return;
                              }
                              try {
                                setUpdatingReferralCode(true);
                                const token = localStorage.getItem('token') || localStorage.getItem('userToken');
                                const response = await fetch('/api/user/referral-code', {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    referralCode: referralCodeInput.trim().toUpperCase()
                                  })
                                });
                                if (response.ok) {
                                  const data = await response.json();
                                  if (data.success) {
                                    setIbInfo({ ...ibInfo, referralCode: referralCodeInput.trim().toUpperCase() });
                                    setEditingReferralCode(false);
                                    alert('Referral code updated successfully!');
                                  }
                                } else {
                                  const errorData = await response.json().catch(() => ({}));
                                  alert(errorData.message || 'Failed to update referral code');
                                }
                              } catch (error) {
                                console.error('Error updating referral code:', error);
                                alert('An error occurred while updating the referral code');
                              } finally {
                                setUpdatingReferralCode(false);
                              }
                            }}
                            disabled={updatingReferralCode}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingReferralCode ? 'Updating...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReferralCodeInput(ibInfo.referralCode || '');
                              setEditingReferralCode(false);
                            }}
                            disabled={updatingReferralCode}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Maximum 8 characters (letters and numbers only)
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-mono font-semibold text-lg bg-gray-50 px-3 py-1.5 rounded border border-gray-200 flex-1">
                            {ibInfo.referralCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const referralLink = `${window.location.origin}/login?referralCode=${ibInfo.referralCode}`;
                              navigator.clipboard.writeText(referralLink);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            Copy Link
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Share this link to refer new partners: <span className="font-mono text-purple-600">{window.location.origin}/login?referralCode={ibInfo.referralCode}</span>
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Quick Stats */}
          <AdminCard>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{accounts.filter(a => a.status === 'Active').length}</p>
                <p className="text-sm text-gray-600 mt-1">Active Accounts</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  ${accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600 mt-1">Combined Balance</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Accounts</p>
              </div>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <AdminCard>
              <div className="text-center py-12 text-gray-500">No accounts found</div>
            </AdminCard>
          ) : (
            <ProTable
              title="Trading Accounts"
              rows={accounts}
              columns={[
                {
                  key: 'id',
                  label: 'Account ID',
                  render: (val, row) => (
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">MT5 #{val}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 inline-block w-fit mt-1">
                        {row.accountType}
                      </span>
                    </div>
                  )
                },
                // {
                //   key: 'balance',
                //   label: 'Balance',
                //   render: (val) => (
                //     <span className="font-semibold text-gray-900">
                //       ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                //     </span>
                //   )
                // },
                // {
                //   key: 'equity',
                //   label: 'Equity',
                //   render: (val) => (
                //     <span className="font-semibold text-gray-900">
                //       ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                //     </span>
                //   )
                // },
                {
                  key: 'status',
                  label: 'Status',
                  render: (val) => (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {val}
                    </span>
                  )
                },
                {
                  key: 'commissionRate',
                  label: 'Commission Rate',
                  render: (val, row) => row.hasCommission ? (
                    <span className="text-sm text-green-700 font-medium">{val}</span>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )
                },
                {
                  key: 'commissionEarned',
                  label: 'Commission Earned',
                  render: (val, row) => (
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-green-700">${Number(val || 0).toFixed(2)}</span>
                      <span className="text-xs text-green-600">
                        Fixed: ${Number(row.commissionFixed || 0).toFixed(2)} • Spread: ${Number(row.commissionSpread || 0).toFixed(2)}
                      </span>
                    </div>
                  )
                }
              ]}
              filters={{
                searchKeys: ['id', 'accountType', 'status'],
                selects: [
                  {
                    key: 'accountType',
                    label: 'All Types',
                    options: ['Standard', 'Pro']
                  },
                  {
                    key: 'status',
                    label: 'All Status',
                    options: ['Active', 'Inactive']
                  }
                ]
              }}
              pageSize={10}
              searchPlaceholder="Search accounts..."
            />
          )}
        </div>
      )}

      {/* Commission Info Tab */}
      {activeTab === 'commission' && (
        <div className="space-y-6">
          <AdminCard>
            <div className="flex items-center gap-3 mb-6">
              <FiInfo className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">IB Commission Information</h2>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiDollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Commission Structure</p>
                    <p className="text-sm text-blue-700">{commissionInfo.commissionType}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-700">USD per Lot</p>
                  <p className="text-3xl font-bold text-blue-800 mt-1">
                    {commissionByType?.Standard?.usdPerLot != null
                      ? `$${commissionByType.Standard.usdPerLot.toFixed(2)}`
                      : commissionByType?.Pro?.usdPerLot != null
                        ? `$${commissionByType.Pro.usdPerLot.toFixed(2)}`
                        : 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-700">Spread Share</p>
                  <p className="text-3xl font-bold text-emerald-800 mt-1">
                    {commissionByType?.Standard?.spreadShare != null
                      ? `${commissionByType.Standard.spreadShare.toFixed(2)}%`
                      : commissionByType?.Pro?.spreadShare != null
                        ? `${commissionByType.Pro.spreadShare.toFixed(2)}%`
                        : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <FiInfo className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Commission is calculated based on your clients' trading activity on each account type.
              </p>
            </div>
          </AdminCard>

          {/* Additional Commission Details */}
          <AdminCard>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Commission Rates by Account Type</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">Standard Accounts</span>
                <span className="text-lg font-bold text-slate-900">
                  {commissionByType?.Standard
                    ? `$${commissionByType.Standard.usdPerLot.toFixed(2)} per lot • ${commissionByType.Standard.spreadShare.toFixed(2)}% share`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-green-700">Pro Accounts</span>
                <span className="text-lg font-bold text-green-800">
                  {commissionByType?.Pro
                    ? `$${commissionByType.Pro.usdPerLot.toFixed(2)} per lot • ${commissionByType.Pro.spreadShare.toFixed(2)}% share`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </AdminCard>
        </div>
      )}


    </div>
  );
};

export default AccountOverview;
