'use client';

import React, { useState, useRef } from 'react';
import { useEventFilters } from '@/hooks/events/useEventFilters';
import { useSearchEvents } from '@/hooks/events/useSearchEvents';
import { COMMUNITIES } from '@/utils/constants/communities';
import EventsGrid from '@/components/events/eventcomponents/EventsGrid';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { format, parse } from 'date-fns';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import { getCategoryDisplayName } from '@/constants/categories';
import { CATEGORY_OPTIONS, needsCommunityField } from '@/components/events/addevents/EventCategories';
import Link from 'next/link';
import FilterDropdown from '@/components/events/eventcomponents/FilterDropdown';
import { FaTimes } from 'react-icons/fa';

const libraries = ['places'];

// Generate month options for the dropdown
const generateMonthOptions = () => {
  const months = [];
  const currentDate = new Date();

  // Add current month and next 11 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthStr = format(date, 'yyyy-MM');
    const monthDisplay = format(date, 'MMMM yyyy');
    months.push({ value: monthStr, label: monthDisplay });
  }

  return months;
};

const monthOptions = generateMonthOptions();

// {value,label} option lists for the custom drawer dropdowns (first entry = the "All ..." option).
const categoryDropdownOptions = [
  { value: '', label: 'All Categories' },
  ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
];
const monthDropdownOptions = [
  { value: '', label: 'All Upcoming Events' },
  ...monthOptions,
];

