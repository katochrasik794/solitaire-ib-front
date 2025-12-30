import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import ProTable from '../../../components/common/ProTable';
import { apiFetch } from '../../../utils/api';

const CommissionStructures = () => {
  const [structureSets, setStructureSets] = useState([]);
  const [allStructures, setAllStructures] = useState([]);
  const [availableStructures, setAvailableStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setsLoading, setSetsLoading] = useState(true);
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [setForm, setSetForm] = useState({
    name: '',
    stage: 1,
    description: '',
    status: 'active',
    selectedStructures: []
  });
  const [savingSet, setSavingSet] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStructureSets();
    fetchAllStructures();
    fetchAvailableStructures();
  }, []);

  const fetchStructureSets = async () => {
    try {
      setSetsLoading(true);
      const response = await apiFetch('/admin/ib-requests/structure-sets');
      if (response.ok) {
        const data = await response.json();
        setStructureSets(data.data.sets || []);
      }
    } catch (error) {
      console.error('Error fetching structure sets:', error);
    } finally {
      setSetsLoading(false);
    }
  };

  const fetchAllStructures = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/admin/ib-requests/commission-structures?page=1&limit=10000');
      if (response.ok) {
        const data = await response.json();
        setAllStructures(data.data.structures || []);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStructures = async () => {
    try {
      const response = await apiFetch('/admin/ib-requests/structure-sets/available-structures');
      if (response.ok) {
        const data = await response.json();
        const structures = data.data?.structures || [];
        console.log('[CommissionStructures] Fetched available structures:', structures.length);
        setAvailableStructures(structures);
      } else {
        console.error('[CommissionStructures] Failed to fetch available structures:', response.status);
        // Fallback: use allStructures if API fails
        if (allStructures.length > 0) {
          console.log('[CommissionStructures] Using allStructures as fallback');
          setAvailableStructures(allStructures);
        }
      }
    } catch (error) {
      console.error('Error fetching available structures:', error);
      // Fallback: use allStructures if fetch fails
      if (allStructures.length > 0) {
        console.log('[CommissionStructures] Using allStructures as fallback after error');
        setAvailableStructures(allStructures);
      }
    }
  };

  const handleAddSet = async () => {
    setEditingSet(null);
    setSetForm({
      name: '',
      stage: 1,
      description: '',
      status: 'active',
      selectedStructures: []
    });
    setShowSetModal(true);
    // Fetch available structures when opening modal
    await fetchAvailableStructures();
  };

  const handleEditSet = async (set) => {
    try {
      setEditingSetId(set.id);
      const response = await apiFetch(`/admin/ib-requests/structure-sets/${set.id}`);
      if (response.ok) {
        const data = await response.json();
        const setData = data.data.set;
        setEditingSet(set);
        setSetForm({
          name: setData.name,
          stage: setData.stage,
          description: setData.description || '',
          status: setData.status,
          selectedStructures: setData.structureNames || []
        });
        setShowSetModal(true);
      }
    } catch (error) {
      console.error('Error fetching set details:', error);
    } finally {
      setEditingSetId(null);
    }
  };

  const handleDeleteSet = async (set) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the structure set "${set.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingSetId(set.id);
      const response = await apiFetch(`/admin/ib-requests/structure-sets/${set.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        Swal.fire('Deleted!', 'Structure set deleted successfully', 'success');
        fetchStructureSets();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Swal.fire('Error!', errorData.message || 'Failed to delete structure set', 'error');
      }
    } catch (error) {
      console.error('Error deleting structure set:', error);
      Swal.fire('Error!', 'Failed to delete structure set', 'error');
    } finally {
      setDeletingSetId(null);
    }
  };

  const handleSaveSet = async () => {
    if (!setForm.name.trim()) {
      Swal.fire('Error!', 'Structure set name is required', 'error');
      return;
    }

    try {
      setSavingSet(true);
      const url = editingSet
        ? `/admin/ib-requests/structure-sets/${editingSet.id}`
        : '/admin/ib-requests/structure-sets';
      const method = editingSet ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: setForm.name.trim(),
          stage: setForm.stage,
          description: setForm.description,
          status: setForm.status,
          structureNames: setForm.selectedStructures
        })
      });

      if (response.ok) {
        Swal.fire('Success!', `Structure set ${editingSet ? 'updated' : 'created'} successfully`, 'success');
        setShowSetModal(false);
        fetchStructureSets();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Swal.fire('Error!', errorData.message || 'Failed to save structure set', 'error');
      }
    } catch (error) {
      console.error('Error saving structure set:', error);
      Swal.fire('Error!', 'Failed to save structure set', 'error');
    } finally {
      setSavingSet(false);
    }
  };

  const toggleStructureSelection = (structureName) => {
    setSetForm(prev => ({
      ...prev,
      selectedStructures: prev.selectedStructures.includes(structureName)
        ? prev.selectedStructures.filter(s => s !== structureName)
        : [...prev.selectedStructures, structureName]
    }));
  };

  // Group available structures by structure_name for display
  const groupedStructures = useMemo(() => {
    if (!availableStructures || availableStructures.length === 0) {
      // Fallback: use allStructures if availableStructures is empty
      const grouped = {};
      (allStructures || []).forEach(structure => {
        const key = structure.structure_name;
        if (!key) return;
        if (!grouped[key]) {
          grouped[key] = {
            structure_name: key,
            level_order: structure.level_order || 1,
            groups: []
          };
        }
        grouped[key].groups.push({
          group_id: structure.group_id,
          group_name: structure.group_name || structure.group_id,
          usd_per_lot: structure.usd_per_lot,
          spread_share_percentage: structure.spread_share_percentage
        });
      });
      return Object.values(grouped).sort((a, b) => (a.level_order || 0) - (b.level_order || 0));
    }

    const grouped = {};
    availableStructures.forEach(structure => {
      const key = structure.structure_name;
      if (!key) return;
      if (!grouped[key]) {
        grouped[key] = {
          structure_name: key,
          level_order: structure.level_order || 1,
          groups: []
        };
      }
      grouped[key].groups.push({
        group_id: structure.group_id,
        group_name: structure.group_name || structure.group_id,
        usd_per_lot: structure.usd_per_lot,
        spread_share_percentage: structure.spread_share_percentage
      });
    });
    return Object.values(grouped).sort((a, b) => (a.level_order || 0) - (b.level_order || 0));
  }, [availableStructures, allStructures]);

  const structureSetsColumns = useMemo(() => [
    {
      key: 'name',
      label: 'NAME',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>
    },
    {
      key: 'stage',
      label: 'STAGE',
      render: (val) => <span className="text-brand-600 font-medium">Stage {val}</span>
    },
    {
      key: 'description',
      label: 'DESCRIPTION',
      render: (val) => <span className="text-gray-600">{val || '-'}</span>
    },
    {
      key: 'structures_count',
      label: 'STRUCTURES COUNT',
      render: (val) => (
        <span className="text-gray-700">{val || 0} structure{val !== 1 ? 's' : ''}</span>
      )
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditSet(row)}
            icon={<FiEdit className="h-3 w-3" />}
            loading={editingSetId === row.id}
            disabled={editingSetId === row.id || deletingSetId === row.id}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteSet(row)}
            icon={<FiTrash2 className="h-3 w-3" />}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
            loading={deletingSetId === row.id}
            disabled={editingSetId === row.id || deletingSetId === row.id}
          >
            Delete
          </Button>
        </div>
      )
    }
  ], []);

  const allStructuresColumns = useMemo(() => [
    {
      key: 'level_order',
      label: 'LEVEL',
      render: (val) => <span className="text-brand-600 font-medium">Level {val || 1}</span>
    },
    {
      key: 'structure_name',
      label: 'STRUCTURE NAME',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>
    },
    {
      key: 'group_name',
      label: 'GROUP NAME',
      render: (val, row) => (
        <div>
          <div className="font-medium text-gray-900">{val || row.group_id}</div>
          {row.group_id && row.group_id !== val && (
            <div className="text-xs text-gray-500">{row.group_id}</div>
          )}
        </div>
      )
    },
    {
      key: 'usd_per_lot',
      label: 'USD / LOT',
      render: (val) => <span className="text-gray-700">${parseFloat(val || 0).toFixed(2)}</span>
    },
    {
      key: 'spread_share_percentage',
      label: 'SPREAD %',
      render: (val) => <span className="text-gray-700">{parseFloat(val || 0).toFixed(2)}%</span>
    },
    {
      key: 'qualification',
      label: 'QUALIFICATION CRITERIA',
      render: (val, row) => {
        const minVol = parseFloat(row.min_trading_volume || 0);
        const maxVol = row.max_trading_volume ? parseFloat(row.max_trading_volume) : null;
        const minClients = row.min_active_clients || 0;
        
        const volText = maxVol 
          ? `Volume: ${minVol.toFixed(2)} - ${maxVol.toFixed(2)} Min. USD`
          : `Volume: ${minVol.toFixed(2)} Min. USD`;
        const clientsText = `Clients: ≥ ${minClients}`;
        
        return (
          <span className="text-sm text-gray-600">
            {volText} {clientsText}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (val, row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/ib-management/commissions/${encodeURIComponent(row.group_id)}`)}
            icon={<FiEye className="h-3 w-3" />}
          >
            View Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/ib-management/commissions/${encodeURIComponent(row.group_id)}`)}
            icon={<FiEdit className="h-3 w-3" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<FiTrash2 className="h-3 w-3" />}
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            Delete
          </Button>
        </div>
      )
    }
  ], [navigate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission Structures</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage commission structures across all groups</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => navigate('/admin/ib-management/commissions')}
          >
            + Add Structure
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={handleAddSet}
          >
            + Add Structure Set
          </Button>
        </div>
      </div>

      {/* Structure Sets Section */}
        <AdminCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Structure Sets</h2>
          <p className="text-sm text-gray-600">Create named packages that group multiple commission structures together</p>
          </div>
        <ProTable
          title="Structure Sets"
          rows={structureSets}
          columns={structureSetsColumns}
          loading={setsLoading}
          pageSize={10}
          searchPlaceholder="Search structure sets..."
          filters={{
            searchKeys: ['name', 'description']
          }}
          emptyMessage="No structure sets found. Click '+ Add Structure Set' to create one."
        />
        </AdminCard>

      {/* All Commission Structures Section */}
        <AdminCard>
        <ProTable
          title="All Commission Structures"
          rows={allStructures}
          columns={allStructuresColumns}
          loading={loading}
          pageSize={25}
          searchPlaceholder="Search by structure name, group..."
          filters={{
            searchKeys: ['structure_name', 'group_name', 'group_id']
          }}
          emptyMessage="No commission structures found"
        />
        </AdminCard>

      {/* Add/Edit Structure Set Modal */}
      {showSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSet ? 'Edit Structure Set' : 'Add New Structure Set'}
              </h2>
              <button
                onClick={() => setShowSetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Set Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={setForm.name}
                    onChange={(e) => setSetForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Package, Standard Package"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={setForm.stage}
                    onChange={(e) => setSetForm(prev => ({ ...prev, stage: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={setForm.description}
                    onChange={(e) => setSetForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description for this structure set"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={setForm.status}
                    onChange={(e) => setSetForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Structures to Include
                  </label>
                  {groupedStructures.length === 0 ? (
                    <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                      <p>No structures available. Please create commission structures first.</p>
                    </div>
                  ) : (
                    <>
                      <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                                <input
                                  type="checkbox"
                                  checked={groupedStructures.length > 0 && groupedStructures.every(s => setForm.selectedStructures.includes(s.structure_name))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSetForm(prev => ({
                                        ...prev,
                                        selectedStructures: groupedStructures.map(s => s.structure_name)
                                      }));
                                    } else {
                                      setSetForm(prev => ({ ...prev, selectedStructures: [] }));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">LEVEL</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">STRUCTURE NAME</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">GROUP</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">SPREAD %</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupedStructures.map((structure) => (
                              <tr key={structure.structure_name} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={setForm.selectedStructures.includes(structure.structure_name)}
                                    onChange={() => toggleStructureSelection(structure.structure_name)}
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm text-brand-600">Level {structure.level_order || 1}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{structure.structure_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {structure.groups && structure.groups.length > 0
                                    ? structure.groups.map(g => g.group_name || g.group_id).join(', ')
                                    : '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {structure.groups && structure.groups.length > 0
                                    ? (parseFloat(structure.groups[0]?.spread_share_percentage || 0).toFixed(2)) + '%'
                                    : '0.00%'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {setForm.selectedStructures.length} structure{setForm.selectedStructures.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowSetModal(false)}
                disabled={savingSet}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSet}
                loading={savingSet}
                disabled={savingSet}
              >
                {editingSet ? 'Update Set' : 'Create Set'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionStructures;
