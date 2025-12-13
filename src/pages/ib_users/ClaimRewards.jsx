import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiMapPin, FiMonitor, FiPhone, FiLock, FiCheckCircle, FiRefreshCw, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProTable from '../../components/common/ProTable.jsx';
import Badge from '../../components/common/Badge.jsx';

// Custom SVG Icons for Rewards
const SportsCarIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const LuxuryWatchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const ClaimRewards = () => {
  const [loading, setLoading] = useState(true);
  const [totalVolumeMln, setTotalVolumeMln] = useState(0);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    }
  });
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [toastState, setToastState] = useState(null);

  const rewards = [
    {
      id: 1,
      icon: FiDollarSign,
      value: '800',
      description: '$300,000 Cash',
      target: 800, // 800 MLN USD
      type: 'cash'
    },
    {
      id: 2,
      icon: SportsCarIcon,
      value: '300',
      description: 'Luxury Sports Car',
      target: 300, // 300 MLN USD
      type: 'item'
    },
    {
      id: 3,
      icon: FiDollarSign,
      value: '100',
      description: '$40,000 Cash',
      target: 100, // 100 MLN USD
      type: 'cash'
    },
    {
      id: 4,
      icon: LuxuryWatchIcon,
      value: '50',
      description: 'A Luxury Watch',
      target: 50, // 50 MLN USD
      type: 'item'
    },
    {
      id: 5,
      icon: FiMapPin,
      value: '25',
      description: 'Luxury International Trip for 2',
      target: 25, // 25 MLN USD
      type: 'trip'
    },
    {
      id: 6,
      icon: FiMapPin,
      value: '10',
      description: 'Luxury City Break for 2',
      target: 10, // 10 MLN USD
      type: 'trip'
    },
    {
      id: 7,
      icon: FiMonitor,
      value: '5',
      description: 'High-end Electronics',
      target: 5, // 5 MLN USD
      type: 'item'
    },
    {
      id: 8,
      icon: FiPhone,
      value: '1.5',
      description: 'Smartphone',
      target: 1.5, // 1.5 MLN USD
      type: 'item'
    },
    {
      id: 9,
      icon: FiDollarSign,
      value: '0.5',
      description: '$500 Cash',
      target: 0.5, // 0.5 MLN USD
      type: 'cash'
    }
  ];

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchVolumeAndMilestones();
    fetchClaimedRewards();
    fetchUserProfile();
  }, []);

  // Toast notification system
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToastState({ id, message, type });
    setTimeout(() => setToastState(null), 4000);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/rewards/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn('[ClaimRewards] Profile endpoint returned error:', response.status);
        // Set empty profile on error so form can still be used
        setUserProfile({
          name: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          }
        });
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        setUserProfile(data.data);
      } else {
        // Set empty profile if no data
        setUserProfile({
          name: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set empty profile on error so form can still be used
      setUserProfile({
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        }
      });
    }
  };

  const fetchVolumeAndMilestones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');

      // Fetch milestones with status
      const response = await fetch('/api/user/rewards/milestones', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const volume = Number(data.data?.totalVolumeMln || 0);
        const milestoneData = data.data?.milestones || [];
        console.log('[ClaimRewards] Volume fetched:', volume, 'MLN');
        console.log('[ClaimRewards] Milestones:', milestoneData);
        setTotalVolumeMln(volume);
        setMilestones(milestoneData);
      } else {
        console.error('[ClaimRewards] Failed to fetch milestones:', data);
      }
    } catch (error) {
      console.error('Error fetching volume and milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedRewards = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/rewards/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const claimedIds = data.data?.claims?.map(c => c.rewardId) || [];
        setClaimedRewards(claimedIds);
      }
    } catch (error) {
      console.error('Error fetching claimed rewards:', error);
    }
  };

  const handleClaimReward = (reward) => {
    setSelectedReward(reward);
    // Pre-populate form with user profile data
    if (userProfile) {
      setClaimForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        address: userProfile.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        }
      });
    }
    setShowClaimForm(true);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimForm.name || !claimForm.phone || !claimForm.email) {
      showToast('Please fill in all required fields (Name, Phone, Email)', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');

      // Submit claim request
      const response = await fetch('/api/user/rewards/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          name: claimForm.name,
          phone: claimForm.phone,
          email: claimForm.email,
          address: claimForm.address
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh claimed rewards and milestones
        await fetchClaimedRewards();
        await fetchVolumeAndMilestones();
        setShowClaimForm(false);
        setClaimForm({
          name: '',
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: ''
          }
        });
        setSelectedReward(null);
        showToast('Reward claim submitted successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to submit claim. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      showToast('Error submitting claim. Please try again.', 'error');
    }
  };

  const getRewardStatus = (reward) => {
    // Check if claimed from milestones data or claimedRewards array
    const milestone = milestones.find(m => m.id === reward.id);
    const isClaimed = milestone?.claimed || claimedRewards.includes(reward.id);

    if (isClaimed) {
      return { status: 'claimed', label: 'Claimed', icon: FiCheckCircle };
    }

    // Use milestone status from API if available, otherwise calculate locally
    if (milestone) {
      if (milestone.status === 'unlocked') {
        return { status: 'unlocked', label: 'Claim Reward', icon: null };
      }
      if (milestone.status === 'locked') {
        const remaining = reward.target - totalVolumeMln;
        return { status: 'locked', label: 'Locked', remaining, icon: FiLock };
      }
    }

    // Fallback: Check if unlocked based on volume
    if (totalVolumeMln >= reward.target) {
      return { status: 'unlocked', label: 'Claim Reward', icon: null };
    }

    const remaining = reward.target - totalVolumeMln;
    return { status: 'locked', label: 'Locked', remaining, icon: FiLock };
  };

  const formatValue = (value) => {
    return `${value} MLN`;
  };

  const formatRemaining = (remaining) => {
    if (remaining >= 1) {
      return `${remaining.toFixed(2)} MLN`;
    } else if (remaining > 0) {
      // Convert to thousands (K) for values less than 1 MLN
      const thousands = remaining * 1000;
      return `${thousands.toFixed(0)}K`;
    }
    return '0 MLN';
  };

  const tableData = rewards.map(reward => {
    const status = getRewardStatus(reward);
    const IconComponent = reward.icon;

    // Calculate progress percentage
    const progress = totalVolumeMln > 0 ? Math.min((totalVolumeMln / reward.target) * 100, 100) : 0;
    const remaining = status.remaining !== undefined ? status.remaining : (reward.target - totalVolumeMln);

    // Debug logging for first 3 rewards
    if (reward.id <= 3) {
      console.log(`[ClaimRewards] Reward ${reward.id} (${reward.value} MLN):`, {
        totalVolumeMln,
        target: reward.target,
        status: status.status,
        remaining,
        progress: progress.toFixed(2) + '%'
      });
    }

    return {
      id: reward.id,
      icon: <IconComponent className="h-6 w-6 text-brand-700" />,
      value: formatValue(reward.value),
      description: reward.description,
      status: status.status,
      statusLabel: status.label,
      remaining: remaining,
      progress: progress,
      target: reward.target,
      currentVolume: totalVolumeMln,
      reward: reward
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claim Rewards</h1>
          <p className="text-gray-600 mt-1">
            Your total trading volume: <span className="font-semibold text-brand-700">{totalVolumeMln.toFixed(2)} MLN USD</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Rewards unlock based on your lifetime trading volume. Keep trading to unlock more rewards!
          </p>
        </div>
        <button
          onClick={() => {
            fetchVolumeAndMilestones();
            fetchClaimedRewards();
          }}
          disabled={loading}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <ProTable
        title=""
        kpis={[]}
        rows={tableData}
        columns={[
          {
            key: 'icon',
            label: '',
            sortable: false,
            render: (v) => (
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  {v}
                </div>
              </div>
            )
          },
          {
            key: 'value',
            label: 'Value',
            sortable: true,
            render: (v) => (
              <span className="font-bold text-gray-900">{v}</span>
            )
          },
          {
            key: 'description',
            label: 'Description',
            sortable: true
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (v, row) => {
              if (v === 'claimed') {
                return (
                  <Badge variant="success" className="flex items-center gap-1">
                    <FiCheckCircle className="h-4 w-4" />
                    <span>Claimed</span>
                  </Badge>
                );
              } else if (v === 'unlocked') {
                return (
                  <button
                    onClick={() => handleClaimReward(row.reward)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Claim Reward
                  </button>
                );
              } else {
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FiLock className="h-4 w-4" />
                        <span>Locked</span>
                      </Badge>
                      {row.remaining && row.remaining > 0 && (
                        <span className="text-xs text-gray-500">
                          Need {formatRemaining(row.remaining)} more
                        </span>
                      )}
                    </div>
                    {row.progress !== undefined && row.progress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              }
            }
          }
        ]}
        filters={{
          searchKeys: ['description', 'value'],
          selects: [],
          dateKey: null
        }}
        pageSize={10}
        searchPlaceholder="Search rewards..."
        loading={loading}
      />

      {/* Claim Form Modal */}
      {showClaimForm && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Claim Reward</h2>
              <button
                onClick={() => {
                  setShowClaimForm(false);
                  setClaimForm({
                    name: '',
                    phone: '',
                    email: '',
                    address: {
                      street: '',
                      city: '',
                      state: '',
                      country: '',
                      postalCode: ''
                    }
                  });
                  setSelectedReward(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-brand-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reward:</p>
              <p className="text-lg font-semibold text-gray-900">{selectedReward.description}</p>
              <p className="text-sm text-brand-700 mt-1">Value: {formatValue(selectedReward.value)}</p>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={claimForm.name}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, name: e.target.value }))}
                  readOnly={!!userProfile?.name}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.name ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={claimForm.phone}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, phone: e.target.value }))}
                  readOnly={!!userProfile?.phone}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.phone ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={claimForm.email}
                  onChange={(e) => setClaimForm(prev => ({ ...prev, email: e.target.value }))}
                  readOnly={!!userProfile?.email}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.email ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <textarea
                  value={claimForm.address.street}
                  onChange={(e) => setClaimForm(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  readOnly={!!userProfile?.address?.street}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.address?.street ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter street address"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={claimForm.address.city}
                    onChange={(e) => setClaimForm(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    readOnly={!!userProfile?.address?.city}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.address?.city ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={claimForm.address.state}
                    onChange={(e) => setClaimForm(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    readOnly={!!userProfile?.address?.state}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.address?.state ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="State/Province"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={claimForm.address.country}
                    onChange={(e) => setClaimForm(prev => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value }
                    }))}
                    readOnly={!!userProfile?.address?.country}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.address?.country ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={claimForm.address.postalCode}
                    onChange={(e) => setClaimForm(prev => ({
                      ...prev,
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                    readOnly={!!userProfile?.address?.postalCode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${userProfile?.address?.postalCode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Postal Code"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimForm(false);
                    setClaimForm({
                      name: '',
                      phone: '',
                      email: '',
                      address: {
                        street: '',
                        city: '',
                        state: '',
                        country: '',
                        postalCode: ''
                      }
                    });
                    setSelectedReward(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg font-medium transition-colors"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification - Bottom Right */}
      <AnimatePresence>
        {toastState && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl min-w-[300px] backdrop-blur-sm ${toastState.type === 'success'
                ? 'bg-brand-500 text-dark-base'
                : toastState.type === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              }`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                {toastState.type === 'success' && <FiCheck className="h-5 w-5" />}
                {toastState.type === 'error' && <FiAlertCircle className="h-5 w-5" />}
                {!toastState.type && <FiCheck className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{toastState.message}</p>
              </div>
              <button
                onClick={() => setToastState(null)}
                className="flex-shrink-0 text-dark-base/80 hover:text-dark-base transition-colors"
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

export default ClaimRewards;
