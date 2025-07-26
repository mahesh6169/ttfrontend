"use client";
import React from 'react';
import { COMMUNITIES } from '@/utils/constants/communities';

const CommunitySelector = ({ 
  value = [], 
  onChange, 
  label = "Community/Language",
  name = "communities",
  error = null
}) => {
  const handleChange = (communityValue) => {
    const newValue = value.includes(communityValue)
      ? value.filter(v => v !== communityValue)
      : [...value, communityValue];
    
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {COMMUNITIES.map((community) => (
          <label
            key={community.value}
            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            <input
              type="checkbox"
              value={community.value}
              checked={value.includes(community.value)}
              onChange={() => handleChange(community.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {community.label}
            </span>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CommunitySelector;