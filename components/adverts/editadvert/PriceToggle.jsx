'use client';

import React from 'react';
import { CATEGORIES_HIDE_ISFORHIRE } from '@/components/adverts/editadvert/AdvertCategories';

const PriceToggle = ({ formData, setFormData, handleChange }) => {
  const handlePriceTypeChange = (selectedType) => {
    // Determine which price type was previously selected
    const previouslySelected = {
      sell: formData.isForSale,
      hire: formData.isForHire,
      rent: formData.isForRent,
      share: formData.isForShare,
    };

    if (selectedType === 'hire' && shouldHideHire) {
      return;
    }

    // If the type has changed, reset all others to 0
    if (!previouslySelected[selectedType]) {
      setFormData((prev) => ({
        ...prev,
        isForSale: selectedType === 'sell',
        sellPrice: selectedType === 'sell' ? prev.sellPrice : 0,

        isForHire: selectedType === 'hire' && !shouldHideHire,
        hirePrice: selectedType === 'hire' && !shouldHideHire ? prev.hirePrice : 0,

        isForRent: selectedType === 'rent',
        rentPrice: selectedType === 'rent' ? prev.rentPrice : 0,

        isForShare: selectedType === 'share',
        sharePrice: selectedType === 'share' ? prev.sharePrice : 0,
      }));
    }
  };

  const shouldHideHire = CATEGORIES_HIDE_ISFORHIRE.includes(formData.category);

  return (
    <div className="mb-4">
      <label className="block font-bold mb-2">Price</label>

      {/* Price Type Buttons */}
      <div className="flex border border-gray-500 rounded overflow-hidden">
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForSale ? 'bg-gray-200 border-gray-500' : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeChange('sell')}
        >
          Sell
        </button>

        {!shouldHideHire && (
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForHire ? 'bg-gray-200 border-gray-500' : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeChange('hire')}
        >
          Hire
        </button>
        )}

        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForRent ? 'bg-gray-200 border-gray-500' : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeChange('rent')}
        >
          Rent
        </button>

        <button
          type="button"
          className={`flex-1 p-2 text-center ${
            formData.isForShare ? 'bg-gray-200 border-gray-500' : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeChange('share')}
        >
          Share
        </button>
      </div>

      {/* Price Input Fields */}
      <div className="mt-4">
        {formData.isForSale && (
          <input
            type="number"
            name="sellPrice"
            value={formData.sellPrice}
            onChange={handleChange}
            placeholder="Enter your price"
            className="w-full p-2 border rounded"
          />
        )}

        {formData.isForHire && (
          <>
            <input
              type="number"
              name="hirePrice"
              value={formData.hirePrice}
              onChange={handleChange}
              placeholder="Enter hire price"
              className="w-full p-2 border rounded mb-2"
            />
            <select
              name="hireUnit"
              value={formData.hireUnit}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="hour">Per Hour</option>
              <option value="day">Per Day</option>
            </select>
          </>
        )}

        {formData.isForRent && (
          <>
            <input
              type="number"
              name="rentPrice"
              value={formData.rentPrice}
              onChange={handleChange}
              placeholder="Enter rent price"
              className="w-full p-2 border rounded mb-2"
            />
            <select
              name="rentUnit"
              value={formData.rentUnit}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="week">Per Week</option>
              <option value="month">Per Month</option>
            </select>
          </>
        )}

        {formData.isForShare && (
          <>
            <input
              type="number"
              name="sharePrice"
              value={formData.sharePrice}
              onChange={handleChange}
              placeholder="Enter share price"
              className="w-full p-2 border rounded mb-2"
            />
            <select
              name="shareUnit"
              value={formData.shareUnit}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="week">Per Week</option>
              <option value="month">Per Month</option>
            </select>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceToggle;
