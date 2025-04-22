'use client';

import React from 'react';
import { CATEGORIES_HIDE_ISFORHIRE } from '@/components/adverts/addadvert/AdvertCategories';

const PriceToggle = ({ formData, setFormData, category }) => {
  const handlePriceTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      isForSale: type === 'sell',
      isForHire: type === 'hire',
      isForRent: type === 'rent',
      isForShare: type === 'share',

      // ❌ Removed isRequestQuote handling
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const shouldHideHire = CATEGORIES_HIDE_ISFORHIRE.includes(category);

  return (
    <div className="mb-4">
      <label className="block font-bold mb-2">Price</label>

      {/* Price Type Toggle Buttons */}
      <div className="flex border border-gray-500 rounded overflow-hidden">
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForSale
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeSelect('sell')}
        >
          Sell
        </button>
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForRent
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeSelect('rent')}
        >
          Rent
        </button>

        {!shouldHideHire && (
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.isForHire
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() => handlePriceTypeSelect('hire')}
        >
          Hire
        </button>
  )}
        <button
  type="button"
  className={`flex-1 p-2 text-center ${
    formData.isForShare
      ? 'bg-gray-200 border-gray-500'
      : 'bg-white border-gray-300'
  }`}
  onClick={() => handlePriceTypeSelect('share')}
>
  Share
</button>



      </div>

      {/* Conditional Inputs */}
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

        {formData.isForHire && !shouldHideHire && (
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
