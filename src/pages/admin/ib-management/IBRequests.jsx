import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheck, FiX, FiEye, FiInfo, FiDownload, FiFilter, FiUser, FiMail, FiCalendar, FiSlash, FiChevronDown } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import ActionButtons from '../../../components/admin/ActionButtons';
import EnhancedDataTable from '../../../components/admin/EnhancedDataTable';
import { useNavigate } from 'react-router-dom';
import CommissionStructureModal from '../../../components/modals/CommissionStructureModal';

// Removed old IB type system - now using groups and commission structures

// Legacy Commission Structure Modal Component (kept for backward compatibility)
const CommissionModal = ({ isOpen, onClose, request, onApprove }) => {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const groupMenuRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !request) {
      return;
    }

    const fetchApprovalOptions = async () => {
      try {
        setLoadingOptions(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/ib-requests/approval-options', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Only show groups that have commission structures
          const groupsWithStructures = data.data.groups.filter(group => group.commissionStructures && group.commissionStructures.length > 0);
          setAvailableGroups(groupsWithStructures);
          setSelectedGroups([]);
        } else {
          console.error('Failed to fetch approval options');
        }
      } catch (error) {
        console.error('Error fetching approval options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchApprovalOptions();
    setValidationError('');
    setIsGroupMenuOpen(false);
  }, [isOpen, request]);

  const handleGroupSelection = (groupId, structureId = null) => {
    const group = availableGroups.find(g => g.group_id === groupId);
    if (group) {
      // Check if group is already selected
      const isAlreadySelected = selectedGroups.some(sg => sg.groupId === groupId);

      if (!isAlreadySelected) {
        const normalizedStructureId = structureId ? Number(structureId) : null;
        const targetStructure =
          (normalizedStructureId && group.commissionStructures.find(s => s.id === normalizedStructureId)) ||
          group.commissionStructures[0];

        if (!targetStructure) {
          console.warn('No commission structure available for group', group.group_id);
          return;
        }

        setSelectedGroups(prev => [
          ...prev,
          {
            groupId: group.group_id,
            groupName: group.name,
            structureId: targetStructure.id,
            usdPerLot: targetStructure.usd_per_lot.toString(),
            spreadSharePercentage: targetStructure.spread_share_percentage.toString()
          }
        ]);
      }
    }
    setIsGroupMenuOpen(false);
  };

  const handleRemoveGroup = (groupId) => {
    setSelectedGroups(prev => prev.filter(sg => sg.groupId !== groupId));
  };

  const handleStructureChange = (groupId, structureId) => {
    setSelectedGroups(prev =>
      prev.map(sg => {
        if (sg.groupId !== groupId) return sg;
        const group = availableGroups.find(g => g.group_id === groupId);
        const structure = group?.commissionStructures.find(s => s.id === Number(structureId));
        if (!structure) {
          return {
            ...sg,
            structureId: Number(structureId) || null
          };
        }
        return {
          ...sg,
          structureId: structure.id,
          usdPerLot: structure.usd_per_lot.toString(),
          spreadSharePercentage: structure.spread_share_percentage.toString()
        };
      })
    );
  };

  const handleCommissionChange = (groupId, field, value) => {
    setSelectedGroups(prev => prev.map(sg =>
      sg.groupId === groupId
        ? { ...sg, [field]: value }
        : sg
    ));
    setValidationError('');
  };

  useEffect(() => {
    if (!isGroupMenuOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target)) {
        setIsGroupMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsGroupMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isGroupMenuOpen]);


  const handleApprove = async () => {
    if (selectedGroups.length === 0) {
      setValidationError('Please select at least one group.');
      return;
    }

    // Validate all groups have valid commission data
    for (const group of selectedGroups) {
      if (!group.structureId) {
        setValidationError(`Select a commission structure for ${group.groupName}.`);
        return;
      }

      const usdValue = Number.parseFloat(group.usdPerLot);
      const spreadValue = Number.parseFloat(group.spreadSharePercentage);

      if (!Number.isFinite(usdValue) || !Number.isFinite(spreadValue)) {
        setValidationError(`Please provide valid numeric values for ${group.groupName}.`);
        return;
      }

      if (spreadValue < 0 || spreadValue > 100 || usdValue < 0) {
        setValidationError(`Values for ${group.groupName} must be non-negative, and spread share must be between 0 and 100.`);
        return;
      }
    }

    setLoading(true);
    setValidationError('');

    try {
      const groupsData = selectedGroups.map(group => {
        const groupInfo = availableGroups.find(g => g.group_id === group.groupId);
        const structure = group.structureId ? groupInfo?.commissionStructures.find(s => s.id === group.structureId) : null;

        // Get structure name - check both structure_name and structureName fields
        const structureName = structure?.structure_name || structure?.structureName || null;
        
        console.log('[APPROVE] Group data:', {
          groupId: group.groupId,
          structureId: group.structureId,
          structure: structure,
          structureName: structureName
        });

        if (!structureName && group.structureId) {
          console.warn(`[APPROVE] Structure name not found for structureId ${group.structureId}`);
        }

        return {
          groupId: group.groupId,
          structureId: group.structureId,
          usdPerLot: Number(parseFloat(group.usdPerLot).toFixed(2)),
          spreadSharePercentage: Number(parseFloat(group.spreadSharePercentage).toFixed(2)),
          groupName: group.groupName,
          structureName: structureName || null // Send null instead of 'Custom' so backend can fetch it
        };
      });

      await onApprove(request.id, groupsData);
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      setValidationError(error?.message || 'Unable to approve the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="commission-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-3xl rounded-2xl bg-white/95 backdrop-blur shadow-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex max-h-[90vh] flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Approve IB Request</h2>
                  <p className="text-sm text-gray-500">
                    Assign the IB to an MT5 group and configure their commission structure.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {/* Applicant Info */}
                <div className="rounded-xl bg-gray-50 p-4 shadow-inner">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Applicant</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center text-sm">
                      <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{request?.full_name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiMail className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="break-all text-gray-700">{request?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Multiple Groups Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      MT5 Groups & Commission Structure
                    </label>
            <div className="relative" ref={groupMenuRef}>
              <button
                type="button"
                onClick={() => setIsGroupMenuOpen((prev) => !prev)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                disabled={loadingOptions || availableGroups.length === 0}
              >
                Add Group
                <FiChevronDown className="ml-1 h-3 w-3" />
              </button>
                      <AnimatePresence>
                        {isGroupMenuOpen && (
                          <motion.div
                            key="group-menu"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 z-10 mt-1 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                          >
                            <div className="max-h-80 overflow-y-auto py-1 text-sm text-gray-700">
                              {availableGroups
                                .filter(group => !selectedGroups.some(sg => sg.groupId === group.group_id))
                                .map((group) => (
                                  <button
                                    key={group.group_id}
                                    type="button"
                                    onClick={() => handleGroupSelection(group.group_id)}
                                    className="flex w-full flex-col gap-1 border-b border-gray-100 px-3 py-3 text-left hover:bg-blue-50 last:border-b-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-gray-900">{group.name}</div>
                                      <span className="text-xs text-gray-500">
                                        {group.commissionStructures.length} structure{group.commissionStructures.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Default: {group.commissionStructures?.[0]?.structure_name || 'N/A'} · $
                                      {group.commissionStructures?.[0]?.usd_per_lot ?? '0'}/lot ·{' '}
                                      {group.commissionStructures?.[0]?.spread_share_percentage ?? '0'}% spread
                                    </p>
                                  </button>
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Select one or more MT5 groups and apply an existing commission structure. Values will default to the structure configuration you choose.
                  </p>

                  {/* Selected Groups */}
                  <div className="space-y-4">
                    {selectedGroups.length === 0 && (
                      <p className="text-gray-500 text-sm">No groups selected yet.</p>
                    )}

                    {selectedGroups.map((selectedGroup, index) => {
                      const group = availableGroups.find(g => g.group_id === selectedGroup.groupId);
                      const structures = group?.commissionStructures || [];
                      const selectedStructure = structures.find(s => s.id === selectedGroup.structureId);

                      return (
                        <div key={selectedGroup.groupId} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{selectedGroup.groupName}</h4>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                              {selectedStructure && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {selectedStructure.structure_name}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveGroup(selectedGroup.groupId)}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Remove group"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>

                        {/* Commission Structure Selector */}
                        {structures.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Commission Structure
                            </label>
                            <select
                              value={selectedGroup.structureId || ''}
                              onChange={(e) => handleStructureChange(selectedGroup.groupId, Number(e.target.value))}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                              {structures.map(structure => (
                                <option key={structure.id} value={structure.id}>
                                  {structure.structure_name} — ${structure.usd_per_lot}/lot — {structure.spread_share_percentage}% spread
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Commission Configuration for this group */}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              USD per Lot
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={selectedGroup.usdPerLot}
                                onChange={(e) => handleCommissionChange(selectedGroup.groupId, 'usdPerLot', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                placeholder="15.00"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                                USD
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Spread Share Percentage
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={selectedGroup.spreadSharePercentage}
                                onChange={(e) => handleCommissionChange(selectedGroup.groupId, 'spreadSharePercentage', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                placeholder="50.00"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {selectedGroups.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                      <p className="text-gray-500">No groups selected. Choose a group and commission structure from the dropdown to continue.</p>
                    </div>
                  )}
                </div>


                {/* Approval Notice */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">
                    <FiCheck className="mr-2 inline h-4 w-4" />
                    Approval will set status to <span className="font-semibold">Approved</span> and assign the IB to{' '}
                    <span className="font-semibold">
                      {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''}
                    </span>{' '}
                    {selectedGroups.length > 0 && (
                      <span>
                        ({selectedGroups.map(g => {
                          const group = availableGroups.find(ag => ag.group_id === g.groupId);
                          const structure = g.structureId ? group?.commissionStructures.find(s => s.id === g.structureId) : null;
                          return `${g.groupName}${structure ? ` (${structure.structure_name})` : ''}`;
                        }).join(', ')})
                      </span>
                    )}
                    with the configured commission rates.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-white/80 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleApprove}
                  loading={loading}
                  icon={<FiCheck className="h-4 w-4" />}
                >
                  Approve
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const IBRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
    banned_requests: 0
  });
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch IB requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ib-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data.requests);
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ib-requests/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const handleViewRequest = (request) => {
    if (request.status !== 'approved') {
      window.alert('Profile becomes available once the IB is approved.');
      return;
    }
    navigate(`/admin/ib-management/profiles/${request.id}`);
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleRejectRequest = async (request) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/ib-requests/${request.id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'rejected',
            adminComments: reason
          })
        });

        if (response.ok) {
          fetchRequests();
          fetchStats();
        } else {
          console.error('Failed to reject request');
        }
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    }
  };

  const handleBanRequest = async (request) => {
    const reason = prompt('Please provide a reason for banning:');
    if (reason) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/ib-requests/${request.id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'banned',
            adminComments: reason
          })
        });

        if (response.ok) {
          fetchRequests();
          fetchStats();
        } else {
          console.error('Failed to ban request');
        }
      } catch (error) {
        console.error('Error banning request:', error);
      }
    }
  };

  const handleModalApprove = async (requestId, groupsData) => {
    const token = localStorage.getItem('adminToken');

    // If no groups data provided, use empty array
    const groupsToApprove = Array.isArray(groupsData) ? groupsData : [];

    const response = await fetch(`/api/admin/ib-requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved',
        groups: groupsToApprove.map(group => ({
          groupId: group.groupId,
          structureId: group.structureId,
          usdPerLot: group.usdPerLot,
          spreadSharePercentage: group.spreadSharePercentage
        })),
        adminComments: `Approved for ${groupsToApprove.length} group${groupsToApprove.length !== 1 ? 's' : ''}: ${groupsToApprove.map(g => `${g.groupName}${g.structureName !== 'Custom' ? ` (${g.structureName})` : ''}`).join(', ')}`
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to approve request';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message ?? errorMessage;
      } catch (parseError) {
        // ignore JSON parse errors and fall back to default message
      }

      throw new Error(errorMessage);
    }

    fetchRequests();
    fetchStats();
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'banned': return 'danger';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'APPLICANT',
      sortable: true,
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">{request.full_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{request.email || ''}</div>
        </div>
      )
    },
    {
      key: 'commissionStructures',
      label: 'IB TYPE',
      sortable: false,
      render: (request) => {
        // For approved IBs, show commission structure names
        // For pending/rejected/banned IBs, show "Not Assigned" or "N/A"
        const structures = request.commissionStructures || [];
        const isApproved = request.status?.toLowerCase() === 'approved';
        
        if (isApproved && structures.length > 0) {
          // Approved with commission structures - show them
          return (
            <div className="flex flex-col gap-1">
              {structures.map((structure, idx) => (
                <span 
                  key={idx}
                  className="inline-block px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md"
                >
                  {structure}
                </span>
              ))}
            </div>
          );
        } else if (isApproved && structures.length === 0) {
          // Approved but no structures assigned (legacy data)
          return (
            <span className="text-sm font-medium text-gray-500 italic">
              Not Assigned
            </span>
          );
        } else {
          // Pending/Rejected/Banned - show "Pending Assignment"
          return (
            <span className="text-sm font-medium text-gray-400 italic">
              Pending Assignment
            </span>
          );
        }
      }
    },
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      render: (request) => (
        <StatusBadge status={request.status} />
      )
    },
    {
      key: 'submitted_at',
      label: 'SUBMITTED',
      sortable: true,
      render: (request) => {
        if (!request.submitted_at) return <span className="text-gray-400">-</span>;
        const date = new Date(request.submitted_at);
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {date.toLocaleDateString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric' 
              })}
            </div>
            <div className="text-gray-500">
              {date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </div>
        );
      }
    },
    {
      key: 'referred_by',
      label: 'REFERRED BY',
      sortable: false,
      render: (request) => (
        request.referrer ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{request.referrer.name}</div>
            <div className="text-gray-500">{request.referrer.email}</div>
            {request.referrer.referralCode && (
              <div className="text-xs text-purple-600 font-mono mt-0.5">
                Code: {request.referrer.referralCode}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'usd_per_lot',
      label: 'COMMISSION',
      sortable: false,
      render: (request) => (
        request.usd_per_lot ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">${request.usd_per_lot}/lot</div>
            {request.spread_percentage_per_lot && (
              <div className="text-gray-500">{request.spread_percentage_per_lot}% spread</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      sortable: false,
      render: (request) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewRequest(request)}
            icon={<FiEye className="h-4 w-4" />}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
          >
            View
          </Button>
          {request.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApproveRequest(request)}
                icon={<FiCheck className="h-4 w-4" />}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleRejectRequest(request)}
                icon={<FiX className="h-4 w-4" />}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleBanRequest(request)}
                icon={<FiSlash className="h-4 w-4" />}
              >
                Ban
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'banned', label: 'Banned' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">IB Requests</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage IB applications and requests</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stats.total_requests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiUser className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-0.5 sm:mt-1">{stats.pending_requests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiCalendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Approved</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{stats.approved_requests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Rejected</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">{stats.rejected_requests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <FiX className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Banned</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 mt-0.5 sm:mt-1">{stats.banned_requests}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
               <FiSlash className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
             </div>
          </div>
        </AdminCard>
      </div>

      {/* Pending Requests Table */}
      <AdminCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending Requests</h2>
          <p className="text-sm text-gray-600">IB applications awaiting approval</p>
        </div>
        <EnhancedDataTable
          data={filteredRequests.filter(r => r.status === 'pending')}
          columns={columns.filter(col => col.key !== 'status')}
          searchable={true}
          filterable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          loading={loading}
          emptyMessage="No pending requests found"
          onExport={(data) => {
            console.log('Exporting pending data:', data);
          }}
        />
      </AdminCard>

      {/* Approved Requests Table */}
      <AdminCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Approved Requests</h2>
          <p className="text-sm text-gray-600">Approved IB partners</p>
        </div>
        <EnhancedDataTable
          data={filteredRequests.filter(r => r.status === 'approved')}
          columns={columns.filter(col => col.key !== 'status')}
          searchable={true}
          filterable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          loading={loading}
          emptyMessage="No approved requests found"
          onExport={(data) => {
            console.log('Exporting approved data:', data);
          }}
        />
      </AdminCard>

      {/* Commission Modal */}
      <CommissionModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onApprove={handleModalApprove}
      />
    </div>
  );
};

export default IBRequests;
