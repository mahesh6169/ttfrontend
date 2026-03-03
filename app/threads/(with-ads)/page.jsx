'use client';

import React, { useEffect, useState, Fragment, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { needsCommunityField } from '@/components/threads/categories';

const libraries = ['places'];

const ThreadsPage = () => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_THREAD_IMAGE_URL;
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Ref for scroll-to-results behavior
  const resultsRef = useRef(null);

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

  // Apply category filter from URL param - replaces existing category filter
  const catParam = searchParams.get('cat');
  useEffect(() => {
    if (catParam) {
      dispatch(updateFilter({ filterType: 'categories', value: [catParam] }));
    }
  }, [catParam, dispatch]);

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

  // Clear communities when category changes to non-eligible or is cleared
  useEffect(() => {
    const currentCategory = filters.categories[0];
    if (!needsCommunityField(currentCategory) && filters.communities.length > 0) {
      dispatch(updateFilter({ filterType: 'communities', value: [] }));
    }
  }, [filters.categories, dispatch]);

  // Hero Go button handler
  const handleHeroGo = () => {
    // Apply search text
    if (searchText) {
      dispatch(updateFilter({ filterType: 'searchText', value: searchText }));
    }
    // Apply category if selected
    if (heroCategory && !filters.categories.includes(heroCategory)) {
      dispatch(toggleCategory(heroCategory));
    }
    // Apply location if selected
    if (heroLocation) {
      dispatch(setLocation({ ...heroLocation, radius: heroRadius }));
    }
    // Scroll to results on mobile
    if (resultsRef.current && window.innerWidth < 768) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const hasFiltersToShow = heroCategory || heroLocation || searchText || getActiveFilterCount() > 0;

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
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xl text-slate-600 hover:text-slate-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-3">
            {/* State Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-slate-700 mb-3">State</h3>
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
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Communities - Only show when eligible category is selected */}
            {needsCommunityField(filters.categories[0]) && (
              <div className="mb-4">
                <h3 className="font-semibold text-slate-700 mb-3">Community/Language</h3>
                <div className="max-h-[7.5rem] overflow-y-auto border border-slate-200 rounded-md p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {COMMUNITIES.map((community) => (
                      <label
                        key={community.value}
                        className="flex items-center cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors"
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
                        <span className="ml-2 text-sm text-slate-700">{community.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {tempFilters.communities?.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    {tempFilters.communities.length} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-teal-700 text-white hover:bg-teal-800 text-sm rounded-lg shadow-sm font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Hero Section */}
        <section className="bg-white border border-slate-200 shadow-sm mx-3 md:mx-4 rounded-xl px-3 py-4 md:px-6 md:py-5 mt-2 md:mt-4 mb-4">
          <h1 className="sr-only">Threads</h1>

          <div className="md:max-w-4xl md:mx-auto">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* Post Topic Button - Right aligned */}
              <div className="flex justify-end">
                <Link
                  href="/threads/new"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
                >
                  + Post Topic
                </Link>
              </div>

              {/* Search Input - Threads specific */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Category Dropdown */}
              <Listbox value={heroCategory} onChange={setHeroCategory}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className={heroCategory ? 'text-slate-900' : 'text-slate-500'}>
                      {heroCategory ? getCategoryDisplayName(heroCategory) : 'Select Category'}
                    </span>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                      className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                    >
                      <ListboxOption
                        value=""
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                              All Categories
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
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
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {getCategoryDisplayName(cat)}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
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

              {/* Location Input - Mobile */}
              <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => setIsScriptLoaded(true)}
                loadingElement={
                  <div className="relative">
                    <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                      <div className="h-4 bg-slate-300 rounded w-32"></div>
                    </div>
                  </div>
                }
              >
                <div className="relative">
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
                      placeholder="Enter suburb or city"
                      value={heroLocationInput}
                      onChange={(e) => setHeroLocationInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </Autocomplete>
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </LoadScriptNext>

              {/* Radius Slider - Mobile (shown when location selected) */}
              {heroLocation && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={heroRadius}
                    onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-600 min-w-[40px] text-right">{heroRadius}km</span>
                </div>
              )}

              {/* Go / Clear Buttons - Mobile */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleHeroGo}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-2 px-5 rounded-full shadow-sm transition-colors"
                >
                  Go
                </button>
                {hasFiltersToShow && (
                  <button
                    onClick={() => {
                      setSearchText('');
                      setHeroCategory('');
                      setHeroLocation(null);
                      setHeroLocationInput('');
                      dispatch(clearAllFilters());
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Layout - Inline */}
            <div className="hidden md:block">
              {/* Post Button - Right aligned */}
              <div className="flex justify-end mb-3">
                <Link
                  href="/threads/new"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
                >
                  + Post Topic
                </Link>
              </div>

              {/* Search Input - Threads specific */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search topics... e.g. Visa, Jobs, Housing"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-3">
                {/* Category Dropdown - Desktop */}
                <Listbox value={heroCategory} onChange={setHeroCategory}>
                  <div className="relative flex-1 max-w-[220px]">
                    <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={heroCategory ? 'text-slate-900' : 'text-slate-500'}>
                        {heroCategory ? getCategoryDisplayName(heroCategory) : 'Select Category'}
                      </span>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                        className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {getCategoryDisplayName(cat)}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
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

                {/* Location Input - Desktop */}
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative flex-1 max-w-[220px]">
                      <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-5 bg-slate-300 rounded w-32"></div>
                      </div>
                    </div>
                  }
                >
                  <div className="relative flex-1 max-w-[220px]">
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
                        placeholder="Enter suburb or city"
                        value={heroLocationInput}
                        onChange={(e) => setHeroLocationInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

                {/* Go / Clear Buttons - Desktop */}
                <button
                  onClick={handleHeroGo}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-5 rounded-full shadow-sm transition-colors"
                >
                  Go
                </button>
                {hasFiltersToShow && (
                  <button
                    onClick={() => {
                      setSearchText('');
                      setHeroCategory('');
                      setHeroLocation(null);
                      setHeroLocationInput('');
                      dispatch(clearAllFilters());
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold py-2 px-4 rounded-full transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Radius Slider - Desktop (shown when location selected) */}
              {heroLocation && (
                <div className="flex items-center gap-2 mt-3 ml-[232px]">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={heroRadius}
                    onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                    className="w-[200px] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-600 min-w-[40px] text-right">{heroRadius}km</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Page Controls - Sort and Filter */}
        <div ref={resultsRef} className="bg-white px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-teal-700 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            
            <div className="relative">
              <button
                className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
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
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-30 border border-slate-200 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors ${
                          filters.sortBy === option.value ? 'bg-slate-50 font-medium' : ''
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
          <div className="bg-slate-50 border-y border-slate-200">
            <div className="relative py-2 sm:py-3">
              {/* Edge fades for mobile */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10 md:hidden"></div>
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-10 md:hidden"></div>

              <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3 sm:px-4">
                <div className="flex gap-2 items-center">
                  {filters.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {getCategoryDisplayName(category)}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-teal-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  {filters.state && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      State: {filters.state}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'state', value: '' }))}
                        className="hover:text-teal-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.location && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {filters.location.radius}km from {filters.location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-teal-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.searchText && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm flex-shrink-0">
                      <span className="max-w-[100px] md:max-w-[150px] truncate">Search: "{filters.searchText}"</span>
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-teal-900 font-bold ml-1 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {/* Only show communities when eligible category is selected */}
                  {needsCommunityField(filters.categories[0]) && filters.communities.map((community) => {
                    const communityLabel = COMMUNITIES.find(c => c.value === community)?.label || community;
                    return (
                      <span
                        key={community}
                        className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                      >
                        {communityLabel}
                        <button
                          onClick={() => dispatch(toggleCommunity(community))}
                          className="hover:text-teal-900 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thread Listing with spacing from filters */}
        {status === 'loading' ? (
          <div className="text-center p-4 min-h-[400px] flex items-center justify-center">Loading threads...</div>
        ) : status === 'failed' ? (
          <div className="flex flex-col justify-center items-center text-center p-8 min-h-[400px]">
            <FaFrown className="text-slate-400 text-4xl sm:text-5xl mb-4" />
            <p className="text-slate-600 text-sm sm:text-base mb-2">Something went wrong</p>
            <p className="text-slate-500 text-xs sm:text-sm">Please try again later</p>
          </div>
        ) : threads.length > 0 ? (
          <div className="space-y-3 px-3 sm:px-4 mt-4 min-h-[400px]">
            {threads.map((thread, index) => (
              <React.Fragment key={thread._id}>
                <Link
                  href={`/threads/views/${thread._id}`}
                  className="block bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex gap-3 p-3">
                    {/* Left content - Text section */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-1">{thread.title}</h2>
                      
                      {/* Question/Description */}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2">{thread.question}</p>
                      
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>{thread.ownerName || 'Former Member'}</span>
                        <span>•</span>
                        <span>{getPostedText(thread.createdAt)}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                          thread.commentCount > 0
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-300 text-slate-700'
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
            <p className="text-xs sm:text-sm text-slate-800">No threads available. Start a new discussion!</p>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(pageNum) => {
                dispatch(updatePagination({ page: pageNum }));
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadsPage;