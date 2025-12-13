import React, { useState, useEffect } from 'react';
import { FiInfo } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const RewardHistory = () => {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({
    profitUSD: 0,
    volumeLots: 0,
    volumeMlnUSD: 0
  });
  const [volumeUnit, setVolumeUnit] = useState('mlnUSD'); // 'mlnUSD' or 'lots'

  useEffect(() => {
    fetchRewardHistory();
  }, []);

  const fetchRewardHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');

      // Fetch claimed rewards from the rewards API
      const claimsResponse = await fetch('/api/user/rewards/claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const claimsData = await claimsResponse.json();

      if (claimsResponse.ok && claimsData.success) {
        const claims = claimsData.data?.claims || [];

        // Process reward claims
        const processedRewards = claims.map((claim) => {
          // Map reward value to display format
          const rewardValue = claim.rewardValue || claim.reward_value || '';
          const rewardDescription = claim.rewardDescription || claim.reward_description || 'Reward';

          return {
            id: claim.id,
            claimId: `CLAIM-${claim.id}`,
            rewardId: claim.rewardId || claim.reward_id,
            rewardValue: rewardValue,
            rewardDescription: rewardDescription,
            rewardType: claim.rewardType || claim.reward_type || 'cash',
            status: claim.status || 'pending',
            totalVolumeMln: Number(claim.totalVolumeMln || claim.total_volume_mln || 0),
            claimedAt: claim.claimedAt || claim.claimed_at,
            updatedAt: claim.updatedAt || claim.updated_at,
            // For display compatibility
            paymentDate: claim.claimedAt || claim.claimed_at,
            orderInMT: `CLAIM-${claim.id}`,
            partnerCode: '-',
            clientCountry: '-',
            clientId: '-',
            clientAccount: '-',
            clientAccountType: '-',
            volumeLots: 0,
            volumeMlnUSD: Number(claim.totalVolumeMln || claim.total_volume_mln || 0),
            profit: 0
          };
        });

        setRewards(processedRewards);

        // Calculate stats from claims
        const totalVolumeMlnUSD = processedRewards.reduce((sum, r) => sum + r.volumeMlnUSD, 0);
        const totalVolumeLots = totalVolumeMlnUSD * 10; // Convert MLN to lots (1 MLN = 10 lots)

        setStats({
          profitUSD: 0, // Rewards don't have profit
          volumeLots: totalVolumeLots,
          volumeMlnUSD: totalVolumeMlnUSD
        });
      }
    } catch (error) {
      console.error('Error fetching reward history:', error);
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
    <AdminCard key="total-claims">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{rewards.length}</p>
        <p className="text-sm text-gray-600 mt-1">Total Claims</p>
      </div>
    </AdminCard>,
    <AdminCard key="pending-claims">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{rewards.filter(r => r.status === 'pending').length}</p>
        <p className="text-sm text-gray-600 mt-1">Pending</p>
      </div>
    </AdminCard>,
    <AdminCard key="approved-claims">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{rewards.filter(r => r.status === 'approved' || r.status === 'fulfilled').length}</p>
        <p className="text-sm text-gray-600 mt-1">Approved/Fulfilled</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reward History</h1>
        <p className="text-sm text-gray-600 mt-1">View all your claimed rewards and their status.</p>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={rewards.map(r => ({
          id: r.id,
          paymentDate: r.paymentDate,
          orderInMT: r.orderInMT,
          claimId: r.claimId,
          rewardId: r.rewardId,
          rewardDescription: r.rewardDescription,
          rewardValue: r.rewardValue,
          rewardType: r.rewardType,
          status: r.status,
          totalVolumeMln: r.totalVolumeMln,
          claimedAt: r.claimedAt,
          updatedAt: r.updatedAt,
          volume: volumeUnit === 'mlnUSD' ? r.volumeMlnUSD : r.volumeLots,
          volumeLots: r.volumeLots,
          volumeMlnUSD: r.volumeMlnUSD
        }))}
        columns={[
          {
            key: 'paymentDate',
            label: 'Claimed Date',
            sortable: true,
            render: (v) => formatDate(v)
          },
          {
            key: 'orderInMT',
            label: 'Claim ID',
            sortable: true
          },
          {
            key: 'rewardDescription',
            label: 'Reward',
            sortable: true,
            render: (v) => <span className="font-medium text-gray-900">{v}</span>
          },
          {
            key: 'rewardValue',
            label: 'Reward Value',
            sortable: true,
            render: (v) => <span className="text-brand-600 font-semibold">{v} MLN</span>
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (v) => {
              const statusColors = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'fulfilled': 'bg-blue-100 text-blue-800',
                'rejected': 'bg-red-100 text-red-800'
              };
              return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[v] || 'bg-gray-100 text-gray-800'}`}>
                  {v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Pending'}
                </span>
              );
            }
          },
          {
            key: 'volume',
            label: 'Volume at Claim',
            sortable: true,
            headerRender: (sortBy) => (
              <div className="flex flex-col items-center gap-1">
                <span>Volume at Claim</span>
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
              volumeUnit === 'mlnUSD' ? Number(row.volumeMlnUSD || 0).toFixed(2) : Number(row.volumeLots || 0).toFixed(4)
            )
          }
        ]}
        filters={{
          searchKeys: ['orderInMT', 'rewardDescription', 'rewardValue'],
          selects: [
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'fulfilled', label: 'Fulfilled' },
                { value: 'rejected', label: 'Rejected' }
              ]
            }
          ],
          dateKey: 'paymentDate'
        }}
        pageSize={10}
        searchPlaceholder="Search reward history..."
        loading={loading}
      />
    </div>
  );
};

export default RewardHistory;
