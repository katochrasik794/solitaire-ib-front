import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import Button from '../common/Button';

export const SymbolModal = ({ isOpen, onClose, symbol, categories, onSave }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    pip_per_lot: '1.00',
    symbol_rate: '10.00',
    pip_value: '10.00',
    volume_lots: '1.00',
    commission: '10.00',
    currency: 'USD',
    status: 'active',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (symbol) {
      const pipPerLot = parseFloat(symbol.pip_per_lot) || 1.00;
      const pipValue = parseFloat(symbol.pip_value) || 10.00;
      const symbolRate = pipPerLot > 0 ? (pipValue / pipPerLot).toFixed(2) : '10.00';
      const volumeLots = pipPerLot;
      const commission = parseFloat(symbol.commission) || pipValue;

      setFormData({
        symbol: symbol.symbol || '',
        pip_per_lot: pipPerLot.toFixed(2),
        symbol_rate: symbolRate,
        pip_value: pipValue.toFixed(2),
        volume_lots: volumeLots.toFixed(2),
        commission: commission.toFixed(2),
        currency: symbol.currency || 'USD',
        status: symbol.status || 'active',
        category: symbol.category || ''
      });
    }
  }, [symbol]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Calculate pip_value when symbol_rate or pip_per_lot changes
      if (name === 'symbol_rate' || name === 'pip_per_lot') {
        const symbolRate = name === 'symbol_rate' ? parseFloat(value) || 0 : parseFloat(newData.symbol_rate) || 0;
        const pipPerLot = name === 'pip_per_lot' ? parseFloat(value) || 0 : parseFloat(newData.pip_per_lot) || 0;
        newData.pip_value = (symbolRate * pipPerLot).toFixed(2);
      }
      
      // Update volume_lots when pip_per_lot changes
      if (name === 'pip_per_lot') {
        newData.volume_lots = value;
      }
      
      // Calculate commission when volume, symbol_rate, or pip_per_lot changes
      // Formula: Commission = (Volume × Symbol Rate) × 1.00
      if (name === 'volume_lots' || name === 'symbol_rate' || name === 'pip_per_lot') {
        // Get the correct volume value
        let volume;
        if (name === 'volume_lots') {
          volume = parseFloat(value) || 0;
        } else if (name === 'pip_per_lot') {
          // When pip_per_lot changes, volume_lots is set to the same value
          volume = parseFloat(value) || 0;
        } else {
          // When symbol_rate changes, use current volume_lots
          volume = parseFloat(newData.volume_lots) || 0;
        }
        
        // Get the correct symbol_rate value
        const symbolRate = name === 'symbol_rate' ? parseFloat(value) || 0 : parseFloat(newData.symbol_rate) || 0;
        
        // Commission = (volume × symbol_rate) × 1.00
        newData.commission = (volume * symbolRate * 1.00).toFixed(2);
      }
      
      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    const pipPerLot = parseFloat(formData.pip_per_lot);
    if (isNaN(pipPerLot) || pipPerLot < 0) {
      newErrors.pip_per_lot = 'Pip/Lot must be a valid positive number';
    }

    const symbolRate = parseFloat(formData.symbol_rate);
    if (isNaN(symbolRate) || symbolRate < 0) {
      newErrors.symbol_rate = 'Symbol Rate must be a valid positive number';
    }

    const volumeLots = parseFloat(formData.volume_lots);
    if (isNaN(volumeLots) || volumeLots < 0) {
      newErrors.volume_lots = 'Volume must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        pip_per_lot: parseFloat(formData.pip_per_lot),
        pip_value: parseFloat(formData.pip_value),
        commission: parseFloat(formData.commission),
        currency: formData.currency,
        status: formData.status,
        category: formData.category || null
      };

      await onSave(symbol.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error saving symbol:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const pipValueDisplay = parseFloat(formData.pip_value) || 0;
  const commissionDisplay = parseFloat(formData.commission) || 0;

  return (
    <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Edit Symbol</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
               Edit the symbol details to update the commission. 
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Pip/Lot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pip/Lot
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="pip_per_lot"
                      value={formData.pip_per_lot}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.pip_per_lot ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">pip</span>
                  </div>
                  {errors.pip_per_lot && (
                    <p className="mt-1 text-sm text-red-600">{errors.pip_per_lot}</p>
                  )}
                  
                  {/* Pip Value Calculation */}
                  <div className="mt-2 text-sm text-gray-600">
                    Pip value = {formData.symbol_rate} × {formData.pip_per_lot} = <strong className="text-green-600">${pipValueDisplay.toFixed(2)}</strong> per pip (1 lot)
                  </div>
                </div>

                {/* Symbol Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symbol Rate ($ per pip for 1 lot)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="symbol_rate"
                      value={formData.symbol_rate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.symbol_rate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">$/pip</span>
                  </div>
                  {errors.symbol_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.symbol_rate}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Category</option>
                    {categories && categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Volume (Lots) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume (Lots)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="volume_lots"
                      value={formData.volume_lots}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.volume_lots ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">lots</span>
                  </div>
                  {errors.volume_lots && (
                    <p className="mt-1 text-sm text-red-600">{errors.volume_lots}</p>
                  )}
                  
                  {/* Commission Calculation */}
                  <div className="mt-2 text-sm text-gray-600">
                    Commission = ({formData.volume_lots} × {formData.symbol_rate}) × 1.00 = <strong className="text-orange-600">${commissionDisplay.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="AUD">AUD</option>
                    <option value="CAD">CAD</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="px-6"
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                icon={<FiSave className="h-4 w-4" />}
                className="px-6 bg-black hover:bg-gray-800"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

