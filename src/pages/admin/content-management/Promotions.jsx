import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiVideo, FiFileText, FiEye } from 'react-icons/fi';
import AdminCard from '../../../components/admin/AdminCard';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/admin/StatusBadge';
import DataTable from '../../../components/admin/DataTable';

const Promotions = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [editingPromo, setEditingPromo] = useState(null);

  // Mock promotion data
  const promotions = [
    {
      id: 1,
      title: 'Welcome Bonus Campaign',
      type: 'banner',
      status: 'active',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      impressions: 15420,
      clicks: 892,
      ctr: 5.8
    },
    {
      id: 2,
      title: 'Trading Contest',
      type: 'video',
      status: 'active',
      startDate: '2024-03-15',
      endDate: '2024-04-15',
      impressions: 8930,
      clicks: 445,
      ctr: 5.0
    },
    {
      id: 3,
      title: 'Referral Program',
      type: 'landing',
      status: 'inactive',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      impressions: 12300,
      clicks: 615,
      ctr: 5.0
    }
  ];

  const columns = [
    {
      key: 'title',
      label: 'Campaign',
      sortable: true,
      render: (promo) => (
        <div>
          <div className="font-medium text-gray-900">{promo.title}</div>
          <div className="text-sm text-gray-500 capitalize">{promo.type}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true
    },
    {
      key: 'dateRange',
      label: 'Duration',
      sortable: false,
      render: (promo) => (
        <div className="text-sm text-gray-600">
          <div>{promo.startDate}</div>
          <div>to {promo.endDate}</div>
        </div>
      )
    },
    {
      key: 'impressions',
      label: 'Impressions',
      sortable: true,
      render: (promo) => (
        <span className="font-medium">{promo.impressions.toLocaleString()}</span>
      )
    },
    {
      key: 'clicks',
      label: 'Clicks',
      sortable: true,
      render: (promo) => (
        <span className="font-medium">{promo.clicks.toLocaleString()}</span>
      )
    },
    {
      key: 'ctr',
      label: 'CTR',
      sortable: true,
      render: (promo) => (
        <span className="font-medium text-green-600">{promo.ctr}%</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (promo) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<FiEye className="h-4 w-4" />}
            onClick={() => console.log('View promo:', promo.id)}
            className="text-blue-600 hover:text-blue-700"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<FiEdit className="h-4 w-4" />}
            onClick={() => setEditingPromo(promo.id)}
            className="text-green-600 hover:text-green-700"
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  const filteredPromotions = promotions.filter(promo => {
    if (activeTab === 'all') return true;
    return promo.status === activeTab;
  });

  const totalImpressions = promotions.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = promotions.reduce((sum, p) => sum + p.clicks, 0);
  const avgCTR = (totalClicks / totalImpressions) * 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage promotional campaigns and materials</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<FiPlus className="h-4 w-4" />}
        >
          <span className="hidden sm:inline">Create Campaign</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiImage className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiVideo className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Impressions</p>
              <p className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
              <FiEye className="h-6 w-6 text-brand-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg CTR</p>
              <p className="text-2xl font-bold text-gray-900">{avgCTR.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiFileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Tabs */}
      <AdminCard>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'All Campaigns' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </AdminCard>

      {/* Promotions Table */}
      <AdminCard>
        <DataTable
          data={filteredPromotions}
          columns={columns}
          searchable={true}
          filterable={true}
          emptyMessage="No promotions found"
        />
      </AdminCard>

      {/* Campaign Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <AdminCard header="Banner Campaigns" icon={<FiImage className="h-4 w-4" />}>
          <div className="space-y-3">
            {promotions.filter(p => p.type === 'banner').map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{promo.title}</div>
                  <div className="text-sm text-gray-600">{promo.impressions.toLocaleString()} impressions</div>
                </div>
                <StatusBadge status={promo.status} size="sm" />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard header="Video Campaigns" icon={<FiVideo className="h-4 w-4" />}>
          <div className="space-y-3">
            {promotions.filter(p => p.type === 'video').map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{promo.title}</div>
                  <div className="text-sm text-gray-600">{promo.impressions.toLocaleString()} impressions</div>
                </div>
                <StatusBadge status={promo.status} size="sm" />
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard header="Landing Pages" icon={<FiFileText className="h-4 w-4" />}>
          <div className="space-y-3">
            {promotions.filter(p => p.type === 'landing').map(promo => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{promo.title}</div>
                  <div className="text-sm text-gray-600">{promo.impressions.toLocaleString()} impressions</div>
                </div>
                <StatusBadge status={promo.status} size="sm" />
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default Promotions;
