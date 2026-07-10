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
        <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
          {label}
        </label>
      )}
      
      {showHint && (
        <p className="text-xs text-slate-500 mb-2">
          Your advert is listed for everyone by default. Select one or more communities/languages so it appears when users filter by them.
        </p>
      )}
      
      <div className="max-h-[7.5rem] overflow-y-auto border border-slate-200 rounded-md p-2">
        <div className="grid grid-cols-2 gap-1">
          {COMMUNITIES.map((community) => (
            <label
              key={community.value}
              className="flex items-center cursor-pointer hover:bg-slate-50 p-2 rounded"
            >
              <input
                type="checkbox"
                value={community.value}
                checked={value.includes(community.value)}
                onChange={() => handleChange(community.value)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">
                {community.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      {showHint && (
        <p className="text-xs text-slate-500 mt-2">
          Don't see your community/language listed? <a href="/support/contact" className="text-teal-700 hover:text-teal-800 underline">Request it here</a>.
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CommunitySelector;