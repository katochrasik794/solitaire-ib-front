import React, { useState, useEffect } from 'react';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const Clients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    volumeLots: 0,
    volumeMlnUSD: 0,
    rewards: 0
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const clientsData = data.data?.clients || [];
        setClients(clientsData);
        
        // Calculate stats
        const totalClients = clientsData.length;
        const volumeLots = clientsData.reduce((sum, c) => sum + Number(c.totalLots || 0), 0);
        const volumeMlnUSD = volumeLots * 100000; // Approximate conversion, adjust as needed
        const rewards = clientsData.reduce((sum, c) => sum + Number(c.rewards || 0), 0);
        
        setStats({
          totalClients,
          volumeLots,
          volumeMlnUSD: volumeMlnUSD / 1000000, // Convert to millions
          rewards
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const kpiCards = [
    <AdminCard key="clients">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
        <p className="text-sm text-gray-600 mt-1">Clients</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-lots">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeLots.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (lots)</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-mln">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeMlnUSD.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (Mln. USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="rewards">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.rewards.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Rewards</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>

      <ProTable
        title=""
        kpis={kpiCards}
        rows={clients.map(c => ({
          clientId: c.id || c.userId || c.email?.split('@')[0] || '-',
          signupDate: c.joinDate || c.createdAt || c.submitted_at,
          status: c.status || 'Active',
          clientProgress: '0%',
          rewards: Number(c.rewards || c.commission || 0),
          comment: '-',
          rebates: Number(c.rebates || 0)
        }))}
        columns={[
          { 
            key: 'clientId', 
            label: 'Client ID',
            sortable: true
          },
          { 
            key: 'signupDate', 
            label: 'Sign-up date',
            sortable: true,
            render: (v) => formatDate(v)
          },
          { 
            key: 'status', 
            label: 'Status',
            sortable: true
          },
          { 
            key: 'clientProgress', 
            label: 'Client progress',
            sortable: false
          },
          { 
            key: 'rewards', 
            label: 'Rewards',
            sortable: true,
            render: (v) => Number(v).toFixed(4)
          },
          { 
            key: 'comment', 
            label: 'Comment',
            sortable: false
          },
          { 
            key: 'rebates', 
            label: 'Rebates',
            sortable: true,
            render: (v) => Number(v).toFixed(4)
          }
        ]}
        filters={{
          searchKeys: ['clientId', 'status', 'comment'],
          selects: [],
          dateKey: 'signupDate'
        }}
        pageSize={10}
        searchPlaceholder="Search clients..."
        loading={loading}
      />
    </div>
  );
};

export default Clients;
