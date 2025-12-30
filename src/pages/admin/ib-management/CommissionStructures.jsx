import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import { apiFetch } from '../../../utils/api';

const CommissionStructures = () => {
  const [groupStructures, setGroupStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      if (!token) {
        console.error('No admin token found. Redirecting to login...');
        navigate('/admin/login');
        return;
      }
      const response = await apiFetch('/admin/ib-requests/commission-structures');

      if (response.ok) {
        const data = await response.json();
        const grouped = data.data.structures.reduce((acc, structure) => {
          const { group_id, group_name } = structure;
          if (!acc[group_id]) {
            acc[group_id] = {
              groupId: group_id,
              groupName: group_name || group_id,
              structures: []
            };
          }
          acc[group_id].structures.push(structure);
          return acc;
        }, {});
        // Sort structures by level_order in ascending order for each group
        const sortedGroups = Object.values(grouped).map(group => ({
          ...group,
          structures: group.structures.sort((a, b) => {
            const levelA = a.level_order || 0;
            const levelB = b.level_order || 0;
            return levelA - levelB;
          })
        }));
        setGroupStructures(sortedGroups);
      } else if (response.status === 401) {
        console.error('Unauthorized. Redirecting to login...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        console.error('Failed to fetch structures:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (structure) => {
    navigate(`/admin/ib-management/commissions/${structure.group_id}`);
  };

  const handleViewGroup = (groupId) => {
    navigate(`/admin/ib-management/commissions/${groupId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission Structures</h1>
          <p className="text-sm sm:text-base text-gray-600">Overview of all commission structures across all groups</p>
        </div>
      </div>

      {loading ? (
        <AdminCard>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </AdminCard>
      ) : groupStructures.length === 0 ? (
        <AdminCard>
          <div className="py-10 text-center text-gray-500">No commission structures found.</div>
        </AdminCard>
      ) : (
        groupStructures.map((group) => (
          <AdminCard key={group.groupId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{group.groupName}</h2>
                <p className="text-sm text-gray-500 break-all">{group.groupId}</p>
              </div>
              <div className="text-sm text-gray-500">
                {group.structures.length} structure{group.structures.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Structure</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">USD / Lot</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Spread %</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.structures.map((structure) => (
                    <tr key={structure.id}>
                      <td className="px-4 py-3 text-sm font-medium text-brand-600">Level {structure.level_order || 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{structure.structure_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">${structure.usd_per_lot}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{structure.spread_share_percentage}%</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={structure.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewGroup(group.groupId)}
                            icon={<FiEye className="h-3 w-3" />}
                          >
                            View Group
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(structure)}
                            icon={<FiEdit className="h-3 w-3" />}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
};

export default CommissionStructures;
