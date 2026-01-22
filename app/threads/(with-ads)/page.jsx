'use client';

import React, { useEffect, useState, Fragment } from 'react';
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
import { FaFrown } from 'react-icons/fa';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import BottomAd from '@/components/ads/BottomAd';
import { getCategoryDisplayName } from '@/constants/categories';
import HeroThreadsSection from '@/components/threads/HeroThreadsSection';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';

const libraries = ['places'];

const ThreadsPage = () => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_THREAD_IMAGE_URL;
  const dispatch = useDispatch();
  const router = useRouter();
  const { filters, pagination, threads, meta, status, error, filterOptions } = useSelector((state) => state.searchThreads);
  
  // Local state for UI
  const [locationInput, setLocationInput] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.searchText || '');

  // Hero section state
  const [heroCategory, setHeroCategory] = useState('');
  const [heroLocationInput, setHeroLocationInput] = useState('');
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [heroLocation, setHeroLocation] = useState(null);
  const [heroRadius, setHeroRadius] = useState(50);

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
      communities: [...filters.communities],
      state: filters.state || '',
      sortBy: filters.sortBy,
    });
  }, [showFilters, filters]);

  // Initial load - fetch filter options
  useEffect(() => {
    dispatch(fetchFilterOptions())
      .unwrap()
      .catch((error) => {
        console.error('Failed to load filter options:', error);
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

  // Sync hero category with Redux filters - reset when category is cleared from active filters
  useEffect(() => {
    if (heroCategory && !filters.categories.includes(heroCategory)) {
      setHeroCategory('');
    }
  }, [filters.categories]);

  // Sync hero location with Redux filters - reset when location is cleared from active filters
  useEffect(() => {
    if (!filters.location && heroLocation) {
      setHeroLocation(null);
      setHeroLocationInput('');
    }
  }, [filters.location]);

  // Hero Go button handler
  const handleHeroGo = () => {
    // Apply category if selected
    if (heroCategory && !filters.categories.includes(heroCategory)) {
      dispatch(toggleCategory(heroCategory));
    }
    // Apply location if selected
    if (heroLocation) {
      dispatch(setLocation({ ...heroLocation, radius: heroRadius }));
    }
    // Apply search text
    if (searchText) {
      dispatch(updateFilter({ filterType: 'searchText', value: searchText }));
    }
  };

  // Hero location place changed handler
  const handleHeroPlaceChanged = () => {
    if (heroAutocomplete) {
      const place = heroAutocomplete.getPlace();
      if (place.geometry) {
        const coordinates = [
          place.geometry.location.lng(),
          place.geometry.location.lat()
        ];
        setHeroLocation({
          coordinates,
          radius: heroRadius,
          name: place.formatted_address || 'Selected Location'
        });
        setHeroLocationInput(place.formatted_address);
      }
    }
  };

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
      communities: [],
      state: '',
      sortBy: 'newest',
    });
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
      console.error('Search failed:', error.message || error || 'An error occurred');
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
    <div className="flex flex-col relative min-h-[calc(100vh-180px)]">
      {/* Modal Overlay */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Filter Modal - Mobile and Desktop Overlay */}
      <div className={`fixed z-50 bg-white rounded-lg shadow-xl
        w-full max-w-xl
        inset-y-0 right-0
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh]
        transition-all duration-300 ease-in-out
        overflow-y-auto
        ${showFilters
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>

          {/* Modal Header - Sticky */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white border-b z-10">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAllTempFilters}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xl text-gray-600 hover:text-gray-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-3">
            {/* State Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">State</h3>
              <div className="grid grid-cols-4 gap-2">
                {AUSTRALIAN_STATES.map(state => (
                  <button
                    key={state.code}
                    onClick={() => {
                      if (tempFilters.state === state.code) {
                        setTempFilters({ ...tempFilters, state: '' });
                      } else {
                        setTempFilters({ ...tempFilters, state: state.code });
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.state === state.code
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Communities */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Community/Language</h3>
              <div className="max-h-[7.5rem] overflow-y-auto border border-gray-200 rounded-md p-2">
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
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      />
                      <span className="ml-2 text-sm text-gray-700">{community.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {tempFilters.communities?.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {tempFilters.communities.length} selected
                </p>
              )}
            </div>
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-[#1E3A5F] text-white hover:bg-[#152d4a] text-sm rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Hero Section with Two-tone Blue Curved Container */}
        <section
          className="relative mt-2 md:mt-4 mb-4 mx-0 sm:mx-4 pt-0 pb-4 px-0 sm:pb-6 rounded-none sm:rounded-xl overflow-hidden"
          style={{ background: '#a3d5ff' }}
        >
          {/* Wave layer 1 - Medium blue */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 C150,100 300,0 500,50 C700,100 850,0 1000,50 L1000,400 L0,400 Z"
                fill="#B1DBFF"
              />
            </svg>
          </div>

          {/* Wave layer 2 - Lightest blue */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,80 C200,130 400,30 600,80 C800,130 900,30 1000,80 L1000,400 L0,400 Z"
                fill="#BFE2FF"
              />
            </svg>
          </div>

          {/* Hero Content */}
          <div className="relative p-0 sm:pt-0 sm:pb-2 sm:px-4">
            <HeroThreadsSection showViewAll={false} showCreate={false} compact={true} />
          </div>

          {/* Hero Controls */}
          <div className="relative px-3 sm:px-6 -mt-2 md:mt-0 pb-4">
            <div className="md:max-w-4xl md:mx-auto">
              {/* Search Input - Own row */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search topics... e.g. Visa, Jobs, Housing"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Post Topic, Category, Location, Go - Second row */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                {/* Post Topic Button */}
                <Link
                  href="/threads/new"
                  className="self-start md:self-auto bg-[#E8F4FF] hover:bg-[#D0E8FF] text-sm font-bold py-2 px-4 md:py-2.5 md:px-5 rounded-full shadow-sm transition-colors whitespace-nowrap"
                  style={{ color: '#1E3A5F' }}
                >
                  + Post Topic
                </Link>

                {/* Category Dropdown - Headless UI */}
                <Listbox value={heroCategory} onChange={setHeroCategory}>
                  <div className="relative flex-1 md:flex-initial md:w-52">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={heroCategory ? 'text-gray-900' : 'text-gray-500'}>
                        {heroCategory ? getCategoryDisplayName(heroCategory) : 'Category'}
                      </span>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-[var(--button-width)] max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {filterOptions.categories?.map((cat) => (
                          <ListboxOption
                            key={cat}
                            value={cat}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {getCategoryDisplayName(cat)}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {/* Location Input */}
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative flex-1 md:flex-initial md:w-52">
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
                        <div className="h-5 bg-gray-300 rounded w-24"></div>
                      </div>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  }
                >
                  <div className="relative flex-1 md:flex-initial md:w-52">
                    <Autocomplete
                      onLoad={(autocompleteInstance) => setHeroAutocomplete(autocompleteInstance)}
                      onPlaceChanged={handleHeroPlaceChanged}
                      options={{
                        componentRestrictions: { country: 'au' },
                        types: ['geocode']
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Location"
                        value={heroLocationInput}
                        onChange={(e) => setHeroLocationInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

                {/* Go Button */}
                <button
                  onClick={handleHeroGo}
                  className="w-full md:w-auto px-6 py-2.5 text-white font-semibold rounded-full shadow-sm transition-colors"
                  style={{ backgroundColor: '#1E3A5F' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#152d4a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E3A5F'}
                >
                  Go
                </button>
              </div>

              {/* Radius slider - appears when location is selected */}
              {heroLocation && (
                <>
                  {/* Mobile slider */}
                  <div className="md:hidden mt-2">
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-xs text-gray-700">1km</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={heroRadius}
                        onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-600
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-xs text-gray-700 min-w-[40px] text-right">{heroRadius}km</span>
                    </div>
                  </div>
                  {/* Desktop slider - aligned under location */}
                  <div className="hidden md:flex mt-1 items-center gap-3">
                    {/* Spacer for Post Topic button */}
                    <div className="w-[116px]"></div>
                    {/* Spacer for Category dropdown */}
                    <div className="w-52"></div>
                    {/* Slider aligned with location input */}
                    <div className="w-52 flex items-center gap-2 px-3">
                      <span className="text-xs text-gray-700">1km</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={heroRadius}
                        onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-blue-600
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-xs text-gray-700 min-w-[40px] text-right">{heroRadius}km</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Page Controls - Sort and Filter */}
        <div className="px-3 mb-3 sm:px-4 sm:mb-4">
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
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
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
        ) : status === 'failed' ? (
          <div className="flex flex-col justify-center items-center text-center p-8 min-h-[400px]">
            <FaFrown className="text-gray-400 text-4xl sm:text-5xl mb-4" />
            <p className="text-gray-600 text-sm sm:text-base mb-2">Something went wrong</p>
            <p className="text-gray-500 text-xs sm:text-sm">Please try again later</p>
          </div>
        ) : threads.length > 0 ? (
          <div className="space-y-3 px-3 sm:px-4 mt-4 min-h-[400px]">
            {threads.map((thread, index) => (
              <React.Fragment key={thread._id}>
                <Link
                  href={`/threads/views/${thread._id}`}
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
                            ? 'bg-[#1E3A5F] text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {thread.commentCount} {thread.commentCount === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>
                    </div>

                    {/* Right image - Optimized for horizontal space */}
                    <div className="flex-shrink-0">
                      <img
                        src={
                          thread.images?.[0] 
                            ? (thread.images[0].optimizedUrls?.mobile || thread.images[0].url)
                            : FALLBACK_IMAGE
                        }
                        alt="Thread"
                        className="w-20 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 object-cover rounded bg-white"
                      />
                    </div>
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