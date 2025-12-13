import React, { useState, useEffect } from 'react';
import { FiGitBranch, FiUsers, FiUser, FiCalendar, FiHash, FiMail, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';
import ProTable from '../../components/common/ProTable';

const IBTree = () => {
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState(null);
  const [flatData, setFlatData] = useState([]);
  const [stats, setStats] = useState({
    ownLots: 0,
    teamLots: 0,
    totalTrades: 0
  });

  useEffect(() => {
    fetchIBTree();
  }, []);

  const fetchIBTree = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/ib-tree', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const root = data.data?.root;
        const treeStats = data.data || {};

        setStats({
          ownLots: treeStats.ownLots || 0,
          teamLots: treeStats.teamLots || 0,
          totalTrades: treeStats.totalTrades || 0
        });

        if (root) {
          setTreeData(root);
          // Flatten tree for table view with all details
          const flat = [];
          const flatten = (node, level = 0, parent = null) => {
            flat.push({
              id: node.id,
              name: node.name,
              email: node.email,
              level: level,
              levelName: level === 0 ? 'You (Root)' : `Level ${level}`,
              parent: parent,
              parentName: parent ? parent.name : null,
              hasChildren: node.children && node.children.length > 0,
              status: node.status,
              ibType: node.ibType,
              referralCode: node.referralCode,
              referredBy: node.referredBy,
              referredByName: node.referredByName,
              referredByEmail: node.referredByEmail,
              referredByCode: node.referredByCode,
              submittedAt: node.submittedAt,
              approvedAt: node.approvedAt,
              usdPerLot: node.usdPerLot,
              spreadPercentage: node.spreadPercentage,
              ownLots: node.ownLots,
              tradeCount: node.tradeCount,
              teamLots: node.teamLots
            });
            if (node.children) {
              node.children.forEach(child => flatten(child, level + 1, node));
            }
          };
          flatten(root);
          setFlatData(flat);
        } else {
          setTreeData(null);
          setFlatData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching IB tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    return `$${Number(value || 0).toFixed(2)}`;
  };

  const renderTreeNode = (node, level = 0) => {
    const isIB = node.children && node.children.length > 0;
    const isRoot = level === 0;

    return (
      <div key={node.id} className={`${level > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
        <div className={`flex items-start p-4 rounded-lg border-2 ${isRoot
            ? 'bg-brand-600 text-dark-base border-brand-500 shadow-lg'
            : isIB
              ? 'bg-neutral-50 border-neutral-300'
              : 'bg-white border-neutral-200'
          }`}>
          <div className="flex-shrink-0 mr-3">
            {isIB ? (
              <FiGitBranch className={`h-6 w-6 ${isRoot ? 'text-white' : 'text-blue-600'}`} />
            ) : (
              <FiUser className={`h-6 w-6 ${isRoot ? 'text-white' : 'text-gray-400'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`font-semibold text-lg ${isRoot ? 'text-white' : 'text-gray-900'}`}>
                {node.name}
              </div>
              {node.status === 'approved' && (
                <FiCheckCircle className={`h-4 w-4 ${isRoot ? 'text-green-200' : 'text-green-600'}`} />
              )}
              {node.status === 'pending' && (
                <FiClock className={`h-4 w-4 ${isRoot ? 'text-yellow-200' : 'text-yellow-600'}`} />
              )}
            </div>
            <div className={`text-sm mb-2 ${isRoot ? 'text-dark-base' : 'text-neutral-600'}`}>
              <FiMail className="h-3 w-3 inline mr-1" />
              {node.email}
            </div>

            {/* Referral Details */}
            <div className={`grid grid-cols-2 gap-2 mt-2 text-xs ${isRoot ? 'text-dark-base' : 'text-neutral-600'}`}>
              {node.referralCode && node.referralCode !== 'N/A' && (
                <div className="flex items-center gap-1">
                  <FiHash className="h-3 w-3" />
                  <span className="font-mono font-medium">Code: {node.referralCode}</span>
                </div>
              )}
              {node.referredByName && (
                <div>
                  <span className="font-medium">Referred by: </span>
                  {node.referredByName}
                  {node.referredByCode && (
                    <span className="ml-1 font-mono">({node.referredByCode})</span>
                  )}
                </div>
              )}
              {node.submittedAt && (
                <div className="flex items-center gap-1">
                  <FiCalendar className="h-3 w-3" />
                  <span>Joined: {formatDate(node.submittedAt)}</span>
                </div>
              )}
              {node.approvedAt && (
                <div className="flex items-center gap-1">
                  <FiCheckCircle className="h-3 w-3" />
                  <span>Approved: {formatDate(node.approvedAt)}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={`flex gap-4 mt-2 text-xs ${isRoot ? 'text-dark-base' : 'text-neutral-500'}`}>
              <div>
                <span className="font-medium">Lots: </span>
                {Number(node.ownLots || 0).toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Trades: </span>
                {node.tradeCount || 0}
              </div>
              {node.teamLots > 0 && (
                <div>
                  <span className="font-medium">Team Lots: </span>
                  {Number(node.teamLots || 0).toFixed(2)}
                </div>
              )}
            </div>


          </div>
        </div>
        {node.children && node.children.map(child => renderTreeNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IB Tree</h1>
        <p className="text-gray-600 mt-1">View your IB hierarchy and network structure with referral details</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard className="bg-brand-50 border border-brand-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-700">Your Lots</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Number(stats.ownLots || 0).toFixed(2)}
              </p>
            </div>
            <FiUser className="h-8 w-8 text-brand-600" />
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Team Lots</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {Number(stats.teamLots || 0).toFixed(2)}
              </p>
            </div>
            <FiUsers className="h-8 w-8 text-blue-600" />
          </div>
        </AdminCard>

        <AdminCard className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Trades</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {stats.totalTrades || 0}
              </p>
            </div>
            <FiGitBranch className="h-8 w-8 text-green-600" />
          </div>
        </AdminCard>
      </div>

      {/* Table View with All Details */}
      {flatData.length > 0 && (
        <AdminCard>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Network Members - Detailed View</h2>
            <p className="text-sm text-gray-600 mt-1">Complete referral details for all network members</p>
          </div>
          <ProTable
            title=""
            rows={flatData}
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (val, row) => (
                  <div className="flex items-center gap-2">
                    {row.hasChildren ? (
                      <FiGitBranch className="h-4 w-4 text-brand-600" />
                    ) : (
                      <FiUser className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium">{val}</span>
                  </div>
                )
              },
              {
                key: 'email',
                label: 'Email',
                render: (val) => (
                  <span className="text-sm text-gray-600">{val}</span>
                )
              },
              {
                key: 'levelName',
                label: 'Level',
                render: (val, row) => (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.level === 0 ? 'bg-brand-100 text-brand-800' :
                      row.level === 1 ? 'bg-blue-100 text-blue-800' :
                        row.level === 2 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {val}
                  </span>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${val === 'approved' ? 'bg-green-100 text-green-800' :
                      val === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        val === 'rejected' ? 'bg-red-100 text-red-800' :
                          val === 'trader' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {val === 'trader' ? 'TRADER' : (val || 'pending')}
                  </span>
                )
              },
              {
                key: 'referralCode',
                label: 'Referral Code',
                render: (val) => (
                  <div className="flex items-center gap-1">
                    <FiHash className="h-3 w-3 text-gray-400" />
                    <span className="font-mono text-sm font-medium text-brand-600">
                      {val || 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                key: 'referredByName',
                label: 'Referred By',
                render: (val, row) => (
                  <div className="flex flex-col">
                    {val ? (
                      <>
                        <span className="font-medium text-gray-900">{val}</span>
                        {row.referredByCode && (
                          <span className="text-xs text-gray-500 font-mono">Code: {row.referredByCode}</span>
                        )}
                        {row.referredByEmail && (
                          <span className="text-xs text-gray-500">{row.referredByEmail}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">Root</span>
                    )}
                  </div>
                )
              },
              {
                key: 'submittedAt',
                label: 'Submitted At',
                render: (val) => (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FiCalendar className="h-3 w-3" />
                    <span>{formatDate(val)}</span>
                  </div>
                )
              },
              {
                key: 'approvedAt',
                label: 'Approved At',
                render: (val) => (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FiCalendar className="h-3 w-3" />
                    <span>{formatDate(val)}</span>
                  </div>
                )
              },
              {
                key: 'ownLots',
                label: 'Own Lots',
                render: (val) => (
                  <span className="text-sm text-gray-700">{Number(val || 0).toFixed(2)}</span>
                )
              },
              {
                key: 'teamLots',
                label: 'Team Lots',
                render: (val) => (
                  <span className="text-sm text-gray-700">{Number(val || 0).toFixed(2)}</span>
                )
              },
              {
                key: 'tradeCount',
                label: 'Trades',
                render: (val) => (
                  <span className="text-sm text-gray-700">{val || 0}</span>
                )
              }
            ]}
            filters={{
              searchKeys: ['name', 'email', 'referralCode', 'referredByName', 'ibType'],
              selects: [
                {
                  key: 'levelName',
                  label: 'All Levels',
                  options: [...new Set(flatData.map(d => d.levelName))]
                },
                {
                  key: 'status',
                  label: 'All Statuses',
                  options: [...new Set(flatData.map(d => d.status || 'pending'))]
                }
              ]
            }}
            loading={loading}
            pageSize={10}
            searchPlaceholder="Search by name, email, referral code..."
          />
        </AdminCard>
      )}
    </div>
  );
};

export default IBTree;
