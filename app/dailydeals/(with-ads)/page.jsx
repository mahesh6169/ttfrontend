'use client';

import { useEffect, useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  searchDeals,
  fetchFilterOptions,
  toggleCategory,
  setLocation,
  setDay,
  updateFilter,
  clearAllFilters,
  updatePagination
} from '@/store/slices/dailydeals/searchDealsSlice';
import DealsGrid from '@/components/dailydeals/dealcomponents/DealsGrid';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
import HeroDailyDealsSection from '@/components/dailydeals/HeroDailyDealsSection';
import Link from 'next/link';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';

const libraries = ['places'];

const DAYS_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const DailyDealsPage = () => {
  const dispatch = useDispatch();
  const { filters, pagination, deals, meta, status, filterOptions } = useSelector(
    (state) => state.searchDeals
  );

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Hero section state
  const [heroCategory, setHeroCategory] = useState('');
  const [heroLocationInput, setHeroLocationInput] = useState('');
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [heroLocation, setHeroLocation] = useState(null);
  const [heroRadius, setHeroRadius] = useState(50);

  // Temp filters for modal
  const [tempFilters, setTempFilters] = useState({});

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'ending', label: 'Ending soon' },
    { value: 'oldest', label: 'Oldest first' }
  ];

  // Initialize temp filters when modal opens
  useEffect(() => {
    setTempFilters({
      state: filters.state || '',
      day: filters.day || '',
      sortBy: filters.sortBy
    });
  }, [showFilters, filters]);

  // Fetch filter options on mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  // Search whenever filters change
  useEffect(() => {
    dispatch(searchDeals());
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

  const handleClearLocation = () => {
    dispatch(updateFilter({ filterType: 'location', value: null }));
  };

  const handleClearAllTempFilters = () => {
    setTempFilters({
      state: '',
      day: '',
      sortBy: 'newest'
    });
    dispatch(clearAllFilters());
  };

  const handleSortChange = (sortValue) => {
    dispatch(updateFilter({ filterType: 'sortBy', value: sortValue }));
    setShowSortMenu(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sortBy);
    return option?.label || 'Newest first';
  };

  const applyFilters = () => {
    // Apply state
    if (tempFilters.state !== filters.state) {
      dispatch(updateFilter({ filterType: 'state', value: tempFilters.state }));
    }

    // Apply day
    if (tempFilters.day !== filters.day) {
      dispatch(setDay(tempFilters.day));
    }

    // Apply sort
    dispatch(updateFilter({ filterType: 'sortBy', value: tempFilters.sortBy }));

    setShowFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.location) count++;
    if (filters.state) count++;
    if (filters.day) count++;
    return count;
  };

  const getDayLabel = (dayValue) => {
    const day = DAYS_OPTIONS.find(d => d.value === dayValue);
    return day?.label || dayValue;
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

      {/* Filter Modal */}
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
            {/* Day Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Day of Week</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTempFilters({ ...tempFilters, day: '' })}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    !tempFilters.day
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </button>
                {DAYS_OPTIONS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => setTempFilters({ ...tempFilters, day: day.value })}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.day === day.value
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

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
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={state.name}
                  >
                    {state.code}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-yellow-600 text-white hover:bg-yellow-700 text-sm rounded shadow font-semibold transition-colors"
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
          style={{ background: '#fad643' }}
        >
          {/* Wave layer 1 - Medium yellow */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,50 C150,100 300,0 500,50 C700,100 850,0 1000,50 L1000,400 L0,400 Z"
                fill="#FBDC5F"
              />
            </svg>
          </div>

          {/* Wave layer 2 - Lightest yellow */}
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,80 C200,130 400,30 600,80 C800,130 900,30 1000,80 L1000,400 L0,400 Z"
                fill="#FCE27B"
              />
            </svg>
          </div>

          <div className="relative p-0 sm:pt-0 sm:pb-2 sm:px-4">
            <HeroDailyDealsSection showViewAll={false} showCreate={false} compact={true} />
          </div>

          {/* Hero Controls */}
          <div className="relative px-3 sm:px-6 -mt-2 md:mt-0 pb-4">
            {/* Mobile: Post Deal at top left */}
            <div className="md:hidden mb-3">
              <Link
                href="/dailydeals/manage"
                className="inline-flex bg-[#FFF8E1] hover:bg-[#FFECB3] text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-colors whitespace-nowrap"
                style={{ color: '#8B6914' }}
              >
                + Post Deal
              </Link>
            </div>

            <div className="md:max-w-4xl md:mx-auto">
              {/* Desktop: All in one row */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                {/* Post Deal - Desktop only */}
                <Link
                  href="/dailydeals/manage"
                  className="hidden md:inline-flex bg-[#FFF8E1] hover:bg-[#FFECB3] text-sm font-bold py-2.5 px-5 rounded-full shadow-sm transition-colors whitespace-nowrap"
                  style={{ color: '#8B6914' }}
                >
                  + Post Deal
                </Link>

                {/* Category Dropdown - Headless UI */}
                <Listbox value={heroCategory} onChange={setHeroCategory}>
                  <div className="relative flex-1 md:flex-initial md:w-56">
                    <ListboxButton className="relative w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all cursor-pointer text-left">
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
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-yellow-50 text-yellow-900' : 'text-gray-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                All Categories
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-600">
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
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-yellow-50 text-yellow-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {cat}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-600">
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
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
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
                  style={{ backgroundColor: '#8B6914' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6B5210'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B6914'}
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
                          [&::-webkit-slider-thumb]:bg-yellow-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-yellow-600
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                      />
                      <span className="text-xs text-gray-700 min-w-[40px] text-right">{heroRadius}km</span>
                    </div>
                  </div>
                  {/* Desktop slider - aligned under location */}
                  <div className="hidden md:flex mt-1 items-center gap-3">
                    {/* Spacer for Post Deal button */}
                    <div className="w-[108px]"></div>
                    {/* Spacer for Category dropdown */}
                    <div className="w-56"></div>
                    {/* Slider aligned with location input */}
                    <div className="w-64 flex items-center gap-2 px-3">
                      <span className="text-xs text-gray-700">1km</span>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={heroRadius}
                        onChange={(e) => setHeroRadius(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/60 rounded-lg appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-yellow-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-yellow-600
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
          {/* Filter and Sort buttons */}
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
                <span className="bg-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
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
                      {category}
                      <button
                        onClick={() => dispatch(toggleCategory(category))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {filters.day && (
                    <span className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                      Day: {getDayLabel(filters.day)}
                      <button
                        onClick={() => dispatch(setDay(''))}
                        className="hover:text-gray-900 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  )}

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

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-3 sm:px-4 mt-4">
          <DealsGrid deals={deals} dealStatus={status} />
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-4 mb-3 sm:mt-6 sm:mb-4">
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              onPageChange={(pageNum) => dispatch(updatePagination({ page: pageNum }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDealsPage;
