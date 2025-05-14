// components/adverts/DynamicPricing.jsx
'use client';

import React from 'react';

const DynamicPricing = ({ pricingConfig, pricing, onChange, adType, errors = [] }) => {
  // Don't show pricing for wanted ads or if pricing is disabled
  if (adType === 'wanted' || !pricingConfig) {
    return null;
  }

  const handleToggle = (priceType) => {
    // For single selection mode - clear all and add only the selected type
    const config = pricingConfig[priceType];
    const newPricing = [{
      priceType,
      amount: 0,
      unit: config.units ? config.units[0] : undefined
    }];
    
    onChange(newPricing);
  };

  const handlePriceChange = (priceType, field, value) => {
    const updatedPricing = pricing.map(p => {
      if (p.priceType === priceType) {
        return {
          ...p,
          [field]: field === 'amount' ? parseFloat(value) || 0 : value
        };
      }
      return p;
    });
    onChange(updatedPricing);
  };

  const getActivePrice = (priceType) => {
    return pricing.find(p => p.priceType === priceType);
  };

  const availablePriceTypes = Object.entries(pricingConfig)
    .filter(([_, config]) => config && config.enabled !== false)
    .map(([type, config]) => ({
      type,
      label: config.label || type.charAt(0).toUpperCase() + type.slice(1),
      units: config.units || []
    }));

  if (availablePriceTypes.length === 0) {
    return null;
  }

  // Get the first available price type to use as default if nothing is selected
  const defaultPriceType = availablePriceTypes[0].type;
  
  // Ensure we have at least one pricing option selected
  React.useEffect(() => {
    if (pricing.length === 0 && availablePriceTypes.length > 0) {
      const config = pricingConfig[defaultPriceType];
      onChange([{
        priceType: defaultPriceType,
        amount: 0,
        unit: config.units ? config.units[0] : undefined
      }]);
    }
  }, []);

  return (
    <div className="mb-6">
      <label className="block font-bold mb-2 text-gray-700">Pricing Option</label>
      
      {/* Price Type Toggle Buttons - Only one can be selected */}
      <div className="flex border border-gray-300 rounded overflow-hidden mb-4">
        {availablePriceTypes.map(({ type, label }, index) => {
          const isActive = !!getActivePrice(type);
          return (
            <button
              key={type}
              type="button"
              className={`flex-1 p-3 text-center transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${index < availablePriceTypes.length - 1 ? 'border-r border-gray-300' : ''}`}
              onClick={() => handleToggle(type)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Price Input Fields */}
      <div className="space-y-4">
        {availablePriceTypes.map(({ type, label, units }) => {
          const activePrice = getActivePrice(type);
          if (!activePrice) return null;

          const priceError = errors.find(err => err.includes(`${type} price`));

          return (
            <div key={type} className="p-4 border border-gray-200 rounded">
              <h4 className="font-medium mb-2 text-gray-700">{label} Price</h4>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={activePrice.amount || ''}
                    onChange={(e) => handlePriceChange(type, 'amount', e.target.value)}
                    placeholder="Amount"
                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                      priceError 
                        ? 'border-red-500 focus:ring-red-300' 
                        : 'border-gray-300 focus:ring-teal-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {units.length > 0 && (
                  <div className="w-1/3">
                    <select
                      value={activePrice.unit || units[0]}
                      onChange={(e) => handlePriceChange(type, 'unit', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          per {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {priceError && (
                <p className="text-red-500 text-sm mt-1">{priceError}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicPricing;