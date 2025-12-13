import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import Badge from '../../../components/common/Badge';

const RewardClaimDetails = ({ claim, onClose, onStatusUpdate }) => {
  const [status, setStatus] = useState(claim.status);
  const [adminNotes, setAdminNotes] = useState(claim.adminNotes || '');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    if (status === claim.status && adminNotes === (claim.adminNotes || '')) {
      return; // No changes
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/rewards/claims/${claim.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        alert('Status updated successfully!');
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (statusValue) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      fulfilled: 'info',
      rejected: 'danger'
    };
    return (
      <Badge variant={variants[statusValue] || 'secondary'}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reward Claim Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reward Information */}
          <div className="bg-brand-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Reward Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Reward Description</p>
                <p className="font-medium text-gray-900">{claim.rewardDescription}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reward Value</p>
                <p className="font-medium text-gray-900">{claim.rewardValue} MLN USD</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reward Type</p>
                <p className="font-medium text-gray-900 capitalize">{claim.rewardType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volume at Claim</p>
                <p className="font-medium text-gray-900">{Number(claim.totalVolumeMln || 0).toFixed(2)} MLN USD</p>
              </div>
            </div>
          </div>

          {/* IB Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">IB Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">IB Name</p>
                <p className="font-medium text-gray-900">{claim.ibName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IB Email</p>
                <p className="font-medium text-gray-900">{claim.ibEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Referral Code</p>
                <p className="font-medium text-gray-900">{claim.ibReferralCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IB Type</p>
                <p className="font-medium text-gray-900 capitalize">{claim.ibType}</p>
              </div>
            </div>
          </div>

          {/* Claimant Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Claimant Information</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{claim.claimantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{claim.claimantEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{claim.claimantPhone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                {claim.address?.street && <p className="text-gray-900">{claim.address.street}</p>}
                <p className="text-gray-900">
                  {[claim.address?.city, claim.address?.state, claim.address?.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {claim.address?.country && <p className="text-gray-900">{claim.address.country}</p>}
              </div>
            </div>
          </div>

          {/* Status and Dates */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Status & Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <div className="mt-1">{getStatusBadge(claim.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Claimed Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(claim.claimedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date(claim.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {claim.adminNotes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-gray-700">{claim.adminNotes}</p>
              </div>
            </div>
          )}

          {/* Update Status Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  rows="4"
                  placeholder="Add notes about this status update..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-dark-base rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardClaimDetails;

