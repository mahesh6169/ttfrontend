"use client";
import React from 'react';
import { COMMUNITIES } from '@/utils/constants/communities';

const CommunitySelector = ({ 
  value = [], 
  onChange, 
  label = "Community/Language",
  name = "communities",
  error = null,
  showHint = false
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
        <label className="block font-bold mb-2 text-gray-700">
          {label}
        </label>
      )}
      
      {showHint && (
        <p className="text-sm text-gray-600 mb-2">
          Your advert is listed for everyone by default. Select one or more communities/languages so it appears when users filter by them.
        </p>
      )}
      
      <div className="max-h-[7.5rem] overflow-y-auto border border-gray-200 rounded-md p-2">
        <div className="grid grid-cols-2 gap-1">
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
      </div>
      
      {showHint && (
        <p className="text-sm text-gray-600 mt-2">
          Don't see your community/language listed? <a href="/support/contact" className="text-blue-600 hover:text-blue-800 underline">Request it here</a>.
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CommunitySelector;