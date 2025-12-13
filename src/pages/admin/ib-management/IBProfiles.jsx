import React, { useState, useEffect } from 'react';
import { FiEdit, FiSave, FiX, FiUser, FiMail, FiCalendar, FiTrendingUp, FiDollarSign, FiEye, FiXCircle } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataTable from '../../../components/admin/DataTable';
import { useNavigate } from 'react-router-dom';

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
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ib-requests/profiles/approved', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/${ib.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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

  const columns = [
    {
      key: 'name',
      label: 'IB Partner',
      sortable: true,
      render: (profile) => (
        <div>
          <div className="font-medium text-gray-900">{profile.name}</div>
          <div className="text-sm text-gray-500">{profile.email}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (profile) => (
        <StatusBadge status={profile.status} />
      )
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (profile) => (
        <div className="text-sm">
          <div>{new Date(profile.joinDate).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: 'usdPerLot',
      label: 'USD per Lot',
      sortable: true,
      render: (profile) => (
        <div className="text-sm">
          <div className="font-medium">${profile.usdPerLot || 0}</div>
        </div>
      )
    },
    {
      key: 'spreadPercentagePerLot',
      label: 'Spread %',
      sortable: true,
      render: (profile) => (
        <div className="text-sm">
          <div className="font-medium">{profile.spreadPercentagePerLot || 0}%</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (profile) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewProfile(profile)}
            icon={<FiEye className="h-3 w-3" />}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUnapprove(profile)}
            disabled={unapprovingId === profile.id}
            icon={<FiXCircle className="h-3 w-3" />}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {unapprovingId === profile.id ? 'Unapproving...' : 'Unapprove'}
          </Button>
        </div>
      )
    }
  ];

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <DataTable
            data={profiles}
            columns={columns}
            emptyMessage="No approved IB profiles found"
          />
        )}
      </AdminCard>
    </div>
  );
};

export default IBProfiles;
