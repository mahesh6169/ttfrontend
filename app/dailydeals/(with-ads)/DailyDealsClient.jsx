'use client';

import { useState, Fragment, useRef } from 'react';
import { useDealFilters } from '@/hooks/deals/useDealFilters';
import { useSearchDeals } from '@/hooks/deals/useSearchDeals';
import DealsGrid from '@/components/dailydeals/dealcomponents/DealsGrid';
import { getAllParentCategories, getSubcategories } from '@/components/dailydeals/dealCategories';
import Pagination from '@/components/Pagination';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';
import { AUSTRALIAN_STATES } from '@/constants/australianStates';
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

const DailyDealsPage = ({ heading }) => {
  // URL-based filters (nuqs)
  const {
    cat,
    subcat,
    state,
    day,
    partnerstoreId,
    sort,
    page,
    location,
    hasLocation,
    setCat,
    setSubcat,
    setState,
    setDay,
    setSort,
    setPage,
    setLocation,
    setRadius,
    clearAllFilters,
  } = useDealFilters();

  // TanStack Query for fetching deals
  const { data, isLoading, isError } = useSearchDeals({
    cat,
    subcat,
    state,
    day,
    q: null,
    partnerstoreId,
    sort,
    page,
    location,
  });

  // Subcategories come from the static taxonomy for the selected parent
  // (same as /listings) so the dropdown always appears once a category is picked.
  const subcategoryOptions = cat ? getSubcategories(cat) : [];

  const deals = data?.deals || [];
  const meta = data || { currentPage: 1, totalPages: 1, totalCount: 0 };
  const status = isLoading ? 'loading' : isError ? 'failed' : 'success';

  // Local state for UI only
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [heroAutocomplete, setHeroAutocomplete] = useState(null);
  const [heroLocationInput, setHeroLocationInput] = useState(location?.name || '');
  const [heroRadius, setHeroRadius] = useState(location?.radius || 10);

  // Temp filters for modal
  const [tempFilters, setTempFilters] = useState({
    state: state || '',
    day: day || '',
    sortBy: sort,
  });

  // Ref for scroll-to-results behavior
  const resultsRef = useRef(null);

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'ending', label: 'Ending soon' },
    { value: 'oldest', label: 'Oldest first' }
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
      state: state || '',
      day: day || '',
      sortBy: sort,
    });
    setShowFilters(true);
  };

  // Handle category change - applies immediately (clears subcategory)
  const handleCategoryChange = (newCat) => {
    setCat(newCat || null);
    scrollToResults();
  };

  // Handle subcategory change - applies immediately
  const handleSubcategoryChange = (newSubcat) => {
    setSubcat(newSubcat || null);
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

  // Modal functions
  const handleClearAllTempFilters = () => {
    setTempFilters({
      state: '',
      day: '',
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
    setState(tempFilters.state || null);
    setDay(tempFilters.day || null);
    setSort(tempFilters.sortBy);
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
    if (subcat) count++;
    if (location) count++;
    if (state) count++;
    if (day) count++;
    return count;
  };

  const getDayLabel = (dayValue) => {
    const dayOption = DAYS_OPTIONS.find(d => d.value === dayValue);
    return dayOption?.label || dayValue;
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
            {/* Day Filter */}
            <div className="mb-4">
              <h3 className="font-semibold text-slate-700 mb-3">Day of Week</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTempFilters({ ...tempFilters, day: '' })}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    !tempFilters.day
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Days
                </button>
                {DAYS_OPTIONS.map(dayOption => (
                  <button
                    key={dayOption.value}
                    onClick={() => setTempFilters({ ...tempFilters, day: dayOption.value })}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      tempFilters.day === dayOption.value
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dayOption.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

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

          </div>

          {/* Apply Button - Sticky */}
          <div className="sticky bottom-0 p-3 bg-white border-t flex justify-center">
            <button
              onClick={applyFilters}
              className="px-8 py-2 bg-teal-700 text-white hover:bg-teal-800 text-sm rounded shadow font-semibold transition-colors"
            >
              Show results
            </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {/* Browse hero - one section, single vertical gap (8/12), no card. See FeatureLandingPagesux.md section 3. */}
        <section className="flex flex-col gap-2 sm:gap-3">
          {heading}
          <div className="w-full">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col gap-2 sm:gap-3 max-w-[90%] mx-auto md:hidden">
              {/* Category Dropdown - Applies immediately */}
              <Listbox value={cat || ''} onChange={handleCategoryChange}>
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
                      {getAllParentCategories().map((catOption) => (
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
                                {catOption}
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

              {/* Subcategory Dropdown - Mobile (always shown, greyed until a category is selected) */}
              {(
                <Listbox value={subcat || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                  <div className="relative">
                    <ListboxButton className={`relative w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-slate-100 cursor-not-allowed'}`}>
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className={subcat ? 'text-slate-900' : 'text-slate-500'}>
                        {subcat || (cat ? 'Select Subcategory' : 'Select category first')}
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
                                All Subcategories
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
                        {subcategoryOptions.map((subOption) => (
                          <ListboxOption
                            key={subOption}
                            value={subOption}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {subOption}
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
              )}

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
              {/* Category + subcategory + location + radius share one centered column so they line up */}
              <div className="max-w-[920px] mx-auto flex flex-col gap-2 sm:gap-3">
                {/* Filters Row */}
                <div className="flex items-center gap-3 w-full">
                {/* Category Dropdown - Desktop - Applies immediately */}
                <div className="flex-1 max-w-[280px]">
                <Listbox value={cat || ''} onChange={handleCategoryChange}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer text-left">
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
                        {getAllParentCategories().map((catOption) => (
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
                                  {catOption}
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

                {/* Subcategory Dropdown - Desktop (always shown, greyed until a category is selected) */}
                <div className="flex-1 max-w-[280px]">
                {(
                  <Listbox value={subcat || ''} onChange={handleSubcategoryChange} disabled={!cat}>
                    <div className="relative">
                      <ListboxButton className={`relative w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-left ${cat ? 'bg-white cursor-pointer' : 'bg-slate-100 cursor-not-allowed'}`}>
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className={subcat ? 'text-slate-900' : 'text-slate-500'}>
                          {subcat || (cat ? 'Select Subcategory' : 'Select category first')}
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
                                  All Subcategories
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
                          {subcategoryOptions.map((subOption) => (
                            <ListboxOption
                              key={subOption}
                              value={subOption}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                    {subOption}
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
                )}
                </div>

                {/* Location Input - Desktop */}
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

              {/* Radius Slider - Desktop (shown when location selected) */}
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
            </div>
          </div>

        {/* Page Controls - Sort and Filter */}
        <div ref={resultsRef}>
          {/* Filter and Sort buttons */}
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
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-slate-900">Sort: {getCurrentSortLabel()}</span>
              </button>

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
                      {cat}
                      <button
                        onClick={() => setCat(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {subcat && (
                    <span
                      className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0"
                    >
                      {subcat}
                      <button
                        onClick={() => setSubcat(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {day && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
                      Day: {getDayLabel(day)}
                      <button
                        onClick={() => setDay(null)}
                        className="hover:text-slate-900 font-bold p-0.5 -mr-0.5"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {state && (
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
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
                    <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[11px] md:text-sm whitespace-nowrap flex-shrink-0">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </section>

        {/* Results */}
        <div className="mt-4">
          <DealsGrid deals={deals} dealStatus={status} />
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
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

export default DailyDealsPage;
