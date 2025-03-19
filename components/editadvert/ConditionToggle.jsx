'use client';

import React from 'react';

const ConditionToggle = ({ formData, setFormData }) => {
  // Don't render if no condition should be shown
  if (!formData || !setFormData) return null;

  return (
    <div className="mb-4">
      <label className="block font-bold mb-2">Condition</label>

      <div className="flex border border-gray-500 rounded overflow-hidden">
        {/* New Condition Button */}
        <button
          type="button"
          className={`flex-1 p-2 text-center border-r-2 ${
            formData.condition === 'New'
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() =>
            setFormData({
              ...formData,
              condition: 'New',
            })
          }
        >
          New
        </button>

        {/* Used Condition Button */}
        <button
          type="button"
          className={`flex-1 p-2 text-center ${
            formData.condition === 'Used'
              ? 'bg-gray-200 border-gray-500'
              : 'bg-white border-gray-300'
          }`}
          onClick={() =>
            setFormData({
              ...formData,
              condition: 'Used',
            })
          }
        >
          Used
        </button>
      </div>
    </div>
  );
};

export default ConditionToggle;