const EventsPage = ({ heading, initialData = null }) => {
  // URL-based filters (nuqs)
  const {
    cat,
    communities,
    state,
    month,
    eventType,
    sort,
    page,
    location,
    hasLocation,
    setCat,
    setCommunities,
    setState,
    setMonth,
    setEventType,
    setSort,
    setPage,
    setLocation,
    setRadius,
    clearAllFilters,
  } = useEventFilters();

  // Default view = no filters, no location, page 1, default sort. Only then may the
  // server pre-fill (initialData) seed the grid; any change and the hook fetches fresh
  // (so a filtered/paged view is never seeded with the default 12).
  const isDefaultView =
    !cat && communities.length === 0 && !state && !month && !eventType &&
    !location && sort === 'date' && page === 1;

  // TanStack Query for fetching events
  const { data, isLoading, isError, refetch } = useSearchEvents({
    cat,
    communities,
    state,
    month,
    eventType,
    q: null,
    sort,
    page,
    location,
    initialData: isDefaultView ? initialData : undefined,
  });

  const events = data?.events || [];
  const meta = data?.meta || { currentPage: 1, totalPages: 1, totalRecords: 0, itemsPerPage: 12 };
  const status = isLoading ? 'loading' : isError ? 'failed' : 'success';

  // Local state for UI only
  // Separate instances per breakpoint (mirrors /listings) so the mobile and
  // desktop location fields don't clobber a single shared autocomplete.
  const [heroAutocompleteMobile, setHeroAutocompleteMobile] = useState(null);
  const [heroAutocompleteDesktop, setHeroAutocompleteDesktop] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [heroLocationInput, setHeroLocationInput] = useState(location?.name || '');
  const [heroRadius, setHeroRadius] = useState(location?.radius || 60);

  // Modal filter states (temporary until applied). Category lives here now (moved out of the
  // hero) and is applied on "Show results". Sort is NOT here - it is a standalone toolbar
  // control applied directly, so it can't fight a second copy in the drawer.
  const [tempFilters, setTempFilters] = useState({
    communities: [...communities],
    category: cat || '',
    state: state || '',
    month: month || '',
    eventType: eventType || '',
  });

  // Sort menu state
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Ref for scroll-to-results behavior
  const resultsRef = useRef(null);

  const sortOptions = [
    { value: 'date', label: 'Date (soonest first)' },
    { value: 'distance', label: 'Distance (nearest first)' },
  ];

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
      category: cat || '',
      state: state || '',
      month: month || '',
      eventType: eventType || '',
    });
    setShowFilters(true);
  };

  // Commit a selected place to the filters. Each breakpoint passes its own
  // Autocomplete instance so the two fields never read each other's place.
  const commitHeroPlace = (autocomplete) => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (place?.geometry) {
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
  };
  const handleHeroPlaceChangedMobile = () => commitHeroPlace(heroAutocompleteMobile);
  const handleHeroPlaceChangedDesktop = () => commitHeroPlace(heroAutocompleteDesktop);

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

  // Clear month filter
  const handleClearMonth = () => {
    setMonth(null);
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      communities: [],
      category: '',
      state: '',
      month: '',
      eventType: '',
    });
  };

  // Handle sort change
  const handleSortChange = (sortValue) => {
    setSort(sortValue);
    setShowSortMenu(false);
  };

  // Apply modal filters
  const applyFilters = () => {
    // Apply all temp filters to URL (sort is applied elsewhere, from the toolbar)
    setCat(tempFilters.category || null);
    setCommunities(tempFilters.communities);
    setState(tempFilters.state || null);
    setMonth(tempFilters.month || null);
    setEventType(tempFilters.eventType || null);
    setShowFilters(false);
    scrollToResults();
  };

  // Handle clear all
  const handleClearAll = () => {
    clearAllFilters();
    setHeroLocationInput('');
    scrollToResults();
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (cat) count++;
    if (communities.length > 0) count++;
    if (location) count++;
    if (state) count++;
    if (month) count++;
    if (eventType) count++;
    return count;
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch (error) {
      return monthStr;
    }
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

          {/* Modal Header - Sticky. Clear pinned left, close (x) pinned right; no title. */}
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10">
            <button
              onClick={handleClearAllTempFilters}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowFilters(false)}
              aria-label="Close"
              className="p-1 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="p-4">
            {/* Category (moved here from the hero; applied on "Show results") */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">Category</h3>
              <FilterDropdown
                ariaLabel="Category"
                value={tempFilters.category || ''}
                onChange={(v) => setTempFilters({ ...tempFilters, category: v })}
                options={categoryDropdownOptions}
                placeholder="All Categories"
              />
            </div>

            {/* Month Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">Month</h3>
              <FilterDropdown
                ariaLabel="Month"
                value={tempFilters.month || ''}
                onChange={(v) => setTempFilters({ ...tempFilters, month: v })}
                options={monthDropdownOptions}
                placeholder="All Upcoming Events"
              />
            </div>

            {/* Event Type Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">Event Type</h3>
              <div className="flex gap-2">
                {[
                  { value: '', label: 'All' },
                  { value: 'free', label: 'RSVP' },
                  { value: 'paid', label: 'Paid' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setTempFilters({ ...tempFilters, eventType: type.value })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      tempFilters.eventType === type.value
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* State Filter */}
            <div className="mb-6">
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
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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

            {/* Communities - Only show for eligible categories (reacts to the TEMP category,
                so choosing a category reveals/hides this before "Show results") */}
            {needsCommunityField(tempFilters.category) && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-3">Community/Language</h3>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
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
                          className="w-4 h-4 text-teal-700 rounded focus:ring-teal-300 focus:ring-2 transition-all"
                        />
                        <span className="ml-2 text-sm text-slate-700">{community.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {tempFilters.communities?.length > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    {tempFilters.communities.length} selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t border-slate-200 flex justify-center">
            <button
              onClick={applyFilters}
              className="px-5 py-2.5 bg-teal-700 text-white hover:bg-teal-800 text-sm rounded-lg shadow-sm font-semibold transition-colors"
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
              {/* Location + Filter, one row (slim hero) */}
              <div className="flex items-center gap-2">
                {/* Location Input - Mobile */}
                <LoadScriptNext
                  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  onLoad={() => setIsScriptLoaded(true)}
                  loadingElement={
                    <div className="relative flex-1 min-w-0">
                      <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg animate-pulse">
                        <div className="h-4 bg-slate-300 rounded w-32"></div>
                      </div>
                    </div>
                  }
                >
                  <div className="relative flex-1 min-w-0">
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
                        className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all"
                      />
                    </Autocomplete>
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </LoadScriptNext>

                {/* Filter button (secondary) - opens the drawer with all filters */}
                <button
                  onClick={handleOpenFilters}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-slate-700">Filter</span>
                </button>
              </div>

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
                      [&::-webkit-slider-thumb]:bg-teal-700 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-700
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-500 min-w-[40px] text-right">{heroRadius}km</span>
                </div>
              )}

            </div>

            {/* Desktop Layout - Inline */}
            <div className="hidden md:block">
              <div className="max-w-[520px] mx-auto flex flex-col gap-2 sm:gap-3">
                {/* Filters Row */}
                {/* Location + Filter, one row (slim hero) */}
                <div className="flex items-center gap-3 w-full">
                  {/* Location Input - Desktop */}
                  <LoadScriptNext
                    googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                    libraries={libraries}
                    onLoad={() => setIsScriptLoaded(true)}
                    loadingElement={
                      <div className="relative flex-1 min-w-0">
                        <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-300 rounded-lg animate-pulse">
                          <div className="h-5 bg-slate-300 rounded w-32"></div>
                        </div>
                      </div>
                    }
                  >
                    <div className="relative flex-1 min-w-0">
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
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all"
                        />
                      </Autocomplete>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </LoadScriptNext>

                  {/* Filter button (secondary) - opens the drawer with all filters */}
                  <button
                    onClick={handleOpenFilters}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="text-slate-700">Filter</span>
                  </button>
                </div>

              {/* Radius Slider - Desktop (contextual, kept local style) */}
              {hasLocation && (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={heroRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-teal-700 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-1.5 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-700
                      [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-xs text-slate-500 min-w-[40px] text-right">{heroRadius}km</span>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Create Event (secondary) - grid-first, sits below the search */}
          <div className="flex justify-center">
            <Link
              href="/events/add"
              className="inline-flex items-center gap-1 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              + Create Event
            </Link>
          </div>

          {/* Toolbar row: Clear (left, pinned) + chips (scroll, middle) + Sort (right, pinned) */}
          <div ref={resultsRef} data-testid="events-toolbar" className="flex items-center gap-2">
            {getActiveFilterCount() > 0 && (
              <button
                onClick={handleClearAll}
                className="flex-shrink-0 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs md:text-sm font-medium py-1 px-3 md:py-1.5 md:px-4 rounded-full transition-colors"
              >
                Clear
              </button>
            )}
            {/* Scrollable chips track - shrinks (min-w-0) so chips scroll instead of pushing Clear/Sort off */}
            <div className="relative flex-1 min-w-0">
              {/* Left edge fade - hints chips scrolled off the left */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
              {/* Right edge fade - hints more chips to scroll right */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>

              <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-2">
                  {cat && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {getCategoryDisplayName(cat)}
                      <button
                        onClick={() => setCat(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {state && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      {state}
                      <button
                        onClick={() => setState(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {location && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {location.radius}km {location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {month && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      {formatMonth(month)}
                      <button
                        onClick={handleClearMonth}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {eventType && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                      {eventType === 'free' ? 'RSVP' : 'Paid'}
                      <button
                        onClick={() => setEventType(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {communities.map((community) => {
                    const communityLabel = COMMUNITIES.find(c => c.value === community)?.label || community;
                    return (
                      <span
                        key={community}
                        className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm whitespace-nowrap flex-shrink-0"
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

                {/* Sort - pinned at the right of the toolbar (ordering, not filtering) */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-medium py-1 px-3 md:py-1.5 md:px-4 rounded-full transition-colors whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <span>Sort: {sort === 'distance' ? 'Distance' : 'Date'}</span>
                  </button>

                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)}></div>
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-30 border border-slate-200 py-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors ${
                              sort === option.value ? 'bg-teal-50 text-teal-700 font-medium' : ''
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
        </section>

        {/* Event listing (below the hero cluster) */}
        <div className="mt-4">
          <EventsGrid events={events} eventStatus={status} onRetry={() => refetch()} />
        </div>

        {/* Pagination - only show when there are events */}
        {events.length > 0 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages || 1}
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

export default EventsPage;
