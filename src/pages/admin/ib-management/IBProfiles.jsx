import React, { useState, useEffect, useMemo } from 'react';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiCalendar, FiTrendingUp, FiDollarSign, FiEye, FiXCircle } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import ProTable from '../../../components/common/ProTable';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';

const IBProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unapprovingId, setUnapprovingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/admin/ib-requests/profiles/approved');

      if (response.ok) {
        const data = await response.json();
        setProfiles(data.data.profiles);
      } else {
        console.error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (ib) => {
    navigate(`/admin/ib-management/profiles/${ib.id}`);
  };

  const handleUnapprove = async (ib) => {
    if (!window.confirm(`Are you sure you want to unapprove "${ib.name}"? This will move the IB request back to pending status.`)) {
      return;
    }

    try {
      setUnapprovingId(ib.id);
      const response = await apiFetch(`/admin/ib-requests/${ib.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'pending',
          adminComments: 'Unapproved by admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove the unapproved profile from the list
          setProfiles(profiles.filter(p => p.id !== ib.id));
          alert(`IB "${ib.name}" has been unapproved and moved back to pending requests.`);
        } else {
          alert(`Failed to unapprove: ${data.message || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to unapprove: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error unapproving IB:', error);
      alert('An error occurred while unapproving the IB. Please try again.');
    } finally {
      setUnapprovingId(null);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'IB Partner',
      render: (val, row) => (
        <div>
          <div className="font-medium text-gray-900">{val}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <StatusBadge status={row.status} />
      )
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      render: (val, row) => (
        <div className="text-sm">
          <div>{new Date(row.joinDate).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: 'usdPerLot',
      label: 'USD per Lot',
      render: (val, row) => (
        <div className="text-sm">
          <div className="font-medium">${row.usdPerLot || 0}</div>
        </div>
      )
    },
    {
      key: 'spreadPercentagePerLot',
      label: 'Spread %',
      render: (val, row) => (
        <div className="text-sm">
          <div className="font-medium">{row.spreadPercentagePerLot || 0}%</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewProfile(row)}
            icon={<FiEye className="h-3 w-3" />}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUnapprove(row)}
            disabled={unapprovingId === row.id}
            icon={<FiXCircle className="h-3 w-3" />}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {unapprovingId === row.id ? 'Unapproving...' : 'Unapprove'}
          </Button>
        </div>
      )
    }
  ], [unapprovingId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">IB Profiles</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage individual IB profiles and settings</p>
        </div>
      </div>

      {/* IB Profiles Table */}
      <AdminCard>
        <ProTable
          rows={profiles}
          columns={columns}
          loading={loading}
          pageSize={25}
          searchPlaceholder="Search IB profiles..."
          filters={{
            searchKeys: ['name', 'email', 'status']
          }}
          emptyMessage="No approved IB profiles found"
        />
      </AdminCard>
    </div>
  );
};

export default IBProfiles;
