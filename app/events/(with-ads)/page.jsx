'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  searchEvents, 
  fetchFilterOptions,
  toggleCategory,
  toggleCommunity,
  setLocation,
  setMonth,
  updateFilter,
  clearAllFilters,
  updatePagination
} from '@/store/slices/events/searchEventsSlice';
import { COMMUNITIES } from '@/utils/constants/communities';
import EventsGrid from '@/components/events/eventcomponents/EventsGrid';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { format, parse, addMonths } from 'date-fns';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import { getCategoryDisplayName } from '@/constants/categories';
import { CATEGORY_OPTIONS } from '@/components/events/addevents/EventCategories';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const libraries = ['places'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

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

const EventsPage = () => {
  const dispatch = useDispatch();
  const { filters, pagination, events, meta, status, error, filterOptions } = useSelector((state) => state.searchEvents);
  
  // Local state for UI
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [heroCategory, setHeroCategory] = useState('');
  const [heroLocationInput, setHeroLocationInput] = useState('');
  const [heroLocation, setHeroLocation] = useState(null);
  const [heroRadius, setHeroRadius] = useState(60);
  
  // Modal filter states
  const [tempFilters, setTempFilters] = useState({});

  // Add state for sort menu
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Ref for scroll-to-results behavior
  const resultsRef = useRef(null);

  const sortOptions = [
    { value: 'date', label: 'Date (soonest first)' },
    { value: 'distance', label: 'Distance (nearest first)' },
  ];

  // Initialize temporary filters
  useEffect(() => {
    setTempFilters({
      communities: [...filters.communities],
      state: filters.state || '',
      month: filters.month,
      eventType: filters.eventType || '',
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
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchEvents());
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

  const handleHeroSearch = () => {
    // Apply category filter
    if (heroCategory && !filters.categories.includes(heroCategory)) {
      dispatch(toggleCategory(heroCategory));
    }
    // Apply location filter
    if (heroLocation) {
      dispatch(setLocation({ ...heroLocation, radius: heroRadius }));
    }
    // Scroll to results on mobile
    if (resultsRef.current && window.innerWidth < 768) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
    setHeroLocationInput('');
    setHeroLocation(null);
  };

  const handleClearMonth = () => {
    dispatch(setMonth(''));
  };

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      communities: [],
      state: '',
      month: '',
      eventType: '',
      sortBy: 'date',
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
    return option?.label || 'Date (soonest first)';
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

    // Apply month filter
    if (tempFilters.month !== filters.month) {
      dispatch(setMonth(tempFilters.month || ''));
    }

    // Apply event type filter
    if (tempFilters.eventType !== filters.eventType) {
      dispatch(updateFilter({ filterType: 'eventType', value: tempFilters.eventType }));
    }

    // Apply sort
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));

    setShowFilters(false);
  };

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
    if (filters.month) count++;
    if (filters.eventType) count++;
    return count;
  };

  const hasFiltersToShow = heroCategory || heroLocation || getActiveFilterCount() > 0;

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch (error) {
      return monthStr;
    }
  };
  
  const handleMonthChange = (e) => {
    const value = e.target.value;
    setTempFilters({ ...tempFilters, month: value });
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
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10">
            <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearAllTempFilters}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-2xl text-slate-600 hover:text-slate-800 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-4">
            {/* Month Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">Month</h3>
              <select
                value={tempFilters.month || ''}
                onChange={handleMonthChange}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">All Upcoming Events</option>
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-700 mb-3">Event Type</h3>
              <div className="flex gap-2">
                {[
                  { value: '', label: 'All' },
                  { value: 'free', label: 'Free' },
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

            {/* Communities */}
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
                <p className="text-sm text-slate-600 mt-1">
                  {tempFilters.communities.length} selected
                </p>
              )}
            </div>
          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t border-slate-200 flex justify-center">
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
        {/* Hero Section - Clean White */}
        <section className="bg-white border border-slate-200 shadow-sm mx-3 md:mx-4 rounded-xl px-3 py-4 md:px-6 md:py-5 mt-2 md:mt-4 mb-4">
          {/* Accessibility heading */}
          <h1 className="sr-only">Events</h1>

          <div className="md:max-w-4xl md:mx-auto">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* Post Event Button - Right aligned */}
              <div className="flex justify-end">
                <Link
                  href="/events/add"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
                >
                  + Post an Event
                </Link>
              </div>

              {/* Category Dropdown */}
              <Listbox value={heroCategory} onChange={setHeroCategory}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span className={heroCategory ? 'text-slate-900' : 'text-slate-500'}>
                      {heroCategory || 'Select Category'}
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
                      {CATEGORY_OPTIONS.map((cat) => (
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
                                {cat}
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
                  onClick={handleHeroSearch}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-2 px-5 rounded-full shadow-sm transition-colors"
                >
                  Go
                </button>
                {hasFiltersToShow && (
                  <button
                    onClick={() => {
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
              <div className="flex justify-end mb-4">
                <Link
                  href="/events/add"
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
                >
                  + Post an Event
                </Link>
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
                        {heroCategory || 'Select Category'}
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
                        {CATEGORY_OPTIONS.map((cat) => (
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
                                  {cat}
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
                    <div className="relative flex-1 max-w-[280px]">
                      <div className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-5 bg-slate-300 rounded w-32"></div>
                      </div>
                    </div>
                  }
                >
                  <div className="relative flex-1 max-w-[280px]">
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

                {/* Go Button - Desktop */}
                <button
                  onClick={handleHeroSearch}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-full shadow-sm transition-colors"
                >
                  Go
                </button>

                {/* Clear Button - Desktop */}
                {hasFiltersToShow && (
                  <button
                    onClick={() => {
                      setHeroCategory('');
                      setHeroLocation(null);
                      setHeroLocationInput('');
                      dispatch(clearAllFilters());
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold py-2.5 px-4 rounded-full transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Radius Slider - Desktop (shown when location selected) */}
              {heroLocation && (
                <div className="flex mt-3 items-center gap-2 max-w-md">
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
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium">Filter</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-xs md:text-sm"
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
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-30 border border-slate-200 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
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
              {/* Left edge fade - mobile only */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10 md:hidden"></div>
              {/* Right edge fade - mobile only */}
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-10 md:hidden"></div>

              <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3 sm:px-4">
                <div className="flex gap-2">
                  {filters.categories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {getCategoryDisplayName(category)}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {filters.state && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      {filters.state}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'state', value: '' }))}
                        className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.location && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {filters.location.radius}km {filters.location.name.split(',')[0]}
                      <button
                        onClick={handleClearLocation}
                        className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.month && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      {formatMonth(filters.month)}
                      <button
                        onClick={handleClearMonth}
                        className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.eventType && (
                    <span className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      {filters.eventType === 'free' ? 'Free' : 'Paid'}
                      <button
                        onClick={() => dispatch(updateFilter({ filterType: 'eventType', value: '' }))}
                        className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
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
                        className="inline-flex items-center gap-0.5 bg-teal-50 border border-teal-300 text-teal-800 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                      >
                        {communityLabel}
                        <button
                          onClick={() => dispatch(toggleCommunity(community))}
                          className="hover:text-teal-900 font-bold p-0.5 -mr-0.5"
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

        {/* Event Listing with spacing from filters */}
        <div className="px-3 sm:px-4 mt-4">
          <EventsGrid events={events} eventStatus={status} />
        </div>

        {/* Pagination - only show when there are events */}
        {events.length > 0 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages || 1}
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

export default EventsPage;