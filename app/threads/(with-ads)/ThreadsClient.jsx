'use client';

import React, { useState, Fragment, useRef } from 'react';
import { useThreadFilters } from '@/hooks/threads/useThreadFilters';
import { useSearchThreads, useThreadFilterOptions } from '@/hooks/threads/useSearchThreads';
import { COMMUNITIES } from '@/utils/constants/communities';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import BottomAd from '@/components/ads/BottomAd';
import { getCategoryDisplayName } from '@/constants/categories';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { needsCommunityField } from '@/components/threads/categories';

const libraries = ['places'];

const ThreadsPage = ({ heading }) => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_THREAD_IMAGE_URL;

  // URL-based filters (nuqs)
  const {
    cat,
    communities,
    state,
    q,
    sort,
    page,
    location,
    hasLocation,
    setCat,
    setCommunities,
    setState,
    setQ,
    setSort,
    setPage,
    setLocation,
    setRadius,
    clearAllFilters,
  } = useThreadFilters();

  // TanStack Query for fetching threads
  const { data, isLoading, isError, refetch } = useSearchThreads({
    cat,
    communities,
    state,
    q,
    sort,
    page,
    location,
  });

  // TanStack Query for filter options
  const { data: filterOptionsData } = useThreadFilterOptions();
  const filterOptions = filterOptionsData || { categories: [] };

  const threads = data?.threads || [];
  const meta = data?.meta || { currentPage: 1, totalPages: 1, totalRecords: 0, itemsPerPage: 12 };
  const status = isLoading ? 'loading' : isError ? 'failed' : 'success';

  // Local state for UI only
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [heroLocationInput, setHeroLocationInput] = useState(location?.name || '');
  const [heroRadius, setHeroRadius] = useState(location?.radius || 10);
  const [searchText, setSearchText] = useState(q || '');

  // Modal filter states (temporary until applied)
  const [tempFilters, setTempFilters] = useState({
    communities: [...communities],
    state: state || '',
    sortBy: sort,
  });

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
      return format(new Date(createdAt), 'dd MMM yyyy');
    }
  };

  // Auto-scroll to results on mobile
  const scrollToResults = () => {
    setTimeout(() => {
      if (resultsRef.current && window.innerWidth < 768) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Sync tempFilters when modal opens
  const handleOpenFilters = () => {
    setTempFilters({
      communities: [...communities],
      state: state || '',
      sortBy: sort,
    });
    setShowFilters(true);
  };

  // Handle category change - applies immediately, auto-scroll
  const handleCategoryChange = (newCat) => {
    setCat(newCat || null);
    scrollToResults();
  };

  // Handle search text submit - applies immediately
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setQ(searchText || null);
    scrollToResults();
  };

  // Handle location selection from autocomplete
  const handleHeroPlaceChanged = () => {
    if (heroAutocomplete) {
      const place = heroAutocomplete.getPlace();
      if (place.geometry) {
        const newLocation = {
          coordinates: [
            place.geometry.location.lng(),
            place.geometry.location.lat()
          ],
          radius: heroRadius,
          name: place.formatted_address || 'Selected Location'
        };
        setLocation(newLocation);
        setHeroLocationInput(place.formatted_address);
        scrollToResults();
      }
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    setHeroRadius(newRadius);
    if (location) {
      setRadius(newRadius);
    }
  };

  // Clear location filter
  const handleClearLocation = () => {
    setLocation(null);
    setHeroLocationInput('');
  };

  // Clear search text
  const handleClearSearch = () => {
    setQ(null);
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

  // Handle sort change
  const handleSortChange = (sortValue) => {
    setSort(sortValue);
    setShowSortMenu(false);
  };

  // Current sort label for display
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sort);
    return option?.label || 'Newest first';
  };

  // Apply modal filters
  const applyFilters = () => {
    // Apply all temp filters to URL
    setCommunities(tempFilters.communities);
    setState(tempFilters.state || null);
    setSort(tempFilters.sortBy);
    setShowFilters(false);
    scrollToResults();
  };

  // Handle clear all
  const handleClearAll = () => {
    clearAllFilters();
    setHeroLocationInput('');
    setSearchText('');
    scrollToResults();
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (cat) count++;
    if (communities.length > 0) count++;
    if (location) count++;
    if (state) count++;
    if (q) count++;
    return count;
  };

  // Toggle community in temp filters
  const handleTempCommunityToggle = (communityValue) => {
    const currentCommunities = tempFilters.communities || [];
    const newCommunities = currentCommunities.includes(communityValue)
      ? currentCommunities.filter(c => c !== communityValue)
      : [...currentCommunities, communityValue];
    setTempFilters({ ...tempFilters, communities: newCommunities });
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
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-xl text-teal-700 hover:text-teal-800 font-bold leading-none transition-colors"
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
                {AUSTRALIAN_STATES.map(stateOption => (
                  <button
                    key={stateOption.code}
                    onClick={() => {
                      if (tempFilters.state === stateOption.code) {
                        setTempFilters({ ...tempFilters, state: '' });
                      } else {
                        setTempFilters({ ...tempFilters, state: stateOption.code });
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.state === stateOption.code
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={stateOption.name}
                  >
                    {stateOption.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Communities - Only show when eligible category is selected */}
            {needsCommunityField(cat) && (
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
                          onChange={() => handleTempCommunityToggle(community.value)}
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
        {/* Browse hero - one section, single vertical gap (8/12), no card. See layout.md section 1. */}
        <section className="flex flex-col gap-2 sm:gap-3">
          {heading}
          <div className="w-full">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-2 sm:gap-3 max-w-[90%] mx-auto md:hidden">
              {/* Search Input - Applies on Enter */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onBlur={handleSearchSubmit}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>

              {/* Category Dropdown - Applies immediately */}
              <Listbox value={cat || ''} onChange={handleCategoryChange}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className={cat ? 'text-slate-900' : 'text-slate-500'}>
                      {cat ? getCategoryDisplayName(cat) : 'Select Category'}
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
                      {filterOptions.categories?.map((catOption) => (
                        <ListboxOption
                          key={catOption}
                          value={catOption}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {getCategoryDisplayName(catOption)}
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
              {hasLocation && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={heroRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-600 min-w-[40px] text-right">{heroRadius}km</span>
                </div>
              )}
            </div>

            {/* Desktop Layout - Inline */}
            <div className="hidden md:block">
              {/* Category + location + radius share one centered column so they line up */}
              <div className="max-w-[920px] mx-auto flex flex-col gap-2 sm:gap-3">
                {/* Filters Row */}
                <div className="flex items-center gap-3 w-full">
                {/* Search Input - Applies on Enter or blur */}
                <div className="flex-1 max-w-[360px]">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search topics... e.g. Visa, Jobs, Housing"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onBlur={handleSearchSubmit}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </form>
                </div>

                {/* Category Dropdown - Desktop - Applies immediately */}
                <div className="flex-1 max-w-[260px]">
                <Listbox value={cat || ''} onChange={handleCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={cat ? 'text-slate-900' : 'text-slate-500'}>
                        {cat ? getCategoryDisplayName(cat) : 'Select Category'}
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
                        {filterOptions.categories?.map((catOption) => (
                          <ListboxOption
                            key={catOption}
                            value={catOption}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {getCategoryDisplayName(catOption)}
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
                </div>

                {/* Location Input - Desktop */}
                <div className="flex-1 max-w-[280px]">
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative w-full">
                      <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-5 bg-slate-300 rounded w-32"></div>
                      </div>
                    </div>
                  }
                >
                  <div className="relative w-full">
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
                </div>

              </div>

              {/* Radius Slider - Desktop - width matched to the location field */}
              {hasLocation && (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 max-w-[360px]" aria-hidden="true"></div>
                  <div className="flex-1 max-w-[260px]" aria-hidden="true"></div>
                  <div className="flex-1 max-w-[280px] flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={heroRadius}
                      onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                        [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-xs text-slate-600 min-w-[40px] text-right">{heroRadius}km</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

        {/* Page Controls - Sort and Filter */}
        <div ref={resultsRef}>
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={handleOpenFilters}
              className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
            >
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-slate-900">Filter</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-slate-900">Sort: {getCurrentSortLabel()}</span>
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
                          sort === option.value ? 'bg-slate-50 font-medium' : ''
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
          <div>
            <div>
              <div className="flex items-center gap-2">
                {/* Clear - fixed at the left, never scrolls; chips scroll to its right */}
                <button
                  onClick={handleClearAll}
                  className="flex-shrink-0 border border-slate-300 text-slate-600 hover:bg-slate-100 text-[11px] md:text-sm font-medium py-1 px-3 md:py-1.5 md:px-4 rounded-full transition-colors"
                >
                  Clear
                </button>
                {/* Scrollable chips track - shrinks (min-w-0) so chips scroll instead of pushing Clear off */}
                <div className="relative flex-1 min-w-0">
                  {/* Left edge fade - hints chips scrolled off the left */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
                  {/* Right edge fade - hints more chips to scroll right */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>

                  <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex gap-2">
                  {cat && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {getCategoryDisplayName(cat)}
                      <button
                        onClick={() => setCat(null)}
                        className="hover:text-slate-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {state && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      State: {state}
                      <button
                        onClick={() => setState(null)}
                        className="hover:text-slate-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {location && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {location.radius}km from {location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-slate-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {q && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm flex-shrink-0">
                      <span className="max-w-[100px] md:max-w-[150px] truncate">Search: "{q}"</span>
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-slate-900 font-bold ml-1 flex-shrink-0"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {/* Only show communities when eligible category is selected */}
                  {needsCommunityField(cat) && communities.map((community) => {
                    const communityLabel = COMMUNITIES.find(c => c.value === community)?.label || community;
                    return (
                      <span
                        key={community}
                        className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                      >
                        {communityLabel}
                        <button
                          onClick={() => {
                            const newCommunities = communities.filter(c => c !== community);
                            setCommunities(newCommunities);
                          }}
                          className="hover:text-slate-900 font-bold ml-1"
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
            </div>
          </div>
        )}
        </section>

        {/* Thread Listing with spacing from filters */}
        {status === 'loading' ? (
          <PageSkeleton variant="mediaRow" rows={6} className="mt-4" />
        ) : status === 'failed' ? (
          <ErrorState onRetry={() => refetch()} />
        ) : threads.length > 0 ? (
          <div className="space-y-3 mt-4 min-h-[400px]">
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
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{thread.title}</h2>

                      {/* Question/Description */}
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-2">{thread.question}</p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>{thread.isCuratedThread ? 'Desify Team' : (thread.ownerName || 'Former Member')}</span>
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
          <EmptyState title="No threads available" description="Start a new discussion!" />
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(pageNum) => {
                setPage(pageNum);
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
