import React, { useState, useEffect } from 'react';
import {
  FiLink,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiArrowRight,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiMail
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import EnhancedDataTable from '../../../components/admin/EnhancedDataTable';
import { apiFetch } from '../../../utils/api';

const ClientLinking = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedIBId, setSelectedIBId] = useState('');
  const [users, setUsers] = useState([]);
  const [ibs, setIbs] = useState([]);
  const [allIbs, setAllIbs] = useState([]); // Store all IBs for filtering
  const [currentLinking, setCurrentLinking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [linkingHistory, setLinkingHistory] = useState([]);
  const [stats, setStats] = useState({
    total_linkings: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [copying, setCopying] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Fetch users list from User table who are NOT under any IB
  const fetchUsers = async () => {
    try {
      const response = await apiFetch('/admin/ib-requests/unlinked-users');

      if (response.ok) {
        const data = await response.json();
        // Map the users to match our user structure
        const usersList = (data.data?.users || []).map(user => ({
          id: user.id,
          name: user.name || user.email,
          email: user.email
        }));
        setUsers(usersList);
        console.log(`[ClientLinking] Fetched ${usersList.length} unlinked users`);
      } else {
        console.error('Failed to fetch unlinked users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching unlinked users:', error);
      setUsers([]);
    }
  };

  // Fetch IB list from ib_request table (approved status only)
  const fetchIbs = async () => {
    try {
      const response = await apiFetch('/admin/ib-requests/profiles/approved');

      if (response.ok) {
        const data = await response.json();
        console.log('[ClientLinking] IB profiles response:', data);
        // Map the profiles to match our IB structure
        const ibsList = (data.data?.profiles || []).map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          ib_type: profile.ibType,
          usd_per_lot: profile.usdPerLot,
          spread_percentage_per_lot: profile.spreadPercentagePerLot,
          status: profile.status,
          approved_date: profile.approvedDate
        }));
        console.log('[ClientLinking] Mapped IBs list:', ibsList);
        setAllIbs(ibsList); // Store all IBs
        setIbs(ibsList); // Also set the displayed IBs initially
      } else {
        console.error('Failed to fetch IBs:', response.status);
        setAllIbs([]);
        setIbs([]);
      }
    } catch (error) {
      console.error('Error fetching IBs:', error);
      setAllIbs([]);
      setIbs([]);
    }
  };

  // Filter available IBs - show all IBs (users from User table are not IBs, so no filtering needed)
  const filterAvailableIbs = (ibsList, userId) => {
    // Show all IBs - users from User table are regular users, not IBs
    // So we can assign any user to any IB
    setIbs(ibsList);
  };

  // Fetch current linking info when user is selected
  const fetchCurrentLinking = async (userId) => {
    if (!userId) {
      setCurrentLinking(null);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Find the selected user (userId is UUID string, not integer)
      const selectedUser = users.find(u => u.id === userId);
      if (!selectedUser) {
        setCurrentLinking(null);
        setLoading(false);
        return;
      }

      // Fetch current IB linking from backend
      const response = await fetch(`/api/admin/ib-requests/user-linking/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLinking({
          user_id: selectedUser.id,
          user_name: selectedUser.name,
          user_email: selectedUser.email,
          current_ib_id: data.data?.ib_id || null,
          current_ib_name: data.data?.ib_name || 'None',
          direct_volume_lots: data.data?.direct_volume_lots || 0.00,
          direct_commission: data.data?.direct_commission || 0.00
        });
      } else {
        // User is not linked to any IB
        setCurrentLinking({
          user_id: selectedUser.id,
          user_name: selectedUser.name,
          user_email: selectedUser.email,
          current_ib_id: null,
          current_ib_name: 'None',
          direct_volume_lots: 0.00,
          direct_commission: 0.00
        });
      }
    } catch (error) {
      console.error('Error fetching current linking:', error);
      // On error, still show user info but with no IB
      const selectedUser = users.find(u => u.id === userId);
      if (selectedUser) {
        setCurrentLinking({
          user_id: selectedUser.id,
          user_name: selectedUser.name,
          user_email: selectedUser.email,
          current_ib_id: null,
          current_ib_name: 'None',
          direct_volume_lots: 0.00,
          direct_commission: 0.00
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch linking history
  const fetchLinkingHistory = async () => {
    try {
      setHistoryLoading(true);
      // const token = localStorage.getItem('adminToken');
      // const params = new URLSearchParams({
      //   page: pagination.page.toString(),
      //   limit: pagination.limit.toString(),
      //   ...(selectedUserId && { user_id: selectedUserId })
      // });

      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/admin/client-linkings/history?${params}`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // Mock data
      setLinkingHistory([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 1
      }));
    } catch (error) {
      console.error('Error fetching linking history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      // const token = localStorage.getItem('adminToken');
      // TODO: Replace with actual API endpoint
      // const response = await fetch('/api/admin/client-linkings/stats', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // Mock stats
      setStats({
        total_linkings: 0,
        active: 0,
        inactive: 0,
        pending: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchIbs();
      fetchStats();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchCurrentLinking(selectedUserId);
      fetchLinkingHistory();
      fetchSelectedProfile(selectedUserId);
    } else {
      // Clear history when no user is selected
      setLinkingHistory([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 1,
        page: 1
      }));
      setCurrentLinking(null);
      setSelectedProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, pagination.page]);

  // Handle user selection
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);

    // Filter available IBs when user is selected
    // Users cannot be assigned to their own IB (same ID cannot be assigned under each other)
    if (allIbs.length > 0) {
      filterAvailableIbs(allIbs, userId);
    }

    // Clear selected IB if it becomes invalid
    if (!userId) {
      setSelectedIBId('');
      // Show all IBs when no user is selected
      setIbs(allIbs);
      setSelectedProfile(null);
    } else {
      // Users from User table are not IBs, so no need to fetch IB profile
      setSelectedProfile(null);
    }
  };

  // Fetch full profile details for the selected user
  // Note: Users from User table are not IBs, so we don't need to fetch IB profile
  const fetchSelectedProfile = async (id) => {
    if (!id) {
      setSelectedProfile(null);
      return;
    }
    // Users from User table are regular users, not IBs
    // So we just set the profile to null
    setSelectedProfile(null);
  };

  // Handle move user
  const handleMoveUser = async () => {
    if (!selectedUserId || !selectedIBId) {
      Swal.fire({
        title: 'Error!',
        text: 'Please select both user and IB',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
      return;
    }

    // User IDs are UUIDs (strings), IB IDs are integers
    const selectedUser = users.find(u => String(u.id) === String(selectedUserId));
    const selectedIB = allIbs.find(ib => ib.id === parseInt(selectedIBId));

    if (!selectedUser || !selectedIB) {
      console.error('[ClientLinking] Invalid selection:', {
        selectedUserId,
        selectedIBId,
        userFound: !!selectedUser,
        ibFound: !!selectedIB,
        usersCount: users.length,
        ibsCount: allIbs.length
      });
      Swal.fire({
        title: 'Error!',
        text: 'Invalid user or IB selection',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
      return;
    }

    // Confirmation dialog with IB type details
    const ibTypeLabel = selectedIB.ib_type ? selectedIB.ib_type.charAt(0).toUpperCase() + selectedIB.ib_type.slice(1) : 'N/A';
    const result = await Swal.fire({
      title: 'Move User?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>User:</strong> ${selectedUser.name}</p>
          <p class="mb-2"><strong>Move to IB:</strong> ${selectedIB.name}</p>
          <p class="mb-2"><strong>IB Email:</strong> ${selectedIB.email}</p>
          <p class="mb-2"><strong>IB Type:</strong> ${ibTypeLabel}</p>
          ${selectedIB.usd_per_lot ? `<p class="mb-2"><strong>USD per Lot:</strong> $${selectedIB.usd_per_lot.toFixed(2)}</p>` : ''}
          ${selectedIB.spread_percentage_per_lot ? `<p class="mb-2"><strong>Spread %:</strong> ${selectedIB.spread_percentage_per_lot.toFixed(2)}%</p>` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6242a5',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Move User',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await apiFetch('/admin/ib-requests/move-user', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          user_name: selectedUser.name,
          user_email: selectedUser.email,
          assigned_ib_id: selectedIB.id,
          assigned_ib_name: selectedIB.name,
          assigned_ib_code: selectedIB.ib_type || '',
          assigned_ib_email: selectedIB.email
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to move user');
      }

      Swal.fire({
        title: 'Success!',
        text: `User moved to ${selectedIB.name} successfully`,
        icon: 'success',
        confirmButtonColor: '#c8f300',
        timer: 2000
      }).then(() => {
        // Refresh data
        fetchCurrentLinking(selectedUserId);
        fetchLinkingHistory();
        fetchStats();
        setSelectedIBId('');
      });
    } catch (error) {
      console.error('Error moving user:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to move user. Please try again.',
        icon: 'error',
        confirmButtonColor: '#c8f300'
      });
    } finally {
      setLoading(false);
    }
  };

  // History table columns
  const historyColumns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm text-gray-900">#{item.id}</span>
      )
    },
    {
      key: 'user_name',
      label: 'User',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.user_name}</div>
          <div className="text-xs text-gray-500">{item.user_email}</div>
        </div>
      )
    },
    {
      key: 'from_ib',
      label: 'From IB',
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          {item.from_ib_name ? (
            <>
              <div className="font-medium text-gray-900">{item.from_ib_name}</div>
              {item.from_ib_code && (
                <div className="text-xs text-gray-500">{item.from_ib_code}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400">None</span>
          )}
        </div>
      )
    },
    {
      key: 'to_ib',
      label: 'To IB',
      sortable: true,
      render: (item) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{item.to_ib_name}</div>
          <div className="text-xs text-gray-500">
            {item.to_ib_code && <span>{item.to_ib_code}</span>}
            {item.to_ib_type && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${item.to_ib_type === 'platinum' ? 'bg-brand-100 text-brand-800' :
                  item.to_ib_type === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                    item.to_ib_type === 'silver' ? 'bg-gray-100 text-gray-800' :
                      item.to_ib_type === 'bronze' ? 'bg-orange-100 text-orange-800' :
                        item.to_ib_type === 'advanced' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                }`}>
                {item.to_ib_type.charAt(0).toUpperCase() + item.to_ib_type.slice(1)}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (item) => (
        <StatusBadge
          status={item.action === 'moved' ? 'moved' : item.action}
        />
      )
    },
    {
      key: 'moved_by',
      label: 'Moved By',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-700">{item.moved_by_name || '-'}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-700">
          {new Date(item.created_at).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Client Linking
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Move user to another IB and manage client-to-IB linking relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FiDownload className="h-4 w-4" />}
          >
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FiRefreshCw className="h-4 w-4" />}
            onClick={() => {
              fetchUsers();
              fetchIbs();
              fetchStats();
              if (selectedUserId) {
                fetchCurrentLinking(selectedUserId);
                fetchLinkingHistory();
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Linkings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_linkings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <FiXCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Move User Section */}
      <AdminCard>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Move User to Another IB</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Input Fields */}
          <div className="space-y-6">
            {/* Select User */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={handleUserChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign To (New IB) */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Assign To (New IB)
              </label>
              <select
                value={selectedIBId}
                onChange={(e) => setSelectedIBId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
              >
                <option value="">Select an IB...</option>
                {ibs.map(ib => (
                  <option key={ib.id} value={ib.id}>
                    {ib.name} ({ib.email}) - {ib.ib_type ? ib.ib_type.charAt(0).toUpperCase() + ib.ib_type.slice(1) : 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {/* Move User Button */}
            <Button
              variant="primary"
              onClick={handleMoveUser}
              loading={loading}
              disabled={!selectedUserId || !selectedIBId || loading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              Move User
            </Button>
          </div>

          {/* Right Section - Current IB, Direct Volume & IB Info */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Current IB, Direct Volume & IB Information
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              {currentLinking ? (
                <>
                  <div className="flex items-start gap-2">
                    <FiUser className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        User: {currentLinking.user_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ({currentLinking.user_email})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiUsers className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Current IB: {currentLinking.current_ib_name || 'None'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiLink className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Direct volume: Lots {parseFloat(currentLinking.direct_volume_lots || 0).toFixed(2)} • Commission ${parseFloat(currentLinking.direct_commission || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {selectedProfile && (
                    <>
                      <div className="border-t my-3"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Full Name</label>
                            <div className="text-gray-900">{selectedProfile.fullName || selectedProfile.name}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Email</label>
                            <div className="text-gray-900">{selectedProfile.email}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Phone</label>
                            <div className="text-gray-900">{selectedProfile.phone || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Commission Structures</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Array.isArray(selectedProfile.commissionStructures) && selectedProfile.commissionStructures.length > 0 ? (
                                selectedProfile.commissionStructures.map((s, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">{s}</span>
                                ))
                              ) : (
                                <StatusBadge status={selectedProfile.ibType || 'Common'} />
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Approved Date</label>
                            <div className="text-gray-900">{selectedProfile.approvedDate ? new Date(selectedProfile.approvedDate).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          {selectedProfile.referralCode && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500">{selectedProfile.fullName || selectedProfile.name}'s Referral Code</label>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-gray-900 font-mono font-semibold bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
                                  {selectedProfile.referralCode}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = `${window.location.origin}/login?referralCode=${selectedProfile.referralCode}`;
                                    setCopying(true);
                                    navigator.clipboard.writeText(link).finally(() => setCopying(false));
                                  }}
                                >
                                  {copying ? 'Copied' : 'Copy Link'}
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Share this link to refer new partners: <span className="font-mono text-brand-600">{`${window.location.origin}/login?referralCode=${selectedProfile.referralCode}`}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {selectedUserId ? 'Loading...' : 'Select a user to view current IB and direct volume'}
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Linking History Table */}
      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Client Linking History ({pagination.total} total)
          </h2>
        </div>
        <EnhancedDataTable
          data={linkingHistory}
          columns={historyColumns}
          searchable={false}
          filterable={false}
          exportable={true}
          pagination={true}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          currentPage={pagination.page}
          loading={historyLoading}
          emptyMessage={selectedUserId ? "No linking history found" : "Select a user to view linking history"}
          onPageChange={(newPage) => {
            setPagination(prev => ({ ...prev, page: newPage }));
          }}
        />
      </AdminCard>
    </div>
  );
};

export default ClientLinking;
