import React, { useState, useEffect } from 'react';
import { FiInfo, FiX, FiSettings, FiFilter } from 'react-icons/fi';
import ProTable from '../../components/common/ProTable.jsx';
import AdminCard from '../../components/admin/AdminCard';

const PerformanceStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [simpleData, setSimpleData] = useState([]);
  const [stats, setStats] = useState({
    clicks: 0,
    registrations: 0,
    conversion: 0,
    startTrading: 0,
    volumeMlnUSD: 0,
    volumeLots: 0,
    profitUSD: 0
  });
  const [simpleStats, setSimpleStats] = useState({
    registrations: 0,
    firstTimeDeposits: 0
  });
  const [groupBy, setGroupBy] = useState(['Date']);
  const [newReport, setNewReport] = useState(false);
  const [clickPeriod, setClickPeriod] = useState({ from: '', to: '' });
  const [country, setCountry] = useState('All');
  const [activeFilters, setActiveFilters] = useState(1);

  const groupByOptions = ['Link', 'Source', 'Day', 'Week', 'Month', 'Year', 'Country', 'Campaign'];
  const simpleGroupByOptions = ['Date', 'Week', 'Month', 'Year'];

  useEffect(() => {
    fetchPerformanceData();
  }, [groupBy, clickPeriod, country, newReport]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      // Fetch referrals/registrations
      const clientsResponse = await fetch('/api/user/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clientsData = await clientsResponse.json();
      
      // Fetch trades
      const tradesResponse = await fetch('/api/user/trades?pageSize=10000', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tradesData = await tradesResponse.json();
      
      if (clientsResponse.ok && tradesResponse.ok) {
        const clients = clientsData.success ? (clientsData.data?.clients || []) : [];
        const trades = tradesData.success ? (tradesData.data?.trades || []) : [];
        
        if (newReport) {
          // New report view - detailed
          const dayMap = new Map();
          
          clients.forEach(client => {
            const date = new Date(client.joinDate || client.createdAt || client.submitted_at);
            const dayKey = date.toISOString().split('T')[0];
            
            if (!dayMap.has(dayKey)) {
              dayMap.set(dayKey, {
                day: dayKey,
                clicks: 0,
                registrations: 0,
                startTrading: 0,
                volumeLots: 0,
                volumeMlnUSD: 0,
                profit: 0
              });
            }
            
            const dayData = dayMap.get(dayKey);
            dayData.registrations += 1;
            if (client.lastTrade) {
              dayData.startTrading += 1;
            }
          });
          
          trades.forEach(trade => {
            const date = new Date(trade.close_time || trade.synced_at || trade.updated_at);
            const dayKey = date.toISOString().split('T')[0];
            
            if (!dayMap.has(dayKey)) {
              dayMap.set(dayKey, {
                day: dayKey,
                clicks: 0,
                registrations: 0,
                startTrading: 0,
                volumeLots: 0,
                volumeMlnUSD: 0,
                profit: 0
              });
            }
            
            const dayData = dayMap.get(dayKey);
            const volumeLots = Number(trade.volume_lots || trade.lots || 0);
            dayData.volumeLots += volumeLots;
            dayData.volumeMlnUSD += volumeLots * 100000 / 1000000;
            dayData.profit += Number(trade.profit || 0);
          });
          
          const processedData = Array.from(dayMap.values()).map(d => ({
            ...d,
            conversion: d.registrations > 0 ? (d.startTrading / d.registrations * 100) : 0
          }));
          
          setData(processedData);
          
          // Calculate totals
          const totals = processedData.reduce((acc, d) => ({
            clicks: acc.clicks + d.clicks,
            registrations: acc.registrations + d.registrations,
            startTrading: acc.startTrading + d.startTrading,
            volumeLots: acc.volumeLots + d.volumeLots,
            volumeMlnUSD: acc.volumeMlnUSD + d.volumeMlnUSD,
            profit: acc.profit + d.profit
          }), { clicks: 0, registrations: 0, startTrading: 0, volumeLots: 0, volumeMlnUSD: 0, profit: 0 });
          
          setStats({
            clicks: totals.clicks,
            registrations: totals.registrations,
            conversion: totals.registrations > 0 ? (totals.startTrading / totals.registrations * 100) : 0,
            startTrading: totals.startTrading,
            volumeMlnUSD: totals.volumeMlnUSD,
            volumeLots: totals.volumeLots,
            profitUSD: totals.profit
          });
        } else {
          // Simple report view
          const dateMap = new Map();
          
          clients.forEach(client => {
            const date = new Date(client.joinDate || client.createdAt || client.submitted_at);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!dateMap.has(dateKey)) {
              dateMap.set(dateKey, {
                date: dateKey,
                registrations: 0,
                firstTimeDeposits: 0
              });
            }
            
            const dateData = dateMap.get(dateKey);
            dateData.registrations += 1;
            // First-time deposit is when client has made their first trade/deposit
            if (client.lastTrade) {
              dateData.firstTimeDeposits += 1;
            }
          });
          
          const processedSimpleData = Array.from(dateMap.values());
          setSimpleData(processedSimpleData);
          
          const totals = processedSimpleData.reduce((acc, d) => ({
            registrations: acc.registrations + d.registrations,
            firstTimeDeposits: acc.firstTimeDeposits + d.firstTimeDeposits
          }), { registrations: 0, firstTimeDeposits: 0 });
          
          setSimpleStats(totals);
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroupBy = (option) => {
    if (newReport) {
      setGroupBy(prev => prev.filter(g => g !== option));
    } else {
      setGroupBy(prev => prev.filter(g => g !== option));
    }
  };

  const handleAddGroupBy = () => {
    const available = newReport 
      ? groupByOptions.filter(opt => !groupBy.includes(opt))
      : simpleGroupByOptions.filter(opt => !groupBy.includes(opt));
    if (available.length > 0) {
      setGroupBy(prev => [...prev, available[0]]);
    }
  };

  const handleClearFilters = () => {
    setClickPeriod({ from: '', to: '' });
    setCountry('All');
    setActiveFilters(0);
  };

  const handleApply = () => {
    fetchPerformanceData();
    if (clickPeriod.from || clickPeriod.to || country !== 'All') {
      setActiveFilters(1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const kpiCards = [
    <AdminCard key="clicks">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.clicks}</p>
        <p className="text-sm text-gray-600 mt-1">Clicks</p>
      </div>
    </AdminCard>,
    <AdminCard key="registrations">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.registrations}</p>
        <p className="text-sm text-gray-600 mt-1">Registrations</p>
      </div>
    </AdminCard>,
    <AdminCard key="conversion">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.conversion.toFixed(2)} %</p>
        <p className="text-sm text-gray-600 mt-1">Conversion</p>
      </div>
    </AdminCard>,
    <AdminCard key="start-trading">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.startTrading}</p>
        <p className="text-sm text-gray-600 mt-1">Start Trading</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-mln">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeMlnUSD.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (Mln. USD)</p>
      </div>
    </AdminCard>,
    <AdminCard key="volume-lots">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.volumeLots.toFixed(4)}</p>
        <p className="text-sm text-gray-600 mt-1">Volume (lots)</p>
      </div>
    </AdminCard>,
    <AdminCard key="profit">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{stats.profitUSD.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Profit (USD)</p>
      </div>
    </AdminCard>
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Performance statistics</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Switch to new performance report</span>
          <button
            onClick={() => setNewReport(!newReport)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              newReport ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                newReport ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {newReport ? (
        // New Report View (Detailed)
        <>
          {/* Group By Section */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">Group by {groupBy.length}/{groupByOptions.length}:</span>
            {groupBy.map((option) => (
              <button
                key={option}
                onClick={() => handleRemoveGroupBy(option)}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
              >
                <span>{option}</span>
                <FiX className="h-3 w-3" />
              </button>
            ))}
            {groupBy.length < groupByOptions.length && (
              <button
                onClick={handleAddGroupBy}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
              >
                + Add
              </button>
            )}
          </div>

          {/* Filter Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Click period:</label>
                <input
                  type="date"
                  value={clickPeriod.from}
                  onChange={(e) => setClickPeriod(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="date"
                  value={clickPeriod.to}
                  onChange={(e) => setClickPeriod(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Country:</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="All">All</option>
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                  <option value="CA">CA</option>
                </select>
              </div>
              
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <FiX className="h-4 w-4" />
                <span>Clear filters</span>
              </button>
              
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg text-sm font-medium transition-colors"
              >
                Apply
              </button>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <FiSettings className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <FiInfo className="h-4 w-4" />
              <span>The report is updated once in 2 hours.</span>
            </div>
          </div>

          <ProTable
            title=""
            kpis={kpiCards}
            rows={data.map(d => ({
              day: d.day,
              clicks: d.clicks,
              registrations: d.registrations,
              conversion: d.conversion,
              startTrading: d.startTrading,
              volumeMlnUSD: d.volumeMlnUSD,
              volumeLots: d.volumeLots,
              profitUSD: d.profit
            }))}
            columns={[
              { 
                key: 'day', 
                label: 'Day',
                sortable: true,
                render: (v) => formatDate(v)
              },
              { 
                key: 'clicks', 
                label: 'Clicks',
                sortable: true
              },
              { 
                key: 'registrations', 
                label: 'Registrations',
                sortable: true
              },
              { 
                key: 'conversion', 
                label: 'Conversion',
                sortable: true,
                render: (v) => `${Number(v).toFixed(2)} %`
              },
              { 
                key: 'startTrading', 
                label: 'Start Trading',
                sortable: true
              },
              { 
                key: 'volumeMlnUSD', 
                label: 'Volume (Mln. USD)',
                sortable: true,
                render: (v) => Number(v).toFixed(4)
              },
              { 
                key: 'volumeLots', 
                label: 'Volume (lots)',
                sortable: true,
                render: (v) => Number(v).toFixed(4)
              },
              { 
                key: 'profitUSD', 
                label: 'Profit (USD)',
                sortable: true,
                render: (v) => Number(v).toFixed(2)
              }
            ]}
            filters={{
              searchKeys: ['day'],
              selects: [],
              dateKey: 'day'
            }}
            pageSize={10}
            searchPlaceholder="Search..."
            loading={loading}
          />
        </>
      ) : (
        // Simple Report View
        <>
          {/* Group By Section */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">Group by {groupBy.length}/{simpleGroupByOptions.length}:</span>
            {groupBy.map((option) => (
              <button
                key={option}
                onClick={() => handleRemoveGroupBy(option)}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
              >
                <span>{option}</span>
                <FiX className="h-3 w-3" />
              </button>
            ))}
            {groupBy.length < simpleGroupByOptions.length && (
              <button
                onClick={handleAddGroupBy}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
              >
                + Add
              </button>
            )}
          </div>

          {/* Filters Button */}
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative">
              <FiFilter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <FiSettings className="h-5 w-5" />
            </button>
          </div>

          {/* Simple Table */}
          <div className="rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-800 select-none whitespace-nowrap text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Date</span>
                        <span>▼</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-800 select-none whitespace-nowrap text-center border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Registrations</span>
                        <span>▲</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-800 select-none whitespace-nowrap text-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>First-time deposits</span>
                        <span>▲</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Summary Row */}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 text-center border-r border-gray-200"></td>
                    <td className="px-6 py-4 text-center border-r border-gray-200">{simpleStats.registrations}</td>
                    <td className="px-6 py-4 text-center">{simpleStats.firstTimeDeposits}</td>
                  </tr>
                  
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center bg-gray-50">
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          <span className="text-gray-600 font-medium">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : simpleData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <span>No data</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    simpleData.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                          {formatDate(d.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                          {d.registrations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {d.firstTimeDeposits}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceStatistics;
