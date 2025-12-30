import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiActivity,
  FiBarChart,
  FiUsers,
  FiTarget,
  FiEye,
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiRefreshCw,
  FiTrendingDown,
  FiHash,
  FiPackage,
  FiBarChart2,
  FiLayers,
  FiPercent,
  FiCopy,
  FiCheck,
  FiDatabase,
  FiX
} from 'react-icons/fi';
import { Tree, TreeNode } from 'react-organizational-chart';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import CommissionStructureModal from '../../../components/modals/CommissionStructureModal';
import ProTable from '../../../components/common/ProTable';

const IBProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountSummary, setAccountSummary] = useState({
    totals: { totalAccounts: 0, totalBalance: 0, totalEquity: 0 },
    accounts: [],
    trades: [],
    tradeSummary: { totalTrades: 0, totalVolume: 0, totalProfit: 0, totalIbCommission: 0 }
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [tradeHistory, setTradeHistory] = useState({ trades: [], total: 0, page: 1, pageSize: 50 });
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradePage, setTradePage] = useState(1);
  const [tradePageSize, setTradePageSize] = useState(100);
  const [nextSyncSeconds, setNextSyncSeconds] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);
  const [editingReferralCode, setEditingReferralCode] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [updatingReferralCode, setUpdatingReferralCode] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const scrollRef = useRef(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [referredUsersLoading, setReferredUsersLoading] = useState(false);
  const [showUserAccountsModal, setShowUserAccountsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [userAccountsLoading, setUserAccountsLoading] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);
  const [allAccountsLoading, setAllAccountsLoading] = useState(false);
  const [syncingCommission, setSyncingCommission] = useState(false);
  const [withdrawalSummary, setWithdrawalSummary] = useState({ totalPaid: 0 });

  const startPan = (e) => {
    if (!scrollRef.current) return;
    setIsPanning(true);
    panRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: scrollRef.current.scrollLeft,
      top: scrollRef.current.scrollTop
    };
  };

  const onPan = (e) => {
    if (!isPanning || !scrollRef.current) return;
    const dx = e.clientX - panRef.current.x;
    const dy = e.clientY - panRef.current.y;
    scrollRef.current.scrollLeft = panRef.current.left - dx;
    scrollRef.current.scrollTop = panRef.current.top - dy;
  };

  const endPan = () => setIsPanning(false);

  // Render a node and its children recursively
  const DynamicTreeNode = ({ node }) => {
    return (
      <TreeNode
        label={
          <div className="inline-block w-80 bg-white border-2 border-gray-300 rounded-lg p-2 shadow-sm">
            <div className="text-sm font-bold text-gray-900 truncate" title={node.name}>{node.name}</div>
            <div className="text-xs text-gray-600 truncate" title={node.email}>{node.email}</div>
            {node.status === 'trader' && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">TRADER</span>
              </div>
            )}
            <table className="w-full mt-0.5 text-[11px] text-gray-700 border border-gray-200 rounded table-fixed">
              <colgroup>
                <col style={{ width: '60%' }} />
                <col style={{ width: '40%' }} />
              </colgroup>
              <tbody>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Accounts</td>
                  <td className="py-0.5 pr-2 text-right font-medium">{Number(node.accountsCount || 0)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Own Lots</td>
                  <td className="py-0.5 pr-2 text-right font-medium">{Number(node.ownLots || 0).toFixed(2)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Team Lots</td>
                  <td className="py-0.5 pr-2 text-right font-medium">{Number(node.teamLots || 0).toFixed(2)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Trades</td>
                  <td className="py-0.5 pr-2 text-right font-medium">{Number(node.tradeCount || 0)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Fixed Commission</td>
                  <td className="py-0.5 pr-2 text-right">${Number(node.fixedCommission || 0).toFixed(2)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2">Spread Commission</td>
                  <td className="py-0.5 pr-2 text-right">${Number(node.spreadCommission || 0).toFixed(2)}</td>
                </tr>
                <tr className="odd:bg-gray-50">
                  <td className="py-0.5 pl-2 font-semibold text-green-700">IB Commission</td>
                  <td className="py-0.5 pr-2 text-right font-bold text-green-700">${Number(node.ibCommissionTotal || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            {Array.isArray(node.structures) && node.structures.length > 0 && (
              <table className="w-full mt-1 text-[10px] border border-brand-200 rounded table-fixed">
                <colgroup>
                  <col style={{ width: '50%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-center font-medium align-middle py-1">Plan</th>
                    <th className="text-center font-medium align-middle py-1">$/lot</th>
                    <th className="text-center font-medium align-middle py-1">Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {node.structures.slice(0, 3).map((s, i) => (
                    <tr key={i} className="odd:bg-brand-50/40">
                      <td className="py-1 pl-2 align-middle"><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200 leading-tight whitespace-nowrap">{s.structureName || 'Plan'}</span></td>
                      <td className="py-1 text-right align-middle">{Number(s.usdPerLot || 0).toFixed(2)}</td>
                      <td className="py-1 text-right pr-1 align-middle">{Number(s.spreadSharePercentage || 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        }
      >
        {Array.isArray(node.children) && node.children.map((child, idx) => (
          <DynamicTreeNode key={child.id || idx} node={child} />
        ))}
      </TreeNode>
    );
  };

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (isMounted) {
        await fetchProfile();
      }
    };
    loadProfile();

    // Auto-sync commission every 5 minutes for this IB
    const syncCommission = async () => {
      if (!isMounted) return;
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/ib-requests/profiles/${id}/sync-commission`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log(`[Auto-sync] Commission synced for IB ${id}`);
            // Refresh profile data after sync
            if (isMounted) {
              await fetchProfile();
            }
          }
        }
      } catch (error) {
        console.error('Error auto-syncing commission:', error);
      }
    };

    // Initial sync after 5 minutes
    const initialSyncTimer = setTimeout(syncCommission, 5 * 60 * 1000);

    // Then sync every 5 minutes
    const syncInterval = setInterval(syncCommission, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearTimeout(initialSyncTimer);
      clearInterval(syncInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (profile?.referralCode) {
      setReferralCodeInput(profile.referralCode);
    }
  }, [profile?.referralCode]);

  const handleUpdateReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      alert('Referral code cannot be empty');
      return;
    }

    if (referralCodeInput.trim().length > 8) {
      alert('Referral code must be 8 characters or less');
      return;
    }

    if (referralCodeInput.trim().toUpperCase() === profile.referralCode) {
      setEditingReferralCode(false);
      return;
    }

    try {
      setUpdatingReferralCode(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/${id}/referral-code`, {
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
          // Update local state
          setProfile({ ...profile, referralCode: referralCodeInput.trim().toUpperCase() });
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
  };

  const handleSyncCommission = async () => {
    try {
      setSyncingCommission(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/profiles/${id}/sync-commission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : { success: false, message: 'Empty response from server' };
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text().catch(() => 'Could not read response'));
        alert('Server returned an invalid response. Check console for details.');
        return;
      }

      if (response.ok && data.success) {
        alert('Commission synced and saved to database successfully!');
        // Refresh profile data to show updated commission
        await fetchProfile();
      } else {
        alert(data.message || 'Failed to sync commission');
      }
    } catch (error) {
      console.error('Error syncing commission:', error);
      alert(`An error occurred while syncing commission: ${error.message}`);
    } finally {
      setSyncingCommission(false);
    }
  };

  const handleCancelEditReferralCode = () => {
    setReferralCodeInput(profile?.referralCode || '');
    setEditingReferralCode(false);
  };

  const handleUpdateCommissionStructures = async (groupsData) => {
    try {
      setUpdatingCommission(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/${id}/commission-structures`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groups: groupsData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh profile data
          await fetchProfile();
          setShowCommissionModal(false);
          alert('Commission structures updated successfully!');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update commission structures');
      }
    } catch (error) {
      console.error('Error updating commission structures:', error);
      throw error;
    } finally {
      setUpdatingCommission(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/admin/ib-requests/profiles/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const p = data.data.profile;
        setProfile(p);
        // Hydrate visible sections immediately from the same payload
        if (p?.tradingAccounts || p?.accountStats) {
          const accountsHydrated = (p.tradingAccounts || []).map(a => ({
            accountId: a.accountId || a.mtsId,
            balance: Number(a.balance || 0),
            equity: Number(a.equity || 0),
            margin: Number(a.margin || 0),
            profit: Number(a.profit || 0),
            marginFree: Number(a.marginFree || 0),
            group: a.group || 'Loading...',
            ibCommission: Number(a.ibCommission || 0),
            isEligibleForCommission: a.isEligibleForCommission || false,
            commissionStructure: a.commissionStructure || null,
            usdPerLot: Number(a.usdPerLot || 0),
            spreadSharePercentage: Number(a.spreadSharePercentage || 0)
          }));

          const hydrated = {
            totals: p.accountStats || { totalAccounts: accountsHydrated.length, totalBalance: 0, totalEquity: 0 },
            accounts: accountsHydrated,
            trades: [],
            tradeSummary: p.tradeSummary || { totalTrades: 0, totalVolume: 0, totalProfit: 0, totalIbCommission: 0 }
          };
          setAccountSummary(hydrated);
          if (accountsHydrated.length > 0) {
            setSelectedAccountId((prev) => prev || accountsHydrated[0].accountId);
          }
        }
        // No group filter in trade history
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalSummary = async (ibRequestId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/withdrawals?ibRequestId=${ibRequestId}&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data?.withdrawals) {
        // Calculate total paid (approved, paid, completed)
        const totalPaid = data.data.withdrawals
          .filter(w => ['approved', 'paid', 'completed'].includes(w.status?.toLowerCase()))
          .reduce((sum, w) => sum + Number(w.amount || 0), 0);
        setWithdrawalSummary({ totalPaid });
        console.log('[IBProfileDetails] Fetched withdrawals:', totalPaid, 'from', data.data.withdrawals.length, 'withdrawals');
      } else {
        console.warn('[IBProfileDetails] No withdrawals found or API error:', data);
      }
    } catch (error) {
      console.error('[IBProfileDetails] Error fetching withdrawal summary:', error);
    }
  };

  useEffect(() => {
    if (!profile) return;
    // Always refresh account stats in background to replace placeholder values
    fetchAccountSummary();
    // Fetch referred users
    fetchReferredUsers();
    // Fetch all accounts
    fetchAllAccounts();
    // Fetch withdrawal summary
    if (profile.id) {
      fetchWithdrawalSummary(profile.id);
    }
  }, [profile]);

  const fetchReferredUsers = async () => {
    try {
      setReferredUsersLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/profiles/${id}/referred-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[fetchReferredUsers] Received users:', data.data.users);
          setReferredUsers(data.data.users || []);
        }
      }
    } catch (error) {
      console.error('Error fetching referred users:', error);
    } finally {
      setReferredUsersLoading(false);
    }
  };

  const fetchUserAccounts = async (userId) => {
    try {
      setUserAccountsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/profiles/${id}/user/${userId}/accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserAccounts(data.data.accounts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user accounts:', error);
    } finally {
      setUserAccountsLoading(false);
    }
  };

  const fetchAllAccounts = async () => {
    try {
      setAllAccountsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/profiles/${id}/all-accounts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('[fetchAllAccounts] Response:', data);
      if (response.ok && data.success) {
        console.log('[fetchAllAccounts] Accounts received:', data.data?.accounts?.length || 0);
        setAllAccounts(data.data?.accounts || []);
      } else {
        console.error('[fetchAllAccounts] Error response:', data);
        console.error('[fetchAllAccounts] Error message:', data.message);
        console.error('[fetchAllAccounts] Error details:', data.error);
        setAllAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      setAllAccounts([]);
    } finally {
      setAllAccountsLoading(false);
    }
  };

  const handleUserClick = async (userId) => {
    setSelectedUserId(userId);
    setShowUserAccountsModal(true);
    await fetchUserAccounts(userId);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get CRM base URL for referral links
  const getCrmBaseUrl = () => {
    const envUrl = import.meta?.env?.VITE_CRM_BASE_URL;
    if (envUrl) return envUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Default dev fallback if not configured explicitly
      return 'http://localhost:3000';
    }
    return 'https://dashboard.solitaire-ib.com';
  };

  const getReferralLink = () => {
    const baseUrl = getCrmBaseUrl();
    const referralCode = profile?.referralCode || 'YOUR_CODE';
    return `${baseUrl}/login?referralCode=${referralCode}`;
  };

  useEffect(() => {
    if (!profile) return;
    fetchTradeHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, profile]);

  // Recompute trade history once account stats (with per-lot/spread) arrive
  useEffect(() => {
    if (!profile) return;
    if (!selectedAccountId) return;
    if (!Array.isArray(accountSummary.accounts) || accountSummary.accounts.length === 0) return;
    fetchTradeHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountSummary.accounts]);

  // Auto refresh timer for trade sync every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setNextSyncSeconds((s) => {
        if (s <= 1) {
          if (selectedAccountId) {
            fetchTradeHistoryData({ sync: true });
          }
          return 300; // reset
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedAccountId]);

  const fetchAccountSummary = async () => {
    try {
      setAccountLoading(true);
      const token = localStorage.getItem('adminToken');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/admin/ib-requests/profiles/${id}/account-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const tradeStats = Array.isArray(data.data?.trades) ? data.data.trades : [];
        const lotsByAccount = tradeStats.reduce((m, r) => {
          const id = String(r.account_id || r.accountId || '');
          if (!id) return m;
          m[id] = Number(r.total_volume || r.totalLots || 0);
          return m;
        }, {});

        const accountsData = (data.data?.accounts || []).map(acc => {
          const accountId = String(acc.accountId || acc.mtsId || '');
          const totalLots = Number(lotsByAccount[accountId] || 0);
          const usdPerLot = Number(acc.usdPerLot || 0);
          const spreadPct = Number(acc.spreadSharePercentage || 0);
          const ibPerLotAmount = Number(acc.ibCommission || 0); // from DB, USD/lot portion
          const spreadAmount = totalLots * (spreadPct / 100);
          const ibCommissionTotal = ibPerLotAmount + spreadAmount;

          return {
            ...acc,
            totalLots,
            ibCommission: ibPerLotAmount,
            ibCommissionTotal,
            spreadCommissionAmount: spreadAmount,
            isEligibleForCommission: acc.isEligibleForCommission || false,
            commissionStructure: acc.commissionStructure || null,
            usdPerLot,
            spreadSharePercentage: spreadPct
          };
        });

        const summary = data.data || {};
        const merged = {
          totals: summary.totals || { totalAccounts: 0, totalBalance: 0, totalEquity: 0 },
          accounts: accountsData,
          trades: Array.isArray(summary.trades) ? summary.trades : tradeStats,
          tradeSummary: summary.tradeSummary || { totalTrades: 0, totalVolume: 0, totalProfit: 0, totalIbCommission: 0 }
        };
        setAccountSummary(merged);
        if (merged.accounts.length > 0) {
          setSelectedAccountId(prev => (prev && merged.accounts.some(acc => acc.accountId === prev) ? prev : merged.accounts[0].accountId));
        } else {
          setSelectedAccountId('');
        }
      }
    } catch (error) {
      console.error('Error fetching account summary:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  const fetchTradeHistoryData = async ({ sync = false, page = tradePage, pageSize = tradePageSize, fromDate, toDate } = {}) => {
    try {
      setTradeLoading(true);
      setTradeError('');
      const token = localStorage.getItem('adminToken');

      // If sync is requested, call the sync endpoint first
      if (sync && selectedAccountId) {
        try {
          // Use dynamic dates or defaults
          const syncFromDate = fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
          const syncToDate = toDate || new Date().toISOString();

          const syncResponse = await fetch(`/api/admin/mt5-trades/sync/${selectedAccountId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ibRequestId: profile.id,
              fromDate: syncFromDate,
              toDate: syncToDate
            })
          });

          if (!syncResponse.ok) {
            console.warn('Sync failed, continuing with cached data');
          } else {
            // After successful sync, refresh account stats
            await fetchAccountSummary();
          }
        } catch (syncError) {
          console.error('Sync error:', syncError);
        }
      }

      // Fetch trades from backend endpoint with authentication
      if (!selectedAccountId) {
        setTradeHistory({ trades: [], total: 0, page: 1, pageSize });
        return;
      }

      // Use dynamic dates or defaults (default to 1 year ago to now)
      const defaultFromDate = fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const defaultToDate = toDate || new Date().toISOString();

      // Format dates to ISO string format if needed
      const formattedFromDate = defaultFromDate.includes('T') ? defaultFromDate : `${defaultFromDate}T00:00:00Z`;
      const formattedToDate = defaultToDate.includes('T') ? defaultToDate : `${defaultToDate}T23:59:59Z`;

      const apiUrl = `/api/admin/mt5-trades/history/${selectedAccountId}?fromDate=${encodeURIComponent(formattedFromDate)}&toDate=${encodeURIComponent(formattedToDate)}&page=${page}&pageSize=${pageSize}&ibRequestId=${profile?.id || ''}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // Increased to 2 minutes for trade saving

      let response;
      try {
        response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The trade history is being saved in the background. Please refresh the page in a moment.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch trade history (${response.status})`);
      }

      const payload = await response.json().catch(() => ({}));
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];

      // Account-level config for commission
      const accountRow = accountSummary.accounts.find(a => String(a.accountId || a.mtsId) === String(selectedAccountId));
      let usdPerLot = Number(accountRow?.usdPerLot || 0);
      if (!usdPerLot && profile.groups && profile.groups.length) {
        const accGroup = accountRow?.group?.toLowerCase?.();
        const match = profile.groups.find(g => {
          const g1 = String(g.groupId || '').toLowerCase();
          const g2 = String(g.groupName || '').toLowerCase();
          return accGroup && (accGroup.includes(g1) || accGroup.includes(g2));
        });
        if (match) usdPerLot = Number(match.usdPerLot || 0);
      }
      if (!usdPerLot) usdPerLot = Number(profile?.usdPerLot || 0);

      // Resolve spread share percentage with same precedence
      let spreadPct = Number(accountRow?.spreadSharePercentage || 0);
      if (!spreadPct && profile.groups && profile.groups.length) {
        const accGroup = accountRow?.group?.toLowerCase?.();
        const match = profile.groups.find(g => {
          const g1 = String(g.groupId || '').toLowerCase();
          const g2 = String(g.groupName || '').toLowerCase();
          return accGroup && (accGroup.includes(g1) || accGroup.includes(g2));
        });
        if (match) spreadPct = Number(match.spreadSharePercentage || 0);
      }
      if (!spreadPct) spreadPct = Number(profile?.spreadPercentagePerLot || 0);

      // Map trades-closed API response format to UI format
      // trades-closed API returns: DealId, OrderId, PositionId, Login, Symbol, VolumeLots, Price, Profit, Commission, Swap, CloseTime, Comment
      const mapped = items
        .filter(t => {
          // All items from trades-closed are already closed trades, but filter out zero-profit if needed
          const profit = Number(t?.Profit || 0);
          const rawVolumeLots = Number(t?.VolumeLots || 0);
          const volumeLots = rawVolumeLots / 100; // Divide by 100 for consistency
          // Only include trades with volume and profit
          return volumeLots > 0;
        })
        .map(t => {
          // trades-closed API provides VolumeLots - divide by 100 for display and storage
          const rawLots = Number(t?.VolumeLots || 0);
          const lots = rawLots / 100; // Divide by 100 as per requirement
          const profit = Number(t?.Profit || 0);
          const dealId = String(t?.DealId || t?.OrderId || '');
          const orderId = String(t?.OrderId || t?.DealId || '');

          // Compute fixed IB commission per-lot using available rate (using divided lots)
          const ibCommission = lots * Number(usdPerLot || 0);
          const spreadCommission = lots * (Number(spreadPct || 0) / 100);

          // Parse close time (trades-closed API provides CloseTime as ISO string)
          let closeTime = null;
          const rawClose = t?.CloseTime;
          if (rawClose) {
            if (typeof rawClose === 'string') {
              try {
                closeTime = new Date(rawClose).toISOString();
              } catch (e) {
                console.warn('Failed to parse CloseTime:', rawClose);
              }
            } else if (typeof rawClose === 'number') {
              const ms = rawClose > 1e12 ? rawClose : rawClose * 1000;
              closeTime = new Date(ms).toISOString();
            }
          }

          return {
            account_id: String(selectedAccountId),
            mt5_deal_id: dealId,
            order_id: orderId,
            symbol: t?.Symbol || '-',
            volume_lots: Number(lots || 0), // Already divided by 100
            profit: Number(profit || 0),
            commission: Number(t?.Commission || 0),
            swap: Number(t?.Swap || 0),
            ib_commission: Number(ibCommission || 0),
            spread_commission: Number(spreadCommission || 0),
            group_id: accountRow?.group || null,
            close_time: closeTime
          };
        });

      // Compute overall totals for this account (all mapped trades)
      const totalsAll = mapped.reduce((acc, t) => {
        acc.lots += Number(t.volume_lots || 0);
        acc.fixed += Number(t.ib_commission || 0);
        acc.spread += Number(t.spread_commission || 0);
        return acc;
      }, { lots: 0, fixed: 0, spread: 0 });

      // Use pagination from API response if available, otherwise use client-side pagination
      const totalCount = payload?.data?.totalCount || mapped.length;
      const totalPages = payload?.data?.totalPages || Math.ceil(totalCount / pageSize);

      // If API provides pagination, use the items as-is, otherwise paginate client-side
      const paged = payload?.data?.totalPages ? mapped : mapped.slice((page - 1) * pageSize, page * pageSize);

      setTradeHistory({
        trades: paged,
        total: totalCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: totalPages,
        totals: totalsAll
      });
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setTradeError(error.message || 'Unable to load trade history');
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-600 mb-4">The requested IB profile could not be found.</p>
        <Button onClick={() => navigate('/admin/ib-management/profiles')}>
          Back to Profiles
        </Button>
      </div>
    );
  }

  const groups = Array.isArray(profile.groups) ? profile.groups : [];
  const isApprovedForGroup = (accGroup) => {
    if (!accGroup) return false;
    const g = String(accGroup).toLowerCase();
    for (const grp of groups) {
      const label = `${grp.groupId || ''} ${grp.groupName || ''}`.toLowerCase();
      if (!label) continue;
      if (
        label === g ||
        label.includes(`/${g}/`) ||
        label.endsWith(`/${g}`) ||
        label.startsWith(`${g}/`) ||
        label.includes(`-${g}-`) ||
        label.includes(` ${g} `) ||
        label.includes(g)
      ) {
        return true;
      }
    }
    return false;
  };
  const tradingAccounts = accountSummary.accounts;
  const accountStats = accountSummary.totals;
  const treeStructure = {
    ownLots: profile.treeStructure?.ownLots ?? 0,
    teamLots: profile.treeStructure?.teamLots ?? 0,
    totalTrades: profile.treeStructure?.totalTrades ?? 0,
    root: profile.treeStructure?.root || null
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
            width: 0%;
          }
          50% {
            transform: translateX(0%);
            width: 70%;
          }
          100% {
            transform: translateX(100%);
            width: 100%;
          }
        }
        .custom-chart .oc-node {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          min-width: 150px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .custom-chart .oc-node:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .custom-chart .oc-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }
        .custom-chart .oc-name {
          font-weight: 500;
          color: #374151;
          font-size: 12px;
        }
        .custom-chart .oc-link {
          stroke: #d1d5db;
          stroke-width: 2;
        }
        .custom-chart .oc-link:hover {
          stroke: #9ca3af;
          stroke-width: 3;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            icon={<FiArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/admin/ib-management/profiles')}
          >
            Back to Profiles
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUser className="h-6 w-6" />
              IB Profile Details
            </h1>
            <p className="text-gray-600">Complete overview of IB user data and performance</p>
          </div>
        </div>
        <StatusBadge status={profile.status} size="lg" />
      </div>

      {/* IB Overview Cards (light style) */}
      {(() => {
        // Prefer computing totals from currently loaded trades (table below)
        const totalsFromTrades = (() => {
          if (!Array.isArray(tradeHistory?.trades) || tradeHistory.trades.length === 0) return null;
          let fixed = 0, spread = 0, lots = 0;
          for (const t of tradeHistory.trades) {
            fixed += Number(t.ib_commission || 0);
            spread += Number(t.spread_commission || 0);
            lots += Number(t.volume_lots || 0);
          }
          return { fixed, spread, lots, total: fixed + spread, count: tradeHistory.trades.length };
        })();

        // Use commission data from ib_commission table if available (preferred)
        const commissionFromDB = profile?.commissionData;
        // Use withdrawal summary from backend if available (consistent with other pages)
        const withdrawalData = profile?.withdrawalSummary || { totalEarned: 0, totalPaid: 0, available: 0 };
        const earnings = withdrawalData.totalEarned || commissionFromDB?.totalCommission || (totalsFromTrades ? totalsFromTrades.total : 0);
        const fixedAmt = commissionFromDB?.fixedCommission || (totalsFromTrades ? totalsFromTrades.fixed : 0);
        const spreadAmt = commissionFromDB?.spreadCommission || (totalsFromTrades ? totalsFromTrades.spread : 0);
        const withdrawals = Number(withdrawalData.totalPaid || withdrawalSummary?.totalPaid || 0);
        const ibBalance = withdrawalData.available || (earnings - withdrawals);
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminCard className="bg-green-50 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">IB Balance</p>
                    <p className="text-2xl font-bold text-green-900">${ibBalance.toFixed(2)}</p>
                  </div>
                  <FiDollarSign className="h-8 w-8 text-green-700" />
                </div>
              </AdminCard>
              <AdminCard className="bg-orange-50 border border-orange-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-medium">Total IB Withdrawals</p>
                    <p className="text-2xl font-bold text-orange-900">${withdrawals.toFixed(2)}</p>
                  </div>
                  <FiActivity className="h-8 w-8 text-orange-700" />
                </div>
              </AdminCard>
              <AdminCard className="bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-medium">Total IB Earnings</p>
                    <p className="text-2xl font-bold text-blue-900">${earnings.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">Fixed ${fixedAmt.toFixed(2)} • Spread ${spreadAmt.toFixed(2)}</p>
                  </div>
                  <FiCreditCard className="h-8 w-8 text-blue-700" />
                </div>
              </AdminCard>
              <AdminCard className="bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-sm font-medium">Account Status</p>
                    <p className="text-xl font-bold capitalize text-emerald-900">{String(profile.status || '').toLowerCase()}</p>
                  </div>
                  <FiActivity className="h-8 w-8 text-emerald-700" />
                </div>
              </AdminCard>
            </div>

            <AdminCard className="bg-green-50 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">IB Commission Earned</p>
                  <p className="text-2xl font-bold text-green-900">${earnings.toFixed(2)}</p>
                  <p className="text-sm text-green-700/80">Fixed ${fixedAmt.toFixed(2)} • Spread ${spreadAmt.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncCommission}
                    disabled={syncingCommission}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-brand-200"
                    title="Sync commission and save to database"
                  >
                    <FiRefreshCw className={`h-3.5 w-3.5 ${syncingCommission ? 'animate-spin' : ''}`} />
                    <span>{syncingCommission ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                  <FiTrendingUp className="h-8 w-8 text-green-700" />
                </div>
              </div>
            </AdminCard>

            {(() => {
              const fallbackTrades = Array.isArray(profile?.groups) ? profile.groups.reduce((s, g) => s + Number(g.totalTrades || 0), 0) : 0;
              const fallbackLots = Array.isArray(profile?.groups) ? profile.groups.reduce((s, g) => s + Number(g.totalLots || 0), 0) : 0;
              const totalTrades = totalsFromTrades ? totalsFromTrades.count : (Number(accountSummary.tradeSummary?.totalTrades || 0) || fallbackTrades);
              const totalLots = totalsFromTrades ? totalsFromTrades.lots : (Number(accountSummary.tradeSummary?.totalVolume || 0) || fallbackLots);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AdminCard className="bg-orange-50 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-700 text-sm font-medium">Total Trades</p>
                        <p className="text-2xl font-bold text-orange-900">{Number(totalTrades).toLocaleString()}</p>
                      </div>
                    </div>
                  </AdminCard>
                  <AdminCard className="bg-teal-50 border border-teal-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-teal-700 text-sm font-medium">Traded Lots</p>
                        <p className="text-2xl font-bold text-teal-900">{Number(totalLots).toFixed(2)}</p>
                      </div>
                    </div>
                  </AdminCard>
                </div>
              );
            })()}
          </>
        );
      })()}

      <div>
        {/* IB Information */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-6">
            <FiUser className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">IB Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="flex items-center gap-2">
                  <FiUser className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{profile.fullName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <FiMail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{profile.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex items-center gap-2">
                  <FiPhone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{profile.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Structure Set Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Structure Set</label>
                  <button
                    onClick={() => setShowCommissionModal(true)}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <FiEdit className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                {profile.structureSet ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {profile.structureSet.name} (Stage {profile.structureSet.stage})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No structure set assigned</span>
                )}
              </div>

              {/* Commission Structures Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Commission Structures</label>
                  <button
                    onClick={() => setShowCommissionModal(true)}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <FiEdit className="h-3 w-3" />
                    Edit
                  </button>
                </div>
                {profile.commissionStructures && profile.commissionStructures.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.commissionStructures.map((structure, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800"
                      >
                        {structure}
                      </span>
                    ))}
                  </div>
                ) : (
                  <StatusBadge status={profile.ibType || 'Common'} />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approved Date</label>
                <div className="flex items-center gap-2">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {profile.approvedDate ? new Date(profile.approvedDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {profile.referralCode && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {profile.fullName}'s Referral Code
                    </label>
                    {!editingReferralCode && (
                      <button
                        type="button"
                        onClick={() => setEditingReferralCode(true)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingReferralCode ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FiHash className="h-4 w-4 text-gray-400" />
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
                          className="flex-1 text-gray-900 font-mono font-semibold text-lg bg-gray-50 px-3 py-1.5 rounded border border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Enter referral code (max 8 chars)"
                          disabled={updatingReferralCode}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateReferralCode}
                          disabled={updatingReferralCode}
                          className="px-3 py-1.5 text-sm font-medium text-dark-base bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingReferralCode ? 'Updating...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditReferralCode}
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
                        <FiHash className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 font-mono font-semibold text-lg bg-gray-50 px-3 py-1.5 rounded border border-gray-200 flex-1">
                          {profile.referralCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const referralLink = getReferralLink();
                            navigator.clipboard.writeText(referralLink).then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            });
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors flex items-center gap-2"
                        >
                          {copied ? (
                            <>
                              <FiCheck className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FiCopy className="h-4 w-4" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Share this link to refer new partners: <span className="font-mono text-brand-600">{getReferralLink()}</span>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </AdminCard>

        {/* Groups & Commission Breakdown section removed per request */}
      </div>

      {/* Users Referred by IB */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-6">
          <FiUsers className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Users Referred by IB</h2>
        </div>
        {referredUsersLoading ? (
          <div className="relative">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Loading referred users data...</p>
            <div className="space-y-3 mt-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-12 bg-gray-50 animate-pulse rounded" />
              ))}
            </div>
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="text-center py-8">
            <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No referred users found</p>
          </div>
        ) : (
          <ProTable
            title={`Referred Users (${referredUsers.length} users)`}
            rows={referredUsers}
            columns={[
              {
                key: 'email',
                label: 'User Email',
                render: (val, row) => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{val}</span>
                    {row.name && (
                      <span className="text-xs text-gray-500">{row.name}</span>
                    )}
                  </div>
                )
              },
              {
                key: 'joinDate',
                label: 'Join Date',
                render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
              },
              {
                key: 'accountCount',
                label: 'MT5 Accounts',
                render: (val) => <span className="font-medium">{val || 0}</span>
              },
              {
                key: 'totalVolume',
                label: 'Trading Volume (Lots)',
                render: (val) => <span className="font-medium">{Number(val || 0).toFixed(2)}</span>
              },
              {
                key: 'totalCommission',
                label: 'Total Commission',
                render: (val) => (
                  <span className="font-semibold text-green-700">${Number(val || 0).toFixed(2)}</span>
                )
              },
              {
                key: 'tradeCount',
                label: 'Trades',
                render: (val) => <span className="font-medium">{Number(val || 0).toLocaleString()}</span>
              },
              {
                key: 'isActive',
                label: 'Status',
                render: (val) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {val ? 'Active' : 'Inactive'}
                  </span>
                )
              },
              {
                key: 'source',
                label: 'Source',
                render: (val) => (
                  <span className="text-xs text-gray-600 capitalize">{val || 'N/A'}</span>
                )
              }
            ]}
            filters={{
              searchKeys: ['email', 'name'],
              selects: [
                {
                  key: 'isActive',
                  label: 'All Status',
                  options: ['Active', 'Inactive']
                },
                {
                  key: 'source',
                  label: 'All Sources',
                  options: [...new Set(referredUsers.map(u => u.source || 'N/A'))]
                }
              ]
            }}
            pageSize={10}
            searchPlaceholder="Search users..."
          />
        )}
      </AdminCard>

      {/* Trading Accounts - Now showing users grouped */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-6">
          <FiDatabase className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Trading Accounts (Grouped by User)</h2>
        </div>
        {accountLoading ? (
          <div className="relative">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Loading trading accounts data...</p>
            <div className="space-y-3 mt-4">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="h-12 bg-gray-50 animate-pulse rounded" />
              ))}
            </div>
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="text-center py-8">
            <FiActivity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No referred users found</p>
          </div>
        ) : (
          <ProTable
            title={`Users with Trading Accounts (${referredUsers.filter(u => u.accountCount > 0).length} users)`}
            rows={referredUsers
              .filter(user => user.accountCount > 0)
              .map(user => {
                // Calculate totals from accountSummary for this user
                const userAccounts = tradingAccounts.filter(acc => {
                  // Match by userId if available, otherwise match by email
                  return acc.userId === user.userId || acc.userEmail === user.email;
                });

                const totalBalance = userAccounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
                const totalEquity = userAccounts.reduce((sum, acc) => sum + Number(acc.equity || 0), 0);
                const totalCommission = user.totalCommission || userAccounts.reduce((sum, acc) => sum + Number(acc.ibCommission || 0), 0);

                // Get total volume from account-stats (more accurate) or fallback to referred users data
                const totalVolumeFromAccounts = userAccounts.reduce((sum, acc) => {
                  // Find matching account in accountSummary for volume data
                  const accountData = accountSummary.accounts.find(a =>
                    String(a.accountId || a.mtsId) === String(acc.accountId)
                  );
                  return sum + Number(accountData?.totalVolume || acc.totalVolume || 0);
                }, 0);
                const totalVolume = totalVolumeFromAccounts > 0 ? totalVolumeFromAccounts : (user.totalVolume || 0);

                // Get trade count from accounts or user data
                const tradeCountFromAccounts = userAccounts.reduce((sum, acc) => sum + Number(acc.tradeCount || 0), 0);
                const tradeCount = tradeCountFromAccounts > 0 ? tradeCountFromAccounts : (user.tradeCount || 0);

                return {
                  userId: user.userId,
                  email: user.email,
                  name: user.name,
                  accountCount: user.accountCount,
                  totalBalance,
                  totalEquity,
                  totalCommission,
                  totalVolume,
                  tradeCount,
                  isActive: user.isActive
                };
              })}
            columns={[
              {
                key: 'email',
                label: 'User',
                render: (val, row) => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{val}</span>
                    {row.name && (
                      <span className="text-xs text-gray-500">{row.name}</span>
                    )}
                  </div>
                )
              },
              {
                key: 'accountCount',
                label: 'MT5 Accounts',
                render: (val) => (
                  <span className="font-medium text-blue-600">{val || 0}</span>
                )
              },
              {
                key: 'totalBalance',
                label: 'Total Balance',
                render: (val) => `$${Number(val || 0).toFixed(2)}`
              },
              {
                key: 'totalEquity',
                label: 'Total Equity',
                render: (val) => `$${Number(val || 0).toFixed(2)}`
              },
              {
                key: 'totalCommission',
                label: 'Total Commission',
                render: (val) => (
                  <span className="font-semibold text-green-700">${Number(val || 0).toFixed(2)}</span>
                )
              },
              {
                key: 'totalVolume',
                label: 'Trading Volume (Lots)',
                render: (val) => <span className="font-medium">{Number(val || 0).toFixed(2)}</span>
              },
              {
                key: 'isActive',
                label: 'Status',
                render: (val) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {val ? 'Active' : 'Inactive'}
                  </span>
                )
              },
              {
                key: 'action',
                label: 'Action',
                sortable: false,
                render: (_, row) => (
                  <button
                    onClick={() => handleUserClick(row.userId)}
                    className="text-xs px-3 py-1.5 bg-brand-500 text-dark-base rounded hover:bg-brand-600 transition-colors"
                  >
                    View Accounts
                  </button>
                )
              }
            ]}
            filters={{
              searchKeys: ['email', 'name'],
              selects: [
                {
                  key: 'isActive',
                  label: 'All Status',
                  options: ['Active', 'Inactive']
                }
              ]
            }}
            pageSize={10}
            searchPlaceholder="Search users..."
          />
        )}
      </AdminCard>

      {/* All MT5 Accounts from Referred Users */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-6">
          <FiDatabase className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Client Accounts</h2>
          <span className="text-sm text-gray-500 ml-2">({allAccounts.length} accounts)</span>
        </div>
        {allAccountsLoading ? (
          <div className="space-y-4 py-12">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-brand-600 h-2.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <div className="text-center text-sm text-gray-600">Loading MT5 accounts and fetching balance data...</div>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          </div>
        ) : allAccounts.length === 0 ? (
          <div className="text-center py-12">
            <FiDatabase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No MT5 accounts found for referred users</p>
            <p className="text-sm text-gray-500 mt-2">Check console for debugging info</p>
          </div>
        ) : (
          <ProTable
            title=""
            rows={allAccounts.map(acc => ({
              clientAccount: acc.clientAccount,
              profit: acc.profit || 0, // Use profit from getClientBalance API
              balance: acc.balance || 0,
              equity: acc.equity || 0,
              lots: acc.volumeLots || 0, // Lots from trade history
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
                sortable: true,
                render: (val) => val ? `MT5 #${val}` : 'N/A'
              },
              {
                key: 'profit',
                label: 'Profit',
                sortable: true,
                render: (v) => Number(v).toFixed(2)
              },
              {
                key: 'lots',
                label: 'Lots',
                sortable: true,
                render: (v) => Number(v || 0).toFixed(2)
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
              selects: []
            }}
            pageSize={10}
            searchPlaceholder="Search client accounts..."
            loading={allAccountsLoading}
          />
        )}
      </AdminCard>

      {/* User Accounts Modal */}
      {showUserAccountsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                MT5 Accounts for {referredUsers.find(u => u.userId === selectedUserId)?.email || 'User'}
              </h3>
              <button
                onClick={() => {
                  setShowUserAccountsModal(false);
                  setSelectedUserId(null);
                  setUserAccounts([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {userAccountsLoading ? (
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-brand-600 h-2.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <div className="text-center text-sm text-gray-600">Loading MT5 account data...</div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="h-12 bg-gray-50 animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              ) : userAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <FiActivity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No MT5 accounts found for this user</p>
                </div>
              ) : (
                <ProTable
                  title={`MT5 Accounts (${userAccounts.length} accounts)`}
                  rows={userAccounts.map(account => {
                    const isSelected = selectedAccountId === account.accountId;
                    return {
                      ...account,
                      isSelected
                    };
                  })}
                  columns={[
                    {
                      key: 'accountId',
                      label: 'Account',
                      render: (val, row) => (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">MT5 #{val}</span>
                          {row.isEligibleForCommission && row.commissionStructure && (
                            <span className="text-xs font-medium text-green-700 mt-0.5">
                              {row.commissionStructure}
                            </span>
                          )}
                        </div>
                      )
                    },
                    { key: 'group', label: 'Group' },
                    {
                      key: 'balance',
                      label: 'Balance',
                      render: (val) => `$${Number(val).toFixed(2)}`
                    },
                    {
                      key: 'equity',
                      label: 'Equity',
                      render: (val) => `$${Number(val).toFixed(2)}`
                    },
                    {
                      key: 'profit',
                      label: 'Profit',
                      render: (val) => (
                        <span className={val > 0 ? 'text-green-600 font-medium' : val < 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          ${Number(val || 0).toFixed(2)}
                        </span>
                      )
                    },
                    {
                      key: 'totalCommission',
                      label: 'Commission',
                      render: (val) => (
                        <span className="font-semibold text-green-700">${Number(val || 0).toFixed(2)}</span>
                      )
                    },
                    {
                      key: 'action',
                      label: 'Action',
                      sortable: false,
                      render: (_, row) => (
                        <button
                          onClick={() => {
                            setSelectedAccountId(row.accountId);
                            setShowUserAccountsModal(false);
                          }}
                          className="text-xs px-3 py-1.5 bg-brand-500 text-dark-base rounded hover:bg-brand-600 transition-colors"
                        >
                          View Trades
                        </button>
                      )
                    }
                  ]}
                  pageSize={10}
                />
              )}
            </div>
          </div>
        </div>
      )}


      {/* Trade History */}
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Trade History</h2>
            <span className="text-sm text-gray-500">(IB Rate: ${profile.usdPerLot || 0}/lot, {profile.spreadPercentagePerLot || 0}% spread)</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accountSummary.accounts.length > 0 ? null : <option value="">No Accounts</option>}
              {accountSummary.accounts.map((account, idx) => {
                const userEmail = account.userEmail || referredUsers.find(u => u.userId === account.userId)?.email || 'Unknown';
                return (
                  <option key={account.accountId || account.mtsId || idx} value={account.accountId || account.mtsId || ''}>
                    {userEmail} - MT5 #{account.accountId || account.mtsId || ''}
                  </option>
                );
              })}
            </select>
            {/* removed group filter dropdown */}
            <div className="text-xs text-gray-500 mr-2 min-w-[110px] text-right">
              Auto sync in {String(Math.floor(nextSyncSeconds / 60)).padStart(2, '0')}:{String(nextSyncSeconds % 60).padStart(2, '0')}
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<FiRefreshCw className={`h-4 w-4 ${tradeLoading ? 'animate-spin' : ''}`} />}
              onClick={() => { setNextSyncSeconds(300); fetchTradeHistoryData({ sync: true }); }}
              disabled={tradeLoading || !selectedAccountId}
            >
              Sync
            </Button>
          </div>
        </div>

        {tradeLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-8 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : tradeError ? (
          <div className="text-red-600 text-sm">{tradeError}</div>
        ) : tradeHistory.trades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No closed trades available for the selected account.</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal ID</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lots</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fixed Commission</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Spread Commission</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IB Commission</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Close Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {tradeHistory.trades.map((trade) => {
                  const lots = Number(trade.volume_lots || 0);
                  const profit = Number(trade.profit || 0);

                  // Get account-level plan (preferred over profile defaults)
                  const accountRow = accountSummary.accounts.find(a => String(a.accountId || a.mtsId) === String(selectedAccountId));
                  // Resolve per-lot rate from account -> groups -> profile
                  let usdPerLot = Number(accountRow?.usdPerLot ?? 0);
                  if (!usdPerLot && profile.groups && profile.groups.length) {
                    const accGroup = accountRow?.group?.toLowerCase?.();
                    const match = profile.groups.find(g => {
                      const g1 = String(g.groupId || '').toLowerCase();
                      const g2 = String(g.groupName || '').toLowerCase();
                      return accGroup && (accGroup.includes(g1) || accGroup.includes(g2));
                    });
                    if (match) usdPerLot = Number(match.usdPerLot || 0);
                  }
                  if (!usdPerLot) usdPerLot = Number(profile?.usdPerLot ?? 0);

                  // Fixed commission strictly equals lots × per-lot rate
                  const fixedCommission = lots * usdPerLot;

                  // Spread share: prefer account/group-specific pct
                  let spreadPct = Number(accountRow?.spreadSharePercentage ?? 0);
                  if (!spreadPct && profile.groups && profile.groups.length) {
                    const accGroup = accountRow?.group?.toLowerCase?.();
                    const match = profile.groups.find(g => {
                      const g1 = String(g.groupId || '').toLowerCase();
                      const g2 = String(g.groupName || '').toLowerCase();
                      return accGroup && (accGroup.includes(g1) || accGroup.includes(g2));
                    });
                    if (match) spreadPct = Number(match.spreadSharePercentage || 0);
                  }
                  if (!spreadPct) spreadPct = Number(profile.spreadPercentagePerLot ?? 0);

                  // If trade payload carries explicit spread commission, prefer it
                  const tradeSpread = (
                    trade.spread_commission ?? trade.SpreadCommission ?? trade.agent_spread_commission ?? trade.AgentSpreadCommission ?? null
                  );
                  const spreadCommission = tradeSpread !== null && tradeSpread !== undefined
                    ? Math.abs(Number(tradeSpread) || 0)
                    : (lots * (spreadPct / 100));

                  const totalIbCommission = fixedCommission + spreadCommission;

                  return (
                    <tr key={`${trade.account_id}-${trade.mt5_deal_id || trade.order_id}`}>
                      <td className="px-4 py-2 font-medium text-gray-900">{trade.mt5_deal_id || trade.order_id}</td>
                      <td className="px-4 py-2 text-gray-700">{trade.symbol || '-'}</td>
                      <td className="px-4 py-2 text-gray-700">{lots.toFixed(2)}</td>
                      <td className={`px-4 py-2 font-medium ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>${profit.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-700">${fixedCommission.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-700">${spreadCommission.toFixed(2)}</td>
                      <td className="px-4 py-2 font-semibold text-green-700">${totalIbCommission.toFixed(2)}</td>
                      <td className="px-4 py-2 text-gray-600">{trade.close_time ? new Date(trade.close_time).toLocaleString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4 px-4">
              <div className="text-sm text-gray-600">
                Total: {tradeHistory.total} • Page {tradeHistory.page} of {tradeHistory.totalPages || Math.max(1, Math.ceil((tradeHistory.total || 0) / (tradeHistory.pageSize || 1)))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={tradePageSize}
                  onChange={(e) => { const size = Number(e.target.value); setTradePageSize(size); setTradePage(1); fetchTradeHistoryData({ page: 1, pageSize: size }); }}
                >
                  {[50, 100, 200, 500].map(s => (<option key={s} value={s}>{s}/page</option>))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tradeHistory.page <= 1 || tradeLoading}
                  onClick={() => { const p = Math.max(1, tradeHistory.page - 1); setTradePage(p); fetchTradeHistoryData({ page: p }); }}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(tradeHistory.totalPages ? tradeHistory.page >= tradeHistory.totalPages : tradeHistory.page >= Math.ceil((tradeHistory.total || 0) / (tradeHistory.pageSize || 1))) || tradeLoading}
                  onClick={() => { const p = tradeHistory.page + 1; setTradePage(p); fetchTradeHistoryData({ page: p }); }}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminCard>

      {/* IB Level UP History */}
      {profile.levelUpHistory && profile.levelUpHistory.length > 0 && (
        <AdminCard>
          <div className="flex items-center gap-2 mb-6">
            <FiTrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">IB Level UP History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Structure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Structure</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trading Volume (Mln. USD)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Clients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profile.levelUpHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(history.upgradedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {history.fromStructure || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {history.toStructure}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {history.tradingVolume.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {history.activeClients}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* IB Tree Structure removed per request */}
      {/* Commission Structure Update Modal */}
      {showCommissionModal && profile && (
        <CommissionStructureModal
          isOpen={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
          request={{
            id: profile.id,
            full_name: profile.fullName,
            email: profile.email
          }}
          onSave={handleUpdateCommissionStructures}
          mode="edit"
          existingGroups={profile.groups || []}
        />
      )}
    </div>
  );
};

export default IBProfileDetails;
