'use client';

import React, { useState, useRef } from 'react';
import { useListingFilters } from '@/hooks/listings/useListingFilters';
import { useSearchListings } from '@/hooks/listings/useSearchListings';
import AdvertList from '@/components/adverts/advertcomponents/AdvertList';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import PromoBanner from '@/components/PromoBanner';
import HeroListingSection from '@/components/adverts/HeroListingSection';
import { CATEGORIES } from '@/components/adverts/fieldSystem/Categories';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const libraries = ['places'];

const AdvertsPage = () => {
  // URL-based filter state (nuqs)
  const {
    cat, sub, state: stateFilter, adType, q, sort, page, location, hasLocation,
    setParams, setFiltersWithPageReset, clearAllFilters, setLocation,
    setCat, setSub, setState, setAdType, setQ, setSort, setPage, setRadius,
    params,
  } = useListingFilters();

  // TanStack Query — fetches listings based on current URL filters
  const { data, isLoading, isError, error, isPlaceholderData } = useSearchListings({
    cat, sub, state: stateFilter, adType, q, sort, page, location,
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
  };

  const handleSubcategoryChange = (value) => {
    if (value === '') {
      // "All in {category}" selected
      setSub(null);
    } else {
      setSub(value);
    }
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

  // Hero section Go button
  const handleHeroGo = () => {
    // Scroll to results on mobile after a short delay
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
    return count;
  };

  const hasFiltersToShow = cat || hasLocation || getActiveFilterCount() > 0;

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
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Type */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Ad Type</h3>
              <div className="flex gap-2">
                {['All', 'Offered', 'Wanted'].map((type) => (
                  <label key={type} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors flex-1">
                    <input
                      type="radio"
                      name="adType"
                      checked={type === 'All' ? !tempFilters.adType : tempFilters.adType === type.toLowerCase()}
                      onChange={() => {
                        const value = type === 'All' ? null : type.toLowerCase();
                        setTempFilters({ ...tempFilters, adType: value });
                      }}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-teal-700 text-lime-100 hover:bg-teal-800 hover:text-lime-50 text-sm rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Hero Section with two-tone curved container */}
        <section
          className="relative mt-2 md:mt-4 mb-4 mx-0 sm:mx-4 pt-0 pb-4 px-0 sm:pb-6 rounded-none sm:rounded-xl overflow-hidden"
          style={{ background: 'rgb(180, 210, 130)' }}
        >
          {/* Wave layer 1 - Medium green */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 C150,100 300,0 500,50 C700,100 850,0 1000,50 L1000,400 L0,400 Z"
                fill="rgb(205, 225, 160)"
              />
            </svg>
          </div>

          {/* Wave layer 2 - Lightest green */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,80 C200,130 400,30 600,80 C800,130 900,30 1000,80 L1000,400 L0,400 Z"
                fill="rgb(235, 245, 193)"
              />
            </svg>
          </div>

          <div className="relative p-0 sm:pt-0 sm:pb-2 sm:px-4">
            <HeroListingSection showViewAll={false} showCreate={false} compact={true} />
          </div>

          {/* Category & Location Picker inside the curved container */}
          <div className="relative px-3 sm:px-6 -mt-2 md:mt-0 pb-4">
            <div className="md:max-w-3xl md:mx-auto">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col gap-1.5 md:hidden">
                {/* Post Listing Button */}
                <Link
                  href="/listings/add"
                  className="self-start bg-[#f0f7d4] hover:bg-[#e8f2c1] text-teal-900 text-xs font-bold py-1.5 px-3 rounded-full shadow-sm transition-colors"
                >
                  + Post Listing
                </Link>

                {/* Parent Category Dropdown */}
                <Listbox value={cat || ''} onChange={handleParentCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-full text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={cat ? 'text-gray-900' : 'text-gray-500'}>
                        {cat || 'Select Category'}
                      </span>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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

                {/* Subcategory Dropdown - always visible, disabled when no parent */}
                <Listbox value={sub || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                  <div className="relative">
                    <ListboxButton className={`relative w-full pl-8 pr-8 py-2 border border-gray-200 rounded-full text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={sub ? 'text-gray-900' : 'text-gray-500'}>
                        {sub || (cat ? 'Select Subcategory' : 'Select category first')}
                      </span>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                      <div className="w-full pl-8 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                      </div>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-full text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

                {/* Radius Slider - shows when location is selected */}
                {hasLocation && (
                  <div className="flex items-center gap-2 px-3 -mt-1">
                    <span className="text-xs text-gray-600">1km</span>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={params.radius}
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-teal-600
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-xs text-gray-600 min-w-[40px] text-right">{params.radius}km</span>
                  </div>
                )}

                {/* Go and Clear Buttons */}
                <div className="flex gap-2 self-start">
                  <button
                    onClick={handleHeroGo}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-1.5 px-6 rounded-full shadow-sm transition-colors"
                  >
                    Go
                  </button>
                  {hasFiltersToShow && (
                    <button
                      onClick={handleHeroClear}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-full shadow-sm transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Layout - Inline */}
              <div className="hidden md:flex items-center gap-3">
                {/* Post Listing Button */}
                <Link
                  href="/listings/add"
                  className="bg-[#f0f7d4] hover:bg-[#e8f2c1] text-teal-900 text-sm font-bold py-2.5 px-5 rounded-full shadow-sm transition-colors whitespace-nowrap"
                >
                  + Post Listing
                </Link>

                {/* Parent Category Dropdown */}
                <Listbox value={cat || ''} onChange={handleParentCategoryChange}>
                  <div className="relative flex-1 max-w-[200px]">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={`block truncate ${cat ? 'text-gray-900' : 'text-gray-500'}`}>
                        {cat || 'Category'}
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
                        className="z-50 w-72 max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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

                {/* Subcategory Dropdown - always visible, disabled when no parent */}
                <Listbox value={sub || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                  <div className="relative w-[260px]">
                    <ListboxButton className={`relative w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={`block truncate ${sub ? 'text-gray-900' : 'text-gray-500'}`}>
                        {sub || (cat ? 'Subcategory' : 'Select category first')}
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
                        className="z-50 w-72 max-h-[var(--anchor-max-height,15rem)] overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-gray-900'}`
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
                    <div className="relative w-[280px]">
                      <div className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full animate-pulse">
                        <div className="h-5 bg-gray-300 rounded w-32"></div>
                      </div>
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  }
                >
                  <div className="relative w-[280px]">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

              </div>

              {/* Go and Clear Buttons - Desktop (separate row) */}
              <div className="hidden md:flex justify-center gap-2 mt-2">
                <button
                  onClick={handleHeroGo}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-1.5 px-6 rounded-full shadow-sm transition-colors whitespace-nowrap"
                >
                  Go
                </button>
                {hasFiltersToShow && (
                  <button
                    onClick={handleHeroClear}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-sm py-1.5 px-4 rounded-full shadow-sm transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Radius Slider - Desktop */}
              {hasLocation && (
                <div className="hidden md:flex mt-2 items-center justify-center gap-2 max-w-md mx-auto">
                  <span className="text-xs text-gray-600">1km</span>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={params.radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-teal-600
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-gray-600 min-w-[40px] text-right">{params.radius}km</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Page Controls - Sort and Filter */}
        <div ref={resultsRef} className="px-3 mb-3 sm:px-4 sm:mb-4">
          {/* Page Controls - Sort and Filter */}
          <div className="flex gap-2 md:gap-3 justify-center">
            <button
              onClick={handleOpenFilters}
              className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs md:text-sm"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
            </button>

            <div className="relative">
  <button
    className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs md:text-sm"
    onClick={() => setShowSortMenu(!showSortMenu)}
  >
    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              sort === option.value ? 'bg-gray-50 font-medium' : ''
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
          <div className="bg-gray-50 border-y">
            <div className="relative py-2 sm:py-3">
              {/* Left edge fade - mobile only */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10 md:hidden"></div>
              {/* Right edge fade - mobile only */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10 md:hidden"></div>

              <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3 sm:px-4">
                <div className="flex gap-2">
                  {/* Show parent category */}
                  {cat && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {cat}
                      <button
                        onClick={handleRemoveCategory}
                        className="hover:text-teal-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {/* Show subcategory */}
                  {sub && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-white border border-gray-300 text-gray-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {sub}
                      <button
                        onClick={() => setSub(null)}
                        className="hover:text-gray-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {stateFilter && (
                    <span className="inline-flex items-center gap-0.5 bg-white border border-gray-300 text-gray-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      {stateFilter}
                      <button
                        onClick={() => setState(null)}
                        className="hover:text-gray-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {hasLocation && (
                    <span className="inline-flex items-center gap-0.5 bg-white border border-gray-300 text-gray-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {params.radius}km {location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-gray-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {q && (
                    <span className="inline-flex items-center gap-0.5 bg-white border border-gray-300 text-gray-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      &ldquo;{q}&rdquo;
                      <button
                        onClick={handleClearSearch}
                        className="hover:text-gray-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {adType && (
                    <span className="inline-flex items-center gap-0.5 bg-white border border-gray-300 text-gray-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      {adType}
                      <button
                        onClick={() => setAdType(null)}
                        className="hover:text-gray-900 font-bold p-1 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advert Listing */}
        <div className="px-3 sm:px-4 mt-4">
          <AdvertList adverts={adverts} advertStatus={status} />
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
