import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiArrowLeft } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataTable from '../../../components/admin/DataTable';

const GroupCommissions = () => {
  const params = useParams();
  const groupId = params['*']; // For wildcard route
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({
    structureName: '',
    usdPerLot: '',
    spreadSharePercentage: '',
    levelOrder: '',
    minTradingVolume: '',
    maxTradingVolume: '',
    minActiveClients: ''
  });

  useEffect(() => {
    fetchStructures();
  }, [groupId]);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/groups/${groupId}/commissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStructures(data.data.structures);
      } else {
        console.error('Failed to fetch structures');
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      structureName: item.structure_name,
      usdPerLot: item.usd_per_lot,
      spreadSharePercentage: item.spread_share_percentage,
      isActive: item.is_active,
      levelOrder: item.level_order || '',
      minTradingVolume: item.min_trading_volume || '',
      maxTradingVolume: item.max_trading_volume || '',
      minActiveClients: item.min_active_clients || ''
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/commissions/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structureName: editForm.structureName,
          usdPerLot: parseFloat(editForm.usdPerLot),
          spreadSharePercentage: parseFloat(editForm.spreadSharePercentage),
          isActive: editForm.isActive,
          levelOrder: editForm.levelOrder ? parseInt(editForm.levelOrder) : null,
          minTradingVolume: editForm.minTradingVolume ? parseFloat(editForm.minTradingVolume) : null,
          maxTradingVolume: editForm.maxTradingVolume ? parseFloat(editForm.maxTradingVolume) : null,
          minActiveClients: editForm.minActiveClients ? parseInt(editForm.minActiveClients) : null
        })
      });

      if (response.ok) {
        await fetchStructures();
        setEditingId(null);
        setEditForm({});
      } else {
        console.error('Failed to update structure');
      }
    } catch (error) {
      console.error('Error updating structure:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNew = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/ib-requests/groups/${groupId}/commissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          structureName: newForm.structureName,
          usdPerLot: parseFloat(newForm.usdPerLot),
          spreadSharePercentage: parseFloat(newForm.spreadSharePercentage),
          levelOrder: newForm.levelOrder ? parseInt(newForm.levelOrder) : 1,
          minTradingVolume: newForm.minTradingVolume ? parseFloat(newForm.minTradingVolume) : 0,
          maxTradingVolume: newForm.maxTradingVolume ? parseFloat(newForm.maxTradingVolume) : null,
          minActiveClients: newForm.minActiveClients ? parseInt(newForm.minActiveClients) : 0
        })
      });

      if (response.ok) {
        await fetchStructures();
        setShowAddForm(false);
        setNewForm({
          structureName: '',
          usdPerLot: '',
          spreadSharePercentage: '',
          levelOrder: '',
          minTradingVolume: '',
          maxTradingVolume: '',
          minActiveClients: ''
        });
      } else {
        console.error('Failed to create structure');
      }
    } catch (error) {
      console.error('Error creating structure:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this commission structure?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/admin/ib-requests/commissions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await fetchStructures();
        } else {
          console.error('Failed to delete structure');
        }
      } catch (error) {
        console.error('Error deleting structure:', error);
      }
    }
  };

  const columns = [
    {
      key: 'level_order',
      label: 'Level',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-brand-600">Level {item.level_order || 1}</span>
      )
    },
    {
      key: 'structure_name',
      label: 'Structure Name',
      sortable: true,
      render: (item) => (
        <span className="font-medium">{item.structure_name}</span>
      )
    },
    {
      key: 'usd_per_lot',
      label: 'USD per Lot',
      sortable: true,
      render: (item) => (
        editingId === item.id ? (
          <input
            type="number"
            step="0.01"
            value={editForm.usdPerLot}
            onChange={(e) => setEditForm(prev => ({ ...prev, usdPerLot: e.target.value }))}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        ) : (
          <span className="font-medium">${item.usd_per_lot}</span>
        )
      )
    },
    {
      key: 'spread_share_percentage',
      label: 'Spread %',
      sortable: true,
      render: (item) => (
        editingId === item.id ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={editForm.spreadSharePercentage}
              onChange={(e) => setEditForm(prev => ({ ...prev, spreadSharePercentage: e.target.value }))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
        ) : (
          <span className="font-medium">{item.spread_share_percentage}%</span>
        )
      )
    },
    {
      key: 'qualification',
      label: 'Qualification Criteria',
      sortable: false,
      render: (item) => (
        <div className="text-sm">
          <div className="text-gray-600">
            Volume: {item.min_trading_volume ? `${item.min_trading_volume}${item.max_trading_volume ? ` - ${item.max_trading_volume}` : '+'} Mln. USD` : '0+ Mln. USD'}
          </div>
          <div className="text-gray-600">
            Clients: ≥ {item.min_active_clients || 0}
          </div>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex items-center gap-2">
          {editingId === item.id ? (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={handleSave}
                icon={<FiSave className="h-3 w-3" />}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                icon={<FiX className="h-3 w-3" />}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(item)}
                icon={<FiEdit className="h-3 w-3" />}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(item.id)}
                icon={<FiTrash2 className="h-3 w-3" />}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/ib-management/commissions')}
            icon={<FiArrowLeft className="h-4 w-4" />}
          >
            Back to Groups
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission Structures</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage commission structures for group: {groupId}</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<FiPlus className="h-4 w-4" />}
          onClick={() => setShowAddForm(true)}
        >
          Add Structure
        </Button>
      </div>

      {/* Structures Table */}
      <AdminCard>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable
              data={structures}
              columns={columns}
              searchable={false}
              filterable={false}
              emptyMessage="No commission structures defined for this group"
            />

            {/* Edit Form Modal */}
            {editingId && (
              <div className="mt-6 border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Edit Commission Structure</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Structure Name</label>
                      <input
                        type="text"
                        value={editForm.structureName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, structureName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">USD per Lot</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.usdPerLot}
                        onChange={(e) => setEditForm(prev => ({ ...prev, usdPerLot: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spread Share %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.spreadSharePercentage}
                        onChange={(e) => setEditForm(prev => ({ ...prev, spreadSharePercentage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Qualification Criteria</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Level Order</label>
                        <input
                          type="number"
                          min="1"
                          value={editForm.levelOrder}
                          onChange={(e) => setEditForm(prev => ({ ...prev, levelOrder: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Trading Volume (Mln. USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.minTradingVolume}
                          onChange={(e) => setEditForm(prev => ({ ...prev, minTradingVolume: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Trading Volume (Mln. USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.maxTradingVolume}
                          onChange={(e) => setEditForm(prev => ({ ...prev, maxTradingVolume: e.target.value }))}
                          placeholder="Leave empty for no limit"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Active Clients</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.minActiveClients}
                          onChange={(e) => setEditForm(prev => ({ ...prev, minActiveClients: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </AdminCard>

      {/* Add New Structure Form */}
      {showAddForm && (
        <AdminCard>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Commission Structure</h3>
          </div>
          <div className="space-y-4 mb-4">
            {/* Basic Commission Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Structure Name</label>
                <input
                  type="text"
                  value={newForm.structureName}
                  onChange={(e) => setNewForm(prev => ({ ...prev, structureName: e.target.value }))}
                  placeholder="e.g., Common, Advanced, Bronze"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">USD per Lot</label>
                <input
                  type="number"
                  step="0.01"
                  value={newForm.usdPerLot}
                  onChange={(e) => setNewForm(prev => ({ ...prev, usdPerLot: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spread Share %</label>
                <input
                  type="number"
                  step="0.01"
                  value={newForm.spreadSharePercentage}
                  onChange={(e) => setNewForm(prev => ({ ...prev, spreadSharePercentage: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Qualification Criteria Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Qualification Criteria (for Auto Upgrade)</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level Order <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newForm.levelOrder}
                    onChange={(e) => setNewForm(prev => ({ ...prev, levelOrder: e.target.value }))}
                    placeholder="1, 2, 3..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Order of levels (1 = lowest)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Trading Volume (Mln. USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newForm.minTradingVolume}
                    onChange={(e) => setNewForm(prev => ({ ...prev, minTradingVolume: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum in millions USD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Trading Volume (Mln. USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newForm.maxTradingVolume}
                    onChange={(e) => setNewForm(prev => ({ ...prev, maxTradingVolume: e.target.value }))}
                    placeholder="Leave empty for no limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: max for range</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Active Clients</label>
                  <input
                    type="number"
                    min="0"
                    value={newForm.minActiveClients}
                    onChange={(e) => setNewForm(prev => ({ ...prev, minActiveClients: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum active clients</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNew}
              disabled={!newForm.structureName || !newForm.usdPerLot || !newForm.spreadSharePercentage || !newForm.levelOrder}
            >
              Add Structure
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  );
};

export default GroupCommissions;