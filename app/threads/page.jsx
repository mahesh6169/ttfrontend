'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  searchThreads, 
  fetchFilterOptions,
  toggleCategory,
  toggleCommunity,
  setLocation,
  updateFilter,
  clearAllFilters,
  updatePagination,
  fetchRecentActivity
} from '@/store/slices/threads/searchThreadsSlice';
import { COMMUNITIES } from '@/utils/constants/communities';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import PostTopicButton from '@/components/buttons/PostTopicButton';
import BottomAd from '@/components/ads/BottomAd';
import { getCategoryDisplayName } from '@/constants/categories';
import PromoBanner from '@/components/PromoBanner';
import { buildSlugUrl } from '@/utils/slugUtils';

const libraries = ['places'];

const ThreadsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { filters, pagination, threads, meta, status, error, filterOptions } = useSelector((state) => state.searchThreads);
  
  // Local state for UI
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');
  
  // Modal filter states
  const [tempFilters, setTempFilters] = useState({});

  // Sort menu state
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'most_comments', label: 'Most comments' },
    { value: 'recent_activity', label: 'Recent activity' },
  ];

  // Get formatted date for display
  const getPostedText = (createdAt) => {
    const daysAgo = differenceInDays(new Date(), new Date(createdAt));
    if (daysAgo <= 10) {
      return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    } else {
      return format(new Date(createdAt), 'dd MMM yyyy'); // e.g., 12 Apr 2025
    }
  };

  // Initialize temporary filters
  useEffect(() => {
    setTempFilters({
      categories: [...filters.categories],
      communities: [...filters.communities],
      location: filters.location,
      state: filters.state || '',
      sortBy: filters.sortBy,
    });
    // Set location input when filter modal opens
    if (filters.location) {
      setLocationInput(filters.location.name || '');
    }
  }, [showFilters, filters]);

  // Initial load - fetch filter options
  useEffect(() => {
    dispatch(fetchFilterOptions())
      .unwrap()
      .catch((error) => {
        toast.error('Failed to load filter options');
      });
    
    // Also fetch recent activity
    dispatch(fetchRecentActivity(5))
      .unwrap()
      .catch((error) => {
        console.error('Failed to load recent activity', error);
      });
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchThreads());
  }, [filters, pagination.page, dispatch]);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ];
        dispatch(setLocation({ 
          coordinates, 
          radius: 10,
          name: place.formatted_address || 'Selected Location'
        }));
        setLocationInput(place.formatted_address);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(updateFilter({ filterType: 'searchText', value: searchText }));
  };

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
    setLocationInput('');
  };

  const handleClearSearch = () => {
    dispatch(updateFilter({ filterType: 'searchText', value: '' }));
    setSearchText('');
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      categories: [],
      communities: [],
      location: null,
      state: '',
      sortBy: 'newest',
    });
    setLocationInput('');
  };

  // Function to handle sort changes
  const handleSortChange = (sortValue) => {
    dispatch(updateFilter({ filterType: 'sortBy', value: sortValue }));
    setShowSortMenu(false);
  };

  // Current sort label for display
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    return option?.label || 'Newest first';
  };

  const applyFilters = () => {
    // Apply all temporary filters to the store
    if (JSON.stringify(tempFilters.categories) !== JSON.stringify(filters.categories)) {
      filters.categories.forEach(cat => {
        if (!tempFilters.categories.includes(cat)) {
          dispatch(toggleCategory(cat));
        }
      });
      tempFilters.categories.forEach(cat => {
        if (!filters.categories.includes(cat)) {
          dispatch(toggleCategory(cat));
        }
      });
    }
    
    // Apply communities filter
    if (JSON.stringify(tempFilters.communities) !== JSON.stringify(filters.communities)) {
      filters.communities.forEach(comm => {
        if (!tempFilters.communities.includes(comm)) {
          dispatch(toggleCommunity(comm));
        }
      });
      tempFilters.communities.forEach(comm => {
        if (!filters.communities.includes(comm)) {
          dispatch(toggleCommunity(comm));
        }
      });
    }
    
    // Apply location filter
    if (tempFilters.location) {
      dispatch(setLocation(tempFilters.location));
    } else if (filters.location && !tempFilters.location) {
      dispatch(updateFilter({ filterType: 'location', value: null }));
    }
    
    // Apply state filter
    if (tempFilters.state !== filters.state) {
      dispatch(updateFilter({ filterType: 'state', value: tempFilters.state }));
    }
    
    // Apply sort
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));
    
    setShowFilters(false);
  };

  useEffect(() => {
    setSearchText(filters.searchText || '');
  }, [filters.searchText]);

  useEffect(() => {
    if (status === 'failed' && error) {
      toast.error(error.message || error || 'An error occurred');
    }
  }, [status, error]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.communities.length > 0) count++;
    if (filters.location) count++;
    if (filters.state) count++;
    if (filters.searchText) count++;
    return count;
  };

  return (
    <div className="flex flex-col relative">
      {/* Modal Overlay */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Filter Modal - Mobile and Desktop Overlay */}
      <div className={`fixed z-50 bg-white rounded-lg shadow-xl overflow-hidden
        w-full max-w-xl 
        inset-y-0 right-0 sm:inset-y-auto sm:top-10 sm:bottom-10 sm:left-1/2 sm:right-auto sm:-translate-x-1/2
        transition-all duration-300 ease-in-out
        ${showFilters 
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto' 
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>

        <div className="h-full overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b z-10">
            <h2 className="text-xl font-semibold">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearAllTempFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-2xl text-gray-600 hover:text-gray-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-4 pb-20">
            {/* State Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">State</h3>
              <div className="grid grid-cols-4 gap-2">
                {AUSTRALIAN_STATES.map(state => (
                  <button
                    key={state.code}
                    onClick={() => {
                      if (tempFilters.state === state.code) {
                        setTempFilters({ ...tempFilters, state: '' });
                      } else {
                        setTempFilters({ ...tempFilters, state: state.code, location: null });
                        setLocationInput('');
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.state === state.code
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${tempFilters.location ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!!tempFilters.location}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
              {tempFilters.location && (
                <p className="text-xs text-gray-500 mt-2">Clear location to use state filter</p>
              )}
            </div>

            {/* Location with Radius */}
            <div className={`mb-6 ${tempFilters.state ? 'opacity-50' : ''}`}>
              <h3 className="font-semibold text-gray-700 mb-3">Location</h3>
              {tempFilters.state && (
                <p className="text-xs text-gray-500 mb-2">Clear state selection to use location filter</p>
              )}
              <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => setIsScriptLoaded(true)}
              >
                <div className="relative">
                  <Autocomplete
                    onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
                    onPlaceChanged={() => {
                      if (autocomplete && !tempFilters.state) {
                        const place = autocomplete.getPlace();
                        if (place.geometry) {
                          const coordinates = [
                            place.geometry.location.lng(),
                            place.geometry.location.lat()
                          ];
                          const location = {
                            coordinates,
                            radius: tempFilters.location?.radius || 10,
                            name: place.formatted_address || 'Selected Location'
                          };
                          setTempFilters({ ...tempFilters, location, state: '' });
                          setLocationInput(place.formatted_address);
                        }
                      }
                    }}
                    options={{
                      componentRestrictions: { country: 'au' },
                      types: ['geocode']
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter location..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!!tempFilters.state}
                    />
                  </Autocomplete>
                  {tempFilters.location && (
                    <button
                      onClick={() => {
                        setTempFilters({ ...tempFilters, location: null });
                        setLocationInput('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear location"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </LoadScriptNext>
              
              {tempFilters.location && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-600">
                      Search within:
                    </label>
                    <span className="text-sm font-medium text-gray-700">
                      {tempFilters.location.radius} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={tempFilters.location.radius || 10}
                    onChange={(e) => {
                      const radius = parseInt(e.target.value);
                      setTempFilters({
                        ...tempFilters,
                        location: { ...tempFilters.location, radius }
                      });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-teal-700
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600 
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:bg-teal-700"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>200 km</span>
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                <div className="space-y-2 p-2">
                  {!filterOptions.categories || filterOptions.categories.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No categories available
                    </p>
                  ) : (
                    filterOptions.categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tempFilters.categories?.includes(category) || false}
                        onChange={() => {
                          const currentCategories = tempFilters.categories || [];
                          const newCategories = currentCategories.includes(category)
                            ? currentCategories.filter(c => c !== category)
                            : [...currentCategories, category];
                          setTempFilters({ ...tempFilters, categories: newCategories });
                        }}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 transition-all"
                      />
                      <span className="ml-3 text-gray-700">{getCategoryDisplayName(category)}</span>
                    </label>
                  )))
                  }
                </div>
              </div>
              {tempFilters.categories?.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {tempFilters.categories.length} selected
                </p>
              )}
            </div>

            {/* Communities */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Community/Language</h3>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                <div className="grid grid-cols-2 gap-1">
                  {COMMUNITIES.map((community) => (
                    <label
                      key={community.value}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={tempFilters.communities?.includes(community.value) || false}
                        onChange={() => {
                          const currentCommunities = tempFilters.communities || [];
                          const newCommunities = currentCommunities.includes(community.value)
                            ? currentCommunities.filter(c => c !== community.value)
                            : [...currentCommunities, community.value];
                          setTempFilters({ ...tempFilters, communities: newCommunities });
                        }}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 transition-all"
                      />
                      <span className="ml-2 text-sm text-gray-700">{community.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {tempFilters.communities?.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {tempFilters.communities.length} selected
                </p>
              )}
            </div>

            {/* Sort Options */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Sort By</h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <label key={option.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                    <input
                      type="radio"
                      name="sortBy"
                      checked={tempFilters.sortBy === option.value}
                      onChange={() => {
                        setTempFilters({ ...tempFilters, sortBy: option.value });
                      }}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500 focus:ring-2"
                    />
                    <span className="ml-3 text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:sticky">
            <button
              onClick={applyFilters}
              className="w-full bg-teal-700 text-lime-100 hover:bg-teal-800 hover:text-lime-50 py-3 rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Hero Banner */}
        {/* <div className="my-4 px-4">
          <div className="bg-white border-2 border-teal-700 p-6 rounded-lg shadow">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center">
              <span className="text-amber-500">Seek</span>
              <span className="text-teal-700 mx-2">•</span>
              <span className="text-teal-700">Learn</span>
              <span className="text-teal-700 mx-2">•</span>
              <span className="text-amber-500">Share</span>
            </h1>
            <p className="text-gray-600 text-center text-sm mt-2">Share knowledge with your community</p>
          </div>
        </div> */}

        {/* Create New Topic Button and Promo Banner */}
        <div className="my-2 px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="shrink-0">
              <PostTopicButton />
            </div>
            <div className="flex-1 min-w-0">
              <PromoBanner page="threads" inline={true} showAll={true} />
            </div>
          </div>
        </div>

        {/* Search Bar with Sort/Filter buttons */}
        <div className="px-3 mb-3 sm:px-4 sm:mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search topics..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button
              type="submit"
              className="bg-teal-700 text-lime-100 hover:bg-teal-800 hover:text-lime-50 px-4 py-2 rounded shadow transition-colors text-sm font-medium"
            >
              Search
            </button>
          </form>

          {/* Page Controls - Sort and Filter */}
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            
            <div className="relative">
              <button 
                className="flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="font-medium">Sort: {getCurrentSortLabel()}</span>
              </button>
              
              {/* Sort dropdown menu */}
              {showSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowSortMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-gray-200 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                          filters.sortBy === option.value ? 'bg-gray-50 font-medium' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="bg-gray-50 border-b px-3 py-3">
            <div className="flex gap-2 overflow-x-auto">
              <div className="flex gap-2 items-center">
                  {filters.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {getCategoryDisplayName(category)}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  {filters.state && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      State: {filters.state}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'state', value: '' }))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {filters.location && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {filters.location.radius}km from {filters.location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.searchText && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Search: "{filters.searchText}"
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  
                  {filters.communities.map((community) => {
                    const communityLabel = COMMUNITIES.find(c => c.value === community)?.label || community;
                    return (
                      <span
                        key={community}
                        className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
                      >
                        {communityLabel}
                        <button
                          onClick={() => dispatch(toggleCommunity(community))}
                          className="hover:text-gray-900 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Thread Listing with spacing from filters */}
        {status === 'loading' ? (
          <div className="text-center p-4 min-h-[400px] flex items-center justify-center">Loading threads...</div>
        ) : threads.length > 0 ? (
          <div className="space-y-3 px-3 sm:px-4 mt-4 min-h-[400px]">
            {threads.map((thread, index) => (
              <React.Fragment key={thread._id}>
                <Link
                  href={`/threads/${buildSlugUrl('thread', thread.title, thread._id).replace('/threads/', '')}`}
                  className="block border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex gap-3 p-3">
                    {/* Left content - Text section */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-1">{thread.title}</h2>
                      
                      {/* Question/Description */}
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{thread.question}</p>
                      
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span>{thread.ownerName || 'Former Member'}</span>
                        <span>•</span>
                        <span>{getPostedText(thread.createdAt)}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                          thread.commentCount > 0 
                            ? 'bg-teal-700 text-lime-100' 
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {thread.commentCount} {thread.commentCount === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>
                    </div>

                    {/* Right image - Optimized for horizontal space */}
                    {thread.images?.[0] && (
                      <div className="flex-shrink-0">
                        <img
                          src={
                            thread.images[0].optimizedUrls?.mobile || 
                            thread.images[0].url
                          }
                          alt="Thread"
                          className="w-20 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 object-cover rounded bg-white"
                        />
                      </div>
                    )}
                  </div>
                </Link>
                {/* Insert BottomAd after the 3rd thread, or after the last thread if 2-3 threads */}
                {((index === 2 && threads.length >= 4) || (index === threads.length - 1 && threads.length >= 2 && threads.length < 4)) && (
                  <div className="w-full">
                    <BottomAd />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 min-h-[400px] flex items-center justify-center">
            <p className="text-xs sm:text-sm text-gray-800">No threads available. Start a new discussion!</p>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(pageNum) => 
                dispatch(updatePagination({ page: pageNum }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadsPage;