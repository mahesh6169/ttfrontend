'use client';

import React, { useEffect, useState } from 'react';
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
import PostEventButton from '@/components/buttons/PostEventButton';
import { getCategoryDisplayName } from '@/constants/categories';
import PromoBanner from '@/components/PromoBanner';
import HeroEventsSection from '@/components/events/HeroEventsSection';
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
          <div className="p-4">
            {/* Month Selection */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">Month</h3>
              <select
                value={tempFilters.month || ''}
                onChange={handleMonthChange}
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Upcoming Events</option>
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

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
          style={{ background: '#a874d2' }}
        >
          {/* Wave layer 1 - Medium purple */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 C150,100 300,0 500,50 C700,100 850,0 1000,50 L1000,400 L0,400 Z"
                fill="#B589D9"
              />
            </svg>
          </div>

          {/* Wave layer 2 - Lightest purple */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,80 C200,130 400,30 600,80 C800,130 900,30 1000,80 L1000,400 L0,400 Z"
                fill="#C29EE0"
              />
            </svg>
          </div>

          <div className="relative p-0 sm:pt-0 sm:pb-2 sm:px-4">
            <HeroEventsSection showViewAll={false} showCreate={false} compact={true} />
          </div>

          {/* Hero Controls */}
          <div className="relative px-3 sm:px-6 -mt-2 md:mt-0 pb-4">
            {/* Mobile: Post Event at top left */}
            <div className="md:hidden mb-3">
              <Link
                href="/events/add"
                className="inline-flex bg-[#f5eef5] hover:bg-[#efe5ef] text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-colors whitespace-nowrap"
                style={{ color: '#4A1D68' }}
              >
                + Post Event
              </Link>
            </div>

            <div className="md:max-w-4xl md:mx-auto">
              {/* Desktop: All in one row */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                {/* Post Event - Desktop only */}
                <Link
                  href="/events/add"
                  className="hidden md:inline-flex bg-[#f5eef5] hover:bg-[#efe5ef] text-sm font-bold py-2.5 px-5 rounded-full shadow-sm transition-colors whitespace-nowrap"
                  style={{ color: '#4A1D68' }}
                >
                  + Post Event
                </Link>

                {/* Category Dropdown - Headless UI */}
                <Listbox value={heroCategory} onChange={setHeroCategory}>
                  <div className="relative flex-1 md:flex-initial md:w-56">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer text-left">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className={heroCategory ? 'text-gray-900' : 'text-gray-500'}>
                        {heroCategory || 'Select Category'}
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
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-purple-50 text-purple-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {cat}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
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
                    <div className="relative flex-1 md:flex-initial md:w-64">
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
                  <div className="relative flex-1 md:flex-initial md:w-64">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                  onClick={handleHeroSearch}
                  className="w-full md:w-auto px-6 py-2.5 text-white font-semibold rounded-full shadow-sm transition-colors"
                  style={{ backgroundColor: '#4A1D68' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a1554'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A1D68'}
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
                      <span className="text-xs text-white/80">1km</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={heroRadius}
                        onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-purple-600
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-xs text-white/80 min-w-[40px] text-right">{heroRadius}km</span>
                    </div>
                  </div>
                  {/* Desktop slider - aligned under location */}
                  <div className="hidden md:flex mt-1 items-center gap-3">
                    {/* Spacer for Post Event button */}
                    <div className="w-[108px]"></div>
                    {/* Spacer for Category dropdown */}
                    <div className="w-56"></div>
                    {/* Slider aligned with location input */}
                    <div className="w-64 flex items-center gap-2 px-3">
                      <span className="text-xs text-white/80">1km</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={heroRadius}
                        onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-purple-600
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-xs text-white/80 min-w-[40px] text-right">{heroRadius}km</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Page Controls - Sort and Filter */}
        <div className="px-3 mb-3 sm:px-4 sm:mb-4">
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
          <div className="bg-gray-50 border-y">
            <div className="px-3 py-3 sm:px-4 flex items-center gap-3 max-w-full">
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
                Active filters:
              </span>
              
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 pb-1">
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

                  {filters.month && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Month: {formatMonth(filters.month)}
                      <button
                        onClick={handleClearMonth}
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

export default EventsPage;