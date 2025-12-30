import React, { useState, useEffect } from 'react';
import { FiInfo, FiDollarSign } from 'react-icons/fi';
import AdminCard from '../../components/admin/AdminCard';

const PipCalculator = () => {
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState([]);
  const [ibRate, setIbRate] = useState(1.00); // Default IB rate
  const [formData, setFormData] = useState({
    symbol: '',
    accountCurrency: 'USD',
    pips: '10',
    lots: '1'
  });
  const [calculation, setCalculation] = useState(null);
  const [ratesUpdateTime, setRatesUpdateTime] = useState(null);

  useEffect(() => {
    fetchSymbols();
    fetchIBRate();
    setRatesUpdateTime(new Date());
  }, []);

  useEffect(() => {
    if (formData.symbol && formData.pips && formData.lots) {
      calculatePipValue();
    } else {
      setCalculation(null);
    }
  }, [formData]);

  const fetchSymbols = async () => {
    try {
      setLoading(true);
      // Symbols endpoint is now public, no token needed
      const response = await fetch('/api/user/symbols', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Symbols API response status:', response.status);

      // Try to parse JSON, but handle empty/invalid responses
      let data;
      try {
        const text = await response.text();
        console.log('Response text (first 200 chars):', text.substring(0, 200));
        data = text ? JSON.parse(text) : { success: false, message: 'Empty response' };
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        data = { success: false, message: 'Invalid JSON response', error: parseError.message };
      }

      console.log('Symbols API response data:', data);
      
      if (response.ok && data.success && Array.isArray(data.data)) {
        const activeSymbols = data.data.filter(s => !s.status || s.status === 'active').sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
        console.log('✅ Active symbols count:', activeSymbols.length);
        if (activeSymbols.length > 0) {
          console.log('✅ First 5 symbols:', activeSymbols.slice(0, 5).map(s => s.symbol));
        }
        setSymbols(activeSymbols);
      } else {
        console.error('❌ Symbols API error:', response.status, data);
      }
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIBRate = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken');
      
      // If no token, use default rate (calculator works without auth)
      if (!token) {
        console.log('No token found, using default IB rate: 1.00');
        return;
      }

      // Try to get IB rate from user profile or IB request
      const response = await fetch('/api/ib-requests/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.request?.usd_per_lot) {
          setIbRate(Number(data.data.request.usd_per_lot) || 1.00);
          console.log('IB rate fetched:', Number(data.data.request.usd_per_lot));
        }
      } else {
        // 401 is expected if not logged in - use default rate silently
        if (response.status !== 401) {
          console.warn('Failed to fetch IB rate, using default:', response.status);
        }
      }
    } catch (error) {
      // Silently fail - calculator works with default rate
      console.log('Could not fetch IB rate, using default rate');
    }
  };

  const calculatePipValue = () => {
    const selectedSymbol = symbols.find(s => s.symbol === formData.symbol);
    if (!selectedSymbol) {
      setCalculation(null);
      return;
    }

    const pips = parseFloat(formData.pips) || 0;
    const lots = parseFloat(formData.lots) || 0;

    if (pips <= 0 || lots <= 0) {
      setCalculation(null);
      return;
    }

    // Get pip value per lot from symbol data or calculate
    let pipValuePerLot = 10.00; // Default $10 per lot
    if (selectedSymbol.pip_value) {
      pipValuePerLot = Number(selectedSymbol.pip_value);
    } else if (selectedSymbol.pair && selectedSymbol.pair.includes('USD')) {
      // For USD pairs, typically $10 per lot
      pipValuePerLot = 10.00;
    } else {
      // For other pairs, use default or calculate based on contract size
      const contractSize = selectedSymbol.contract_size || 100000;
      pipValuePerLot = contractSize / 10000; // Standard calculation
    }

    // Calculate estimated pip value
    const estimatedPipValue = pipValuePerLot * lots * pips;

    // Calculate commission preview (based on IB rate per lot)
    const commissionPreview = ibRate * lots;

    setCalculation({
      symbol: selectedSymbol.symbol,
      pair: selectedSymbol.pair || '-',
      category: selectedSymbol.category || 'N/A',
      pipValuePerLot: pipValuePerLot.toFixed(2),
      estimatedPipValue: estimatedPipValue.toFixed(2),
      commissionPreview: commissionPreview.toFixed(2),
      lots: lots,
      pips: pips
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pip Calculator</h1>
        <p className="text-gray-600 mt-1">Calculate pip values and commission for your trading pairs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form - Left Panel */}
        <AdminCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h2>

          <div className="space-y-4">
            {/* Symbol Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <select
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                disabled={loading}
              >
                <option value="">Select Symbol</option>
                {symbols.map((symbol) => (
                  <option key={symbol.id || symbol.symbol} value={symbol.symbol}>
                    {symbol.symbol} {symbol.category ? `(${symbol.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Currency
              </label>
              <select
                name="accountCurrency"
                value={formData.accountCurrency}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>

            {/* Pips Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pips
              </label>
              <input
                type="number"
                name="pips"
                value={formData.pips}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Enter pips"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Lots Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lots
              </label>
              <input
                type="number"
                name="lots"
                value={formData.lots}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="Enter lots"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
        </AdminCard>

        {/* Calculation Output - Middle Panel */}
        <AdminCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculation Results</h2>

          {calculation ? (
            <div className="space-y-6">
              {/* Estimated Pip Value - Large Display */}
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-2">Estimated Pip Value</p>
                <p className="text-5xl font-bold text-blue-600">
                  ${calculation.estimatedPipValue}
                </p>
              </div>

              {/* Calculation Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Symbol:</span>
                  <span className="text-sm font-medium text-gray-900">{calculation.symbol}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Lots:</span>
                  <span className="text-sm font-medium text-gray-900">{calculation.lots.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Pips:</span>
                  <span className="text-sm font-medium text-gray-900">{calculation.pips.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Your IB Rate:</span>
                  <span className="text-sm font-bold text-green-600">${ibRate.toFixed(2)}/Lot</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Commission Preview:</span>
                  <span className="text-sm font-bold text-green-600">${calculation.commissionPreview}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pip Value / Lot:</span>
                  <span className="text-sm font-medium text-gray-900">${calculation.pipValuePerLot}</span>
                </div>
              </div>

              {/* Rates Update Information */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Rates updated {formatTime(ratesUpdateTime)} via frankfurter • Base {formData.accountCurrency}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FiDollarSign className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-sm">Select a symbol and enter values to calculate</p>
            </div>
          )}
        </AdminCard>

        {/* Notes/Disclaimers - Right Panel */}
        <AdminCard className="bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FiInfo className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                Pip USD per lot can vary by symbol and broker settings.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <FiInfo className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                The above tool is for estimation only; live trading may differ.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <FiInfo className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">
                Commission preview uses your IB pip/lot rate for accurate calculations.
              </p>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
};

export default PipCalculator;
