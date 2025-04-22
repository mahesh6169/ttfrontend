'use client';

import React from 'react';

const AdTypeToggle = ({ formData, setFormData }) => {
  return (
    <div className="mb-4">
      <label className="block font-bold mb-2">Ad Type</label>

      <div className="flex border rounded overflow-hidden">
        {/* Offered Button */}
        <button
          type="button"
          className={`flex-1 p-2 ${
            formData.isOffered
              ? 'bg-gray-200 border-gray-500'  // Selected
              : 'bg-white border-gray-300'      // Not Selected
          }`}
          onClick={() =>
            setFormData({
              ...formData,
              isOffered: true,
              isWanted: false,
            })
          }
        >
          Offered
        </button>

        {/* Wanted Button */}
        <button
          type="button"
          className={`flex-1 p-2 ${
            formData.isWanted
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() =>
            setFormData({
              ...formData,
              isOffered: false,
              isWanted: true,
            })
          }
        >
          Wanted
        </button>
      </div>
    </div>
  );
};

export default AdTypeToggle;
