import React, { useState, useEffect } from 'react';
import {
   FiCopy,
   FiStar,
   FiTrendingUp,
   FiUsers,
   FiClock,
   FiDollarSign,
   FiMapPin,
   FiMonitor,
   FiPhone,
   FiCalendar,
   FiBarChart,
   FiRefreshCw,
   FiCheck,
   FiX,
   FiEdit2,
   FiLock
 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CommissionCalculatorModal from '../../components/modals/CommissionCalculatorModal';
import Badge from '../../components/common/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  const [toastState, setToastState] = useState(null);
  const [showLoyaltyDetails, setShowLoyaltyDetails] = useState(true);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'code'
  const [showEditReferralModal, setShowEditReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [updatingReferralCode, setUpdatingReferralCode] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [totalVolumeMln, setTotalVolumeMln] = useState(0);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    // Load cached data first if available
    const cachedData = localStorage.getItem('dashboard_cache');
    const cacheTimestamp = localStorage.getItem('dashboard_cache_timestamp');
    
    if (cachedData && cacheTimestamp) {
      try {
        const parsedData = JSON.parse(cachedData);
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setDashboardData(parsedData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing cached dashboard data:', error);
      }
    }
    
    // Always fetch fresh data in the background
    fetchDashboardData();
    fetchClaimedRewards();
    fetchVolumeAndMilestones();
  }, []);

  const fetchClaimedRewards = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/rewards/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setClaimedRewards(data.data?.claims || []);
      }
    } catch (error) {
      console.error('Error fetching claimed rewards:', error);
    }
  };

  const fetchVolumeAndMilestones = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/rewards/milestones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTotalVolumeMln(Number(data.data?.totalVolumeMln || 0));
        setMilestones(data.data?.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching volume and milestones:', error);
    }
  };

  useEffect(() => {
    if (dashboardData?.referralCode) {
      setReferralCodeInput(dashboardData.referralCode);
    }
  }, [dashboardData?.referralCode]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDashboardData(data.data);
        // Cache the data in localStorage
        localStorage.setItem('dashboard_cache', JSON.stringify(data.data));
        localStorage.setItem('dashboard_cache_timestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Toast notification system - attractive bottom right toast
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToastState({ id, message, type });
    setTimeout(() => setToastState(null), 4000);
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text, label = 'Copied!') => {
    if (!text) {
      showToast('Nothing to copy', 'error');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`, 'success');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`${label} copied to clipboard!`, 'success');
    }
  };

  const handleCopyLink = () => {
    const link = getCrmReferralLink();
    copyToClipboard(link, 'Partner link');
  };

  const handleCopyCode = () => {
    const code = dashboardData?.referralCode || 'YOUR_CODE';
    copyToClipboard(code, 'Partner code');
  };

  const handleEditReferralCode = () => {
    setReferralCodeInput(dashboardData?.referralCode || '');
    setShowEditReferralModal(true);
  };

  const handleSaveReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      showToast('Referral code cannot be empty', 'error');
      return;
    }

    const trimmedCode = referralCodeInput.trim().toUpperCase();
    
    if (trimmedCode.length > 8) {
      showToast('Referral code must be 8 characters or less', 'error');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      showToast('Referral code must contain only uppercase letters and numbers', 'error');
      return;
    }

    if (trimmedCode === dashboardData?.referralCode) {
      setShowEditReferralModal(false);
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
          referralCode: trimmedCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        const updatedData = {
          ...dashboardData,
          referralCode: trimmedCode
        };
        setDashboardData(updatedData);
        // Update cache
        localStorage.setItem('dashboard_cache', JSON.stringify(updatedData));
        localStorage.setItem('dashboard_cache_timestamp', Date.now().toString());
        setShowEditReferralModal(false);
        showToast('Referral code updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to update referral code', 'error');
      }
    } catch (error) {
      console.error('Error updating referral code:', error);
      showToast('An error occurred while updating the referral code', 'error');
    } finally {
      setUpdatingReferralCode(false);
    }
  };

  // Handle navigation
  const navigateTo = (path) => {
    // Assuming react-router navigation
    window.location.href = path;
  };

  // Removed partner portal referral link helpers

  // CRM signup link (referred trader)
  const getCrmBaseUrl = () => {
    const envUrl = import.meta?.env?.VITE_CRM_BASE_URL;
    if (envUrl) return envUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Default dev fallback if not configured explicitly
      return 'http://localhost:3000';
    }
    return 'https://dashboard.Soliataire Cabinet.com';
  };

  const getCrmReferralLink = () => {
    const baseUrl = getCrmBaseUrl();
    const referralCode = dashboardData?.referralCode || 'YOUR_CODE';
    return `${baseUrl}/login?referralCode=${referralCode}`;
  };

  // Custom SVG Icons for Rewards
  const SportsCarIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  );

  const LuxuryWatchIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" strokeWidth={2}/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );

  const rewards = [
    {
      id: 1,
      icon: FiDollarSign,
      value: '800',
      description: '$300,000 Cash',
      target: 800,
      type: 'cash'
    },
    {
      id: 2,
      icon: SportsCarIcon,
      value: '300',
      description: 'Luxury Sports Car',
      target: 300,
      type: 'item'
    },
    {
      id: 3,
      icon: FiDollarSign,
      value: '100',
      description: '$40,000 Cash',
      target: 100,
      type: 'cash'
    },
    {
      id: 4,
      icon: LuxuryWatchIcon,
      value: '50',
      description: 'A Luxury Watch',
      target: 50,
      type: 'item'
    },
    {
      id: 5,
      icon: FiMapPin,
      value: '25',
      description: 'Luxury International Trip for 2',
      target: 25,
      type: 'trip'
    },
    {
      id: 6,
      icon: FiMapPin,
      value: '10',
      description: 'Luxury City Break for 2',
      target: 10,
      type: 'trip'
    },
    {
      id: 7,
      icon: FiMonitor,
      value: '5',
      description: 'High-end Electronics',
      target: 5,
      type: 'item'
    },
    {
      id: 8,
      icon: FiPhone,
      value: '1.5',
      description: 'Smartphone',
      target: 1.5,
      type: 'item'
    },
    {
      id: 9,
      icon: FiDollarSign,
      value: '0.5',
      description: '$500 Cash',
      target: 0.5,
      type: 'cash'
    }
  ];

  const getRewardStatus = (reward) => {
    const milestone = milestones.find(m => m.id === reward.id);
    const isClaimed = milestone?.claimed || claimedRewards.some(c => (c.rewardId || c.reward_id) === reward.id);
    
    if (isClaimed) {
      return { status: 'claimed', label: 'Claimed' };
    }
    
    if (milestone) {
      if (milestone.status === 'unlocked') {
        return { status: 'unlocked', label: 'Claim Now' };
      }
    }
    
    if (totalVolumeMln >= reward.target) {
      return { status: 'unlocked', label: 'Claim Now' };
    }
    
    const remaining = reward.target - totalVolumeMln;
    return { status: 'locked', label: 'Locked', remaining };
  };

  const formatRemaining = (remaining) => {
    if (remaining >= 1) {
      return `${remaining.toFixed(2)} MLN`;
    } else if (remaining > 0) {
      const thousands = remaining * 1000;
      return `${thousands.toFixed(0)}K`;
    }
    return '0 MLN';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Soliataire Cabinates portal</p>
      </div>

      {/* Two Column Layout: Left (3 cards stacked) + Right (1 large card) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left Column - 3 Cards Stacked Vertically */}
        <div className="flex flex-col space-y-4">
          {/* Balance Card */}
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              <h3 className="text-sm font-medium text-gray-900">Balance</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Available Balance
              </p>
              <p className="text-3xl font-bold text-gray-900 leading-none mb-3">
                {loading ? '0.00' : (dashboardData?.availableBalance || dashboardData?.balance || 0).toFixed(2)}
                <span className="text-base font-normal text-gray-600 ml-1">USD</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Total earned {loading ? '0.00' : (dashboardData?.totalEarned || dashboardData?.totalEarning || dashboardData?.totalProfit || 0).toFixed(2)} USD
              </p>
              <p className="text-xs text-gray-400 italic mb-2">
                Balance is updated every 4 hours
              </p>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </Card>

          {/* Your Partner Link Card */}
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <h3 className="text-sm font-medium text-gray-900">Your Partner Link</h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('link')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    activeTab === 'link'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Partner link
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    activeTab === 'code'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Partner code
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2 px-8 relative">
              <p className="text-xs text-purple-600 underline break-all text-center flex-1">
                {loading ? 'Loading...' : activeTab === 'link' ? getCrmReferralLink() : (dashboardData?.referralCode || 'YOUR_CODE')}
              </p>
              {!loading && (
                <button
                  onClick={handleEditReferralCode}
                  className="flex-shrink-0 p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors"
                  title="Edit referral code"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex justify-center gap-2">
              <button
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                onClick={activeTab === 'link' ? handleCopyLink : handleCopyCode}
              >
                <FiCopy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </Card>

          {/* Knowledge Base Card */}
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h3 className="text-sm font-medium text-gray-900">Knowledge base</h3>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">
                <span
                  className="text-purple-600 underline cursor-pointer"
                  onClick={() => setShowKnowledgeBase(true)}
                >
                  Here you can find everything you need to know about our trading partnership program.
                </span>
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column - Single Combined Card */}
        <div className="flex flex-col h-full">
          <Card className="bg-white border border-gray-200 h-full" padding="p-6">
            <div className="flex flex-col h-full">
            {/* Common/Level Section */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {loading ? 'Common' : (dashboardData?.ibType || 'Common')}
                </h3>
                <FiStar className="h-4 w-4 text-purple-600" />
              </div>
              <button
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-md flex items-center gap-1.5 flex-shrink-0"
                onClick={() => navigateTo('/partner-levels')}
              >
                <FiBarChart className="h-3.5 w-3.5" />
                Partner levels
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">Your level and commission</p>
            <div className="flex items-center gap-6 mb-4">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              ) : dashboardData?.commissionStructures?.length > 0 ? (
                dashboardData.commissionStructures.slice(0, 2).map((struct, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-3xl font-bold text-purple-600 underline">{struct.spreadShare || 0}%</span>
                    <span className="text-xs text-gray-600 mt-0.5">{struct.name}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-purple-600 underline">0%</span>
                  <span className="text-xs text-gray-600 mt-0.5">No commission data</span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700"
                onClick={() => setShowCalc(true)}
              >
                <FiBarChart className="h-3.5 w-3.5" />
                Commission calculator
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Qualification Criteria Section */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Qualification criteria (0/2)</h3>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span className="text-xs text-purple-600 font-medium underline">18 Days left</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600 underline cursor-pointer">Trading volume</span>
                  <span className="text-xs text-gray-600">0 / 15 mln USD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-600">Common</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-600">Advanced</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600 underline cursor-pointer">Active clients</span>
                  <span className="text-xs text-gray-600">0 / 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-600">Common</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-600">Advanced</span>
                </div>
              </div>
            </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Commission Calculator Modal */}
      <CommissionCalculatorModal
        isOpen={Boolean(showCalc)}
        onClose={() => setShowCalc(false)}
        presets={(dashboardData?.commissionStructures || []).map(s => ({ name: s.name, usdPerLot: s.usdPerLot, spreadShare: s.spreadShare }))}
      />

      {/* Knowledge Base Modal */}
      {showKnowledgeBase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Knowledge Base</h3>
              <button onClick={() => setShowKnowledgeBase(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Partner Program Guide</h4>
                <p className="text-sm text-gray-600">Learn about our trading partnership program, commission structure, and how to grow your network.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Commission Calculator</h4>
                <p className="text-sm text-gray-600">Use our calculator to estimate your potential earnings based on trading volume.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Loyalty Program</h4>
                <p className="text-sm text-gray-600">Discover exclusive rewards and benefits for top-performing partners.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Support & Resources</h4>
                <p className="text-sm text-gray-600">Access training materials, marketing tools, and dedicated support.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Program */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Loyalty Program</h3>
          <div className="flex items-center gap-2">
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>billion USD</option>
              <option>million USD</option>
            </select>
            <span className="text-sm text-gray-600">Data is updated every 4 hours</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLoyaltyDetails(!showLoyaltyDetails)}
            >
              {showLoyaltyDetails ? 'Hide details' : 'Show details'}
            </Button>
          </div>
        </div>
        
        {showLoyaltyDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Targets */}
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Hit all three targets to claim your reward. You can choose to take the prize or receive a cash alternative.
              </p>
              
              <div className="space-y-4">
                {/* Target 1 */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Target 1</span>
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2">Qualifying Lifetime Trading Volume of clients</h4>
                  <p className="text-lg font-bold text-gray-900">500 million USD to your target</p>
                  <p className="text-sm text-gray-600">Current result: 0 USD</p>
                </div>
                
                {/* Target 2 */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Target 2</span>
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2">Qualifying Trading Volume in the past 12 months &gt; 20% of clients Qualifying Lifetime Trading Volume</h4>
                  <p className="text-lg font-bold text-gray-900">0 USD to your target</p>
                  <p className="text-sm text-gray-600">Current result: 0 USD</p>
                </div>
                
                {/* Target 3 */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Target 3</span>
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2">Number of active clients in the last 3 calendar months ≥ 10</h4>
                  <p className="text-lg font-bold text-gray-900">10 active clients until next target</p>
                  <p className="text-sm text-gray-600">Current result: 0 active clients</p>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => navigateTo('/loyalty-program')}
              >
                Learn More
              </Button>
            </div>
            
            {/* Rewards */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Qualifying Lifetime Trading Volume in million USD</h4>
              <p className="text-sm text-gray-600 mb-2">
                Your total volume: <span className="font-semibold text-purple-600">{totalVolumeMln.toFixed(2)} MLN USD</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">Reach milestones and claim your rewards!</p>
              
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {rewards.map((reward) => {
                  const status = getRewardStatus(reward);
                  const IconComponent = reward.icon;
                  const progress = totalVolumeMln > 0 ? Math.min((totalVolumeMln / reward.target) * 100, 100) : 0;
                  
                  return (
                    <div key={reward.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{reward.value} MLN</p>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                        {status.status === 'locked' && status.remaining && (
                          <p className="text-xs text-gray-500 mt-1">
                            Need {formatRemaining(status.remaining)} more
                          </p>
                        )}
                        {status.status === 'locked' && progress < 100 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {status.status === 'claimed' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <FiCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">Claimed</span>
                          </div>
                        ) : status.status === 'unlocked' ? (
                          <button
                            onClick={() => window.location.href = '/claim-rewards'}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Claim
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <FiLock className="h-4 w-4" />
                            <span className="text-xs">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Claimed Rewards Section */}
              {claimedRewards.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Your Claimed Rewards</h4>
                  <div className="space-y-2">
                    {claimedRewards.slice(0, 3).map((claim) => (
                      <div key={claim.id} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <FiCheck className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{claim.rewardDescription || claim.reward_description}</p>
                          <p className="text-xs text-gray-600">
                            Claimed: {new Date(claim.claimedAt || claim.claimed_at).toLocaleDateString()} • 
                            Status: <span className={`font-medium ${
                              claim.status === 'approved' ? 'text-green-600' :
                              claim.status === 'fulfilled' ? 'text-blue-600' :
                              claim.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {claimedRewards.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => window.location.href = '/claim-rewards'}
                      >
                        View All Claimed Rewards ({claimedRewards.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Edit Referral Code Modal */}
      <AnimatePresence>
        {showEditReferralModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-lg z-50"
              onClick={() => !updatingReferralCode && setShowEditReferralModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Referral Code</h3>
                  <button
                    onClick={() => !updatingReferralCode && setShowEditReferralModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={updatingReferralCode}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    maxLength={8}
                    disabled={updatingReferralCode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter referral code (max 8 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be uppercase letters and numbers only (max 8 characters)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditReferralModal(false)}
                    disabled={updatingReferralCode}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReferralCode}
                    disabled={updatingReferralCode || !referralCodeInput.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updatingReferralCode ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck className="h-4 w-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attractive Toast Notification - Bottom Right */}
      <AnimatePresence>
        {toastState && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl min-w-[300px] backdrop-blur-sm ${
              toastState.type === 'success' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                : toastState.type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            }`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                {toastState.type === 'success' && <FiCheck className="h-5 w-5" />}
                {toastState.type === 'error' && <FiX className="h-5 w-5" />}
                {!toastState.type && <FiCheck className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{toastState.message}</p>
              </div>
              <button
                onClick={() => setToastState(null)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
