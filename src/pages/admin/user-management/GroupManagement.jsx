import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiUserCheck, FiSettings, FiRefreshCw, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataTable from '../../../components/admin/DataTable';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/ib-requests/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data.data.groups || []);
      } else {
        console.error('Failed to fetch groups');
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
      const response = await fetch('/api/admin/ib-requests/groups/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      const response = await fetch('/api/admin/ib-requests/groups/regenerate-names', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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

  const handleEdit = (group) => {
    setEditingGroup(group.id);
    setEditForm({
      name: group.name,
      description: group.description,
      permissions: group.permissions,
      status: group.status
    });
  };

  const handleSave = () => {
    console.log('Save group:', editingGroup, editForm);
    setEditingGroup(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingGroup(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddGroup = () => {
    console.log('Add new group');
    // Open add group modal
  };

  // Enhanced editing functions for group names
  const handleEditName = (group) => {
    setEditingGroup(group.group_id);
    setEditingName(group.name);
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

      const response = await fetch(`/api/admin/ib-requests/groups/${groupId}/name`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingName.trim()
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        alert(`Success: ${data.message}`);
        await fetchGroups(); // Refresh groups after update
        setEditingGroup(null);
        setEditingName('');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          errorData = { message: errorText };
        }
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

  const columns = [
    {
      key: 'group_id',
      label: 'Group ID',
      sortable: true,
      render: (group) => <span className="font-mono text-sm">{group.group_id}</span>
    },
    {
      key: 'name',
      label: 'Group Name',
      sortable: true,
      render: (group) => {
        if (editingGroup === group.group_id) {
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
                onClick={() => handleSaveName(group.group_id)}
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
              <div className="font-medium text-gray-900">{group.name}</div>
              <div className="text-xs text-gray-500">Click to edit</div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditName(group)}
              icon={<FiEdit3 className="h-3 w-3" />}
              className="edit-button opacity-0 transition-opacity"
            />
          </div>
        );
      }
    },
    {
      key: 'memberCount',
      label: 'Members',
      sortable: true,
      render: (group) => (
        <div className="flex items-center gap-2">
          <FiUsers className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{group.memberCount}</span>
        </div>
      )
    },
    {
      key: 'commissionStructures',
      label: 'Structures',
      sortable: false,
      render: (group) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {group.commissionStructures?.length || 0} structures
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (group) => (
        editingGroup === group.id ? (
          <select
            value={editForm.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        ) : (
          <StatusBadge status={group.status} size="sm" />
        )
      )
    },
    {
      key: 'createdDate',
      label: 'Created',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (group) => (
        editingGroup === group.id ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="text-green-600 hover:text-green-700"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<FiEdit className="h-4 w-4" />}
              onClick={() => handleEdit(group)}
              className="text-blue-600 hover:text-blue-700"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<FiTrash2 className="h-4 w-4" />}
              onClick={() => console.log('Delete group:', group.id)}
              className="text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        )
      )
    }
  ];

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.is_active).length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);

  return (
    <div className="space-y-6">
      <style jsx>{`
        .group-row:hover .edit-button {
          opacity: 1 !important;
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MT5 Group Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage MT5 groups with intelligent naming and inline editing</p>
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
            variant="outline"
            size="sm"
            onClick={syncGroups}
            disabled={syncing}
            icon={<FiRefreshCw className="h-4 w-4" />}
          >
            {syncing ? 'Syncing...' : 'Sync Groups'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={handleAddGroup}
          >
            <span className="hidden sm:inline">Add Group</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">{totalGroups}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-gray-900">{activeGroups}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiUserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Members</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalMembers / totalGroups)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiSettings className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Groups Table */}
      <AdminCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable
              data={groups}
              columns={columns}
              searchable={true}
              filterable={true}
              emptyMessage="No groups available. Click 'Sync Groups' to fetch from MT5 API."
            />

            {/* Pagination could be added here if needed */}
          </>
        )}
      </AdminCard>

      {/* Permission Templates */}
      <AdminCard header="Permission Templates" icon={<FiSettings className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Basic Access</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• View reports</li>
              <li>• Basic analytics</li>
              <li>• Client list access</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Standard Access</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• All basic permissions</li>
              <li>• Manage clients</li>
              <li>• Export data</li>
              <li>• Advanced reports</li>
            </ul>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Premium Access</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• All standard permissions</li>
              <li>• Advanced analytics</li>
              <li>• API access</li>
              <li>• Custom reports</li>
            </ul>
          </div>
        </div>
      </AdminCard>

      {/* Group Statistics */}
      <AdminCard header="MT5 Group Statistics" icon={<FiUsers className="h-4 w-4" />}>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading groups...</p>
            </div>
          ) : groups.length > 0 ? (
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {groups.map(group => (
                  <div key={group.group_id} className="flex-shrink-0 w-80 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{group.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-600">ID: {group.group_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="font-medium text-sm">{group.commissionStructures?.length || 0} structures</div>
                      <div className="text-sm">
                        {group.is_active ? (
                          <span className="text-green-600">● Active</span>
                        ) : (
                          <span className="text-red-600">● Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No groups available</p>
              <p className="text-sm text-gray-500">Click "Sync Groups" to fetch groups from MT5 API</p>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
};

export default GroupManagement;
