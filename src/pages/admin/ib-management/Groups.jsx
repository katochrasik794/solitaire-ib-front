import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiRefreshCw, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found. Redirecting to login...');
        navigate('/admin/login');
        return;
      }
      const response = await apiFetch('/admin/ib-requests/groups');

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data.groups);
      } else if (response.status === 401) {
        console.error('Unauthorized. Redirecting to login...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        console.error('Failed to fetch groups:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncGroups = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('/admin/ib-requests/groups/sync', {
        method: 'POST'
      });

      if (response.ok) {
        await fetchGroups(); // Refresh groups after sync
      } else {
        console.error('Failed to sync groups');
      }
    } catch (error) {
      console.error('Error syncing groups:', error);
    } finally {
      setSyncing(false);
    }
  };

  const regenerateNames = async () => {
    try {
      setRegenerating(true);
      const token = localStorage.getItem('adminToken');
      const response = await apiFetch('/admin/ib-requests/groups/regenerate-names', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        await fetchGroups(); // Refresh groups after regeneration
      } else {
        alert('Failed to regenerate group names');
      }
    } catch (error) {
      console.error('Error regenerating group names:', error);
      alert('Error regenerating group names');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAddCommission = (group) => {
    navigate(`/admin/ib-management/commissions/${encodeURIComponent(group)}`);
  };

  const handleEditName = (group) => {
    setEditingGroup(group.group);
    setEditingName(group.dedicated_name || '');
  };

  const handleSaveName = async (groupId) => {
    try {
      setUpdating(true);
      console.log('Attempting to update group:', { groupId, editingName });

      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('No admin token found. Please login again.');
        return;
      }

      const response = await apiFetch(`/admin/ib-requests/groups/${encodeURIComponent(groupId)}/name`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        alert(`Success: ${data.message}`);
        await fetchGroups(); // Refresh groups after update
        setEditingGroup(null);
        setEditingName('');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Failed to update group name: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error updating group name:', error);
      alert(`Network error updating group name: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditingName('');
  };

  const columns = useMemo(() => [
    {
      key: 'group',
      label: 'Group ID',
      render: (val) => <span className="font-mono text-sm">{val || '-'}</span>
    },
    {
      key: 'dedicated_name',
      label: 'Group Name',
      render: (val, row) => {
        if (editingGroup === row.group) {
          return (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter group name"
                disabled={updating}
              />
              <Button
                size="sm"
                variant="success"
                onClick={() => handleSaveName(row.group)}
                disabled={updating || !editingName.trim()}
                icon={<FiCheck className="h-3 w-3" />}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updating}
                icon={<FiX className="h-3 w-3" />}
              />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-between group-row">
            <div>
              <div className="font-medium text-gray-900">{val || 'Click to edit'}</div>
              <div className="text-xs text-gray-500">Click to edit</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditName(row)}
              icon={<FiEdit3 className="h-3 w-3" />}
              className="edit-button opacity-0 transition-opacity"
            />
          </div>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span className="text-gray-600">{val || 'N/A'}</span>
    },
    {
      key: 'commission_count',
      label: 'Structures',
      render: (val, row) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.commissionStructures?.length || 0} structures
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (val, row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleAddCommission(row.group)}
          icon={<FiPlus className="h-3 w-3" />}
        >
          Add Commission
        </Button>
      )
    }
  ], [editingGroup, editingName, updating]);

  return (
    <div className="space-y-6">
      <style>{`
        .group-row:hover .edit-button {
          opacity: 1 !important;
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MT5 Groups</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage groups synced from MT5 API with auto-generated names</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateNames}
            disabled={regenerating}
            icon={<FiEdit3 className="h-4 w-4" />}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Names'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={syncGroups}
            disabled={syncing}
            icon={<FiRefreshCw className="h-4 w-4" />}
          >
            {syncing ? 'Syncing...' : 'Sync Groups'}
          </Button>
        </div>
      </div>

      {/* Groups Table */}
      <AdminCard>
        <ProTable
          rows={groups}
          columns={columns}
          loading={loading}
          pageSize={25}
          searchPlaceholder="Search groups..."
          filters={{
            searchKeys: ['group', 'dedicated_name', 'account_type']
          }}
          emptyMessage="No groups available. Click 'Sync Groups' to fetch from API."
        />
      </AdminCard>
    </div>
  );
};

export default Groups;