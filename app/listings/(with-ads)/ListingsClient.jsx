'use client';

import React, { useState, useRef } from 'react';
import { useListingFilters } from '@/hooks/listings/useListingFilters';
import { useSearchListings } from '@/hooks/listings/useSearchListings';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import { CATEGORIES, needsCommunityField } from '@/components/adverts/fieldSystem/Categories';
import { COMMUNITIES } from '@/utils/constants/communities';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const libraries = ['places'];

const AdvertsPage = ({ heading }) => {
  // URL-based filter state (nuqs)
  const {
    cat, sub, state: stateFilter, adType, q, sort, page, location, hasLocation, communities,
    setParams, setFiltersWithPageReset, clearAllFilters, setLocation, setCommunities,
    setCat, setSub, setState, setAdType, setQ, setSort, setPage, setRadius,
    params,
  } = useListingFilters();

  // TanStack Query — fetches listings based on current URL filters
  const { data, isLoading, isError, error, isPlaceholderData, refetch } = useSearchListings({
    cat, sub, state: stateFilter, adType, q, sort, page, location, communities,
  });

  const adverts = data?.adverts || [];
  const meta = data?.meta || { currentPage: 1, totalPages: 1, totalRecords: 0, itemsPerPage: 12 };
  const status = isLoading ? 'loading' : isError ? 'failed' : 'success';

  // Local UI state
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(q || '');
  const resultsRef = useRef(null);

  // Hero location input (local state for autocomplete text field)
  const [heroLocationInput, setHeroLocationInput] = useState(location?.name || '');
  const [heroAutocompleteMobile, setHeroAutocompleteMobile] = useState(null);
  const [heroAutocompleteDesktop, setHeroAutocompleteDesktop] = useState(null);

  // Get subcategories for selected parent category
  const heroSubcategories = cat
    ? CATEGORIES.find(c => c.label === cat)?.subcategories || []
    : [];

  // Modal filter states
  const [tempFilters, setTempFilters] = useState({});

  // Sort menu
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
  ];

  // Initialize temporary filters when modal opens
  const handleOpenFilters = () => {
    setTempFilters({
      state: stateFilter || '',
      adType: adType,
      sortBy: sort,
      communities: [...communities],
    });
    setShowFilters(true);
  };

  // --- Handlers ---

  const handleParentCategoryChange = (value) => {
    if (value === '') {
      // "All Categories" selected
      setFiltersWithPageReset({ cat: null, sub: null });
    } else {
      setCat(value);
    }
    scrollToResults();
  };

  const handleSubcategoryChange = (value) => {
    if (value === '') {
      // "All in {category}" selected
      setSub(null);
    } else {
      setSub(value);
    }
    scrollToResults();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQ(searchText);
  };

  const handleClearLocation = () => {
    setLocation(null);
    setHeroLocationInput('');
  };

  const handleClearSearch = () => {
    setQ(null);
    setSearchText('');
  };

  // Auto-scroll to results on mobile when filters change
  const scrollToResults = () => {
    setTimeout(() => {
      if (resultsRef.current && window.innerWidth < 768) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Hero section Clear button
  const handleHeroClear = () => {
    clearAllFilters();
    setHeroLocationInput('');
    setSearchText('');
    scrollToResults();
  };

  // Remove category and its associated subcategories
  const handleRemoveCategory = () => {
    setFiltersWithPageReset({ cat: null, sub: null });
  };

  // Hero location place changed - mobile
  const handleHeroPlaceChangedMobile = () => {
    if (heroAutocompleteMobile) {
      const place = heroAutocompleteMobile.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({
          lat,
          lng,
          radius: params.radius || 10,
          name: place.formatted_address || 'Selected Location',
        });
        setHeroLocationInput(place.formatted_address);
        scrollToResults();
      }
    }
  };

  // Hero location place changed - desktop
  const handleHeroPlaceChangedDesktop = () => {
    if (heroAutocompleteDesktop) {
      const place = heroAutocompleteDesktop.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocation({
          lat,
          lng,
          radius: params.radius || 10,
          name: place.formatted_address || 'Selected Location',
        });
        setHeroLocationInput(place.formatted_address);
        scrollToResults();
      }
    }
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      state: '',
      adType: null,
      sortBy: 'newest',
    });
    setSearchText('');
    clearAllFilters();
    setHeroLocationInput('');
  };

  const handleSortChange = (sortValue) => {
    setSort(sortValue);
    setShowSortMenu(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sort);
    return option?.label || 'Newest first';
  };

  const applyFilters = () => {
    const updates = {};
    if (tempFilters.state !== (stateFilter || '')) {
      updates.state = tempFilters.state || null;
    }
    if (tempFilters.adType !== adType) {
      updates.adType = tempFilters.adType || null;
    }
    if (tempFilters.sortBy !== sort) {
      updates.sort = tempFilters.sortBy || null;
    }
    // Apply communities filter
    const tempCommunitiesStr = (tempFilters.communities || []).join(',');
    const currentCommunitiesStr = communities.join(',');
    if (tempCommunitiesStr !== currentCommunitiesStr) {
      updates.communities = tempFilters.communities?.length > 0 ? tempFilters.communities.join(',') : null;
    }
    if (Object.keys(updates).length > 0) {
      setFiltersWithPageReset(updates);
    }
    setShowFilters(false);
  };


  const getActiveFilterCount = () => {
    let count = 0;
    if (cat) count++;
    if (sub) count++;
    if (hasLocation) count++;
    if (stateFilter) count++;
    if (q) count++;
    if (adType) count++;
    if (communities.length > 0) count++;
    return count;
  };

  const getTotalResults = () => {
    return meta.totalRecords || adverts.length;
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
      <div className={`fixed z-50 bg-white rounded-2xl shadow-xl
        w-full max-w-xl
        inset-y-0 right-0
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh]
        transition-all duration-300 ease-in-out
        overflow-y-auto
        ${showFilters
          ? 'translate-x-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
          : 'translate-x-full sm:translate-x-0 sm:opacity-0 sm:scale-95 sm:pointer-events-none'}`}>

          {/* Modal Header - Sticky */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-10">
            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
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
          <div className="p-4">
            {/* State Filter */}
            <div className="mb-5">
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
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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

            {/* Ad Type */}
            <div className="mb-5">
              <h3 className="font-semibold text-slate-700 mb-3">Ad Type</h3>
              <div className="flex gap-2">
                {['All', 'Offered', 'Wanted'].map((type) => (
                  <label key={type} className="flex items-center cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors flex-1">
                    <input
                      type="radio"
                      name="adType"
                      checked={type === 'All' ? !tempFilters.adType : tempFilters.adType === type.toLowerCase()}
                      onChange={() => {
                        const value = type === 'All' ? null : type.toLowerCase();
                        setTempFilters({ ...tempFilters, adType: value });
                      }}
                      className="w-4 h-4 text-teal-700 focus:ring-teal-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-slate-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Community/Language - Only show when eligible subcategory is selected */}
            {needsCommunityField(sub, cat) && (
              <div className="mb-5">
                <h3 className="font-semibold text-slate-700 mb-3">Community/Language</h3>
                <div className="max-h-[7.5rem] overflow-y-auto border border-slate-200 rounded-lg p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {COMMUNITIES.map((community) => (
                      <label
                        key={community.value}
                        className="flex items-center cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
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
                          className="w-4 h-4 text-teal-700 rounded focus:ring-teal-500 focus:ring-2 transition-all"
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
          <div className="sticky bottom-0 p-4 bg-white border-t border-slate-200 flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2.5 bg-teal-700 text-white hover:bg-teal-800 text-sm rounded-lg shadow-sm font-semibold transition-colors"
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
              {/* Parent Category Dropdown */}
              <Listbox value={cat || ''} onChange={handleParentCategoryChange}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className={cat ? 'text-slate-900' : 'text-slate-500'}>
                      {cat || 'Select Category'}
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
                      {CATEGORIES.map((group) => (
                        <ListboxOption
                          key={group.label}
                          value={group.label}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {group.label}
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

              {/* Subcategory Dropdown */}
              <Listbox value={sub || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                <div className="relative">
                  <ListboxButton className={`relative w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-slate-100 cursor-not-allowed'}`}>
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={sub ? 'text-slate-900' : 'text-slate-500'}>
                      {sub || (cat ? 'Select Subcategory' : 'Select category first')}
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
                              All in {cat}
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
                      {heroSubcategories.map((subcat) => (
                        <ListboxOption
                          key={subcat}
                          value={subcat}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {subcat}
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

              {/* Location Autocomplete */}
              <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => setIsScriptLoaded(true)}
                loadingElement={
                  <div className="relative">
                    <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                      <div className="h-4 bg-slate-300 rounded w-32"></div>
                    </div>
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                }
              >
                <div className="relative">
                  <Autocomplete
                    onLoad={(autocompleteInstance) => setHeroAutocompleteMobile(autocompleteInstance)}
                    onPlaceChanged={handleHeroPlaceChangedMobile}
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

              {/* Radius Slider - shows when location is selected */}
              {hasLocation && (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={params.radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-600 min-w-[40px] text-right">{params.radius}km</span>
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              {/* Category + subcategory + location + radius share one centered column so they line up */}
              <div className="max-w-[920px] mx-auto flex flex-col gap-2 sm:gap-3">
                {/* Filters Row */}
                <div className="flex items-center gap-3 w-full">
                {/* Parent Category Dropdown */}
                <div className="flex-1 max-w-[280px]">
                <Listbox value={cat || ''} onChange={handleParentCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={`block truncate ${cat ? 'text-slate-900' : 'text-slate-500'}`}>
                        {cat || 'Category'}
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
                        className="z-50 w-72 max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
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
                        {CATEGORIES.map((group) => (
                          <ListboxOption
                            key={group.label}
                            value={group.label}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {group.label}
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

                {/* Subcategory Dropdown */}
                <div className="flex-1 max-w-[280px]">
                <Listbox value={sub || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                  <div className="relative">
                    <ListboxButton className={`relative w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-slate-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`block truncate ${sub ? 'text-slate-900' : 'text-slate-500'}`}>
                        {sub || (cat ? 'Subcategory' : 'Select category first')}
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
                        className="z-50 w-72 max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
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
                                All in {cat}
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
                        {heroSubcategories.map((subcat) => (
                          <ListboxOption
                            key={subcat}
                            value={subcat}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {subcat}
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

                {/* Location Autocomplete */}
                <div className="flex-1 max-w-[320px]">
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative w-full">
                      <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-5 bg-slate-300 rounded w-32"></div>
                      </div>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  }
                >
                  <div className="relative w-full">
                    <Autocomplete
                      onLoad={(autocompleteInstance) => setHeroAutocompleteDesktop(autocompleteInstance)}
                      onPlaceChanged={handleHeroPlaceChangedDesktop}
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
                  <div className="flex-1 max-w-[280px]" aria-hidden="true"></div>
                  <div className="flex-1 max-w-[280px]" aria-hidden="true"></div>
                  <div className="flex-1 max-w-[320px] flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={params.radius}
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-600
                        [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-xs text-slate-600 min-w-[40px] text-right">{params.radius}km</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Filter + Sort controls (spacing owned by the section's gap) */}
          <div ref={resultsRef}>
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={handleOpenFilters}
              className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-slate-900">Filter</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-30 border border-slate-200 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
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
                  onClick={handleHeroClear}
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
                  {/* Show parent category */}
                  {cat && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {cat}
                      <button
                        onClick={handleRemoveCategory}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {/* Show subcategory */}
                  {sub && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {sub}
                      <button
                        onClick={() => setSub(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {stateFilter && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      {stateFilter}
                      <button
                        onClick={() => setState(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {hasLocation && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {params.radius}km {location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {q && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      &ldquo;{q}&rdquo;
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {adType && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      {adType}
                      <button
                        onClick={() => setAdType(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {/* Community chips - only show when eligible subcategory is selected */}
                  {needsCommunityField(sub, cat) && communities.map((community) => {
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
                          className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
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

        {/* Advert Listing */}
        <div className="mt-4">
          <AdvertList adverts={adverts} advertStatus={status} onRetry={() => refetch()} />
        </div>

        {/* Pagination */}
        <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            onPageChange={(pageNum) => {
              setPage(pageNum);
              // Scroll to results section
              setTimeout(() => {
                if (resultsRef.current) {
                  resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvertsPage;
