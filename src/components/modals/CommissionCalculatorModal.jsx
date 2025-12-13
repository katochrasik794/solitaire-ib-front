import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiBarChart, FiChevronDown, FiSearch } from 'react-icons/fi';

const Backdrop = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
    onClick={onClose}
    aria-hidden="true"
  />
);

const CommissionCalculatorModal = ({ isOpen, onClose, presets = [] }) => {
  const [accountType, setAccountType] = useState('');
  const [instrument, setInstrument] = useState('');
  const [lots, setLots] = useState(1.00);
  const [accountTypes, setAccountTypes] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [commissionLevels, setCommissionLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState([]);
  const [instrumentSearch, setInstrumentSearch] = useState('');
  const [instrumentDropdownOpen, setInstrumentDropdownOpen] = useState(false);
  const instrumentDropdownRef = useRef(null);

  // Fetch calculator data on mount
  useEffect(() => {
    if (isOpen) {
      fetchCalculatorData();
    }
  }, [isOpen]);

  // Close instrument dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (instrumentDropdownRef.current && !instrumentDropdownRef.current.contains(event.target)) {
        setInstrumentDropdownOpen(false);
      }
    }
    if (instrumentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [instrumentDropdownOpen]);

  // Filter instruments based on search
  const filteredInstruments = instruments.filter(inst => {
    if (!instrumentSearch) return true;
    const searchLower = instrumentSearch.toLowerCase();
    return inst.name.toLowerCase().includes(searchLower) || 
           (inst.category && inst.category.toLowerCase().includes(searchLower));
  });

  const fetchCalculatorData = async () => {
    try {
      setLoading(true);
      console.log('[CALCULATOR] Fetching calculator data...');
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      const response = await fetch('/api/user/dashboard/calculator-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('[CALCULATOR] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CALCULATOR] Error response:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[CALCULATOR] Response data:', data);
      console.log('[CALCULATOR] Account Types count:', data.data?.accountTypes?.length || 0);
      console.log('[CALCULATOR] Account Types:', data.data?.accountTypes);
      
      if (response.ok && data.success) {
        setAccountTypes(data.data.accountTypes || []);
        setInstruments(data.data.instruments || []);
        setCommissionLevels(data.data.commissionLevels || []);
        
        console.log('[CALCULATOR] Set account types:', data.data.accountTypes?.length || 0);
        
        // Set default values
        if (data.data.accountTypes && data.data.accountTypes.length > 0) {
          setAccountType(data.data.accountTypes[0].id);
          console.log('[CALCULATOR] Set default account type:', data.data.accountTypes[0].id);
        } else {
          console.warn('[CALCULATOR] WARNING: No account types available!');
        }
        if (data.data.instruments && data.data.instruments.length > 0) {
          setInstrument(data.data.instruments[0].id);
        }
      } else {
        console.error('[CALCULATOR] Response not successful:', data);
      }
    } catch (error) {
      console.error('[CALCULATOR] Error fetching calculator data:', error);
      console.error('[CALCULATOR] Error details:', error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!accountType || !instrument || !lots || lots <= 0) {
      return;
    }

    const selectedAccountType = accountTypes.find(at => at.id === accountType);
    if (!selectedAccountType) return;

    // Calculate commission for each UNIFIED level
    // Commission levels are now uniform across all groups - based on IB Level only
    const calculatedResults = [];
    
    // Group commission levels by level number (unified levels, not per group)
    const levelsMap = new Map();
    commissionLevels.forEach(level => {
      // All levels are unified now - no need to filter by groupId
      if (!levelsMap.has(level.level)) {
        levelsMap.set(level.level, []);
      }
      levelsMap.get(level.level).push(level);
    });

    // If no specific levels found, use the account type's default commission
    if (levelsMap.size === 0) {
      const fixedCommission = lots * selectedAccountType.usdPerLot;
      const spreadCommission = lots * (selectedAccountType.spreadSharePercentage / 100);
      const totalCommission = fixedCommission + spreadCommission;

      calculatedResults.push({
        level: 1,
        levelName: 'Level 1',
        structureName: selectedAccountType.structureName,
        usdPerLot: selectedAccountType.usdPerLot,
        spreadSharePercentage: selectedAccountType.spreadSharePercentage,
        fixedCommission,
        spreadCommission,
        totalCommission
      });
    } else {
      // Calculate for each unified level (applies to all account types)
      Array.from(levelsMap.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([levelNum, levelData]) => {
          // Use the first structure for this level (all should be the same since they're unified)
          const level = levelData[0];

          const fixedCommission = lots * level.usdPerLot;
          const spreadCommission = lots * (level.spreadSharePercentage / 100);
          const totalCommission = fixedCommission + spreadCommission;

          calculatedResults.push({
            level: levelNum,
            levelName: `Level ${levelNum}`,
            structureName: level.structureName,
            usdPerLot: level.usdPerLot,
            spreadSharePercentage: level.spreadSharePercentage,
            fixedCommission,
            spreadCommission,
            totalCommission
          });
        });
    }

    setResults(calculatedResults);
    setCalculated(true);
  };

  const handleBack = () => {
    setCalculated(false);
    setResults([]);
  };

  const isCalculateDisabled = !accountType || !instrument || !lots || lots <= 0 || loading;

  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Commission calculator</h3>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!calculated ? (
              <>
                {/* Informational Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <FiBarChart className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    See how much you can earn.
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get a commission estimate based on your referred clients' account type, instruments, and trading volume.
                  </p>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account type
                    </label>
                    <div className="relative">
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none pr-10"
                        disabled={loading}
                      >
                        <option value="">Select account</option>
                        {accountTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    {accountType && accountTypes.find(t => t.id === accountType)?.description && (
                      <p className="mt-2 text-xs text-gray-600">
                        {accountTypes.find(t => t.id === accountType)?.description}
                      </p>
                    )}
                  </div>

                  {/* Instrument and Lots Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Instrument - Searchable Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instrument
                      </label>
                      <div className="relative" ref={instrumentDropdownRef}>
                        <div className="relative">
                          <input
                            type="text"
                            value={instrumentDropdownOpen ? instrumentSearch : (instruments.find(i => i.id === instrument)?.name || '')}
                            onChange={(e) => {
                              setInstrumentSearch(e.target.value);
                              setInstrumentDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setInstrumentSearch('');
                              setInstrumentDropdownOpen(true);
                            }}
                            placeholder="Select instrument"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                            disabled={loading}
                          />
                          <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                        
                        {/* Dropdown Menu - Opens Upwards */}
                        {instrumentDropdownOpen && (
                          <div className="absolute z-50 w-full bottom-full mb-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {filteredInstruments.length > 0 ? (
                              filteredInstruments.map((inst) => (
                                <div
                                  key={inst.id}
                                  onClick={() => {
                                    setInstrument(inst.id);
                                    setInstrumentSearch('');
                                    setInstrumentDropdownOpen(false);
                                  }}
                                  className={`px-4 py-2 cursor-pointer hover:bg-purple-50 ${
                                    instrument === inst.id ? 'bg-purple-100' : ''
                                  }`}
                                >
                                  <div className="text-sm font-medium text-gray-900">{inst.name}</div>
                                  {inst.category && (
                                    <div className="text-xs text-gray-500">{inst.category}</div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No instruments found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Number of lots */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of lots
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lots}
                        onChange={(e) => setLots(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Results Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Commission Calculation Results
                  </h4>
                  
                  {/* Summary Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Account Type:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {accountTypes.find(at => at.id === accountType)?.name || accountType}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Instrument:</span>
                        <span className="ml-2 font-medium text-gray-900">{instrument}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Lots:</span>
                        <span className="ml-2 font-medium text-gray-900">{lots.toFixed(2)}</span>
                      </div>
                      {accountTypes.find(at => at.id === accountType)?.ibType && (
                        <div>
                          <span className="text-gray-600">IB Type:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {accountTypes.find(at => at.id === accountType)?.ibType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Commission Levels */}
                  {results.length > 0 ? (
                    <div className="space-y-3">
                      {results.map((result, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-gray-900">{result.levelName}</h5>
                              <p className="text-xs text-gray-600">IB Type: {result.structureName}</p>
                              <p className="text-xs text-gray-500 mt-1">Applies to all account types</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">
                                ${result.totalCommission.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">Total Commission</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Fixed Commission</div>
                              <div className="text-sm font-medium text-gray-900">
                                ${result.fixedCommission.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ${result.usdPerLot.toFixed(2)} per lot
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Spread Commission</div>
                              <div className="text-sm font-medium text-gray-900">
                                ${result.spreadCommission.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {result.spreadSharePercentage.toFixed(2)}% share
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No commission data available for the selected account type.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
            {calculated ? (
              <>
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCalculate}
                  className="px-6 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
                >
                  Recalculate
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCalculate}
                  disabled={isCalculateDisabled}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isCalculateDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Calculate
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommissionCalculatorModal;
